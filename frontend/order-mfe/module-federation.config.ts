import {
  createModuleFederationConfig,
} from "@module-federation/vite";

export default createModuleFederationConfig({
  name:
    "order_mfe",

  filename:
    "remoteEntry.js",

  manifest:
    true,

  exposes: {
    "./OrderSummary":
      "./src/OrderSummaryRemote.tsx",
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