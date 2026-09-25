import { describe, expect, test } from "vitest";

import {
  type QueueEntry,
  type QueuedAction,
  enqueue,
  flushQueue,
  loadQueue,
  saveQueue,
} from "@/lib/offline-queue";

// A stub action recorder — flushQueue calls the dispatcher, not the DB.
function recordingDispatcher(log: string[]) {
  return async (action: QueuedAction) => {
    log.push(action.kind);
    // Simulate a network failure for a specific action id.
    if ("taskId" in action && action.taskId === "boom") {
      throw new Error("network down");
    }
  };
}

function sampleEntries(): QueueEntry[] {
  const base = { queuedAt: "2026-09-24T15:00:00.000Z" };
  return [
    {
      id: "q1",
      action: {
        kind: "set-occurrence",
        habitId: "h1",
        date: "2026-09-24",
        metCount: 1,
      },
      ...base,
    },
    {
      id: "q2",
      action: { kind: "complete-task", taskId: "t1" },
      ...base,
    },
  ];
}

describe("queue persistence", () => {
  test("saves and reloads entries intact", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    saveQueue(sampleEntries(), storage);
    const loaded = loadQueue(storage);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].action.kind).toBe("set-occurrence");
  });

  test("corrupt storage yields an empty queue, not a crash", () => {
    const loaded = loadQueue({ getItem: () => "{not json", setItem: () => {} });
    expect(loaded).toEqual([]);
  });

  test("missing storage yields an empty queue", () => {
    const loaded = loadQueue({ getItem: () => null, setItem: () => {} });
    expect(loaded).toEqual([]);
  });
});

describe("enqueue", () => {
  test("appends with a stable unique id and timestamp", () => {
    const entries = enqueue([], {
      kind: "set-rest",
      habitId: "h1",
      date: "2026-09-24",
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].action.kind).toBe("set-rest");
    expect(entries[0].id).toMatch(/^q-\d+-\d+$/);
    expect(Number.isNaN(Date.parse(entries[0].queuedAt))).toBe(false);
  });
});

describe("flushQueue — latest-action-timestamp wins (ADR: offline)", () => {
  test("replays in order and clears the queue on success", async () => {
    const log: string[] = [];
    const after = await flushQueue(sampleEntries(), recordingDispatcher(log));
    expect(log).toEqual(["set-occurrence", "complete-task"]);
    expect(after).toEqual([]);
  });

  test("an older action on the same occurrence loses to the newer one", async () => {
    const log: string[] = [];
    const entries: QueueEntry[] = [
      {
        id: "q-old",
        queuedAt: "2026-09-24T10:00:00.000Z",
        action: {
          kind: "set-occurrence",
          habitId: "h1",
          date: "2026-09-24",
          metCount: 0,
        },
      },
      {
        id: "q-new",
        queuedAt: "2026-09-24T12:00:00.000Z",
        action: {
          kind: "set-occurrence",
          habitId: "h1",
          date: "2026-09-24",
          metCount: 1,
        },
      },
    ];
    const after = await flushQueue(entries, recordingDispatcher(log));
    // Only ONE dispatch — the newer action replaced the older before replay.
    expect(log).toEqual(["set-occurrence"]);
    expect(after).toEqual([]);
  });

  test("unrelated actions on different targets both survive coalescing", async () => {
    const log: string[] = [];
    const entries: QueueEntry[] = [
      {
        id: "q-a",
        queuedAt: "2026-09-24T10:00:00.000Z",
        action: {
          kind: "set-occurrence",
          habitId: "h1",
          date: "2026-09-24",
          metCount: 1,
        },
      },
      {
        id: "q-b",
        queuedAt: "2026-09-24T11:00:00.000Z",
        action: {
          kind: "set-occurrence",
          habitId: "h2",
          date: "2026-09-24",
          metCount: 1,
        },
      },
    ];
    const after = await flushQueue(entries, recordingDispatcher(log));
    expect(log).toEqual(["set-occurrence", "set-occurrence"]);
    expect(after).toEqual([]);
  });

  test("a failing action stays in the queue; earlier successes are cleared", async () => {
    const log: string[] = [];
    const entries: QueueEntry[] = [
      {
        id: "q-ok",
        queuedAt: "2026-09-24T10:00:00.000Z",
        action: { kind: "complete-task", taskId: "t1" },
      },
      {
        id: "q-boom",
        queuedAt: "2026-09-24T11:00:00.000Z",
        action: { kind: "complete-task", taskId: "boom" },
      },
    ];
    const after = await flushQueue(entries, recordingDispatcher(log));
    expect(log).toEqual(["complete-task", "complete-task"]);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe("q-boom");
  });
});
