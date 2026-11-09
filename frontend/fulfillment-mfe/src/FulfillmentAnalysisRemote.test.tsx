import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import FulfillmentAnalysisRemote
  from "./FulfillmentAnalysisRemote";

import {
  fulfilledDecision,
} from "./test/mockDecision";

describe(
  "FulfillmentAnalysisRemote",
  () => {
    it(
      "shows the fulfillment micro-frontend badge",
      () => {
        render(
          <FulfillmentAnalysisRemote
            decision={
              fulfilledDecision
            }
          />
        );

        expect(
          screen.getByText(
            "fulfillment-mfe"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the recommendation and all candidate locations",
      () => {
        render(
          <FulfillmentAnalysisRemote
            decision={
              fulfilledDecision
            }
          />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              level: 2,
              name:
                "Kukatpally Store",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 3,
              name:
                "Kukatpally Store",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 3,
              name:
                "Central Fulfillment Warehouse",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 3,
              name:
                "Hitech City Store",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 3,
              name:
                "Hyderabad Central Store",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /4\s+locations evaluated/i
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "marks HYD-03 as the only recommended candidate",
      () => {
        render(
          <FulfillmentAnalysisRemote
            decision={
              fulfilledDecision
            }
          />
        );

        expect(
          screen.getAllByText(
            "Recommended"
          )
        ).toHaveLength(
          1
        );

        expect(
          screen.getByText(
            "#1"
          )
        ).toBeInTheDocument();

        /*
         * HYD-03 intentionally appears twice:
         *
         * 1. Recommended fulfillment location code
         * 2. Candidate location code
         */
        expect(
          screen.getAllByText(
            "HYD-03"
          )
        ).toHaveLength(
          2
        );

        expect(
          screen.getByRole(
            "heading",
            {
              level: 3,
              name:
                "Kukatpally Store",
            }
          )
        ).toBeInTheDocument();
      }
    );
  }
);