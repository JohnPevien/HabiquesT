# HabiquesT — Product & Domain Glossary

HabiquesT is a gamified habit, task, and goal tracker for one player. Fantasy presentation modes make execution feel like an RPG campaign, an anime training arc, or an arcade run, while one honest scoring engine underneath measures whether the player is actually following their plan.

## Language

### Core planning

**Goal**:
A real-world outcome the player wants, always confirmed by the player — the app never infers that an outcome happened. May carry an optional metric (target value and current value) and an optional target date.
_Avoid_: Quest (reserved for mode vocabulary), dream, ambition

**Campaign**:
A player-created 30/60/90-day season that groups goals under one shared end date and one fantasy framing. Ends on its end date; its goals and history persist afterward. A goal may instead use a custom target date or no date.
_Avoid_: Season (reserved for mode vocabulary), sprint

**Habit**:
A recurring commitment the player schedules (daily, chosen weekdays, times per week, or times per day). Each scheduled period produces one Occurrence.
_Avoid_: Routine, ritual, daily quest

**Occurrence**:
One scheduled instance of a habit for a specific day or week period. Ends as Met (fully or partially), Partially Met, or Missed when its local day or week closes.
_Avoid_: Check-in, entry

**Task**:
A one-off piece of work with a title, optional due date, effort, and tags. Completes once; can be reopened. Never causes penalties.
_Avoid_: Todo, action item

**Tag**:
A private, case-insensitive, ≤30-character label attached to habits and tasks. Goals _watch_ tags; any action carrying a watched tag influences that goal's Momentum. Normalized spelling makes `#Fitness` and `#fitness` the same tag.
_Avoid_: Category, label, topic

**Effort**:
The Small / Medium / Major size chosen for a habit or task. Affects XP only — never Momentum.
_Avoid_: Difficulty, priority

### Scoring

**Momentum**:
A goal's 0–100 rolling 7-day adherence score over scheduled habit periods plus completed tagged tasks. Partially met periods count proportionally. Shown as a percent with plain evidence ("5 of 7 planned days met"). Displays "No score yet" while the window has no planned periods and no completed tagged tasks.
_Avoid_: Health, damage, HP, progress points

**Planned Period**:
One habit occurrence or one completed task that enters a goal's Momentum denominator for the rolling window.
_Avoid_: Point, credit

**XP**:
Permanent experience earned once per actual completion (habit occurrence or task), scaled by effort (Small 5 / Medium 10 / Major 20). Never removed. One completion pays once regardless of how many goals watch its tags.
_Avoid_: Points, energy, coins

**Level**:
The player's permanent rank derived from XP on a gentle increasing curve with no cap. Unlocks cosmetic and story content in the active mode.
_Avoid_: Rank (reserved for mode vocabulary)

**Pace**:
A goal's Ahead / On Pace / Behind status, computed only when the goal has both a metric and a target date, by comparing metric progress against elapsed time.
_Avoid_: Deadline status, urgency

### Product surfaces

**Setup Wizard**:
The four-step first-run flow: mode → campaign (or skip) → one goal → one habit or task. Runs after sign-in so all choices sync immediately.
_Avoid_: Onboarding gauntlet, tutorial

**Mode**:
One of three deep presentation packs — RPG, Anime Hero, Arcade — sharing one rules engine. Each mode renames concepts, applies its own tuned palette in light and dark themes, and carries original story beats and milestone celebrations. Switchable anytime with no mechanical reset.
_Avoid_: Theme, skin, character class

**Correction Window**:
The last two closed local days (plus today) during which the player can still mark a habit done, mark a day as rest, or edit a task. Older days lock.
_Avoid_: Grace period, freeze

**Rest**:
A day a paused habit produces no occurrence — it neither helps nor hurts Momentum. Can be applied forward or retroactively inside the correction window.
_Avoid_: Skip, cheat day, streak freeze

**Player**:
The single signed-in human whose data this is. No other party can see it in the first version.
_Avoid_: User (too generic), hero (reserved for mode vocabulary)
