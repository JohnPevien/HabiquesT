# HabiquesT

Gamified habit, task, and goal tracker. One honest scoring engine (rolling 7-day Goal Momentum + permanent XP) under three fantasy presentation modes — RPG campaign, anime training arc, arcade run. Built for ADHD adults first: fast feedback, fast recovery, no punishing streaks.

> **Disclaimer:** All worlds, names, and characters are original and not affiliated with any existing game, anime, or franchise. HabiquesT is a personal productivity tool, not medical or mental-health treatment. Your data is visible only to you, the signed-in player.

## What it is

- **Goals** you confirm yourself — the app never claims an outcome happened just because you followed the plan.
- **Habits** scheduled daily, on chosen weekdays, times per week, or times per day.
- **Tasks** that reward, never punish: completing them boosts matching goals; overdue tasks never damage anything.
- **Momentum**: each goal's rolling 7-day adherence score, explained in plain evidence ("5 of 7 planned days met"). Misses lower it; days naturally age out of the window; recovery is always possible.
- **XP & Level**: permanent growth from every completion. Never removed, no daily cap.
- **Three modes** over one engine: switch anytime — progress carries over, only the fantasy changes.
- **Campaigns** (30/60/90-day seasons) group goals under one shared arc; calendar review with a two-day correction window; offline-friendly with queued edits.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 + shadcn/ui (aria-nova) · Neon Postgres + Neon Auth (Google & magic link) · Vitest · Playwright + axe

Scaffolded from [next-starter](https://github.com/JohnPevien/next-starter).

## Getting started

```bash
pnpm install
pnpm dev        # → http://127.0.0.1:3000
```

Requires Node 20+ and pnpm 11.6+. Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET` in `.env.local` (see `.env.example`).

## Commands

| Command                     | Description                                |
| --------------------------- | ------------------------------------------ |
| `pnpm dev`                  | Dev server (Turbopack) at 127.0.0.1:3000   |
| `pnpm build` / `pnpm start` | Production build / serve                   |
| `pnpm lint`                 | ESLint (fails on a11y errors)              |
| `pnpm typecheck`            | `next typegen && tsc --noEmit`             |
| `pnpm test:run`             | Vitest single run                          |
| `pnpm test:e2e:chromium`    | Playwright (Chromium)                      |
| `pnpm check`                | format:check + lint + typecheck + test:run |

## Documentation

- [`CONTEXT.md`](./CONTEXT.md) — domain glossary (the language of the product)
- [`docs/adr/`](./docs/adr/) — architecture decision records
- [`docs/research/momentum-window.md`](./docs/research/momentum-window.md) — evidence behind the 7-day Momentum window

## License

[MIT](./LICENSE) © 2026 John Pevien
