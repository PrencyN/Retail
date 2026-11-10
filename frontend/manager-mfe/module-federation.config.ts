import {
  createModuleFederationConfig,
} from "@module-federation/vite";

export default createModuleFederationConfig({
  name:
    "manager_mfe",

  filename:
    "remoteEntry.js",

  manifest:
    true,

  exposes: {
    "./ManagerWorkspace":
      "./src/ManagerWorkspaceRemote.tsx",
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