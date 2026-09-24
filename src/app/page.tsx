import type { Metadata } from "next";

import { PlayerBoard } from "@/components/player-board";
import {
  computeGoalMomentum,
  computePace,
  levelFromXp,
  MOMENTUM_WINDOW_DAYS,
} from "@/lib/engine";
import { loadPlayerView } from "@/lib/load-player";
import { MODES } from "@/lib/modes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HabiquesT — habits, tasks & goals with Momentum",
  description:
    "Gamified habit, task and goal tracker. Rolling 7-day Momentum, permanent XP, three fantasy modes. Original worlds, not medical advice, private by default.",
};

export default async function Home() {
  const view = await loadPlayerView();
  const now = new Date();
  const mode = MODES[view.mode];

  // Score every goal with the pure engine — Momentum is computed, never stored.
  const scored = view.state.goals.map((goal) => {
    const momentum = computeGoalMomentum(goal.id, {
      now,
      timezone: view.timezone,
      state: view.state,
    });
    const pace = computePace(goal, { now, timezone: view.timezone });
    return { goal, momentum, pace };
  });

  const level = levelFromXp(view.xp);

  return (
    <PlayerBoard
      mode={mode}
      modeId={view.mode}
      theme={view.theme}
      signedIn={view.signedIn}
      timezone={view.timezone}
      displayName={view.displayName}
      goals={scored.map((s) => ({
        id: s.goal.id,
        title: s.goal.title,
        watchedTags: s.goal.watchedTags,
        targetDate: s.goal.targetDate ?? null,
        achievedAt: s.goal.achievedAt ?? null,
        score: s.momentum.score,
        met: s.momentum.evidence.met,
        total: s.momentum.evidence.total,
        restartRecommended: s.momentum.restartRecommended,
        paceStatus: s.pace?.status ?? null,
      }))}
      habits={view.state.habits.map((h) => ({
        id: h.id,
        title: h.title,
        tags: h.tags,
        effort: h.effort,
        schedule: h.schedule,
      }))}
      tasks={view.state.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        tags: t.tags,
        effort: t.effort,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
      }))}
      occurrences={view.state.occurrences}
      level={level.level}
      xpIntoLevel={level.xpIntoLevel}
      xpForNext={level.xpForNext}
      windowDays={MOMENTUM_WINDOW_DAYS}
      todayKey={new Intl.DateTimeFormat("en-CA", {
        timeZone: view.timezone,
        calendar: "iso8601",
      }).format(now)}
    />
  );
}
