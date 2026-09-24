import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // `next/core-web-vitals` already registers `eslint-plugin-jsx-a11y`, but
    // only enables ~6 rules as warnings. Re-use that plugin registration and
    // overlay the full `jsx-a11y/recommended` rule set (31 rules) as errors.
    // Spreading `jsxA11y.flatConfigs.recommended` would re-declare the same
    // plugin under a different object identity and trigger
    // "Cannot redefine plugin jsx-a11y" — so only apply its `rules`.
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated/test reports — not source
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
    "playwright/.cache/**",
    "coverage/**",
  ]),
]);
export default eslintConfig;
