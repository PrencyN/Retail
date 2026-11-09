import {
  defineConfig,
} from "vitest/config";

import react
  from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
  ],

  test: {
    globals: true,

    environment:
      "jsdom",

    setupFiles: [
      "./src/test/setup.ts",
    ],

    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],

    exclude: [
      "playwright/**",
      "cypress/**",
      "node_modules/**",
      "dist/**",
    ],

    env: {
      VITE_ENTRA_CLIENT_ID:
        "00000000-0000-0000-0000-000000000001",

      VITE_ENTRA_TENANT_ID:
        "00000000-0000-0000-0000-000000000002",

      VITE_ENTRA_API_CLIENT_ID:
        "00000000-0000-0000-0000-000000000003",
    },

    css: true,

    clearMocks: true,

    restoreMocks: true,

    mockReset: true,
  },
});