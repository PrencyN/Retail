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

import RecommendationChangeBanner
  from "./RecommendationChangeBanner";

import {
  recommendationChange,
  unchangedChange,
} from "../test/mockData";

describe(
  "RecommendationChangeBanner",
  () => {
    it(
      "shows the changed recommendation",
      () => {
        render(
          <RecommendationChangeBanner
            change={
              recommendationChange
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
            /HYD-03.*69\.64/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /WH-01.*67\.00/i
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows an unchanged stock update",
      () => {
        render(
          <RecommendationChangeBanner
            change={
              unchangedChange
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
            "Stock values were updated."
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
      "calls the dismiss callback",
      async () => {
        const user =
          userEvent.setup();

        const callback =
          vi.fn();

        render(
          <RecommendationChangeBanner
            change={
              recommendationChange
            }
            onDismiss={
              callback
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
          callback
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );
  }
);