import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      ".mf",
      "coverage",
      "playwright-report",
      "test-results",
      "blob-report",
      "cypress/screenshots",
      "cypress/videos",
      "cypress/downloads",
      "playwright/.auth",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: [
      "src/**/*.ts",
      "src/**/*.tsx",
    ],

    languageOptions: {
      ecmaVersion: 2023,

      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },

    plugins: {
      "react-hooks":
        reactHooks,

      "react-refresh":
        reactRefresh,
    },

    rules: {
      ...reactHooks.configs.recommended.rules,

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport:
            true,
        },
      ],
    },
  },

  {
    files: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "vitest.config.ts",
    ],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  {
    files: [
      "vite.config.ts",
      "module-federation.config.ts",
      "playwright.config.ts",
      "playwright/**/*.ts",
    ],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  {
    files: [
      "cypress/**/*.ts",
      "cypress/**/*.tsx",
    ],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,

        Cypress:
          "readonly",

        cy:
          "readonly",

        expect:
          "readonly",

        assert:
          "readonly",

        describe:
          "readonly",

        context:
          "readonly",

        it:
          "readonly",

        before:
          "readonly",

        beforeEach:
          "readonly",

        after:
          "readonly",

        afterEach:
          "readonly",
      },
    },

    rules: {
      "@typescript-eslint/no-unused-expressions":
        "off",
    },
  }
);