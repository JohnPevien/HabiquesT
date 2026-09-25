import type { Metadata } from "next";

import { AccountSection } from "@/components/account-section";
import { CalendarPanel } from "@/components/calendar-panel";
import { PlayerBoard } from "@/components/player-board";
import { SetupWizard } from "@/components/setup-wizard";
import {
  computeGoalMomentum,
  computePace,
  levelFromXp,
  MOMENTUM_WINDOW_DAYS,
} from "@/lib/engine";
import { addLocalDays } from "@/lib/local-time";
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
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: view.timezone,
    calendar: "iso8601",
  }).format(now);
  // 28-day trend grid: oldest first, today last.
  const dayKeys = Array.from({ length: 28 }, (_, i) =>
    addLocalDays(now, -(27 - i), view.timezone),
  );

  return (
    <>
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
        todayKey={todayKey}
      />
      {view.signedIn &&
      view.state.goals.length === 0 &&
      view.state.habits.length === 0 ? (
        <div className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
          <SetupWizard />
        </div>
      ) : null}
      {view.signedIn ? (
        <div className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
          <AccountSection />
        </div>
      ) : null}
      {view.signedIn ? (
        <CalendarPanel
          habits={view.state.habits.map((h) => ({
            id: h.id,
            title: h.title,
            effort: h.effort,
            schedule: h.schedule,
          }))}
          occurrences={view.state.occurrences}
          timezone={view.timezone}
          dayKeys={dayKeys}
          todayKey={todayKey}
        />
      ) : null}
    </>
  );
}
