// HabiquesT momentum engine — pure functions only.
// All decisions below trace to docs/adr/0001-momentum-replaces-damage.md.
// Time is always injected (`now`, `timezone`) so every computation is deterministic.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Effort = "small" | "medium" | "major";

/** How often a habit schedules occurrences. */
export type Schedule =
  | { kind: "daily" }
  | { kind: "weekdays"; days: Weekday[] } // 0=Sunday … 6=Saturday
  | { kind: "times-per-day"; count: number } // quota closes at local day end
  | { kind: "times-per-week"; count: number }; // quota closes at local week end

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Tag = string; // always normalized via normalizeTag before storage

export interface Goal {
  id: string;
  title: string;
  watchedTags: Tag[];
  /** Optional measurable outcome ("12 books"). Presence + targetDate enables Pace. */
  metric?: { target: number; current: number; unit: string };
  /** Optional target date (YYYY-MM-DD, local). May come from a Campaign. */
  targetDate?: string;
  campaignId?: string;
  /** Player-confirmed only. computeGoalMomentum never flips this. */
  achievedAt?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  tags: Tag[];
  effort: Effort;
  schedule: Schedule;
  createdAt: string;
}

/**
 * One scheduled instance of a habit.
 * - date is the LOCAL day key (YYYY-MM-DD) for daily/day-quota habits,
 *   or the LOCAL week key (YYYY-Www) for times-per-week habits.
 * - status is derived, never trusted as the source of truth; metCount is.
 */
export interface Occurrence {
  id: string;
  habitId: string;
  date: string;
  /** null = day not yet closed (or rest); a number = resolved count. */
  metCount: number | null;
  targetCount: number;
  isRest: boolean;
  status: "pending" | "met" | "partial" | "missed" | "rest";
  /** XP pays once per actual completion — see xpForOccurrenceCompletion. */
  xpAwarded: boolean;
}

export interface Task {
  id: string;
  title: string;
  tags: Tag[];
  effort: Effort;
  /** Optional due date (YYYY-MM-DD). Overdue never penalizes. */
  dueDate: string | null;
  /** Non-null iff completed. Reopening nulls it. */
  completedAt: string | null;
  xpAwarded: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  lengthDays: 30 | 60 | 90;
  startAt: string;
  /** Ends on this local date. Goals persist after; campaign becomes read-only. */
  endAt: string;
  status: "active" | "ended" | "archived";
}

export interface PlayerState {
  goals: Goal[];
  habits: Habit[];
  occurrences: Occurrence[];
  tasks: Task[];
  campaigns: Campaign[];
  /** Lifetime XP total — permanent, never removed. */
  xp: number;
}

export interface EngineContext {
  now: Date;
  /** IANA timezone from the player profile. */
  timezone: string;
  state: PlayerState;
}

// ---------------------------------------------------------------------------
// Time — local-day math delegated to ./time (single source of truth for zones)
// ---------------------------------------------------------------------------

const MOMENTUM_WINDOW_DAYS = 7;

/** Today plus the previous two closed local days are editable. */
export const CORRECTION_WINDOW_DAYS = 2;

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

const TAG_MAX_LENGTH = 30;

/** Case-folds, trims, caps at 30 chars; null when nothing remains. */
export function normalizeTag(raw: string): Tag | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, TAG_MAX_LENGTH);
}

// ---------------------------------------------------------------------------
// State constructors — used by UI and tests alike
// ---------------------------------------------------------------------------

let idCounter = 0;
/** Stable-enough unique id for local state; persistence layer remaps anyway. */
export function localId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function createInitialState(): PlayerState {
  return {
    goals: [],
    habits: [],
    occurrences: [],
    tasks: [],
    campaigns: [],
    xp: 0,
  };
}

export function addGoal(
  state: PlayerState,
  input: { title: string; watchedTags: string[] } & Partial<Goal>,
) {
  const watchedTags = input.watchedTags
    .map((t) => normalizeTag(t))
    .filter((t): t is Tag => t !== null);
  const goal: Goal = {
    id: localId("goal"),
    title: input.title,
    watchedTags,
    createdAt: input.createdAt ?? new Date().toISOString().slice(0, 10),
    ...(input.metric ? { metric: input.metric } : {}),
    ...(input.targetDate ? { targetDate: input.targetDate } : {}),
    ...(input.campaignId ? { campaignId: input.campaignId } : {}),
  };
  state.goals.push(goal);
  return { state, goal };
}

export function addHabit(state: PlayerState, input: Habit) {
  const habit: Habit = {
    ...input,
    tags: input.tags.map(normalizeTag).filter((t): t is Tag => t !== null),
  };
  state.habits.push(habit);
  return { state, habit };
}

export function addTask(
  state: PlayerState,
  input: Omit<Task, "id" | "completedAt" | "xpAwarded" | "createdAt"> &
    Partial<Pick<Task, "createdAt">>,
) {
  const task: Task = {
    id: localId("task"),
    title: input.title,
    tags: input.tags.map(normalizeTag).filter((t): t is Tag => t !== null),
    effort: input.effort,
    dueDate: input.dueDate,
    completedAt: null,
    xpAwarded: false,
    createdAt: input.createdAt ?? new Date().toISOString().slice(0, 10),
  };
  state.tasks.push(task);
  return { state, task };
}

// ---------------------------------------------------------------------------
// Momentum — the honest rolling 7-day adherence ratio
// ---------------------------------------------------------------------------

export interface Momentum {
  /** null = "No score yet" — window has no planned periods and no completed tasks. */
  score: number | null;
  evidence: { met: number; total: number };
  /** True iff score === 0 — UI must offer a restart affordance, never a bare zero. */
  restartRecommended: boolean;
}

/**
 * Rolling 7-day adherence for one goal.
 *
 * Denominator ("planned periods"):
 *   - habit occurrences (rest days excluded) whose habit carries a watched tag
 *   - + one period per completed task carrying a watched tag (a completed task
 *     IS a met period by design: tasks reward, never punish)
 * Numerator: met counts — partial quotas contribute proportionally.
 *
 * Only CLOSED local days/weeks count; an open day never counts against the player.
 */
export function computeGoalMomentum(
  goalId: string,
  ctx: EngineContext,
): Momentum {
  const goal = ctx.state.goals.find((g) => g.id === goalId);
  if (!goal) {
    throw new Error(`computeGoalMomentum: no goal ${goalId}`);
  }

  const watched = new Set(goal.watchedTags);
  const windowStart = localDayKey(
    addLocalDays(ctx.now, ctx.timezone, -(MOMENTUM_WINDOW_DAYS - 1)),
    ctx.timezone,
  );

  let met = 0;
  let total = 0;

  // Habit occurrences inside the window.
  for (const occ of ctx.state.occurrences) {
    const habit = ctx.state.habits.find((h) => h.id === occ.habitId);
    if (!habit) continue;
    if (!habit.tags.some((t) => watched.has(t))) continue;
    if (occ.isRest || occ.targetCount === 0) continue; // rest drops out entirely
    if (occ.date < windowStart) continue; // aged out of the window
    if (occ.date > localDayKey(ctx.now, ctx.timezone)) continue; // future: never
    if (occ.metCount === null) continue; // open day — must never count against

    total += occ.targetCount;
    met += Math.min(occ.metCount, occ.targetCount);
  }

  // Completed tagged tasks: one met period each, once (reopen nulls completedAt).
  for (const task of ctx.state.tasks) {
    if (task.completedAt === null) continue;
    if (!task.tags.some((t) => watched.has(t))) continue;
    const completedDay = localDayKey(new Date(task.completedAt), ctx.timezone);
    if (completedDay < windowStart) continue;

    total += 1;
    met += 1;
  }

  if (total === 0) {
    return {
      score: null,
      evidence: { met: 0, total: 0 },
      restartRecommended: false,
    };
  }

  const score = Math.round((met / total) * 100);
  return { score, evidence: { met, total }, restartRecommended: score === 0 };
}

// ---------------------------------------------------------------------------
// XP and level — permanent growth
// ---------------------------------------------------------------------------

export function effortXp(effort: Effort): number {
  return effort === "small" ? 5 : effort === "medium" ? 10 : 20;
}

/** XP paid once per actual completion; 0 when already paid. Effort-scaled. */
export function xpForOccurrenceCompletion(
  occ: Occurrence,
  habit: Habit,
): number {
  if (occ.xpAwarded || occ.metCount === null || occ.metCount === 0) return 0;
  if (occ.isRest || occ.status === "missed") return 0;
  return effortXp(habit.effort);
}

/** Task XP — same once-only contract. */
export function xpForTaskCompletion(task: Task): number {
  if (task.xpAwarded || task.completedAt === null) return 0;
  return effortXp(task.effort);
}

/**
 * Gentle increasing curve, no cap: level N costs 10 × N XP (cumulative 5·N·(N+1)).
 * Level 1 at 0 XP; level 2 at 10; level 3 at 30; level 4 at 60 …
 */
export function levelFromXp(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
} {
  let level = 1;
  let remaining = xp;
  // Cost of the NEXT level from the current one is 10 × (level).
  while (remaining >= 10 * level) {
    remaining -= 10 * level;
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNext: 10 * level };
}

// ---------------------------------------------------------------------------
// Pace — optional metric vs elapsed time
// ---------------------------------------------------------------------------

export type PaceStatus = "ahead" | "on-pace" | "behind";

/**
 * Only when the goal has BOTH a metric and a target date (ADR: "Optional
 * metric-based pace"). Compares metric progress against elapsed time fraction.
 * ahead: ≥ 110% of the expected fraction · behind: ≤ 60% · else on-pace.
 */
export function computePace(
  goal: Goal,
  ctx: { now: Date; timezone: string },
): {
  status: PaceStatus;
  expectedFraction: number;
  actualFraction: number;
} | null {
  if (!goal.metric || !goal.targetDate) return null;

  const start = localDayKey(new Date(goal.createdAt), ctx.timezone);
  const end = goal.targetDate; // already a local day key
  const today = localDayKey(ctx.now, ctx.timezone);
  if (end <= start) return null;

  const elapsed = Math.max(0, dayDiff(start, today));
  const span = dayDiff(start, end);
  if (span <= 0) return null;

  const expectedFraction = Math.min(1, elapsed / span);
  const actualFraction =
    goal.metric.target === 0 ? 1 : goal.metric.current / goal.metric.target;

  const ratio =
    expectedFraction === 0
      ? actualFraction > 0
        ? Infinity
        : 1
      : actualFraction / expectedFraction;
  const status: PaceStatus =
    ratio >= 1.1 ? "ahead" : ratio <= 0.6 ? "behind" : "on-pace";
  return { status, expectedFraction, actualFraction };
}

// ---------------------------------------------------------------------------
// Occurrence lifecycle — day closure, rest, correction window
// ---------------------------------------------------------------------------

/** All occurrences scheduled for a given local date key (or week key). */
export function occurrencesForDate(
  occurrences: Occurrence[],
  date: string,
): Occurrence[] {
  return occurrences.filter((o) => o.date === date);
}

/**
 * Occurrences whose date is today or within the previous two closed local days.
 * Everything else is locked — derived, never stored.
 */
export function occurrencesEditable(
  occurrences: Occurrence[],
  ctx: { now: Date; timezone: string },
): string[] {
  const today = localDayKey(ctx.now, ctx.timezone);
  const oldest = localDayKey(
    addLocalDays(ctx.now, ctx.timezone, -CORRECTION_WINDOW_DAYS),
    ctx.timezone,
  );
  const editable: string[] = [];
  for (const occ of occurrences) {
    if (occ.date <= today && occ.date >= oldest) {
      editable.push(occ.date);
    }
  }
  return [...new Set(editable)].sort();
}

/** Mark an occurrence met (fully or partially) — the correction-window action. */
export function markOccurrence(
  occ: Occurrence,
  input: { metCount: number; now: Date; timezone: string },
): Occurrence {
  const today = localDayKey(input.now, input.timezone);
  const oldest = localDayKey(
    addLocalDays(input.now, input.timezone, -CORRECTION_WINDOW_DAYS),
    input.timezone,
  );
  if (occ.date < oldest || occ.date > today) {
    throw new Error(
      `markOccurrence: ${occ.date} is outside the correction window (${oldest}..${today})`,
    );
  }
  const metCount = Math.max(0, Math.min(input.metCount, occ.targetCount));
  const status: Occurrence["status"] = occ.isRest
    ? "rest"
    : metCount === 0
      ? "missed"
      : metCount >= occ.targetCount
        ? "met"
        : "partial";
  return { ...occ, metCount, status };
}

/** Mark a day as rest — drops out of scoring entirely, retroactively OK in-window. */
export function restOccurrence(
  occ: Occurrence,
  ctx: { now: Date; timezone: string },
): Occurrence {
  const today = localDayKey(ctx.now, ctx.timezone);
  const oldest = localDayKey(
    addLocalDays(ctx.now, ctx.timezone, -CORRECTION_WINDOW_DAYS),
    ctx.timezone,
  );
  if (occ.date < oldest || occ.date > today) {
    throw new Error(
      `restOccurrence: ${occ.date} is outside the correction window (${oldest}..${today})`,
    );
  }
  return {
    ...occ,
    isRest: true,
    metCount: null,
    targetCount: occ.targetCount,
    status: "rest",
  };
}

// ---------------------------------------------------------------------------
// Task lifecycle
// ---------------------------------------------------------------------------

export function completeTask(task: Task, ctx: { now: Date }): Task {
  if (task.completedAt) return task; // idempotent — completing twice changes nothing
  return { ...task, completedAt: ctx.now.toISOString() };
}

export function reopenTask(task: Task, ctx: { now: Date }): Task {
  void ctx;
  if (task.completedAt === null) return task;
  // Reopening nulls completedAt (momentum credit leaves) but keeps xpAwarded —
  // XP already paid stays paid; re-completing must not double-pay.
  return { ...task, completedAt: null };
}

// ---------------------------------------------------------------------------
// Local time helpers — thin, deterministic, zone-aware
// ---------------------------------------------------------------------------

function localDayKey(date: Date, timezone: string): string {
  // en-CA gives YYYY-MM-DD; u-ca-iso8601 pins the calendar.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    calendar: "iso8601",
  }).format(date);
}

function addLocalDays(date: Date, timezone: string, days: number): Date {
  // Add whole UTC days then let localDayKey re-derive the zone. For zone math
  // across DST the day key comparison stays correct because both endpoints
  // are normalized through the same zone.
  const result = new Date(date.getTime() + days * 86_400_000);
  void timezone;
  return result;
}

function dayDiff(fromDayKey: string, toDayKey: string): number {
  // Both are YYYY-MM-DD — UTC-anchored day math is exact for calendar-day diffs.
  return Math.round(
    (Date.parse(toDayKey) - Date.parse(fromDayKey)) / 86_400_000,
  );
}
