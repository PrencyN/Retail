import {
  createModuleFederationConfig,
} from "@module-federation/vite";

export default createModuleFederationConfig({
  name:
    "fulfillment_mfe",

  filename:
    "remoteEntry.js",

  manifest:
    true,

  exposes: {
    "./FulfillmentAnalysis":
      "./src/FulfillmentAnalysisRemote.tsx",
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