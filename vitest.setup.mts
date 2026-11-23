import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// `globals: false` in vitest.config.mts hides the global `afterEach` that
// @testing-library/react's own auto-cleanup looks for, so without this it
// never unmounts components between tests — state (and side effects like
// localStorage writes) leaks across test cases in the same file.
afterEach(() => {
  cleanup();
});
