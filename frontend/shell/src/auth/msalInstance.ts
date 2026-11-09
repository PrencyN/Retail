import {
  EventType,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type EventMessage,
} from "@azure/msal-browser";

import {
  msalConfig,
} from "./authConfig";

export const msalInstance =
  new PublicClientApplication(
    msalConfig
  );

let initialized =
  false;

function selectAccount(
  account: AccountInfo | null
): void {
  if (!account) {
    return;
  }

  msalInstance.setActiveAccount(
    account
  );
}

function handleMsalEvent(
  event: EventMessage
): void {
  if (
    event.eventType !==
    EventType.LOGIN_SUCCESS
  ) {
    return;
  }

  const authenticationResult =
    event.payload as
      AuthenticationResult | null;

  selectAccount(
    authenticationResult?.account ??
    null
  );
}

export async function initializeMsal():
  Promise<void> {
  if (initialized) {
    return;
  }

  await msalInstance.initialize();

  msalInstance.addEventCallback(
    handleMsalEvent
  );

  const redirectResult =
    await msalInstance
      .handleRedirectPromise({
        navigateToLoginRequestUrl:
          true,
      });

  if (redirectResult?.account) {
    selectAccount(
      redirectResult.account
    );
  }

  if (
    !msalInstance.getActiveAccount()
  ) {
    const accounts =
      msalInstance.getAllAccounts();

    if (accounts.length > 0) {
      selectAccount(
        accounts[0]
      );
    }
  }

  initialized =
    true;
}

export function getActiveAccount():
  AccountInfo | null {
  const activeAccount =
    msalInstance.getActiveAccount();

  if (activeAccount) {
    return activeAccount;
  }

  const accounts =
    msalInstance.getAllAccounts();

  if (
    accounts.length === 0
  ) {
    return null;
  }

  selectAccount(
    accounts[0]
  );

  return accounts[0];
}