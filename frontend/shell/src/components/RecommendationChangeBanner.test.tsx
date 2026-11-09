import {
  render,
  screen,
} from "@testing-library/react";

import userEvent
  from "@testing-library/user-event";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import RecommendationChangeBanner, {
  type SimulationChange,
} from "./RecommendationChangeBanner";

const changedRecommendation:
  SimulationChange = {
    title:
      "Workload Updated",

    cause:
      "Kukatpally Store workload changed from 25% to 95%.",

    previousLocationCode:
      "HYD-03",

    previousLocationName:
      "Kukatpally Store",

    previousScore:
      69.64,

    newLocationCode:
      "WH-01",

    newLocationName:
      "Central Fulfillment Warehouse",

    newScore:
      67,

    recommendationChanged:
      true,
  };

const unchangedRecommendation:
  SimulationChange = {
    title:
      "Stock Updated",

    cause:
      "Hitech City electronics stock was changed.",

    previousLocationCode:
      "HYD-03",

    previousLocationName:
      "Kukatpally Store",

    previousScore:
      69.64,

    newLocationCode:
      "HYD-03",

    newLocationName:
      "Kukatpally Store",

    newScore:
      69.64,

    recommendationChanged:
      false,
  };

describe(
  "RecommendationChangeBanner",
  () => {
    it(
      "shows the old and new recommendations when the winner changes",
      () => {
        render(
          <RecommendationChangeBanner
            change={
              changedRecommendation
            }
            onDismiss={
              vi.fn()
            }
          />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Recommendation Changed",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Kukatpally Store"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Central Fulfillment Warehouse"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "69.64"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "67.00"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows an unchanged update without a recommendation comparison",
      () => {
        render(
          <RecommendationChangeBanner
            change={
              unchangedRecommendation
            }
            onDismiss={
              vi.fn()
            }
          />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Stock Updated",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /electronics stock was changed/i
          )
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            "Previous"
          )
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "New"
          )
        ).not.toBeInTheDocument();
      }
    );

    it(
      "calls onDismiss when the close button is selected",
      async () => {
        const user =
          userEvent.setup();

        const onDismiss =
          vi.fn();

        render(
          <RecommendationChangeBanner
            change={
              changedRecommendation
            }
            onDismiss={
              onDismiss
            }
          />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Dismiss notification",
            }
          )
        );

        expect(
          onDismiss
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );
  }
);