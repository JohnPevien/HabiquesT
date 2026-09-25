# HabiquesT Backlog — Linear-ready

Each `##` section is one Linear issue: copy the heading as the title, the
body as the description, and apply the suggested `labels` + `estimate`.
Order is build order; dependencies are noted per issue. Design authority:
`CONTEXT.md` (glossary) and `docs/adr/0001-momentum-replaces-damage.md`.
Locked design — anything contradicting the ADR needs a re-grill, not a PR.

Status lives here until Linear auth exists on this machine, then moves there.

---

## 1. Provision Neon project and run the first migration

**Labels:** `infra` · **Estimate:** S · **Depends on:** user action (Neon Console)

**Context.** The app compiles and the full gate is green, but every
DB-touching path runs on placeholder env. Nothing signed-in can be exercised
until a real project exists.

**Scope:** Neon Console + `drizzle/` migration + `src/db/rls-baseline.sql` +
`.env.local` (gitignored; never commit real values).

**Acceptance:**

- [ ] Neon project created; Auth enabled with **Google + email magic link**
- [ ] `drizzle/0000_*.sql` applied (tables land in `app_public`, verified via
      `\dn` / schema browser)
- [ ] `src/db/rls-baseline.sql` applied (six owner-only policies, one per table)
- [ ] `.env.local` holds real `DATABASE_URL`, `NEON_AUTH_BASE_URL`,
      `NEON_AUTH_COOKIE_SECRET`
- [ ] `pnpm dev` boots with real env and `/` renders without the
      `DATABASE_URL is not set` error

---

## 2. Signed-in end-to-end pass against live data

**Labels:** `qa`, `e2e` · **Estimate:** M · **Depends on:** #1

**Context.** All E2E to date covers the signed-out surface. This is the first
exercise of the real loop: wizard → check-in → Momentum → correction →
export, as an actual player.

**Scope:** manual pass + extend `e2e/` where deterministic.

**Acceptance:**

- [ ] Sign in with Google; profile row auto-created (`requireProfile` lazy path)
- [ ] Wizard completes: mode persists, campaign created (or skipped), goal +
      first habit/task created and visible on the dashboard
- [ ] Checking in today's habit raises the goal's Momentum on next render
- [ ] Correcting yesterday flips a miss to met and the score recomputes
- [ ] Rest-day marking drops the day from the denominator (score rises or holds)
- [ ] Completing a tagged task adds exactly one met period to every matching goal
- [ ] Export downloads JSON containing all owned rows; DELETE-typed deletion
      wipes the player and signs out
- [ ] Any deterministic sub-flow above is captured as a Playwright spec

---

## 3. Profile settings UI (timezone, week start, theme, display name)

**Labels:** `frontend` · **Estimate:** S · **Depends on:** #1 for live verification

**Context.** `updateProfile` already accepts `displayName`, `timezone`,
`weekStart`, `mode`, `theme` — but no surface edits them, and `mode` is the
only one wired (board switcher). Per ADR: profile IANA timezone drives all
day math; week start (Sun/Mon) closes weekly quotas; theme follows system
with a player override.

**Scope:** extend `src/components/account-section.tsx` (or a new
`settings-section.tsx`); no new actions needed.

**Acceptance:**

- [ ] Display name editable, persists across reload
- [ ] Timezone selector (curated IANA list) persists; dashboard day boundary
      visibly follows it (verify by comparing UTC-near-midnight in two zones)
- [ ] Week-start toggle Sun/Mon persists; a `times-per-week` habit's open
      week period closes on the chosen boundary
- [ ] Theme override System/Light/Dark persists and beats the OS setting;
      each of the 3 modes renders its tuned palette in both themes
- [ ] No axe violations on the settings surface (extend `e2e/a11y.spec.ts`)

---

## 4. Pace surfacing + metric editing on goals

**Labels:** `frontend` · **Estimate:** M · **Depends on:** #1 for live verification

**Context.** `computePace` exists in the engine and the board shows
Ahead/On Pace/Behind chips — but a player can neither set nor edit the metric
(target/current/unit) or target date that pace requires. Per ADR: pace needs
BOTH metric and target date; otherwise no pace status, ever.

**Scope:** goal edit affordance on `player-board.tsx` goal cards (or a goal
detail); `actions.ts` gains `updateGoal` with server-stamped ownership.

**Acceptance:**

- [ ] Metric editor: target, current, unit; validates target > 0
- [ ] Target-date picker (local day key); clearable back to "no date"
- [ ] Setting metric + date shows a pace chip; clearing either removes it
      (null contract, per engine test)
- [ ] Ahead (≥110% of expected fraction) / Behind (≤60%) / On Pace render
      distinctly; Behind copy is neutral, never shaming
- [ ] 100% Momentum never auto-completes a goal — only the player's
      "mark achieved" does (`achieveGoal` unchanged)

---

## 5. Campaign lifecycle UI (extend, complete early, archive)

**Labels:** `frontend` · **Estimate:** S · **Depends on:** #1 for live verification

**Context.** Actions `createCampaign`, `extendCampaign`, `archiveCampaign`
exist and `load-player.ts` reads campaigns — but nothing renders them, and the
wizard's campaign choice disappears into a void. Per ADR: campaigns end on
`endAt` (goals persist), can be extended/completed-early/archived, and ended
campaigns are read-only until extended.

**Scope:** campaign section on the dashboard (or a `/campaigns` view).

**Acceptance:**

- [ ] Active campaigns list with days-remaining countdown per campaign
- [ ] Extend (new end date), Complete Early, Archive actions work and persist
- [ ] Ended campaign renders read-only with an Extend affordance; goals
      created under it remain editable and keep their history
- [ ] Wizard-created campaigns appear here with correct 30/60/90-day spans
- [ ] Goals can join/leave a campaign (campaignId set/cleared)

---

## 6. Level-up celebration on rank gain

**Labels:** `frontend`, `modes` · **Estimate:** S · **Depends on:** #1 for live verification

**Context.** `levelUpTemplate` copy exists per mode (`"Rank {level} reached —
your aura sharpens."`) but nothing renders it. Per ADR: levels unlock
cosmetic/story beats; XP is permanent; celebrations frame achievement, never
deficiency (cf. `docs/research/momentum-window.md` §5.2 — never a bare zero).

**Scope:** dashboard-level toast/celebration; optional: per-mode unlock list.

**Acceptance:**

- [ ] Crossing a level threshold on completion renders the active mode's
      `levelUpTemplate` with `{level}` substituted — once per crossing
      (no repeat on reload)
- [ ] Respects reduced motion (`prefers-reduced-motion` disables animation;
      copy still shows)
- [ ] Switching modes does not re-trigger or lose pending celebrations
- [ ] Copy per mode comes only from `modes.ts` — no hardcoded rank names

---

## 7. Offline queue browser wiring (localStorage + flush on reconnect)

**Labels:** `frontend`, `sync` · **Estimate:** M · **Depends on:** #1 for live verification

**Context.** `lib/offline-queue.ts` is implemented and unit-tested (8 tests:
coalescing, order retention on failure, corrupt-storage fallback). What is
missing is the browser glue: persist to `localStorage`, flush when
connectivity returns.

**Scope:** a small client module + integration in `player-board.tsx`
(or a provider); dispatcher maps queued actions onto existing server actions.

**Acceptance:**

- [ ] Going offline queues habit/task mutations to `localStorage`
      (`habiquest-offline-queue` key) instead of failing
- [ ] `online` event (and a manual "Sync now" control) flushes in order;
      per-target coalescing means only the latest edit per occurrence replays
- [ ] UI shows pending-sync count while offline; clears on successful flush
- [ ] Corrupt `localStorage` payload degrades to an empty queue (covered by
      existing unit test; verify in-browser once)
- [ ] Server rejections (e.g. correction-window lock) surface per-action
      errors, not a silent drop

---

## 8. Habit editing + archiving UI

**Labels:** `frontend` · **Estimate:** S · **Depends on:** #1 for live verification

**Context.** Habits can be created and deleted, but title/tags/effort/schedule
are frozen after creation and nothing sets `archivedAt` — even though the
engine already honors it (archived habits contribute only pre-archive
periods). Per ADR: schedule changes apply forward; history never rewrites.

**Scope:** habit edit affordance; `actions.ts` gains `updateHabit` +
`archiveHabit` with server-stamped ownership.

**Acceptance:**

- [ ] Title, tags, effort editable; tag edits renormalize via
      `normalizeTag` (case-fold, trim, ≤30)
- [ ] Schedule editable (daily / weekdays / times-per-day / times-per-week);
      past occurrences keep their original credit — only future periods change
- [ ] Archive removes the habit from today's plan but preserves its history
      in Momentum windows and the 28-day heatmap
- [ ] Archived habits excluded from new occurrence generation

---

## 9. Goal editing UI (title, tags, metric, target date, campaign)

**Labels:** `frontend` · **Estimate:** S · **Depends on:** #1 for live verification

**Context.** Mirror of #8 for goals. Watched tags are currently set once at
creation; the tag-watch model explicitly anticipates retagging ("adding a
watched tag can change Momentum retroactively — accepted behavior").

**Scope:** goal edit affordance; `updateGoal` action alongside #4's metric work
(coordinate to avoid duplicate actions — #4 may subsume the metric half).

**Acceptance:**

- [ ] Title and watched tags editable; retagging recomputes Momentum
      (retroactive change accepted and visible, not hidden)
- [ ] Campaign membership changeable (join/leave), honoring ended-campaign
      read-only rules from #5
- [ ] Delete keeps its current confirm-less ghost-button? No — deletion of a
      goal with history requires an explicit confirm control (decide copy in PR)
- [ ] Achieved goals show their achieved state distinctly and stop accruing
      expectations (no new planned periods demanded)

---

## 10. Production deploy (target decision + go-live)

**Labels:** `infra`, `decision` · **Estimate:** S · **Depends on:** #1, #2

**Context.** Hosting was explicitly out of grilling scope. The app builds
clean (`pnpm build` green) but has never run outside dev. Env discipline:
`.env.local` is gitignored; production secrets must live in the host, never
the repo.

**Scope:** decision record + deploy pipeline.

**Acceptance:**

- [ ] Target chosen (Vercel is the path of least resistance for Next 16;
      record the choice + why in `docs/adr/`)
- [ ] Production env vars set on the host (`DATABASE_URL`, Neon Auth URL +
      cookie secret); preview branches get isolated Neon branches
- [ ] `CI=true pnpm test:e2e` (build+start path in `playwright.config.ts`)
      passes against the production build before go-live
- [ ] Post-deploy smoke: sign-in, one check-in, one correction, all 200s
