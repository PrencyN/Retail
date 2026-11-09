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
  base:
    "http://localhost:5175/",

  plugins: [
    react(),

    federation(
      moduleFederationConfig
    ),
  ],

  server: {
    port:
      5175,

    strictPort:
      true,

    origin:
      "http://localhost:5175",

    cors:
      true,
  },

  preview: {
    port:
      5175,

    strictPort:
      true,
  },

  build: {
    target:
      "chrome89",
  },
});