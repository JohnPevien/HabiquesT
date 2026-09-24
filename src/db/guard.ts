// Server-side ownership guard. Every mutation goes through a Server Action;
// this module resolves the verified session and refuses to touch rows that
// do not belong to the caller. The client never supplies user_id.

import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { auth } from "@/lib/auth/server";

export class UnauthorizedError extends Error {}
/** Verified Neon Auth session user id, or null when signed out. */
export async function currentUserId(): Promise<string | null> {
  const { data: session } = await auth.getSession();
  return session?.user?.id ?? null;
}
/**
 * The player's own profile row — created lazily on first call after sign-in.
 * Timezone defaults to a browser-supplied hint captured at wizard time;
 * weekStart defaults to Monday; mode defaults to rpg (ADR defaults).
 */
export async function requireProfile(input: { timezoneHint?: string } = {}) {
  const userId = await currentUserId();
  if (!userId) throw new UnauthorizedError("sign-in required");

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(profiles)
    .values({
      userId,
      // Only trust the hint on creation — never silently rewrite a stored zone.
      ...(input.timezoneHint ? { timezone: input.timezoneHint } : {}),
    })
    .returning();
  return created;
}

/** Session user id or a hard error — for actions that must be signed in. */
export async function requireUserId(): Promise<string> {
  const userId = await currentUserId();
  if (!userId) throw new UnauthorizedError("sign-in required");
  return userId;
}
