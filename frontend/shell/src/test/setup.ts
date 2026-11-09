import {
  afterEach,
  vi,
} from "vitest";

import {
  cleanup,
} from "@testing-library/react";

import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();

  vi.clearAllMocks();
});

/*
 * jsdom may not provide every browser API used by
 * third-party libraries. These safe mocks prevent
 * unrelated browser API failures.
 */

Object.defineProperty(
  window,
  "matchMedia",
  {
    writable: true,

    value: vi.fn().mockImplementation(
      (query: string) => ({
        matches: false,

        media: query,

        onchange: null,

        addListener:
          vi.fn(),

        removeListener:
          vi.fn(),

        addEventListener:
          vi.fn(),

        removeEventListener:
          vi.fn(),

        dispatchEvent:
          vi.fn(),
      })
    ),
  }
);

Object.defineProperty(
  window,
  "scrollTo",
  {
    writable: true,

    value:
      vi.fn(),
  }
);