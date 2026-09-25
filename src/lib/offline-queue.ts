// Offline queue — read cache, queue edits, latest-action-timestamp wins
// (ADR: Offline). Pure logic; storage is injected so tests and the browser
// (localStorage) use the same code.

export type QueuedAction =
  | { kind: "set-occurrence"; habitId: string; date: string; metCount: number }
  | { kind: "set-rest"; habitId: string; date: string }
  | { kind: "complete-task"; taskId: string }
  | { kind: "reopen-task"; taskId: string };

export interface QueueEntry {
  id: string;
  queuedAt: string; // ISO timestamp — the conflict-resolution key
  action: QueuedAction;
}

/** Storage adapter: browser passes localStorage, tests pass closures. */
export interface QueueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = "habiquest-offline-queue";

let counter = 0;

export function enqueue(
  queue: QueueEntry[],
  action: QueuedAction,
): QueueEntry[] {
  counter += 1;
  return [
    ...queue,
    {
      id: `q-${Date.now()}-${counter}`,
      queuedAt: new Date().toISOString(),
      action,
    },
  ];
}

export function saveQueue(queue: QueueEntry[], storage: QueueStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function loadQueue(storage: QueueStorage): QueueEntry[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is QueueEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as QueueEntry).id === "string" &&
        typeof (e as QueueEntry).queuedAt === "string" &&
        typeof (e as QueueEntry).action === "object",
    );
  } catch {
    // Corrupt or unavailable storage — start clean rather than crash.
    return [];
  }
}

/** Identity of the target an action mutates — the coalescing key. */
function actionKey(action: QueuedAction): string {
  if (action.kind === "set-occurrence" || action.kind === "set-rest") {
    return `${action.kind}:${action.habitId}:${action.date}`;
  }
  return `${action.kind}:${action.taskId}`;
}

/**
 * Coalesce: for the same action target, only the LATEST queuedAt survives.
 * Replay in queue order. Actions whose dispatch throws stay queued (in order);
 * everything before the failure is cleared — a later flush retries the rest.
 */
export async function flushQueue(
  queue: QueueEntry[],
  dispatch: (action: QueuedAction) => Promise<void>,
): Promise<QueueEntry[]> {
  // Latest-wins per target, preserving original queue order of the winners.
  const latestByTarget = new Map<string, QueueEntry>();
  for (const entry of queue) {
    const key = actionKey(entry.action);
    const existing = latestByTarget.get(key);
    if (
      !existing ||
      Date.parse(entry.queuedAt) > Date.parse(existing.queuedAt)
    ) {
      latestByTarget.set(key, entry);
    }
  }
  const winners = queue.filter(
    (entry) => latestByTarget.get(actionKey(entry.action)) === entry,
  );

  const remaining: QueueEntry[] = [];
  for (const entry of winners) {
    try {
      await dispatch(entry.action);
    } catch {
      // Keep this entry and everything after it — order must not be lost.
      remaining.push(entry);
    }
  }
  return remaining;
}
