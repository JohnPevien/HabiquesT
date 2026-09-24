# Accessibility

This starter treats a11y as a layered system — no single tool catches everything.

```text
while writing code
    ↓
eslint-plugin-jsx-a11y      → static JSX analysis (lint fails)

while running/testing the app
    ↓
@axe-core/playwright        → rendered DOM analysis (CI fails)
  └─ Playwright launches Chromium, renders real page, axe scans DOM

human verification
    ↓
keyboard + screen reader + manual checks
```

## Layers

| Layer             | Tool                                                                                                                                      | When                    | How to run                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------- |
| 1. Source         | `eslint-plugin-jsx-a11y` (31 rules, `error`)                                                                                              | on save / CI            | `pnpm lint`                   |
| 2. Unit/Component | Vitest + Testing Library (`getByRole`, `userEvent`) + `jest-dom`                                                                          | on save / pre-push / CI | `pnpm test` / `pnpm test:run` |
| 3. E2E            | Playwright + `@axe-core/playwright`                                                                                                       | CI + locally            | `pnpm test:a11y`              |
| 4. Dev inspection | [axe DevTools extension](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd), a11y tree | during dev              | manual                        |
| 5. Manual         | keyboard, focus, screen reader, zoom                                                                                                      | before ship             | manual                        |

> Automated axe scans catch ~30–50% of issues. Layers 4–5 are still required. This starter uses `@axe-core/playwright` (open-source, no license) not `@axe-devtools/playwright` (commercial).

## How it works in this repo

- **1. Lint:** `pnpm lint` runs `eslint-plugin-jsx-a11y` (31 rules). `next/core-web-vitals` only enables ~6 as warnings — this starter upgrades to full `error`. See `eslint.config.mjs`.
- **2. Unit:** Your Vitest tests use `getByRole` + accessible names. If a test is hard to write with those queries, the component likely needs a11y fixes — see [Testing Guide](./testing.md).
- **3. E2E:** `pnpm test:a11y` (tagged `@a11y`) runs `e2e/a11y.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage has no detectable a11y violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

Add a route by copying that test: `await page.goto("/about")` → `new AxeBuilder({ page }).analyze()`.

- **4–5. Manual:** Use the tools below before shipping.

## Manual checklist (before each release)

- [ ] **Keyboard-only navigation** — every interactive element reachable and operable without a mouse
- [ ] **Visible focus** — focus indicator present on every focused element, never removed
- [ ] **Focus order** — Tab follows a logical DOM/visual order; no focus traps or skips
- [ ] **Focus restoration** — after closing a dialog/menu/popover, focus returns to the trigger
- [ ] **Screen reader smoke test** — VoiceOver (macOS) or NVDA/JAWS (Windows) announces sensible labels on each page
- [ ] **200% / 400% zoom** — content reflows, nothing clipped or overlapping
- [ ] **Reduced motion** — `prefers-reduced-motion` respected; no vestibular triggers
- [ ] **Touch targets** — tappable areas are comfortably sized (≈24×24px minimum) with adequate spacing
- [ ] **Error identification** — form errors announced and visually linked to the failing field
- [ ] **Content meaning without color** — no information conveyed by color alone
- [ ] **Accessibility tree** — Chrome DevTools → Elements → Accessibility shows correct roles/names
- [ ] **axe DevTools extension** — 0 violations on each page

Delete this guide when you’re comfortable — the checks stay in `pnpm lint` + `pnpm test:a11y`.
