"use client";

// The dashboard. Server-renders scores; client handles interaction.
// Every action is a Server Action from src/app/actions.ts — the client
// never touches the DB or supplies ownership.

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Flame,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import {
  completeTaskAction,
  createGoal,
  createHabit,
  createTask,
  deleteGoal,
  reopenTaskAction,
  setOccurrence,
  setRest,
  updateProfile,
} from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Effort, Occurrence, Schedule } from "@/lib/engine";
import type { ModeCopy, ModeId } from "@/lib/modes";
import { MODES, MODE_IDS } from "@/lib/modes";
import { cn } from "@/lib/utils";

export interface ScoredGoalView {
  id: string;
  title: string;
  watchedTags: string[];
  targetDate: string | null;
  achievedAt: string | null;
  score: number | null;
  met: number;
  total: number;
  restartRecommended: boolean;
  paceStatus: "ahead" | "on-pace" | "behind" | null;
}

export interface HabitView {
  id: string;
  title: string;
  tags: string[];
  effort: Effort;
  schedule: Schedule;
}

export interface TaskView {
  id: string;
  title: string;
  tags: string[];
  effort: Effort;
  dueDate: string | null;
  completedAt: string | null;
}

export interface PlayerBoardProps {
  mode: ModeCopy;
  modeId: ModeId;
  theme: "system" | "light" | "dark";
  signedIn: boolean;
  timezone: string;
  displayName: string;
  goals: ScoredGoalView[];
  habits: HabitView[];
  tasks: TaskView[];
  occurrences: Occurrence[];
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  windowDays: number;
  todayKey: string;
}

const PACE_LABEL: Record<"ahead" | "on-pace" | "behind", string> = {
  ahead: "Ahead",
  "on-pace": "On pace",
  behind: "Behind",
};

export function PlayerBoard(props: PlayerBoardProps) {
  const {
    mode,
    modeId,
    signedIn,
    goals,
    habits,
    tasks,
    occurrences,
    todayKey,
  } = props;
  const [, startTransition] = useTransition();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTag, setNewGoalTag] = useState("");

  // Optimistic occurrence updates — instant feedback, server reconciles.
  const [optimisticOccs, applyOptimistic] = useOptimistic(
    occurrences,
    (
      state: Occurrence[],
      action: {
        habitId: string;
        date: string;
        metCount: number | null;
        rest?: boolean;
      },
    ): Occurrence[] =>
      state.some((o) => o.habitId === action.habitId && o.date === action.date)
        ? state.map((o): Occurrence =>
            o.habitId === action.habitId && o.date === action.date
              ? {
                  ...o,
                  metCount: action.rest ? null : action.metCount,
                  isRest: action.rest ?? false,
                  status: action.rest
                    ? "rest"
                    : action.metCount === 0
                      ? "missed"
                      : action.metCount !== null &&
                          action.metCount >= o.targetCount
                        ? "met"
                        : "partial",
                }
              : o,
          )
        : [
            ...state,
            {
              id: `optimistic-${action.habitId}-${action.date}`,
              habitId: action.habitId,
              date: action.date,
              metCount: action.rest ? null : action.metCount,
              targetCount: 1,
              isRest: action.rest ?? false,
              status: action.rest ? "rest" : "pending",
              xpAwarded: false,
            } satisfies Occurrence,
          ],
  );

  const todaysHabits = useMemo(() => {
    return habits.map((habit) => {
      const occ = optimisticOccs.find(
        (o) => o.habitId === habit.id && o.date === todayKey,
      );
      return { habit, occ: occ ?? null };
    });
  }, [habits, optimisticOccs, todayKey]);

  const openTasks = tasks.filter((t) => t.completedAt === null);
  const doneTasks = tasks.filter((t) => t.completedAt !== null);

  if (!signedIn) {
    return (
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            HabiquesT
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Habits with Momentum.
          </h1>
          <p className="text-muted-foreground">{mode.tagline}</p>
        </header>
        <p className="text-sm text-muted-foreground">
          A gamified habit, task, and goal tracker. Your rolling 7-day Momentum
          rises when you follow your plan — and recovers naturally when life
          happens. No damage, no shaming, permanent XP. Your data is visible
          only to you.
        </p>
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-medium">
            Original worlds. Not medical advice. Private by default.
          </p>
          <p className="mt-1 text-muted-foreground">
            All names and characters are original — not affiliated with any game
            or anime.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth/sign-in"
            className="text-primary underline underline-offset-4"
          >
            Sign in to begin your {mode.campaign.toLowerCase()}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      data-mode={modeId}
      className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6"
    >
      {/* Header: identity, level, mode */}
      <header className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {mode.label}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode.player} {props.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">{mode.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg border bg-card px-3 py-2 text-sm">
            <span className="font-semibold">
              {mode.level} {props.level}
            </span>
            <span className="ml-2 text-muted-foreground">
              {props.xpIntoLevel}/{props.xpForNext} XP
            </span>
            <div
              aria-hidden
              className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (props.xpIntoLevel / Math.max(1, props.xpForNext)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mode switcher — presentation only, progress persists (ADR: modes) */}
      <section aria-label="Fantasy mode" className="mb-6 flex flex-wrap gap-2">
        {MODE_IDS.map((id) => (
          <Button
            key={id}
            variant={id === modeId ? "default" : "outline"}
            size="sm"
            onPress={() =>
              startTransition(async () => {
                await updateProfile({ mode: id });
              })
            }
          >
            {MODES[id].label}
          </Button>
        ))}
      </section>

      {/* Goals */}
      <section aria-labelledby="goals-h" className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="goals-h" className="text-lg font-semibold">
            {mode.goals}
          </h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => (
            <li key={goal.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    watching {goal.watchedTags.map((t) => `#${t}`).join(" ")}
                    {goal.targetDate ? ` · until ${goal.targetDate}` : ""}
                  </p>
                </div>
                {goal.achievedAt ? (
                  <Sparkles
                    aria-label="Achieved"
                    className="size-5 text-primary"
                  />
                ) : goal.paceStatus ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      goal.paceStatus === "ahead" &&
                        "bg-primary/10 text-primary",
                      goal.paceStatus === "on-pace" &&
                        "bg-muted text-foreground",
                      goal.paceStatus === "behind" &&
                        "bg-destructive/10 text-destructive",
                    )}
                  >
                    {PACE_LABEL[goal.paceStatus]}
                  </span>
                ) : null}
              </div>

              {goal.score === null ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No score yet — schedule actions to begin.
                </p>
              ) : goal.restartRecommended ? (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    {mode.momentum} reset — today is a fresh start.
                  </p>
                  <RotateCcw aria-hidden className="size-4 text-primary" />
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums">
                      {goal.score}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {goal.met} of {goal.total} planned{" "}
                      {goal.total === 1 ? "period" : "periods"} · last{" "}
                      {props.windowDays} days
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${goal.score}%` }}
                    />
                  </div>
                </>
              )}
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onPress={() =>
                    startTransition(
                      async () => void (await deleteGoal({ goalId: goal.id })),
                    )
                  }
                >
                  <Trash2 aria-hidden className="size-3.5" /> Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newGoalTitle.trim()) return;
            const tags = newGoalTag.trim()
              ? newGoalTag.trim().split(/\s+/)
              : [];
            startTransition(async () => {
              await createGoal({
                title: newGoalTitle.trim(),
                watchedTags: tags,
              });
              setNewGoalTitle("");
              setNewGoalTag("");
            });
          }}
        >
          <label htmlFor="new-goal" className="sr-only">
            New {mode.goals.replace(/s$/, "").toLowerCase()} title
          </label>
          <input
            id="new-goal"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder={`New ${mode.goals.replace(/s$/, "").toLowerCase()} — e.g. Run a 10K`}
            className="h-8 min-w-0 flex-1 rounded-lg border bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <label htmlFor="new-goal-tag" className="sr-only">
            Tags this goal watches
          </label>
          <input
            id="new-goal-tag"
            value={newGoalTag}
            onChange={(e) => setNewGoalTag(e.target.value)}
            placeholder="#fitness"
            className="h-8 w-28 rounded-lg border bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            disabled={!newGoalTitle.trim()}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus aria-hidden className="size-3.5" /> Add
          </button>
        </form>
      </section>

      {/* Today's habits */}
      <section aria-labelledby="habits-h" className="mb-10">
        <h2 id="habits-h" className="mb-3 text-lg font-semibold">
          Today&apos;s plan
        </h2>
        {habits.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No habits yet. Add one below — daily, weekdays, times per week, or
            times per day.
          </p>
        ) : (
          <ul className="grid gap-2">
            {todaysHabits.map(({ habit, occ }) => {
              const met = occ?.metCount ?? 0;
              const rest = occ?.isRest ?? false;
              return (
                <li
                  key={habit.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <Button
                    aria-label={
                      rest
                        ? `${habit.title} — rest day`
                        : `${habit.title} — mark done`
                    }
                    variant={met > 0 ? "default" : "outline"}
                    size="icon"
                    onPress={() =>
                      startTransition(async () => {
                        applyOptimistic({
                          habitId: habit.id,
                          date: todayKey,
                          metCount: met > 0 ? 0 : 1,
                        });
                        await setOccurrence({
                          habitId: habit.id,
                          date: todayKey,
                          metCount: met > 0 ? 0 : 1,
                        });
                      })
                    }
                  >
                    <Check aria-hidden className="size-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        met > 0 && "text-primary",
                      )}
                    >
                      {habit.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {habit.tags.map((t) => `#${t}`).join(" ")} ·{" "}
                      {describeSchedule(habit.schedule)}
                    </p>
                  </div>
                  <Button
                    aria-label={`Mark ${habit.title} as rest today`}
                    variant="ghost"
                    size="icon-sm"
                    onPress={() =>
                      startTransition(async () => {
                        applyOptimistic({
                          habitId: habit.id,
                          date: todayKey,
                          metCount: null,
                          rest: true,
                        });
                        await setRest({ habitId: habit.id, date: todayKey });
                      })
                    }
                  >
                    <Moon aria-hidden className="size-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newHabitTitle.trim()) return;
            startTransition(async () => {
              const tags =
                newHabitTitle.match(/#(\S+)/g)?.map((t) => t.slice(1)) ?? [];
              const title = newHabitTitle.replace(/\s*#\S+/g, "").trim();
              await createHabit({
                title,
                tags: tags.length ? tags : ["general"],
                effort: "medium",
                schedule: { kind: "daily" },
              });
              setNewHabitTitle("");
            });
          }}
        >
          <label htmlFor="new-habit" className="sr-only">
            New habit title (add #tags inline)
          </label>
          <input
            id="new-habit"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="Morning stretch #fitness"
            className="h-8 min-w-0 flex-1 rounded-lg border bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            disabled={!newHabitTitle.trim()}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus aria-hidden className="size-3.5" /> Add habit
          </button>
        </form>
      </section>

      {/* Tasks */}
      <section aria-labelledby="tasks-h">
        <h2 id="tasks-h" className="mb-3 text-lg font-semibold">
          Tasks
        </h2>
        {openTasks.length === 0 && doneTasks.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Tasks are one-off work with tags. Completing them boosts matching
            goals; overdue never penalizes.
          </p>
        ) : (
          <ul className="grid gap-2">
            {openTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <Button
                  aria-label={`Complete ${task.title}`}
                  variant="outline"
                  size="icon"
                  onPress={() =>
                    startTransition(
                      async () =>
                        void (await completeTaskAction({ taskId: task.id })),
                    )
                  }
                >
                  <Check aria-hidden className="size-4" />
                </Button>
                <p className="min-w-0 flex-1 truncate text-sm">{task.title}</p>
                {task.dueDate ? (
                  <span className="text-xs text-muted-foreground">
                    due {task.dueDate}
                  </span>
                ) : null}
              </li>
            ))}
            {doneTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 opacity-60"
              >
                <Button
                  aria-label={`Reopen ${task.title}`}
                  variant="ghost"
                  size="icon-sm"
                  onPress={() =>
                    startTransition(
                      async () =>
                        void (await reopenTaskAction({ taskId: task.id })),
                    )
                  }
                >
                  <RotateCcw aria-hidden className="size-3.5" />
                </Button>
                <p className="min-w-0 flex-1 truncate text-sm line-through">
                  {task.title}
                </p>
                <Flame aria-hidden className="size-3.5 text-primary" />
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTaskTitle.trim()) return;
            const tags =
              newTaskTitle.match(/#(\S+)/g)?.map((t) => t.slice(1)) ?? [];
            const title = newTaskTitle.replace(/\s*#\S+/g, "").trim();
            startTransition(async () => {
              await createTask({
                title,
                tags: tags.length ? tags : ["general"],
                effort: "small",
                dueDate: null,
              });
              setNewTaskTitle("");
            });
          }}
        >
          <label htmlFor="new-task" className="sr-only">
            New task title (add #tags inline)
          </label>
          <input
            id="new-task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Book race entry #fitness"
            className="h-8 min-w-0 flex-1 rounded-lg border bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className={buttonVariants({ size: "sm" })}
          >
            <Target aria-hidden className="size-3.5" /> Add task
          </button>
        </form>
      </section>
    </main>
  );
}

/** Human schedule text — mirrors engine.Schedule. */
function describeSchedule(schedule: Schedule): string {
  if (schedule.kind === "daily") return "daily";
  if (schedule.kind === "times-per-day") return `${schedule.count}× a day`;
  if (schedule.kind === "times-per-week") return `${schedule.count}× a week`;
  const days = schedule.days
    .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
    .join(" ");
  return days;
}
