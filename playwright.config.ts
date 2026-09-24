import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for next-starter.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: "html",

  timeout: 30 * 1000,

  expect: {
    timeout: 5 * 1000,
  },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    // CI tests the production build (closer to what users receive);
    // local dev uses the fast dev server. Port 3000 collides with a
    // sibling project on this machine — override with E2E_PORT.
    command: process.env.CI
      ? "pnpm build && pnpm start"
      : `pnpm dev --port ${process.env.E2E_PORT ?? 3100}`,
    url:
      process.env.E2E_BASE_URL ??
      `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
