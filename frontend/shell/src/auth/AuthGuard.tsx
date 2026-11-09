import type {
  PropsWithChildren,
} from "react";

import {
  InteractionStatus,
} from "@azure/msal-browser";

import {
  useIsAuthenticated,
  useMsal,
} from "@azure/msal-react";

import LoginPage
  from "../components/LoginPage";

function AuthGuard({
  children,
}: PropsWithChildren) {
  const authenticated =
    useIsAuthenticated();

  const {
    inProgress,
  } = useMsal();

  if (
    inProgress !==
    InteractionStatus.None
  ) {
    return (
      <main className="auth-loading-page">
        <div className="auth-loading-card">
          <div className="spinner" />

          <h2>
            Completing Microsoft sign-in
          </h2>

          <p>
            FulfillIQ is validating the
            authentication response.
          </p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

export default AuthGuard;