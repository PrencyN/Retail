import {
  test,
  expect,
} from "./fixtures";

test.describe(
  "FulfillIQ fulfillment journey",
  () => {
    test(
      "changes recommendation at 95 percent workload and resets",
      async ({
        page,
      }) => {
        await page.goto(
          "/"
        );

        const resetButton =
          page.getByRole(
            "button",
            {
              name:
                "Reset Demo",
            }
          );

        await expect(
          resetButton
        ).toBeVisible();

        await resetButton.click();

        /*
          Baseline
        */

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
          timeout:
            30_000,
        });

        await expect(
          page.getByText(
            "HYD-03",
            {
              exact: true,
            }
          ).first()
        ).toBeVisible();

        await expect(
          page.getByText(
            "69.64",
            {
              exact: true,
            }
          ).first()
        ).toBeVisible();

        /*
          Find Manager MFE workload card.
        */

        const workloadCard =
          page
            .getByRole(
              "article"
            )
            .filter({
              has:
                page.getByRole(
                  "heading",
                  {
                    name:
                      "Workload Simulator",
                  }
                ),
            });

        await expect(
          workloadCard
        ).toBeVisible();

        /*
          Change from 25 to 95 percent.
        */

        await workloadCard
          .getByRole(
            "button",
            {
              name: "95%",
            }
          )
          .click();

        const workloadInput =
          workloadCard.getByRole(
            "spinbutton",
            {
              name:
                "Workload percentage",
            }
          );

        await expect(
          workloadInput
        ).toHaveValue(
          "95"
        );

        await workloadCard
          .getByRole(
            "button",
            {
              name:
                "Apply & Recalculate",
            }
          )
          .click();

        /*
          Fulfillment MFE should
          now show WH-01.
        */

        await expect(
          page.getByRole(
            "heading",
            {
              level: 2,
              name:
                "Central Fulfillment Warehouse",
            }
          )
        ).toBeVisible({
          timeout:
            30_000,
        });

        await expect(
          page.getByText(
            "WH-01",
            {
              exact: true,
            }
          ).first()
        ).toBeVisible();

        await expect(
          page.getByText(
            "67.00",
            {
              exact: true,
            }
          ).first()
        ).toBeVisible();

        /*
          Manager MFE should
          show the change banner.
        */

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Recommendation Changed",
            }
          )
        ).toBeVisible();

        await expect(
          page.getByText(
            "Previous",
            {
              exact: true,
            }
          )
        ).toBeVisible();

        await expect(
          page.getByText(
            "New",
            {
              exact: true,
            }
          )
        ).toBeVisible();

        /*
          Restore baseline.
        */

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
          timeout:
            30_000,
        });

        await expect(
          page.getByText(
            "HYD-03",
            {
              exact: true,
            }
          ).first()
        ).toBeVisible();

        await expect(
          page.getByText(
            "69.64",
            {
              exact: true,
            }
          ).first()
        ).toBeVisible();
      }
    );
  }
);