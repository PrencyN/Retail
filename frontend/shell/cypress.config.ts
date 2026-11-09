import {
  defineConfig,
} from "cypress";

export default defineConfig({
  e2e: {
    baseUrl:
      "http://localhost:5173",

    specPattern:
      "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    supportFile:
      "cypress/support/e2e.ts",

    video:
      false,

    screenshotOnRunFailure:
      true,

    defaultCommandTimeout:
      10000,

    requestTimeout:
      10000,

    responseTimeout:
      30000,

    viewportWidth:
      1440,

    viewportHeight:
      900,

    setupNodeEvents(
      on,
      config
    ) {
      return config;
    },
  },
});