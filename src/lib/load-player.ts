// Server-side data loading for the dashboard. PlayerState assembled from
// the player's rows; the pure engine does all scoring.

import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  campaigns,
  goals,
  habits,
  occurrences,
  profiles,
  tasks,
} from "@/db/schema";
import { currentUserId } from "@/db/guard";
import type { Effort, PlayerState, Schedule } from "@/lib/engine";
import { isModeId, type ModeId } from "@/lib/modes";

export interface PlayerView {
  signedIn: boolean;
  timezone: string;
  weekStart: 0 | 1;
  mode: ModeId;
  theme: "system" | "light" | "dark";
  displayName: string;
  state: PlayerState;
  /** Level info derived from total XP awarded across completions. */
  xp: number;
}

export async function loadPlayerView(): Promise<PlayerView> {
  const userId = await currentUserId();
  if (!userId) {
    return {
      signedIn: false,
      timezone: "UTC",
      weekStart: 1,
      mode: "rpg",
      theme: "system",
      displayName: "Player",
      state: {
        goals: [],
        habits: [],
        occurrences: [],
        tasks: [],
        campaigns: [],
        xp: 0,
      },
      xp: 0,
    };
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  const [goalRows, habitRows, occRows, taskRows, campaignRows] =
    await Promise.all([
      db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .orderBy(desc(goals.createdAt)),
      db.select().from(habits).where(eq(habits.userId, userId)),
      db.select().from(occurrences).where(eq(occurrences.userId, userId)),
      db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.createdAt)),
      db.select().from(campaigns).where(eq(campaigns.userId, userId)),
    ]);

  const state: PlayerState = {
    goals: goalRows.map((g) => ({
      id: g.id,
      title: g.title,
      watchedTags: (g.watchedTags ?? []) as string[],
      ...(g.metric
        ? {
            metric: g.metric as {
              target: number;
              current: number;
              unit: string;
            },
          }
        : {}),
      ...(g.targetDate ? { targetDate: g.targetDate } : {}),
      ...(g.campaignId ? { campaignId: g.campaignId } : {}),
      ...(g.achievedAt ? { achievedAt: g.achievedAt.toISOString() } : {}),
      createdAt: g.createdAt,
    })),
    habits: habitRows.map((h) => ({
      id: h.id,
      title: h.title,
      tags: (h.tags ?? []) as string[],
      effort: h.effort as Effort,
      schedule: h.schedule as Schedule,
      createdAt: h.createdAt,
    })),
    occurrences: occRows.map((o) => ({
      id: o.id,
      habitId: o.habitId,
      date: o.date,
      metCount: o.metCount,
      targetCount: o.targetCount,
      isRest: o.isRest,
      status: o.status as "pending" | "met" | "partial" | "missed" | "rest",
      xpAwarded: o.xpAwarded,
    })),
    tasks: taskRows.map((t) => ({
      id: t.id,
      title: t.title,
      tags: (t.tags ?? []) as string[],
      effort: t.effort as Effort,
      dueDate: t.dueDate,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      xpAwarded: t.xpAwarded,
      createdAt: t.createdAt,
    })),
    campaigns: campaignRows.map((c) => ({
      id: c.id,
      title: c.title,
      lengthDays: c.lengthDays as 30 | 60 | 90,
      startAt: c.startAt,
      endAt: c.endAt,
      status: c.status as "active" | "ended" | "archived",
    })),
    xp: 0,
  };

  // Total XP: every occurrence/task with xpAwarded contributes its effort value.
  const effortXp = (e: Effort) =>
    e === "small" ? 5 : e === "medium" ? 10 : 20;
  let xp = 0;
  for (const o of state.occurrences) {
    if (o.xpAwarded && o.metCount !== null && o.metCount > 0 && !o.isRest) {
      const habit = state.habits.find((h) => h.id === o.habitId);
      if (habit) xp += effortXp(habit.effort);
    }
  }
  for (const t of state.tasks) {
    if (t.xpAwarded && t.completedAt) xp += effortXp(t.effort);
  }
  state.xp = xp;

  const mode = isModeId(profile?.mode ?? "rpg")
    ? (profile!.mode as ModeId)
    : "rpg";

  return {
    signedIn: true,
    timezone: profile?.timezone ?? "UTC",
    weekStart: (profile?.weekStart ?? 1) === 0 ? 0 : 1,
    mode,
    theme: (["system", "light", "dark"] as const).includes(
      (profile?.theme ?? "system") as "system" | "light" | "dark",
    )
      ? (profile!.theme as "system" | "light" | "dark")
      : "system",
    displayName: profile?.displayName ?? "Player",
    state,
    xp,
  };
}
