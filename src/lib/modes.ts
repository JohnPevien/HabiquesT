// Mode registry — the presentation packs (ADR: deep presentation packs).
// One engine; each mode renames concepts, carries flavor copy, and pairs with
// a tuned palette in globals.css ([data-mode] on <html>, light + dark).
//
// IMPORTANT: every field must be serializable — ModeCopy crosses the RSC
// boundary as props. No functions. Templates use "{level}" placeholders.

export type ModeId = "rpg" | "anime" | "arcade";

export interface ModeCopy {
  id: ModeId;
  label: string;
  /** What the player is called in this world. */
  player: string;
  /** Goals. */
  goals: string;
  /** Campaigns / seasons. */
  campaign: string;
  /** Momentum — the score. */
  momentum: string;
  /** Level. */
  level: string;
  /** One-line flavor shown on the dashboard. */
  tagline: string;
  /** Celebration copy when a level unlocks — "{level}" replaced client-side. */
  levelUpTemplate: string;
}

export const MODES: Record<ModeId, ModeCopy> = {
  rpg: {
    id: "rpg",
    label: "Ember Campaign",
    player: "Wayfarer",
    goals: "Quests",
    campaign: "Campaign",
    momentum: "Momentum",
    level: "Renown",
    tagline: "Every plan kept is a torch carried forward.",
    levelUpTemplate: "Renown {level} — the guild marks your name.",
  },
  anime: {
    id: "anime",
    label: "Training Arc",
    player: "Trainee",
    goals: "Ambitions",
    campaign: "Arc",
    momentum: "Spirit",
    level: "Rank",
    tagline: "The montage is daily. Keep showing up.",
    levelUpTemplate: "Rank {level} reached — your aura sharpens.",
  },
  arcade: {
    id: "arcade",
    label: "Neon Run",
    player: "Player One",
    goals: "Missions",
    campaign: "Season",
    momentum: "Score",
    level: "Stage",
    tagline: "No continues needed — just press start again.",
    levelUpTemplate: "Stage {level} unlocked — insert coin.",
  },
};

export const MODE_IDS: ModeId[] = ["rpg", "anime", "arcade"];

export function isModeId(value: string): value is ModeId {
  return value === "rpg" || value === "anime" || value === "arcade";
}
