import {
  defineConfig,
  devices,
} from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",

  fullyParallel: false,

  workers: 1,

  timeout: 120_000,

  expect: {
    timeout: 30_000,
  },

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
      },
    ],
  ],

  use: {
    baseURL:
      "http://localhost:5173",

    trace:
      "retain-on-failure",

    screenshot:
      "only-on-failure",

    video:
      "retain-on-failure",

    actionTimeout:
      30_000,

    navigationTimeout:
      30_000,
  },

  projects: [
    {
      name:
        "auth-setup",

      testMatch:
        "auth.setup.ts",

      use: {
        ...devices[
          "Desktop Chrome"
        ],

        headless: false,
      },
    },

    {
      name:
        "chromium",

      testIgnore: [
        "auth.setup.ts",
        "ai.spec.ts",
      ],

      use: {
        ...devices[
          "Desktop Chrome"
        ],

        headless: true,
      },
    },

    {
      name:
        "chromium-ai",

      testMatch:
        "ai.spec.ts",

      use: {
        ...devices[
          "Desktop Chrome"
        ],

        headless: false,
      },
    },
  ],

  outputDir:
    "test-results",
});