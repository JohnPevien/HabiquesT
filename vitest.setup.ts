import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Isolate every test's DOM — without this, queries see every test's markup.
afterEach(() => {
  cleanup();
});
