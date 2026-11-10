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
       * The shell consumes this MFE from localhost:5176.
       *
       * Production:
       * Use the hosting site's own origin so Cloudflare
       * Pages can serve remoteEntry.js and generated
       * Module Federation chunks correctly.
       */
      base:
        isDevelopment
          ? "http://localhost:5176/"
          : "/",

      plugins: [
        react(),

        federation(
          moduleFederationConfig
        ),
      ],

      server: {
        port:
          5176,

        strictPort:
          true,

        origin:
          "http://localhost:5176",

        cors:
          true,
      },

      preview: {
        port:
          5176,

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