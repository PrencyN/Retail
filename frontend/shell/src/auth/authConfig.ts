import {
  BrowserCacheLocation,
  LogLevel,
  type Configuration,
  type RedirectRequest,
} from "@azure/msal-browser";

function requireEnvironmentValue(
  name: string,
  value: string | undefined
): string {
  const normalizedValue =
    value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return normalizedValue;
}

export const tenantId =
  requireEnvironmentValue(
    "VITE_ENTRA_TENANT_ID",
    import.meta.env.VITE_ENTRA_TENANT_ID
  );

export const spaClientId =
  requireEnvironmentValue(
    "VITE_ENTRA_SPA_CLIENT_ID",
    import.meta.env.VITE_ENTRA_SPA_CLIENT_ID
  );

export const apiClientId =
  requireEnvironmentValue(
    "VITE_ENTRA_API_CLIENT_ID",
    import.meta.env.VITE_ENTRA_API_CLIENT_ID
  );

export const apiScope =
  `api://${apiClientId}/access_as_user`;

export const tokenRequestScopes: string[] = [
  apiScope,
];

export const msalConfig: Configuration = {
  auth: {
    clientId:
      spaClientId,

    authority:
      `https://login.microsoftonline.com/${tenantId}`,

    redirectUri:
      "http://localhost:5173",

    postLogoutRedirectUri:
      "http://localhost:5173",
  },

  cache: {
    cacheLocation:
      BrowserCacheLocation.SessionStorage,
  },

  system: {
    allowPlatformBroker:
      false,

    loggerOptions: {
      logLevel:
        LogLevel.Warning,

      piiLoggingEnabled:
        false,

      loggerCallback: (
        level,
        message,
        containsPii
      ) => {
        if (containsPii) {
          return;
        }

        if (
          level ===
          LogLevel.Error
        ) {
          console.error(
            `[MSAL] ${message}`
          );

          return;
        }

        if (
          level ===
          LogLevel.Warning
        ) {
          console.warn(
            `[MSAL] ${message}`
          );
        }
      },
    },
  },
};

export const loginRequest:
  RedirectRequest = {
    scopes: [
      "openid",
      "profile",
      "email",
      apiScope,
    ],

    prompt:
      "select_account",
  };