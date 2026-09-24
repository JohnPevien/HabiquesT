import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Automated accessibility scanning with axe-core.
 *
 * Layer 3 of the accessibility stack:
 *   1. eslint-plugin-jsx-a11y  → static JSX
 *   2. axe-core / @axe-core/playwright → rendered DOM  ← this file
 *   3. Manual verification (keyboard, screen reader, axe DevTools extension)
 *
 * `pnpm test:a11y` runs only tests tagged `@a11y`.
 * `pnpm test:e2e` runs the full Playwright suite.
 *
 * @see https://playwright.dev/docs/accessibility-testing
 * @see https://github.com/dequelabs/axe-core
 */

test.describe("@a11y accessibility", () => {
  test("homepage has no detectable accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page }).analyze();

    // On failure, Playwright will show the diff. Also log a human-readable
    // report so the terminal output is actionable without opening the HTML report.
    if (results.violations.length > 0) {
      const report = results.violations
        .map((v) => {
          const nodes = v.nodes
            .map((n) => `  - ${n.target.join(", ")} → ${n.failureSummary}`)
            .join("\n");
          return `[${v.impact}] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n${nodes}`;
        })
        .join("\n\n");

      // Attach to Playwright report and log to stdout
      await test.info().attach("axe-violations", {
        body: JSON.stringify(results.violations, null, 2),
        contentType: "application/json",
      });
      console.error(
        `\n${results.violations.length} accessibility violation(s) found:\n\n${report}\n`,
      );
    }

    expect(results.violations).toEqual([]);
  });
});
