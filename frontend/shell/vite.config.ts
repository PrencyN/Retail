import {
  defineConfig,
} from "vite";

import react
  from "@vitejs/plugin-react";

import {
  federation,
} from "@module-federation/vite";

import moduleFederationConfig
  from "./module-federation.config.ts";

export default defineConfig({
  plugins: [
    react(),

    federation(
      moduleFederationConfig
    ),
  ],

  server: {
    port:
      5173,

    strictPort:
      true,

    origin:
      "http://localhost:5173",

    cors:
      true,
  },

  preview: {
    port:
      5173,

    strictPort:
      true,
  },

  build: {
    target:
      "chrome89",

    chunkSizeWarningLimit:
      600,
  },
});