export type RemoteName =
  | "order_mfe"
  | "fulfillment_mfe"
  | "manager_mfe";

export type TrustedRemoteEntries = Readonly<
  Record<RemoteName, string>
>;

type RemoteEnvironment = Readonly<
  Record<string, string | undefined>
>;

const REMOTE_ENTRY_FILE =
  "/remoteEntry.js";

const DEVELOPMENT_REMOTES: TrustedRemoteEntries =
  Object.freeze({
    order_mfe:
      "http://localhost:5174/remoteEntry.js",

    fulfillment_mfe:
      "http://localhost:5175/remoteEntry.js",

    manager_mfe:
      "http://localhost:5176/remoteEntry.js",
  });

const DEVELOPMENT_ORIGINS =
  Object.freeze([
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
  ]);

function splitOrigins(
  value: string | undefined,
): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) =>
      origin.trim().replace(/\/+$/, ""),
    )
    .filter(Boolean);
}

function validateOrigin(
  origin: string,
  production: boolean,
): string {
  let parsed: URL;

  try {
    parsed =
      new URL(origin);
  } catch {
    throw new Error(
      `Invalid trusted remote origin: ${origin}`,
    );
  }

  if (
    parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
  ) {
    throw new Error(
      `Trusted remote origin must not contain credentials, query parameters, or fragments: ${origin}`,
    );
  }

  if (
    parsed.pathname !== "/"
    && parsed.pathname !== ""
  ) {
    throw new Error(
      `Trusted remote origin must not contain a path: ${origin}`,
    );
  }

  if (
    production
    && parsed.protocol !== "https:"
  ) {
    throw new Error(
      `Production remote origins must use HTTPS: ${origin}`,
    );
  }

  if (
    !production
    && parsed.protocol === "http:"
    && parsed.hostname !== "localhost"
    && parsed.hostname !== "127.0.0.1"
  ) {
    throw new Error(
      `Development HTTP remotes are allowed only on localhost: ${origin}`,
    );
  }

  if (
    parsed.protocol !== "https:"
    && parsed.protocol !== "http:"
  ) {
    throw new Error(
      `Unsupported remote origin protocol: ${origin}`,
    );
  }

  return parsed.origin;
}

function validateRemoteEntry(
  name: RemoteName,
  value: string,
  trustedOrigins: ReadonlySet<string>,
  production: boolean,
): string {
  let parsed: URL;

  try {
    parsed =
      new URL(value);
  } catch {
    throw new Error(
      `Invalid Module Federation entry for ${name}: ${value}`,
    );
  }

  if (
    parsed.username
    || parsed.password
  ) {
    throw new Error(
      `Remote entry for ${name} must not contain credentials.`,
    );
  }

  if (
    parsed.search
    || parsed.hash
  ) {
    throw new Error(
      `Remote entry for ${name} must not contain a query string or fragment.`,
    );
  }

  if (
    parsed.pathname !== REMOTE_ENTRY_FILE
  ) {
    throw new Error(
      `Remote entry for ${name} must end with ${REMOTE_ENTRY_FILE}.`,
    );
  }

  if (
    production
    && parsed.protocol !== "https:"
  ) {
    throw new Error(
      `Production remote ${name} must use HTTPS.`,
    );
  }

  if (
    !production
    && parsed.protocol === "http:"
    && parsed.hostname !== "localhost"
    && parsed.hostname !== "127.0.0.1"
  ) {
    throw new Error(
      `Development HTTP remote ${name} must use localhost.`,
    );
  }

  if (
    parsed.protocol !== "https:"
    && parsed.protocol !== "http:"
  ) {
    throw new Error(
      `Unsupported protocol for remote ${name}.`,
    );
  }

  if (
    !trustedOrigins.has(
      parsed.origin,
    )
  ) {
    throw new Error(
      `Remote ${name} uses an origin that is not allowlisted: ${parsed.origin}`,
    );
  }

  return parsed.toString();
}

function requiredProductionValue(
  environment: RemoteEnvironment,
  key: string,
): string {
  const value =
    environment[key]?.trim();

  if (!value) {
    throw new Error(
      `Required production environment variable is missing: ${key}`,
    );
  }

  return value;
}

export function createTrustedRemoteEntries(
  environment: RemoteEnvironment,
  mode: string,
): TrustedRemoteEntries {
  const production =
    mode === "production";

  const configuredOrigins =
    splitOrigins(
      environment
        .VITE_TRUSTED_REMOTE_ORIGINS,
    );

  const origins =
    production
      ? configuredOrigins
      : configuredOrigins.length > 0
        ? configuredOrigins
        : [...DEVELOPMENT_ORIGINS];

  if (
    production
    && origins.length === 0
  ) {
    throw new Error(
      "VITE_TRUSTED_REMOTE_ORIGINS must be configured for production.",
    );
  }

  const trustedOrigins =
    new Set(
      origins.map((origin) =>
        validateOrigin(
          origin,
          production,
        ),
      ),
    );

  const candidateEntries:
    TrustedRemoteEntries =
    production
      ? {
          order_mfe:
            requiredProductionValue(
              environment,
              "VITE_ORDER_MFE_ENTRY",
            ),

          fulfillment_mfe:
            requiredProductionValue(
              environment,
              "VITE_FULFILLMENT_MFE_ENTRY",
            ),

          manager_mfe:
            requiredProductionValue(
              environment,
              "VITE_MANAGER_MFE_ENTRY",
            ),
        }
      : {
          order_mfe:
            environment
              .VITE_ORDER_MFE_ENTRY
              ?.trim()
            || DEVELOPMENT_REMOTES
              .order_mfe,

          fulfillment_mfe:
            environment
              .VITE_FULFILLMENT_MFE_ENTRY
              ?.trim()
            || DEVELOPMENT_REMOTES
              .fulfillment_mfe,

          manager_mfe:
            environment
              .VITE_MANAGER_MFE_ENTRY
              ?.trim()
            || DEVELOPMENT_REMOTES
              .manager_mfe,
        };

  return Object.freeze({
    order_mfe:
      validateRemoteEntry(
        "order_mfe",
        candidateEntries.order_mfe,
        trustedOrigins,
        production,
      ),

    fulfillment_mfe:
      validateRemoteEntry(
        "fulfillment_mfe",
        candidateEntries
          .fulfillment_mfe,
        trustedOrigins,
        production,
      ),

    manager_mfe:
      validateRemoteEntry(
        "manager_mfe",
        candidateEntries.manager_mfe,
        trustedOrigins,
        production,
      ),
  });
}