# Git Hooks

Husky + lint-staged + typecheck make `git commit` and `git push` fast safety nets. Heavy work stays in CI.

## What runs when

```text
git commit
  ↓
Husky (.husky/pre-commit)
  ↓
lint-staged (lint-staged.config.mjs)
  ↓
only staged files
  ├── eslint --fix  (includes jsx-a11y)  → blocks on unfixable a11y
  └── prettier --write (includes Tailwind sorting) → auto-fixes formatting

git push
  ↓
Husky (.husky/pre-push)
  ↓
pnpm typecheck  →  next typegen + tsc --noEmit
pnpm test:run   →  vitest run (unit tests)
  → blocks push on type or test failures
```

**Why not `next build` in pre-push?** A full build is too slow — you’d bypass it. `next typegen && tsc --noEmit` is the fast path Next.js recommends. Full `lint` + `format:check` + `Playwright` + `axe` + `build` run in CI.

## Config

`lint-staged.config.mjs`:

```js
export default {
  "**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "**/*.{json,css,md,mdx,yml,yaml}": "prettier --write",
};
```

- `js/ts` → ESLint and Prettier run **sequentially** (array) to avoid concurrent edits.
- Other files → just Prettier.

`.husky/pre-commit`:

```sh
pnpm exec lint-staged
```

`.husky/pre-push`:

```sh
pnpm typecheck
pnpm test:run
```

`package.json`:

```json
{
  "scripts": {
    "lint:staged": "lint-staged",
    "typecheck": "next typegen && tsc --noEmit",
    "prepare": "husky"
  }
}
```

`prepare` runs `husky` on `pnpm install` so hooks work after clone.

## Try it

**Formatting auto-fix:**

```bash
# mess up a file
echo 'const x=1' > src/app/bad.ts
git add src/app/bad.ts
git commit -m "test"
# → Prettier fixes it and re-stages
```

**A11y block:**

```tsx
// src/app/bad.tsx
<div onClick={() => {}}>Click</div>
```

```bash
git add src/app/bad.tsx
git commit -m "test"
# → eslint jsx-a11y/click-events-have-key-events blocks commit
# fix: add onKeyDown, role="button", tabIndex={0}
```

**Type block:**

```ts
const n: number = "hello";
```

```bash
git push
# → pnpm typecheck fails: TS2322, push blocked
```

**Test block:**

```bash
# break a Vitest test
git push
# → pnpm test:run fails, push blocked
```

## Debug without committing/pushing

```bash
pnpm lint:staged   # same as pre-commit
pnpm typecheck     # same as pre-push (first half)
pnpm test:run      # same as pre-push (second half)
```

## Bypass (not recommended)

```bash
git commit --no-verify
git push --no-verify
```

Use only for `WIP` or docs — the hooks are fast enough you shouldn’t need this.

Delete this guide when you know the hooks by heart — `.husky/` and `lint-staged.config.mjs` stay.
