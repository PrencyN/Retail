import {
  expect,
  test as setup,
} from "@playwright/test";

import path
  from "node:path";

const authenticationStateFile =
  path.join(
    process.cwd(),
    "playwright",
    ".auth",
    "user.json"
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

        await page.goto(
          "http://localhost:5173",
          {
            waitUntil:
              "domcontentloaded",
          }
        );

        /*
         * The page may already be authenticated if
         * localStorage contains a valid MSAL session.
         *
         * Otherwise, click the Microsoft login button.
         */

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
            .catch(() => false);

        if (!dashboardAlreadyVisible) {
          await expect(
            signInButton
          ).toBeVisible({
            timeout:
              20_000,
          });

          await signInButton.click();

          /*
           * Complete the Microsoft login manually in
           * the headed browser.
           *
           * Playwright waits until Microsoft redirects
           * back and the protected dashboard loads.
           */
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

        /*
         * Confirm that authenticated API calls have
         * completed before storing browser state.
         */

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

        await page.context()
          .storageState({
            path:
              authenticationStateFile,
          });

        console.log(
          `Authentication state saved to ${authenticationStateFile}`
        );
      }
    );
  }
);