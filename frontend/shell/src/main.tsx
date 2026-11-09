import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  MsalProvider,
} from "@azure/msal-react";

import App from "./App.tsx";

import "./index.css";

import {
  initializeMsal,
  msalInstance,
} from "./auth/msalInstance";

async function startApplication() {
  const rootElement =
    document.getElementById(
      "root"
    );

  if (!rootElement) {
    throw new Error(
      "React root element was not found."
    );
  }

  await initializeMsal();

  createRoot(
    rootElement
  ).render(
    <StrictMode>
      <MsalProvider
        instance={msalInstance}
      >
        <App />
      </MsalProvider>
    </StrictMode>
  );
}

startApplication().catch(
  error => {
    console.error(
      "Unable to start FulfillIQ.",
      error
    );

    const rootElement =
      document.getElementById(
        "root"
      );

    if (rootElement) {
      rootElement.innerHTML = `
        <main style="
          font-family: Segoe UI, sans-serif;
          padding: 32px;
          color: #991b1b;
        ">
          <h1>FulfillIQ could not start</h1>
          <p>
            Check the Microsoft Entra configuration
            in .env.local and restart the Vite server.
          </p>
        </main>
      `;
    }
  }
);