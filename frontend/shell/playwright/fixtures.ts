import {
  test as base,
  expect,
} from "@playwright/test";

import fs
  from "node:fs/promises";

import path
  from "node:path";

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

export const test =
  base.extend({
    page:
      async (
        {
          page,
        },
        use
      ) => {
        let sessionStorageValues:
          SessionStorageValues;

        try {
          const content =
            await fs.readFile(
              sessionStorageFile,
              "utf-8"
            );

          sessionStorageValues =
            JSON.parse(
              content
            ) as SessionStorageValues;
        } catch {
          throw new Error(
            "Playwright login state was not found. " +
            "Run npm run playwright:auth first."
          );
        }

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