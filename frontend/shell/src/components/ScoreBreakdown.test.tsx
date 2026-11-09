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
  hyd01IneligibleCandidate,
  hyd03Candidate,
} from "../test/mockData";

describe(
  "ScoreBreakdown",
  () => {
    it(
      "shows every score for an eligible candidate",
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
            "100.00"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "28.57"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "75.00"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "50.00"
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
      "shows total score separately",
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
      "shows the rejection reason for an ineligible candidate",
      () => {
        render(
          <ScoreBreakdown
            candidate={
              hyd01IneligibleCandidate
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
      }
    );
  }
);