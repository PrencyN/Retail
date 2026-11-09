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