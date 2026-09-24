# Testing Guide

> **For first-timers:** You don’t need to be a testing expert. Copy a template, run `pnpm test`, and learn by doing. This guide shows you exactly where to put tests and how to write them like a user would.

## Where tests live

```text
src/
  components/
    button.tsx
    button.test.tsx          ← colocated with component (preferred)
  lib/
    utils.ts
    utils.test.ts
  __tests__/
    testing-setup.test.tsx   ← or shared folder for general tests
e2e/
  a11y.spec.ts               ← Playwright (real browser), not Vitest
```

- **Vitest** (`pnpm test` / `pnpm test:run`) — fast, jsdom, for components and utils inside `src/`
- **Playwright** (`pnpm test:e2e` / `pnpm test:a11y`) — real Chromium, for pages/routes in `e2e/` (especially async Server Components)

> **Rule:** Vitest can’t reliably test async Server Components. Test those via Playwright instead. Everything else (Client Components, utils, hooks) is great for Vitest.

## Quick start

```bash
pnpm test        # watch mode — edits re-run instantly
pnpm test:run    # single run — what pre-push and CI run
```

You already have one passing smoke test: `src/__tests__/testing-setup.test.tsx`. Duplicate it to start:

```bash
cp src/__tests__/testing-setup.test.tsx src/components/my-first.test.tsx
pnpm test
```

## How to write a test

Copy this template for every new component:

```tsx
// src/components/my-button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { Button } from "./ui/button";

test("can click button", async () => {
  const user = userEvent.setup();

  let clicked = false;
  render(<Button onPress={() => (clicked = true)}>Save</Button>);

  // 1. find like a user would — by role + accessible name
  const btn = screen.getByRole("button", { name: "Save" });

  // 2. act like a user
  await user.click(btn);

  // 3. assert what a user sees
  expect(btn).toBeInTheDocument();
  expect(clicked).toBe(true);
});
```

### 1. Find elements the accessible way

```text
Prefer:  getByRole, getByLabelText, getByText
Avoid:   getByTestId, querySelector, class names
```

- `getByRole("textbox", { name: "Email" })` — finds an input via its label
- `getByLabelText("Email")` — same, via `<label>`
- `getByRole("button", { name: "Submit" })` — finds a button by its text

If you can’t find an element with these, the UI likely has an a11y bug — fix the component (add `<label>`, `aria-label`, proper role).

```tsx
// good — accessible
<label htmlFor="email">Email</label>
<input id="email" />

screen.getByRole("textbox", { name: "Email" }); // works

// bad — not accessible
<input placeholder="Email" />
screen.getByPlaceholderText("Email"); // works but hides a11y issue
```

### 2. Interact like a real user

```tsx
const user = userEvent.setup();

await user.type(
  screen.getByRole("textbox", { name: "Email" }),
  "john@example.com",
);
await user.click(screen.getByRole("button", { name: "Submit" }));
await user.tab(); // keyboard
```

Use `userEvent` (realistic) not `fireEvent` (fake). `userEvent` is what Testing Library recommends.

### 3. Check what a user sees

```tsx
import "@testing-library/jest-dom/vitest"; // already in vitest.setup.ts

expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(
  "john@example.com",
);
expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
expect(screen.getByText("Saved!")).toBeInTheDocument();
```

These `jest-dom` matchers are auto-loaded via `vitest.setup.ts`.

## More examples

### Form with validation

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

function Newsletter() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}

test("requires email", async () => {
  const user = userEvent.setup();
  render(<Newsletter />);

  const input = screen.getByRole("textbox", { name: "Email" });
  expect(input).toBeRequired();

  await user.type(input, "a@b.com");
  expect(input).toHaveValue("a@b.com");
});
```

### Testing `src/lib/utils.ts`

```tsx
import { expect, test } from "vitest";
import { cn } from "@/lib/utils";

test("cn merges tailwind classes", () => {
  expect(cn("px-2 px-4")).toBe("px-4");
  expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
});
```

## Config — you don’t need to touch it, but here’s what it does

`vitest.config.mts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}"],
    exclude: ["node_modules", "e2e", ".next", "playwright.config.*"],
  },
});
```

- `jsdom` — fake browser for unit tests
- `vite-tsconfig-paths` — makes `@/*` alias work
- `include` — only `src/` (so `e2e/` stays with Playwright)
- `setupFiles` — loads `jest-dom` matchers

`vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

## Common gotchas

- **Missing `await` with `userEvent`?** Always `await user.click(...)` / `await user.type(...)` — they’re async.
- **Can’t find by role?** Open the accessibility tree in Chrome DevTools → Elements → Accessibility, or log roles: `screen.logTestingPlaygroundURL()`.
- **Test for Server Component?** Move it to `e2e/` with Playwright — Vitest can’t handle async Server Components well.
- **Pre-push failing?** Run `pnpm test:run` locally — same command the hook runs.

## What runs when

```text
pnpm test         → watch, for you
pnpm test:run     → single run, for pre-push + CI (Husky runs this on git push)
pnpm test:e2e     → Playwright E2E (real browser)
pnpm test:a11y    → axe a11y only
```

Delete this guide when you’re comfortable — the one smoke test in `src/__tests__/` stays as your template.
