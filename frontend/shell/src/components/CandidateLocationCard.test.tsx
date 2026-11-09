import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import CandidateLocationCard
  from "./CandidateLocationCard";

import {
  hyd01IneligibleCandidate,
  hyd03Candidate,
} from "../test/mockData";

describe(
  "CandidateLocationCard",
  () => {
    it(
      "shows an eligible recommended candidate",
      () => {
        render(
          <CandidateLocationCard
            candidate={
              hyd03Candidate
            }
            recommended={
              true
            }
          />
        );

        expect(
          screen.getByText(
            "HYD-03"
          )
        ).toBeInTheDocument();

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
            "Recommended"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "#1"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows candidate metrics",
      () => {
        render(
          <CandidateLocationCard
            candidate={
              hyd03Candidate
            }
            recommended={
              false
            }
          />
        );

        expect(
          screen.getByText(
            "10 km"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "25%"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "90"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Yes"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows an ineligible incomplete-basket candidate",
      () => {
        render(
          <CandidateLocationCard
            candidate={
              hyd01IneligibleCandidate
            }
            recommended={
              false
            }
          />
        );

        expect(
          screen.getByText(
            "HYD-01"
          )
        ).toBeInTheDocument();

        expect(
          screen.getAllByText(
            "Ineligible"
          ).length
        ).toBeGreaterThanOrEqual(
          1
        );

        expect(
          screen.getByText(
            "N/A"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "No"
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