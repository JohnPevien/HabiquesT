# Momentum replaces damage/health mechanics

The product concept began as Habitify-style health damage ("more than 2 misses damages you"). During design the user replaced that entire mechanism: there is no health, no lives, and no miss-count threshold. The damaged number is instead **Goal Momentum**, a rolling 7-day adherence score. Behavioral research (Lally 2010: a single missed day does not impair habit formation; Silverman & Barasch 2023: displaying broken streaks reduces subsequent engagement; Jackson & MacKillop 2016: ADHD adults discount delayed rewards, d = 0.43) converged on a fast-feedback, fast-recovery score over punishing, long-memory mechanics.

## Consequences

- Misses lower a percentage that recovers naturally as days roll out of the window — never a permanent record and never an auto-completed goal.
- XP is permanent and never removed; only Momentum can fall.
- The engine never needs damage events, health floors, or recovery quests; it needs only adherence math.

## Considered Options

- Health/lives with third-miss damage — rejected: punishes lapse-prone players, contradicts lapse-recovery evidence.
- Hard progression loss — rejected: demotivating for the ADHD-first audience.
- Cosmetic damage — rejected: the mechanic would have no consequence and the product loses its hook.

# Rolling 7-day primary window with 28-day non-punitive trend

Goal Momentum scores the last seven local days. A 28-day heatmap/trend gives context. Lifetime totals appear only as milestone celebrations, never as a score denominator.

Evidence: weekly resets manufacture exactly the broken-streak display shown to depress engagement (Silverman & Barasch 2023); lifetime denominators make early misses permanently un-closeable and dilute feedback to near-zero; the 7-day window makes one day's action visibly move the score (~1/7), which matters most for ADHD reward timing (Jackson & MacKillop 2016; Marx et al. 2021). Full note with 17 verified sources: `docs/research/momentum-window.md`. No head-to-head study compares 7 vs 28 days; 7-day is an evidence-informed product inference.

## Consequences

- Momentum is computed from events, not stored as a mutable number — recomputation is idempotent.
- A 0% score must never render as a bare zero: show a restart affordance instead (evidence: Nunes & Drèze 2006 endowed progress; Kivetz et al. 2006 goal gradient).

# Goals watch tags; actions are never owned by goals

Habits and tasks carry private tags; goals watch tags. One tagged action influences every matching goal's Momentum (XP still pays once). This was an explicit user choice over one-goal ownership, multi-goal credit, and later manual allocation.

## Consequences

- No ownership column exists in the data model; the join is goal.watched_tags ∩ action.tags.
- Adding a watched tag to a goal can change its Momentum retroactively — accepted behavior.
- Tag matching must normalize case and cap length at 30 characters.

# Tasks reward, habits can hurt

Completed tasks count as one met period toward every matching goal's Momentum and pay XP by effort. Overdue tasks never auto-penalize. Only unmet scheduled habit periods lower Momentum. This keeps real deadlines meaningful without letting an ordinary task backlog spiral a goal downward.

# Effort affects XP only; Momentum stays an honest ratio

Small/Medium/Major (5/10/20 XP) was chosen so harder work levels the character faster, but Momentum deliberately ignores effort. Weighting Momentum by self-declared importance would let label choice distort the adherence number and make the percent unexplainable.

# Player-confirmed goal completion

The app never infers a real-world outcome. Momentum and pace are displays of execution; the player marks a goal achieved. Auto-completing at 100% Momentum would equate "followed the plan" with "ran the 10K."

# Neon Postgres + Neon Auth; sync-first, no social

Cloud sync is part of the first product (cross-device persistence), but the user explicitly deferred all social features. Authentication happens before the setup wizard so onboarding choices sync immediately and cannot be lost. Sign-in: Google + email magic link. Sharing boundary: only the signed-in player sees their data.

## Considered Options

- Supabase — rejected in favor of the user's explicit preference for Neon Postgres.
- Local-first with later sync — rejected: conflicts with cloud-sync being a first-product requirement.

# Offline: read cache, queue edits, latest-action-timestamp wins

When offline the app shows the cached board and queues completions/corrections locally. On reconnect, per-action events resolve conflicts by latest action timestamp; unrelated edits merge. Whole-record last-write-wins would erase unrelated edits; manual merge prompts would interrupt a daily loop.

# Fantasy modes are deep presentation packs, not rule variants

RPG, Anime Hero, and Arcade modes share one engine, one XP ledger, and one set of scores. Each mode provides vocabulary, palettes tuned for light and dark themes, original story beats, cosmetic unlocks, and milestone celebrations. Switching is instant and mechanical progress persists. Mode-specific rules were rejected as "three products"; cosmetic-only themes were rejected as too shallow to be the differentiating hook.

# Content boundary: original mild fantasy with disclaimer

All names, characters, and story beats are original — no existing franchise references (copyright/trademark risk). Misses are framed neutrally, never with shame, injury, gore, gambling, or humiliation imagery. A disclaimer (originality, privacy, not-medical-treatment) appears during onboarding and in About/Legal. The audience is ADHD adults: recovery framing is a product requirement, not decoration.

# Account deletion is deliberate, not hidden

The user asked to "make it hard" to delete. Resolution: typed `DELETE` confirmation on a discoverable control, with data export available. The control stays accessible — hiding it or requiring support contact would be unacceptable — but the typed phrase prevents accidents. Hard delete is permanent; no recovery hold.

# Times: profile timezone, player-selected week start

Day boundaries use an IANA timezone stored on the player profile (default from browser, changeable) so travel never rewrites history. Weekly-quota periods close on the player's chosen week start (Sunday or Monday, default Monday) in that timezone. A "times per week" habit scores the closed week proportionally; "times per day" scores the closed day proportionally.

# Starter lineage

HabiquesT is scaffolded from the private `next-starter` template (Next.js 16 App Router, React 19 + Compiler, TypeScript strict, Tailwind 4 + shadcn aria-nova, ESLint jsx-a11y, Vitest, Playwright + axe). Starter conventions carry over: `127.0.0.1:3000` dev URL, `cn()` for classes, a11y as a hard requirement, no manual `useMemo` (compiler handles it).
