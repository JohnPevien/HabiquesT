"use server";

// Player mutations. Every action stamps user_id from the verified session —
// the client never supplies ownership. Momentum is always recomputed from
// events by the pure engine, so these actions only record facts.

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import {
  campaigns,
  goals,
  habits,
  occurrences,
  profiles,
  tasks,
} from "@/db/schema";
import { requireProfile } from "@/db/guard";
import {
  CORRECTION_WINDOW_DAYS,
  type Effort,
  type Schedule,
  markOccurrence,
  normalizeTag,
} from "@/lib/engine";
import { localDayKey, addLocalDays } from "@/lib/local-time";

// Resolve the signed-in profile once per action — owns userId + timezone.
async function actingAs() {
  const profile = await requireProfile();
  return { userId: profile.userId, timezone: profile.timezone };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProfile(input: {
  displayName?: string;
  timezone?: string;
  weekStart?: 0 | 1;
  mode?: "rpg" | "anime" | "arcade";
  theme?: "system" | "light" | "dark";
}) {
  const { userId } = await actingAs();
  await db
    .update(profiles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function createCampaign(input: {
  title: string;
  lengthDays: 30 | 60 | 90;
}) {
  const { userId, timezone } = await actingAs();
  const startAt = localDayKey(new Date(), timezone);
  const endAt = addLocalDays(new Date(), input.lengthDays, timezone);
  const [row] = await db
    .insert(campaigns)
    .values({
      userId,
      title: input.title,
      lengthDays: input.lengthDays,
      startAt,
      endAt,
    })
    .returning();
  revalidatePath("/");
  return row;
}

export async function extendCampaign(input: {
  campaignId: string;
  newEndAt: string;
}) {
  const { userId } = await actingAs();
  await db
    .update(campaigns)
    .set({ endAt: input.newEndAt, status: "active" })
    .where(
      and(eq(campaigns.id, input.campaignId), eq(campaigns.userId, userId)),
    );
  revalidatePath("/");
}

export async function archiveCampaign(input: { campaignId: string }) {
  const { userId } = await actingAs();
  await db
    .update(campaigns)
    .set({ status: "archived" })
    .where(
      and(eq(campaigns.id, input.campaignId), eq(campaigns.userId, userId)),
    );
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function createGoal(input: {
  title: string;
  watchedTags: string[];
  metric?: { target: number; current: number; unit: string };
  targetDate?: string;
  campaignId?: string;
}) {
  const { userId, timezone } = await actingAs();
  const watchedTags = input.watchedTags
    .map((t) => normalizeTag(t))
    .filter((t): t is string => t !== null);
  const [row] = await db
    .insert(goals)
    .values({
      userId,
      title: input.title,
      watchedTags,
      ...(input.metric ? { metric: input.metric } : {}),
      ...(input.targetDate ? { targetDate: input.targetDate } : {}),
      ...(input.campaignId ? { campaignId: input.campaignId } : {}),
      createdAt: localDayKey(new Date(), timezone),
    })
    .returning();
  revalidatePath("/");
  return row;
}

export async function achieveGoal(input: { goalId: string }) {
  const { userId } = await actingAs();
  await db
    .update(goals)
    .set({ achievedAt: new Date() })
    .where(and(eq(goals.id, input.goalId), eq(goals.userId, userId)));
  revalidatePath("/");
}

export async function deleteGoal(input: { goalId: string }) {
  const { userId } = await actingAs();
  await db
    .delete(goals)
    .where(and(eq(goals.id, input.goalId), eq(goals.userId, userId)));
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Habits + occurrences
// ---------------------------------------------------------------------------

export async function createHabit(input: {
  title: string;
  tags: string[];
  effort: Effort;
  schedule: Schedule;
}) {
  const { userId, timezone } = await actingAs();
  const tags = input.tags
    .map((t) => normalizeTag(t))
    .filter((t): t is string => t !== null);
  const [row] = await db
    .insert(habits)
    .values({
      userId,
      title: input.title,
      tags,
      effort: input.effort,
      schedule: input.schedule,
      createdAt: localDayKey(new Date(), timezone),
    })
    .returning();
  revalidatePath("/");
  return row;
}

export async function deleteHabit(input: { habitId: string }) {
  const { userId } = await actingAs();
  await db
    .delete(habits)
    .where(and(eq(habits.id, input.habitId), eq(habits.userId, userId)));
  revalidatePath("/");
}

/**
 * Record a completion / correction for a habit occurrence on a given local day.
 * Enforces the correction window (today + previous two closed days); older
 * dates are rejected — history locks.
 */
export async function setOccurrence(input: {
  habitId: string;
  date: string;
  metCount: number;
}) {
  const { userId, timezone } = await actingAs();
  const today = localDayKey(new Date(), timezone);
  const oldest = addLocalDays(new Date(), -CORRECTION_WINDOW_DAYS, timezone);
  if (input.date < oldest || input.date > today) {
    throw new Error(
      `Date ${input.date} is outside the correction window (${oldest}..${today})`,
    );
  }

  const [habit] = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, input.habitId), eq(habits.userId, userId)));
  if (!habit) throw new Error("Habit not found");

  const schedule = habit.schedule as Schedule;
  const targetCount = schedule.kind === "times-per-day" ? schedule.count : 1;

  const existing = await db
    .select()
    .from(occurrences)
    .where(
      and(
        eq(occurrences.habitId, input.habitId),
        eq(occurrences.date, input.date),
      ),
    );

  if (existing.length === 0) {
    await db.insert(occurrences).values({
      userId,
      habitId: input.habitId,
      date: input.date,
      targetCount,
      metCount: input.metCount,
      status:
        input.metCount >= targetCount
          ? "met"
          : input.metCount > 0
            ? "partial"
            : "missed",
    });
  } else {
    const row = existing[0];
    // Engine Occurrence vs DB row: status is a free string in the DB and
    // metCount can be null while open — cast the derived status explicitly.
    const updated = markOccurrence(
      {
        id: row.id,
        habitId: row.habitId,
        date: row.date,
        metCount: row.metCount ?? null,
        targetCount,
        isRest: row.isRest,
        status: row.status as "pending" | "met" | "partial" | "missed" | "rest",
        xpAwarded: row.xpAwarded,
      },
      { metCount: input.metCount, now: new Date(), timezone },
    );
    await db
      .update(occurrences)
      .set({
        metCount: updated.metCount,
        status: updated.status,
        updatedAt: new Date(),
      })
      .where(eq(occurrences.id, row.id));
  }
  revalidatePath("/");
}

/** Mark a day as rest — drops out of Momentum entirely (ADR: rest). */
export async function setRest(input: { habitId: string; date: string }) {
  const { userId, timezone } = await actingAs();
  const today = localDayKey(new Date(), timezone);
  const oldest = addLocalDays(new Date(), -CORRECTION_WINDOW_DAYS, timezone);
  if (input.date < oldest || input.date > today) {
    throw new Error(
      `Date ${input.date} is outside the correction window (${oldest}..${today})`,
    );
  }

  const existing = await db
    .select()
    .from(occurrences)
    .where(
      and(
        eq(occurrences.habitId, input.habitId),
        eq(occurrences.date, input.date),
      ),
    );
  if (existing.length === 0) {
    await db.insert(occurrences).values({
      userId,
      habitId: input.habitId,
      date: input.date,
      targetCount: 1,
      isRest: true,
      status: "rest",
      metCount: null,
    });
  } else {
    await db
      .update(occurrences)
      .set({
        isRest: true,
        metCount: null,
        status: "rest",
        updatedAt: new Date(),
      })
      .where(eq(occurrences.id, existing[0].id));
  }
  revalidatePath("/");
}
// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(input: {
  title: string;
  tags: string[];
  effort: Effort;
  dueDate: string | null;
}) {
  const { userId, timezone } = await actingAs();
  const tags = input.tags
    .map((t) => normalizeTag(t))
    .filter((t): t is string => t !== null);
  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      title: input.title,
      tags,
      effort: input.effort,
      dueDate: input.dueDate,
      createdAt: localDayKey(new Date(), timezone),
    })
    .returning();
  revalidatePath("/");
  return row;
}

export async function completeTaskAction(input: { taskId: string }) {
  const { userId } = await actingAs();
  await db
    .update(tasks)
    .set({ completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));
  revalidatePath("/");
}

export async function reopenTaskAction(input: { taskId: string }) {
  const { userId } = await actingAs();
  // Reopen nulls completedAt but keeps xpAwarded — XP paid stays paid (ADR).
  await db
    .update(tasks)
    .set({ completedAt: null, updatedAt: new Date() })
    .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));
  revalidatePath("/");
}

export async function deleteTask(input: { taskId: string }) {
  const { userId } = await actingAs();
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));
  revalidatePath("/");
}
