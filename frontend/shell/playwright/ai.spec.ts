import {
  test,
  expect,
} from "./fixtures";

test.describe(
  "FulfillIQ AI journey",
  () => {
    test.setTimeout(
      120_000
    );

    test(
      "gets a grounded Azure AI explanation",
      async ({
        page,
      }) => {
        await page.goto(
          "/"
        );

        await expect(
          page.getByRole(
            "heading",
            {
              level: 1,
              name: "FulfillIQ",
            }
          )
        ).toBeVisible({
          timeout: 30_000,
        });

        await expect(
          page.getByRole(
            "button",
            {
              name: /sign out/i,
            }
          )
        ).toBeVisible({
          timeout: 30_000,
        });

        const resetButton =
          page.getByRole(
            "button",
            {
              name: "Reset Demo",
            }
          );

        await expect(
          resetButton
        ).toBeVisible({
          timeout: 30_000,
        });

        await resetButton.click();

        await expect(
          page.getByRole(
            "heading",
            {
              level: 2,
              name:
                "Kukatpally Store",
            }
          )
        ).toBeVisible({
          timeout: 30_000,
        });

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Ask FulfillIQ AI",
            }
          )
        ).toBeVisible({
          timeout: 30_000,
        });

        const questionButton =
          page.getByRole(
            "button",
            {
              name:
                "Why was the nearest store not selected?",
            }
          );

        await expect(
          questionButton
        ).toBeVisible();

        await questionButton.click();

        const questionInput =
          page.getByLabel(
            "Manager question"
          );

        await expect(
          questionInput
        ).toHaveValue(
          "Why was the nearest store not selected?"
        );

        const askButton =
          page.getByRole(
            "button",
            {
              name: "Ask AI",
            }
          );

        await expect(
          askButton
        ).toBeEnabled();

        const aiResponsePromise =
          page.waitForResponse(
            response => {
              return (
                response.url()
                  .startsWith(
                    "http://localhost:5143"
                  ) &&
                response.request()
                  .method() !== "OPTIONS"
              );
            },
            {
              timeout: 90_000,
            }
          );

        await askButton.click();

        const aiResponse =
          await aiResponsePromise;

        expect(
          aiResponse.ok()
        ).toBeTruthy();

        await expect(
          page.getByText(
            "Azure AI",
            {
              exact: true,
            }
          )
        ).toBeVisible({
          timeout: 30_000,
        });

        await expect(
          page.getByText(
            /Azure OpenAI/i
          )
        ).toBeVisible();

        await expect(
          page.getByText(
            /fulfilliq-gpt5-mini/i
          )
        ).toBeVisible();

        await expect(
          page.getByText(
            "Answer",
            {
              exact: true,
            }
          )
        ).toBeVisible();

        await expect(
          page.getByText(
            "Primary reason",
            {
              exact: true,
            }
          )
        ).toBeVisible();

        await expect(
          page.getByText(
            "Supporting evidence",
            {
              exact: true,
            }
          )
        ).toBeVisible();
      }
    );
  }
);