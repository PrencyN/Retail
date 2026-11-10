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

export default defineConfig(
  ({
    command,
  }) => {
    const isDevelopment =
      command === "serve";

    return {
      /*
       * Development:
       * Use the explicit localhost origin so the shell
       * can consume the Order MFE on port 5174.
       *
       * Production:
       * Use the deployed site's own origin. Relative "/"
       * paths allow Cloudflare Pages to serve all generated
       * Module Federation chunks correctly.
       */
      base:
        isDevelopment
          ? "http://localhost:5174/"
          : "/",

      plugins: [
        react(),

        federation(
          moduleFederationConfig
        ),
      ],

      server: {
        port:
          5174,

        strictPort:
          true,

        origin:
          "http://localhost:5174",

        cors:
          true,
      },

      preview: {
        port:
          5174,

        strictPort:
          true,
      },

      build: {
        target:
          "chrome89",
      },
    };
  }
);
