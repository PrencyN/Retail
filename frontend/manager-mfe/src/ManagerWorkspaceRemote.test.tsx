import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import ManagerWorkspaceRemote
  from "./ManagerWorkspaceRemote";

import {
  aiResponse,
  fulfilledDecision,
  recommendationChange,
} from "./test/mockData";

function renderWorkspace(
  showRecommendationChange: boolean = false
) {
  const onUpdateWorkload =
    vi.fn().mockResolvedValue(
      undefined
    );

  const onUpdateStock =
    vi.fn().mockResolvedValue(
      undefined
    );

  const onAskAi =
    vi.fn().mockResolvedValue(
      aiResponse
    );

  const onDismissChange =
    vi.fn();

  render(
    <ManagerWorkspaceRemote
      decision={
        fulfilledDecision
      }
      simulationChange={
        showRecommendationChange
          ? recommendationChange
          : null
      }
      resetVersion={
        0
      }
      workloadLocationCode={
        "HYD-03"
      }
      workloadLocationName={
        "Kukatpally Store"
      }
      currentWorkload={
        25
      }
      stockProductId={
        "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99"
      }
      stockProductName={
        "RetailIQ Red Electronics 25"
      }
      stockLocationCode={
        "HYD-02"
      }
      stockLocationName={
        "Hitech City Store"
      }
      initialAvailableQuantity={
        4
      }
      initialReservedQuantity={
        1
      }
      initialReorderLevel={
        2
      }
      onUpdateWorkload={
        onUpdateWorkload
      }
      onUpdateStock={
        onUpdateStock
      }
      onAskAi={
        onAskAi
      }
      onDismissChange={
        onDismissChange
      }
    />
  );

  return {
    onUpdateWorkload,
    onUpdateStock,
    onAskAi,
    onDismissChange,
  };
}

describe(
  "ManagerWorkspaceRemote",
  () => {
    it(
      "shows the manager MFE badges",
      () => {
        renderWorkspace();

        const badges =
          screen.getAllByText(
            "manager-mfe"
          );

        expect(
          badges
        ).toHaveLength(
          2
        );

        expect(
          badges[0]
        ).toBeInTheDocument();

        expect(
          badges[1]
        ).toBeInTheDocument();
      }
    );

    it(
      "shows both fulfillment simulators",
      () => {
        renderWorkspace();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 2,
              name:
                "Fulfillment Simulator",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 3,
              name:
                "Workload Simulator",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 3,
              name:
                "Stock Simulator",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "HYD-03"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "HYD-02"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "RetailIQ Red Electronics 25"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Hitech City Store"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the AI assistant and deterministic authority",
      () => {
        renderWorkspace();

        expect(
          screen.getByRole(
            "heading",
            {
              level: 2,
              name:
                "Ask FulfillIQ AI",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Deterministic authority"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /winner:\s*HYD-03/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /score:\s*69\.64/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Ask AI",
            }
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the recommendation change from HYD-03 to WH-01",
      () => {
        renderWorkspace(
          true
        );

        expect(
          screen.getByRole(
            "heading",
            {
              level: 2,
              name:
                "Recommendation Changed",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Previous"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "New"
          )
        ).toBeInTheDocument();

        /*
         * Kukatpally Store appears twice:
         *
         * 1. Previous recommendation
         * 2. Workload Simulator location
         */
        const kukatpallyElements =
          screen.getAllByText(
            "Kukatpally Store"
          );

        expect(
          kukatpallyElements
        ).toHaveLength(
          2
        );

        /*
         * HYD-03 and 69.64 also appear twice:
         *
         * 1. Previous recommendation details
         * 2. AI deterministic authority
         */
        const hyd03ScoreElements =
          screen.getAllByText(
            /HYD-03.*69\.64/i
          );

        expect(
          hyd03ScoreElements
        ).toHaveLength(
          2
        );

        hyd03ScoreElements.forEach(
          element => {
            expect(
              element
            ).toBeInTheDocument();
          }
        );

        expect(
          screen.getByText(
            "Central Fulfillment Warehouse"
          )
        ).toBeInTheDocument();

        /*
         * WH-01 and 67.00 belong only to
         * the new recommendation result.
         */
        expect(
          screen.getByText(
            /WH-01.*67\.00/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /workload changed from 25% to 95%/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Dismiss notification",
            }
          )
        ).toBeInTheDocument();
      }
    );
  }
);