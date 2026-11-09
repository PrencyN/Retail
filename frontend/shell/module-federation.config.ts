import {
  createModuleFederationConfig,
} from "@module-federation/vite";

export default createModuleFederationConfig({
  name:
    "fulfilliq_shell",

  remotes: {
    order_mfe: {
      type:
        "module",

      name:
        "order_mfe",

      entry:
        "http://localhost:5174/remoteEntry.js",
    },

    fulfillment_mfe: {
      type:
        "module",

      name:
        "fulfillment_mfe",

      entry:
        "http://localhost:5175/remoteEntry.js",
    },

    manager_mfe: {
      type:
        "module",

      name:
        "manager_mfe",

      entry:
        "http://localhost:5176/remoteEntry.js",
    },
  },

  shared: {
    react: {
      singleton:
        true,
    },

    "react-dom": {
      singleton:
        true,
    },

    "react/": {
      singleton:
        true,
    },

    "react-dom/": {
      singleton:
        true,
    },
  },
});