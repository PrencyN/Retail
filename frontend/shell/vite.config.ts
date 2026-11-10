import {
  defineConfig,
  loadEnv,
} from "vite";

import react
  from "@vitejs/plugin-react";

import {
  federation,
} from "@module-federation/vite";

import {
  createShellFederationConfig,
} from "./module-federation.config.js";

import {
  createTrustedRemoteEntries,
} from "./federation/trustedRemotes.js";

export default defineConfig(
  ({
    mode,
  }) => {
    const environment =
      loadEnv(
        mode,
        process.cwd(),
        "VITE_",
      );

    const remoteEntries =
      createTrustedRemoteEntries(
        environment,
        mode,
      );

    const federationConfig =
      createShellFederationConfig(
        remoteEntries,
      );

    return {
      plugins: [
        react(),

        federation(
          federationConfig,
        ),
      ],

      server: {
        port:
          5173,

        strictPort:
          true,

        origin:
          "http://localhost:5173",

        cors: {
          origin:
            "http://localhost:5173",

          methods: [
            "GET",
            "HEAD",
            "OPTIONS",
          ],
        },

        headers: {
          "X-Content-Type-Options":
            "nosniff",

          "Referrer-Policy":
            "strict-origin-when-cross-origin",

          "Permissions-Policy":
            "camera=(), microphone=(), geolocation=()",
        },
      },

      preview: {
        port:
          5173,

        strictPort:
          true,

        headers: {
          "X-Content-Type-Options":
            "nosniff",

          "Referrer-Policy":
            "strict-origin-when-cross-origin",

          "Permissions-Policy":
            "camera=(), microphone=(), geolocation=()",
        },
      },

      build: {
        target:
          "chrome89",

        chunkSizeWarningLimit:
          600,

        sourcemap:
          false,
      },
    };
  },
);