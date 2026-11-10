import {
  test as base,
  expect,
} from "@playwright/test";

import fs
  from "node:fs/promises";

import path
  from "node:path";

const authenticationStateFile =
  path.join(
    process.cwd(),
    "playwright",
    ".auth",
    "user.json"
  );

const sessionStorageFile =
  path.join(
    process.cwd(),
    "playwright",
    ".auth",
    "session-storage.json"
  );

type SessionStorageValues =
  Record<
    string,
    string
  >;

async function readSessionStorage():
  Promise<SessionStorageValues> {
  let content: string;

  try {
    content =
      await fs.readFile(
        sessionStorageFile,
        "utf-8"
      );
  } catch {
    throw new Error(
      "Playwright session-storage state was not found. " +
      "Run npm run playwright:auth first."
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        content
      );
  } catch {
    throw new Error(
      "Playwright session-storage state is invalid. " +
      "Run npm run playwright:auth again."
    );
  }

  if (
    typeof parsed !==
      "object" ||
    parsed === null ||
    Array.isArray(
      parsed
    )
  ) {
    throw new Error(
      "Playwright session-storage state has an invalid format."
    );
  }

  const values =
    parsed as Record<
      string,
      unknown
    >;

  const validEntries =
    Object.entries(
      values
    ).every(
      (
        [
          key,
          value,
        ]
      ) =>
        typeof key ===
          "string" &&
        typeof value ===
          "string"
    );

  if (
    !validEntries ||
    Object.keys(
      values
    ).length === 0
  ) {
    throw new Error(
      "Playwright session-storage state is empty or invalid. " +
      "Run npm run playwright:auth again."
    );
  }

  return values as
    SessionStorageValues;
}

export const test =
  base.extend({
    context:
      async (
        {
          browser,
        },
        use
      ) => {
        try {
          await fs.access(
            authenticationStateFile
          );
        } catch {
          throw new Error(
            "Playwright browser authentication state was not found. " +
            "Run npm run playwright:auth first."
          );
        }

        const context =
          await browser.newContext({
            storageState:
              authenticationStateFile,
          });

        await use(
          context
        );

        await context.close();
      },

    page:
      async (
        {
          context,
        },
        use
      ) => {
        const sessionStorageValues =
          await readSessionStorage();

        const page =
          await context.newPage();

        await page.addInitScript(
          values => {
            if (
              window.location.origin !==
              "http://localhost:5173"
            ) {
              return;
            }

            for (
              const [
                key,
                value,
              ] of Object.entries(
                values
              )
            ) {
              window.sessionStorage.setItem(
                key,
                value
              );
            }
          },
          sessionStorageValues
        );

        await use(
          page
        );
      },
  });

export {
  expect,
};