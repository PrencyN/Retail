import {
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

import {
  tokenRequestScopes,
} from "../auth/authConfig";

import {
  getActiveAccount,
  msalInstance,
} from "../auth/msalInstance";

async function acquireApiToken(
  forceRefresh: boolean
): Promise<string> {
  const account =
    getActiveAccount();

  if (!account) {
    throw new Error(
      "No signed-in Microsoft account is available."
    );
  }

  try {
    const authenticationResult =
      await msalInstance.acquireTokenSilent({
        account,

        scopes:
          tokenRequestScopes,

        forceRefresh,
      });

    if (
      !authenticationResult.accessToken
    ) {
      throw new Error(
        "Microsoft Entra ID did not return an API access token."
      );
    }

    return authenticationResult.accessToken;
  } catch (error) {
    if (
      error instanceof
      InteractionRequiredAuthError
    ) {
      await msalInstance.acquireTokenRedirect({
        account,

        scopes:
          tokenRequestScopes,
      });

      throw new Error(
        "Additional Microsoft authentication is required."
      );
    }

    throw error;
  }
}

function createHeaders(
  init: RequestInit,
  accessToken: string
): Headers {
  const headers =
    new Headers(
      init.headers
    );

  headers.set(
    "Authorization",
    `Bearer ${accessToken}`
  );

  if (!headers.has("Accept")) {
    headers.set(
      "Accept",
      "application/json"
    );
  }

  if (
    init.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  return headers;
}

async function sendAuthenticatedRequest(
  input: RequestInfo | URL,
  init: RequestInit,
  accessToken: string
): Promise<Response> {
  return fetch(
    input,
    {
      ...init,

      headers:
        createHeaders(
          init,
          accessToken
        ),
    }
  );
}

export async function getApiAccessToken():
  Promise<string> {
  return acquireApiToken(
    false
  );
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  // -------------------------------------------
  // FIRST ATTEMPT
  // Use normal MSAL cached-token behavior.
  // -------------------------------------------

  let accessToken =
    await acquireApiToken(
      false
    );

  let response =
    await sendAuthenticatedRequest(
      input,
      init,
      accessToken
    );

  // -------------------------------------------
  // TOKEN REFRESH
  //
  // A newly assigned Entra role may not exist
  // in the currently cached access token.
  //
  // Refresh ONCE and retry.
  // -------------------------------------------

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    accessToken =
      await acquireApiToken(
        true
      );

    response =
      await sendAuthenticatedRequest(
        input,
        init,
        accessToken
      );
  }

  // -------------------------------------------
  // STILL 401
  // Authentication/token problem.
  // -------------------------------------------

  if (response.status === 401) {
    throw new Error(
      "Your Microsoft access token was rejected. " +
      "Please sign out and sign in again."
    );
  }

  // -------------------------------------------
  // STILL 403
  // User is authenticated but does not have
  // one of the required application roles.
  // -------------------------------------------

  if (response.status === 403) {
    throw new Error(
      "Your Microsoft account is authenticated, " +
      "but it does not have the Fulfillment Manager " +
      "or Admin role."
    );
  }

  return response;
}