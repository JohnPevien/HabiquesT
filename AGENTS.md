<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Development workflow

### Test-driven development

For behavior changes and bug fixes, use Red-Green-Refactor:

1. Write or update the smallest relevant test first.
2. Run the test and confirm it fails for the expected reason.
3. Implement the minimum code required to make it pass.
4. Run the test again and confirm it passes.
5. Refactor only after the test is green.
6. Run related tests, linting, and type checking before considering the task complete.

Do not write implementation code first and add tests afterward unless the task is purely configuration, documentation, or otherwise unsuitable for behavioral testing.

### Testing conventions

Prefer testing observable user behavior over implementation details.

Prefer accessible Testing Library queries in this order:

1. `getByRole`
2. `getByLabelText`
3. `getByText`
4. other semantic queries

Use `getByTestId` only when there is no appropriate semantic query.

Use `userEvent.setup()` for user interaction tests instead of directly calling `fireEvent` unless there is a specific reason.

### Accessibility

Accessibility is a requirement, not an optional enhancement.

When implementing UI:

- Prefer semantic HTML before adding ARIA.
- Ensure interactive elements are keyboard accessible.
- Ensure controls have accessible names.
- Ensure form fields have associated labels.
- Preserve visible focus indicators.
- Verify focus management for dialogs, menus, popovers, and similar components.
- Do not suppress accessibility lint errors without a documented reason.
