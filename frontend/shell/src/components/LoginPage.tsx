import {
  InteractionStatus,
} from "@azure/msal-browser";

import {
  useMsal,
} from "@azure/msal-react";

import {
  loginRequest,
} from "../auth/authConfig";

function LoginPage() {
  const {
    instance,
    inProgress,
  } = useMsal();

  const signingIn =
    inProgress !==
    InteractionStatus.None;

  async function handleLogin() {
    await instance.loginRedirect(
      loginRequest
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            FI
          </div>

          <div>
            <span className="eyebrow">
              POD 14
            </span>

            <h1>FulfillIQ</h1>
          </div>
        </div>

        <h2>
          Intelligent fulfillment
          decisions
        </h2>

        <p className="login-description">
          Sign in with Microsoft to access
          deterministic fulfillment scoring,
          What-If simulation, and grounded
          Azure AI explanations.
        </p>

        <div className="login-features">
          <div>
            <span>✓</span>

            <p>
              Complete-basket eligibility
            </p>
          </div>

          <div>
            <span>✓</span>

            <p>
              Distance, workload and
              capacity scoring
            </p>
          </div>

          <div>
            <span>✓</span>

            <p>
              Azure GPT-5-mini explanations
            </p>
          </div>

          <div>
            <span>✓</span>

            <p>
              Microsoft Entra role
              authorization
            </p>
          </div>
        </div>

        <button
          type="button"
          className="microsoft-login-button"
          disabled={signingIn}
          onClick={handleLogin}
        >
          <span className="microsoft-grid">
            <i />
            <i />
            <i />
            <i />
          </span>

          {signingIn
            ? "Signing in..."
            : "Sign in with Microsoft"}
        </button>

        <p className="login-security-note">
          Access is limited to users assigned
          the Fulfillment Manager or Admin role.
        </p>
      </section>
    </main>
  );
}

export default LoginPage;