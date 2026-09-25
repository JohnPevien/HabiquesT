"use server";

// Account-level actions: data export and permanent deletion (ADR: deliberate,
// not hidden). Deletion requires the client to send the typed DELETE token —
// the server enforces it independently of the UI.

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  occurrences,
  habits,
  goals,
  tasks,
  campaigns,
  profiles,
} from "@/db/schema";
import { requireProfile, requireUserId } from "@/db/guard";

/** Full data export — JSON of every row the player owns. */
export async function exportPlayerData() {
  const profile = await requireProfile();
  const userId = profile.userId;
  const [goalRows, habitRows, occRows, taskRows, campaignRows] =
    await Promise.all([
      db.select().from(goals).where(eq(goals.userId, userId)),
      db.select().from(habits).where(eq(habits.userId, userId)),
      db.select().from(occurrences).where(eq(occurrences.userId, userId)),
      db.select().from(tasks).where(eq(tasks.userId, userId)),
      db.select().from(campaigns).where(eq(campaigns.userId, userId)),
    ]);
  return {
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: profile.displayName,
      timezone: profile.timezone,
      weekStart: profile.weekStart,
      mode: profile.mode,
      theme: profile.theme,
    },
    goals: goalRows,
    habits: habitRows,
    occurrences: occRows,
    tasks: taskRows,
    campaigns: campaignRows,
  };
}

/**
 * Permanent deletion. The typed DELETE token is enforced server-side —
 * a UI bug can never make this a one-click action. Cascades remove every row.
 */
export async function deleteAccount(input: { confirmationToken: string }) {
  if (input.confirmationToken !== "DELETE") {
    throw new Error("Type DELETE to confirm — deletion is permanent.");
  }
  const userId = await requireUserId();
  await db.delete(profiles).where(eq(profiles.userId, userId));
  revalidatePath("/");
  return { deleted: true };
}
