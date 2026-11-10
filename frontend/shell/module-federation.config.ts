import {
  createModuleFederationConfig,
} from "@module-federation/vite";

import type {
  TrustedRemoteEntries,
} from "./federation/trustedRemotes.js";

export function createShellFederationConfig(
  remoteEntries: TrustedRemoteEntries,
) {
  return createModuleFederationConfig({
    name:
      "fulfilliq_shell",

    remotes: {
      order_mfe: {
        type:
          "module",

        name:
          "order_mfe",

        entry:
          remoteEntries.order_mfe,
      },

      fulfillment_mfe: {
        type:
          "module",

        name:
          "fulfillment_mfe",

        entry:
          remoteEntries
            .fulfillment_mfe,
      },

      manager_mfe: {
        type:
          "module",

        name:
          "manager_mfe",

        entry:
          remoteEntries.manager_mfe,
      },
    },

    shared: {
      react: {
        singleton:
          true,

        strictVersion:
          true,
      },

      "react-dom": {
        singleton:
          true,

        strictVersion:
          true,
      },

      "react/": {
        singleton:
          true,

        strictVersion:
          true,
      },

      "react-dom/": {
        singleton:
          true,

        strictVersion:
          true,
      },
    },
  });
}