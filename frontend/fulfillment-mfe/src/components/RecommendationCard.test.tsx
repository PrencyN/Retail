import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import RecommendationCard
  from "./RecommendationCard";

import {
  fulfilledDecision,
  noRecommendationDecision,
} from "../test/mockDecision";

describe(
  "RecommendationCard",
  () => {
    it(
      "shows the recommended location",
      () => {
        render(
          <RecommendationCard
            decision={
              fulfilledDecision
            }
          />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Kukatpally Store",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "HYD-03"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the winning score",
      () => {
        render(
          <RecommendationCard
            decision={
              fulfilledDecision
            }
          />
        );

        expect(
          screen.getByText(
            "Winning Score"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "69.64"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Deterministic result"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the deterministic explanation",
      () => {
        render(
          <RecommendationCard
            decision={
              fulfilledDecision
            }
          />
        );

        expect(
          screen.getByText(
            /best overall balance/i
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the no-recommendation state",
      () => {
        render(
          <RecommendationCard
            decision={
              noRecommendationDecision
            }
          />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                /no fulfillment location available/i,
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /no single fulfillment location/i
          )
        ).toBeInTheDocument();
      }
    );
  }
);