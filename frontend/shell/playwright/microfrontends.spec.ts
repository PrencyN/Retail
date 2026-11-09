import {
  test,
  expect,
} from "./fixtures";

test.describe(
  "FulfillIQ micro-frontends",
  () => {
    test(
      "loads shell and all three micro-frontends",
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
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /sign out/i,
            }
          )
        ).toBeVisible();

        /*
          Order MFE
        */

        await expect(
          page.getByText(
            "order-mfe",
            {
              exact: true,
            }
          )
        ).toBeVisible();

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "SYN-1001",
            }
          )
        ).toBeVisible();

        /*
          Fulfillment MFE
        */

        await expect(
          page.getByText(
            "fulfillment-mfe",
            {
              exact: true,
            }
          )
        ).toBeVisible();

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Candidate Locations",
            }
          )
        ).toBeVisible();

        /*
          Manager MFE
        */

        const managerBadges =
          page.getByText(
            "manager-mfe",
            {
              exact: true,
            }
          );

        await expect(
          managerBadges
        ).toHaveCount(
          2
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Fulfillment Simulator",
            }
          )
        ).toBeVisible();

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Ask FulfillIQ AI",
            }
          )
        ).toBeVisible();

        /*
          No MFE should have failed.
        */

        await expect(
          page.getByText(
            "Micro-Frontend Unavailable"
          )
        ).toHaveCount(
          0
        );
      }
    );
  }
);