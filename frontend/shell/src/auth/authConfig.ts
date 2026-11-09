import {
  BrowserCacheLocation,
  LogLevel,
  type Configuration,
  type RedirectRequest,
} from "@azure/msal-browser";

const tenantId =
  import.meta.env.VITE_ENTRA_TENANT_ID;

const spaClientId =
  import.meta.env.VITE_ENTRA_SPA_CLIENT_ID;

const apiClientId =
  import.meta.env.VITE_ENTRA_API_CLIENT_ID;

if (!tenantId) {
  throw new Error(
    "VITE_ENTRA_TENANT_ID is not configured."
  );
}

if (!spaClientId) {
  throw new Error(
    "VITE_ENTRA_SPA_CLIENT_ID is not configured."
  );
}

if (!apiClientId) {
  throw new Error(
    "VITE_ENTRA_API_CLIENT_ID is not configured."
  );
}

export const tokenRequestScopes:
  string[] = [
    `api://${apiClientId}/access_as_user`,
  ];

export const msalConfig:
  Configuration = {
    auth: {
      clientId:
        spaClientId,

      authority:
        `https://login.microsoftonline.com/${tenantId}`,

      redirectUri:
        window.location.origin,

      postLogoutRedirectUri:
        window.location.origin,
    },

    cache: {
      cacheLocation:
        BrowserCacheLocation.SessionStorage,
    },

    system: {
      loggerOptions: {
        loggerCallback: (
          level,
          message,
          containsPii
        ) => {
          if (containsPii) {
            return;
          }

          switch (level) {
            case LogLevel.Error:
              console.error(
                message
              );
              break;

            case LogLevel.Warning:
              console.warn(
                message
              );
              break;

            case LogLevel.Info:
              console.info(
                message
              );
              break;

            case LogLevel.Verbose:
              console.debug(
                message
              );
              break;

            default:
              break;
          }
        },

        piiLoggingEnabled:
          false,
      },
    },
  };

export const loginRequest:
  RedirectRequest = {
    scopes: [
      "openid",
      "profile",
      "email",
      ...tokenRequestScopes,
    ],
  };

export const apiTokenRequest = {
  scopes:
    tokenRequestScopes,
};