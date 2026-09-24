// HabiquesT database schema — mirrors src/lib/engine.ts types exactly.
// Every table is player-scoped and RLS-protected: user_id is stamped by the
// server from the verified Neon Auth session (see src/db/guard.ts); the
// client can never supply user_id.

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// All HabiquesT tables live in app_public, isolated from neon_auth.
export const app = pgSchema("app_public");

// ---------------------------------------------------------------------------
// Tables — RLS-protected, player-owned rows (src/db/rls-baseline.sql)
// ---------------------------------------------------------------------------

export const profiles = app.table("profiles", {
  // Matches the neon_auth user id. One row per player, created on first sign-in.
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name").notNull().default("Player"),
  // IANA timezone — all local-day math keys off this (ADR: profile timezone).
  timezone: text("timezone").notNull().default("UTC"),
  // 0=Sunday, 1=Monday. Weekly quotas close at this boundary (ADR: times).
  weekStart: integer("week_start").notNull().default(1),
  // rpg | anime | arcade — presentation only, switchable anytime (ADR: modes).
  mode: text("mode").notNull().default("rpg"),
  // system | light | dark (ADR: system theme plus override).
  theme: text("theme").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaigns = app.table(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    // 30 | 60 | 90 days (ADR: campaign groups goals).
    lengthDays: integer("length_days").notNull(),
    startAt: text("start_at").notNull(), // local day key YYYY-MM-DD
    endAt: text("end_at").notNull(), // local day key; ended ⇒ read-only
    status: text("status").notNull().default("active"), // active | ended | archived
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("campaigns_user_idx").on(t.userId)],
);

export const goals = app.table(
  "goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    // Normalized watched tags (engine.normalizeTag); goals watch tags (ADR).
    watchedTags: jsonb("watched_tags").notNull().default([]),
    // Optional measurable outcome — presence + targetDate enables Pace.
    metric: jsonb("metric"),
    // Optional target date (local day key) — may come from a campaign end.
    targetDate: text("target_date"),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    // Player-confirmed only; the engine never flips this.
    achievedAt: timestamp("achieved_at", { withTimezone: true }),
    createdAt: text("created_at").notNull(), // local day key — pace anchor
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const habits = app.table(
  "habits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    tags: jsonb("tags").notNull().default([]),
    effort: text("effort").notNull().default("medium"), // small | medium | major
    schedule: jsonb("schedule").notNull(), // engine.Schedule
    createdAt: text("created_at").notNull(), // local day key
  },
  (t) => [index("habits_user_idx").on(t.userId)],
);

export const occurrences = app.table(
  "occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    // Local day key (daily/day-quota) or week key YYYY-Www (times-per-week).
    date: text("date").notNull(),
    metCount: integer("met_count"), // null = open/rest; number = resolved
    targetCount: integer("target_count").notNull(),
    isRest: boolean("is_rest").notNull().default(false),
    // Denormalized from metCount for cheap calendar reads; metCount is truth.
    status: text("status").notNull().default("pending"),
    // XP pays once per actual completion (ADR).
    xpAwarded: boolean("xp_awarded").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("occurrences_habit_date").on(t.habitId, t.date),
    index("occurrences_user_date_idx").on(t.userId, t.date),
  ],
);

export const tasks = app.table(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    tags: jsonb("tags").notNull().default([]),
    effort: text("effort").notNull().default("medium"),
    dueDate: text("due_date"), // local day key; overdue never penalizes
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // Reopen nulls completedAt but keeps xpAwarded — XP paid stays paid.
    xpAwarded: boolean("xp_awarded").notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_user_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Relations — for Drizzle query API
// ---------------------------------------------------------------------------

export const profilesRelations = relations(profiles, ({ many }) => ({
  campaigns: many(campaigns),
  goals: many(goals),
  habits: many(habits),
  tasks: many(tasks),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  profile: one(profiles, { fields: [campaigns.userId], references: [profiles.userId] }),
  goals: many(goals),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  profile: one(profiles, { fields: [goals.userId], references: [profiles.userId] }),
  campaign: one(campaigns, { fields: [goals.campaignId], references: [campaigns.id] }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  profile: one(profiles, { fields: [habits.userId], references: [profiles.userId] }),
  occurrences: many(occurrences),
}));

export const occurrencesRelations = relations(occurrences, ({ one }) => ({
  habit: one(habits, { fields: [occurrences.habitId], references: [habits.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  profile: one(profiles, { fields: [tasks.userId], references: [profiles.userId] }),
}));