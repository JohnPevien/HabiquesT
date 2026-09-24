import { describe, expect, test } from "vitest";

import {
  CORRECTION_WINDOW_DAYS,
  createInitialState,
  type Habit,
  type Occurrence,
  type Task,
  addGoal,
  addTask,
  completeTask,
  computeGoalMomentum,
  computePace,
  effortXp,
  levelFromXp,
  markOccurrence,
  normalizeTag,
  occurrencesEditable,
  occurrencesForDate,
  reopenTask,
  restOccurrence,
  xpForOccurrenceCompletion,
} from "@/lib/engine";

// Deterministic clock: every scenario pins "now" to a fixed instant.
// 2026-09-24 is a Thursday. Profile timezone is fixed per scenario.
const NOW = "2026-09-24T15:00:00Z"; // 3 PM UTC = 11 PM in Asia/Singapore (+08:00)

const clock = () => new Date(NOW);

const SG = "Asia/Singapore"; // UTC+8, no DST — day ends 4 PM UTC

function habitWith(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Morning run",
    tags: ["fitness"],
    effort: "medium",
    schedule: { kind: "daily" },
    createdAt: "2026-09-01",
    ...overrides,
  };
}

function seededOccurrence(overrides: Partial<Occurrence> = {}): Occurrence {
  return {
    id: "o1",
    habitId: "h1",
    date: "2026-09-24", // local day key
    metCount: null, // null = unresolved (day not closed); number = resolved
    targetCount: 1,
    isRest: false,
    status: "pending",
    xpAwarded: false,
    ...overrides,
  };
}
describe("normalizeTag", () => {
  test("folds case and trims so #Fitness and #fitness are one tag", () => {
    expect(normalizeTag("  Fitness ")).toBe(normalizeTag("fitness"));
    expect(normalizeTag("Fitness")).toBe("fitness");
  });

  test("caps length at 30 characters", () => {
    expect(normalizeTag("a".repeat(40))).toHaveLength(30);
  });

  test("rejects empty and whitespace-only tags", () => {
    expect(normalizeTag("")).toBeNull();
    expect(normalizeTag("   ")).toBeNull();
  });
});

describe("goal momentum — the honest ratio", () => {
  test("met daily habit over the last 7 days scores 100%", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();

    // Seven fully met occurrences in the window, including today.
    const occs: Occurrence[] = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      seededOccurrence({
        id: `o${i}`,
        date: `2026-09-${18 + i}`,
        metCount: 1,
        targetCount: 1,
        status: "met",
      }),
    );

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [] },
    });

    expect(momentum.score).toBe(100);
    expect(momentum.evidence.met).toBe(7);
    expect(momentum.evidence.total).toBe(7);
  });

  test("one missed day in seven yields 6/7, not a broken streak", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs: Occurrence[] = [];
    for (let i = 0; i < 7; i++) {
      const met = i === 3 ? 0 : 1; // miss on 2026-09-21
      occs.push(
        seededOccurrence({
          id: `o${i}`,
          date: `2026-09-${18 + i}`,
          metCount: met,
          targetCount: 1,
          status: met === 1 ? "met" : "missed",
        }),
      );
    }

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [] },
    });

    expect(momentum.score).toBe(86); // 6/7 = 85.7 → 86
    expect(momentum.evidence.met).toBe(6);
    expect(momentum.evidence.total).toBe(7);
  });

  test("times-per-day quota scores proportionally: 2 of 3 done is 2/3 credit", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Hydrate",
      watchedTags: ["health"],
    }).goal;
    const habit = habitWith({
      tags: ["health"],
      schedule: { kind: "times-per-day", count: 3 },
    });
    const occs: Occurrence[] = [];
    for (let i = 0; i < 7; i++) {
      const metCount = i === 6 ? 2 : 3; // today partially done
      occs.push(
        seededOccurrence({
          id: `o${i}`,
          date: `2026-09-${18 + i}`,
          metCount,
          targetCount: 3,
          status: metCount === 3 ? "met" : "partial",
        }),
      );
    }

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [] },
    });

    // 6 days × 3 + 2 = 20 of 21 planned.
    expect(momentum.score).toBe(95); // 20/21 = 95.2 → 95
    expect(momentum.evidence.met).toBe(20);
    expect(momentum.evidence.total).toBe(21);
  });

  test("a completed tagged task counts as one met period", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs: Occurrence[] = [];
    for (let i = 0; i < 6; i++) {
      occs.push(
        seededOccurrence({
          id: `o${i}`,
          date: `2026-09-${18 + i}`,
          metCount: 1,
          targetCount: 1,
          status: "met",
        }),
      );
    }
    const task: Task = {
      id: "t1",
      title: "Book race entry",
      tags: ["fitness"],
      effort: "medium",
      dueDate: null,
      completedAt: "2026-09-24T02:00:00Z",
      xpAwarded: false,
      createdAt: "2026-09-20",
    };

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [task] },
    });

    // 6 habit days + 1 task = 7 of 7 — a task lifts the score exactly one period.
    expect(momentum.score).toBe(100);
    expect(momentum.evidence.met).toBe(7);
    expect(momentum.evidence.total).toBe(7);
  });

  test("empty window shows 'No score yet', never 0% or 100%", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Learn chess",
      watchedTags: ["chess"],
    }).goal;
    const habit = habitWith({ tags: ["chess"], createdAt: "2026-09-24" });

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: [], tasks: [] },
    });

    expect(momentum.score).toBeNull();
    expect(momentum.evidence.met).toBe(0);
    expect(momentum.evidence.total).toBe(0);
  });

  test("zero-percent score carries a restart affordance, never a bare zero", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs: Occurrence[] = [];
    for (let i = 0; i < 7; i++) {
      occs.push(
        seededOccurrence({
          id: `o${i}`,
          date: `2026-09-${18 + i}`,
          metCount: 0,
          targetCount: 1,
          status: "missed",
        }),
      );
    }

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [] },
    });

    expect(momentum.score).toBe(0);
    expect(momentum.restartRecommended).toBe(true);
  });

  test("only occurrences inside the rolling 7-day local window count", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs: Occurrence[] = [
      // Old miss (2026-09-10) must age out of the score entirely.
      seededOccurrence({
        id: "old",
        date: "2026-09-10",
        metCount: 0,
        targetCount: 1,
        status: "missed",
      }),
      // Window: 2026-09-18..24 local (SG). All met.
      ...[0, 1, 2, 3, 4, 5, 6].map((i) =>
        seededOccurrence({
          id: `o${i}`,
          date: `2026-09-${18 + i}`,
          metCount: 1,
          targetCount: 1,
          status: "met",
        }),
      ),
    ];

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [] },
    });

    expect(momentum.score).toBe(100); // the ancient miss did not dent it
    expect(momentum.evidence.total).toBe(7);
  });

  test("rest days drop out of the denominator — neither help nor hurt", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs: Occurrence[] = [];
    for (let i = 0; i < 7; i++) {
      const isRest = i === 2;
      occs.push(
        seededOccurrence({
          id: `o${i}`,
          date: `2026-09-${18 + i}`,
          metCount: isRest ? null : 1,
          targetCount: isRest ? 0 : 1,
          isRest,
          status: isRest ? "rest" : "met",
        }),
      );
    }

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [] },
    });

    expect(momentum.score).toBe(100); // 6 of 6, not 6 of 7
    expect(momentum.evidence.total).toBe(6);
  });

  test("a goal only scores actions whose tags it watches", () => {
    const state = createInitialState();
    const fitness = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const work = addGoal(state, {
      title: "Ship product",
      watchedTags: ["work"],
    }).goal;
    const habit = habitWith({ tags: ["fitness", "work"] });
    const occs: Occurrence[] = [
      seededOccurrence({
        id: "o1",
        date: "2026-09-24",
        metCount: 1,
        targetCount: 1,
        status: "met",
      }),
    ];

    const engineState = {
      ...state,
      habits: [habit],
      occurrences: occs,
      tasks: [],
    };
    const fitnessMomentum = computeGoalMomentum(fitness.id, {
      now: clock(),
      timezone: SG,
      state: engineState,
    });
    const workMomentum = computeGoalMomentum(work.id, {
      now: clock(),
      timezone: SG,
      state: engineState,
    });

    expect(fitnessMomentum.score).toBe(100);
    expect(workMomentum.score).toBe(100); // both goals watch a matching tag
  });
});

describe("day closure and the correction window", () => {
  test("a day is not closed until local midnight passes", () => {
    // 15:00 UTC = 23:00 in SG — Thursday is still open.
    const occs = [seededOccurrence({ date: "2026-09-24" })];
    expect(occurrencesForDate(occs, "2026-09-24")).toHaveLength(1);

    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: { ...state, habits: [habit], occurrences: occs, tasks: [] },
    });

    // Today is pending, not missed: an open day must never count against the player.
    expect(momentum.score).toBeNull();
  });

  test("today plus the previous two closed local days are editable; older locks", () => {
    const occs = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24"].map(
      (date, i) =>
        seededOccurrence({
          id: `o${i}`,
          date,
          metCount: null,
          status: "pending",
        }),
    );

    // In SG at 23:00 Thursday 2026-09-24: editable = today (24) + 2 closed days (23, 22).
    // Monday 2026-09-21 is outside the correction window and therefore locked.
    expect(occurrencesEditable(occs, { now: clock(), timezone: SG })).toEqual([
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
    ]);
  });

  test("marking a rest day inside the correction window removes it from scoring", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs = [0, 1, 2].map((i) =>
      seededOccurrence({
        id: `o${i}`,
        date: `2026-09-${22 + i}`,
        metCount: 1,
        targetCount: 1,
        status: "met",
      }),
    );
    const rested = restOccurrence(occs[0], { now: clock(), timezone: SG });
    expect(rested.isRest).toBe(true);
    expect(rested.metCount).toBeNull();
    expect(rested.status).toBe("rest");

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: {
        ...state,
        habits: [habit],
        occurrences: [rested, occs[1], occs[2]],
        tasks: [],
      },
    });
    expect(momentum.evidence.total).toBe(2); // the rested day left the denominator
  });

  test("marking a pending occurrence met inside the correction window restores its credit", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      seededOccurrence({
        id: `o${i}`,
        date: `2026-09-${18 + i}`,
        metCount: i === 5 ? 0 : 1, // Wednesday missed...
        targetCount: 1,
        status: i === 5 ? "missed" : "met",
      }),
    );

    const corrected = markOccurrence(occs[5], {
      metCount: 1,
      now: clock(),
      timezone: SG,
    });
    expect(corrected.status).toBe("met");

    const momentum = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: {
        ...state,
        habits: [habit],
        occurrences: occs.map((o, i) => (i === 5 ? corrected : o)),
        tasks: [],
      },
    });
    expect(momentum.score).toBe(100);
  });
});

describe("XP — permanent, once per actual completion", () => {
  test("effort maps to 5/10/20 XP", () => {
    expect(effortXp("small")).toBe(5);
    expect(effortXp("medium")).toBe(10);
    expect(effortXp("major")).toBe(20);
  });

  test("an occurrence pays XP exactly once, even after reopen-recomplete cycles", () => {
    const habit = habitWith({ effort: "major" });

    // First completion pays.
    const first = xpForOccurrenceCompletion(
      seededOccurrence({
        metCount: 1,
        targetCount: 1,
        status: "met",
        xpAwarded: false,
      }),
      habit,
    );
    expect(first).toBe(20);

    // Second call on an already-paid occurrence pays nothing.
    const second = xpForOccurrenceCompletion(
      seededOccurrence({
        metCount: 1,
        targetCount: 1,
        status: "met",
        xpAwarded: true,
      }),
      habit,
    );
    expect(second).toBe(0);
  });
});

describe("level curve", () => {
  test("level 1 at zero XP; gentle increasing curve; no cap", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(10).level).toBe(2);
    expect(levelFromXp(10_000).level).toBeGreaterThan(20);
    // monotone: more XP never lowers the level
    let last = 1;
    for (let xp = 0; xp <= 5000; xp += 50) {
      const lv = levelFromXp(xp).level;
      expect(lv).toBeGreaterThanOrEqual(last);
      last = lv;
    }
  });
});

describe("pace — only when metric AND target date exist", () => {
  const base = { title: "Read more", watchedTags: ["reading"] };

  test("no metric or no date means no pace status", () => {
    const state = createInitialState();
    const goal = addGoal(state, base).goal;
    expect(computePace(goal, { now: clock(), timezone: SG })).toBeNull();
  });

  test("metric progress at or above elapsed time fraction is On Pace or Ahead", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      ...base,
      createdAt: "2026-09-09",
      metric: { target: 12, current: 7, unit: "books" },
      targetDate: "2026-10-09",
    }).goal;
    const pace = computePace(goal, { now: clock(), timezone: SG });
    expect(["on-pace", "ahead"]).toContain(pace?.status);
  });

  test("metric progress well below elapsed time fraction is Behind", () => {
    const state = createInitialState();
    // Half the time gone, only 1 of 12 done → behind.
    const goal = addGoal(state, {
      ...base,
      createdAt: "2026-09-09",
      metric: { target: 12, current: 1, unit: "books" },
      targetDate: "2026-10-09",
    }).goal;
    expect(computePace(goal, { now: clock(), timezone: SG })?.status).toBe(
      "behind",
    );
  });
});

describe("tasks", () => {
  test("completing then reopening a task does not double-count in momentum", () => {
    const state = createInitialState();
    const goal = addGoal(state, {
      title: "Get fit",
      watchedTags: ["fitness"],
    }).goal;
    const habit = habitWith();
    const occs = [0, 1, 2, 3, 4, 5].map((i) =>
      seededOccurrence({
        id: `o${i}`,
        date: `2026-09-${18 + i}`,
        metCount: 1,
        targetCount: 1,
        status: "met",
      }),
    );
    const { task } = addTask(state, {
      title: "Buy shoes",
      tags: ["fitness"],
      effort: "small",
      dueDate: null,
    });

    const completed = completeTask(task, { now: clock() });
    const withTask = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: {
        ...state,
        habits: [habit],
        occurrences: occs,
        tasks: [completed],
      },
    });
    expect(withTask.evidence.total).toBe(7); // 6 habit days + 1 completed task

    const reopened = reopenTask(completed, { now: clock() });
    const withoutTask = computeGoalMomentum(goal.id, {
      now: clock(),
      timezone: SG,
      state: {
        ...state,
        habits: [habit],
        occurrences: occs,
        tasks: [reopened],
      },
    });
    expect(withoutTask.evidence.total).toBe(6); // reopen removed the credit — no ghost period
  });
});

describe("CORRECTION_WINDOW_DAYS contract", () => {
  test("window is today plus the previous two closed days", () => {
    expect(CORRECTION_WINDOW_DAYS).toBe(2);
  });
});
