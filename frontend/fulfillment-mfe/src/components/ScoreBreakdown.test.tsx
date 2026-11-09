import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import ScoreBreakdown
  from "./ScoreBreakdown";

import {
  hyd01Candidate,
  hyd03Candidate,
} from "../test/mockDecision";

describe(
  "ScoreBreakdown",
  () => {
    it(
      "shows all weighted score categories",
      () => {
        render(
          <ScoreBreakdown
            candidate={
              hyd03Candidate
            }
          />
        );

        expect(
          screen.getByText(
            "Inventory"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Distance"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Workload"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Capacity"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Weight 40%"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Weight 25%"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Weight 20%"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Weight 15%"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the total deterministic score",
      () => {
        render(
          <ScoreBreakdown
            candidate={
              hyd03Candidate
            }
          />
        );

        expect(
          screen.getByText(
            "Total"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "69.64"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the reason when the candidate is ineligible",
      () => {
        render(
          <ScoreBreakdown
            candidate={
              hyd01Candidate
            }
          />
        );

        expect(
          screen.getByText(
            "Ineligible"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /insufficient stock/i
          )
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            "Total"
          )
        ).not.toBeInTheDocument();
      }
    );
  }
);