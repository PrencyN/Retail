import {
  expect,
  test as setup,
} from "@playwright/test";

import fs
  from "node:fs/promises";

import path
  from "node:path";

const authDirectory =
  path.join(
    process.cwd(),
    "playwright",
    ".auth"
  );

const authenticationStateFile =
  path.join(
    authDirectory,
    "user.json"
  );

const sessionStorageFile =
  path.join(
    authDirectory,
    "session-storage.json"
  );

setup.describe(
  "Microsoft authentication setup",
  () => {
    setup(
      "signs in and saves authenticated browser state",
      async ({
        page,
      }) => {
        setup.setTimeout(
          180_000
        );

        await fs.mkdir(
          authDirectory,
          {
            recursive:
              true,
          }
        );

        await page.goto(
          "http://localhost:5173",
          {
            waitUntil:
              "domcontentloaded",
          }
        );

        const resetDemoButton =
          page.getByRole(
            "button",
            {
              name:
                "Reset Demo",
            }
          );

        const signInButton =
          page.getByRole(
            "button",
            {
              name:
                "Sign in with Microsoft",
            }
          );

        const dashboardAlreadyVisible =
          await resetDemoButton
            .isVisible()
            .catch(
              () =>
                false
            );

        if (!dashboardAlreadyVisible) {
          await expect(
            signInButton
          ).toBeVisible({
            timeout:
              20_000,
          });

          await signInButton.click();
        }

        await page.waitForURL(
          url =>
            url.origin ===
            "http://localhost:5173",
          {
            timeout:
              180_000,
          }
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "FulfillIQ",
            }
          )
        ).toBeVisible({
          timeout:
            60_000,
        });

        await expect(
          resetDemoButton
        ).toBeVisible({
          timeout:
            60_000,
        });

        await expect(
          page.getByText(
            "Kukatpally Store",
            {
              exact:
                true,
            }
          ).first()
        ).toBeVisible({
          timeout:
            30_000,
        });

        /*
         * Save cookies and localStorage using Playwright's
         * standard storage-state format.
         */
        await page.context()
          .storageState({
            path:
              authenticationStateFile,
          });

        /*
         * Playwright storageState does not persist
         * browser sessionStorage. FulfillIQ/MSAL uses
         * sessionStorage, so persist it separately.
         *
         * Do not log these values because authentication
         * tokens may be present.
         */
        const sessionStorageValues =
          await page.evaluate(
            () => {
              const values:
                Record<
                  string,
                  string
                > =
                {};

              for (
                let index = 0;
                index <
                window.sessionStorage.length;
                index++
              ) {
                const key =
                  window.sessionStorage.key(
                    index
                  );

                if (!key) {
                  continue;
                }

                const value =
                  window.sessionStorage.getItem(
                    key
                  );

                if (
                  value !== null
                ) {
                  values[key] =
                    value;
                }
              }

              return values;
            }
          );

        if (
          Object.keys(
            sessionStorageValues
          ).length === 0
        ) {
          throw new Error(
            "Microsoft authentication completed, but no sessionStorage state was available to save."
          );
        }

        await fs.writeFile(
          sessionStorageFile,
          JSON.stringify(
            sessionStorageValues
          ),
          "utf-8"
        );

        console.log(
          "Playwright authentication state saved successfully."
        );
      }
    );
  }
);