import {
  useState,
} from "react";

import ManagerWorkspaceRemote
  from "./ManagerWorkspaceRemote";

import type {
  ExplainDecisionRequest,
  ExplainDecisionResponse,
  FulfillmentDecision,
  SimulationChange,
  SimulationUpdate,
} from "./types/manager";

import "./App.css";

const previewDecision:
  FulfillmentDecision = {
    decisionId:
      "manager-preview-001",

    orderReference:
      "SYN-1001",

    calculatedAtUtc:
      new Date().toISOString(),

    hasRecommendation:
      true,

    recommendedLocationCode:
      "HYD-03",

    recommendedLocationName:
      "Kukatpally Store",

    winningScore:
      69.64,

    explanation:
      "Kukatpally Store achieved the highest deterministic score.",

    policy: {
      inventoryWeight:
        0.40,

      distanceWeight:
        0.25,

      workloadWeight:
        0.20,

      capacityWeight:
        0.15,

      totalWeight:
        1,
    },

    candidates: [
      {
        rank:
          1,

        locationCode:
          "HYD-03",

        locationName:
          "Kukatpally Store",

        completeBasket:
          true,

        eligible:
          true,

        reason:
          "Complete basket available.",

        missingProductIds:
          [],

        distanceKm:
          10,

        workloadPercent:
          25,

        dailyCapacity:
          120,

        currentOrders:
          30,

        remainingCapacity:
          90,

        inventoryScore:
          100,

        distanceScore:
          28.57,

        workloadScore:
          75,

        capacityScore:
          50,

        totalScore:
          69.64,
      },

      {
        rank:
          2,

        locationCode:
          "WH-01",

        locationName:
          "Central Fulfillment Warehouse",

        completeBasket:
          true,

        eligible:
          true,

        reason:
          "Complete basket available.",

        missingProductIds:
          [],

        distanceKm:
          14,

        workloadPercent:
          40,

        dailyCapacity:
          300,

        currentOrders:
          120,

        remainingCapacity:
          180,

        inventoryScore:
          100,

        distanceScore:
          0,

        workloadScore:
          60,

        capacityScore:
          100,

        totalScore:
          67,
      },
    ],
  };

function App() {
  const [
    simulationChange,
    setSimulationChange,
  ] =
    useState<
      SimulationChange |
      null
    >(
      null
    );

  async function handleWorkload(
    locationCode: string,
    workloadPercent: number,
    update: SimulationUpdate
  ): Promise<void> {
    setSimulationChange({
      title:
        update.title,

      cause:
        update.cause,

      previousLocationCode:
        "HYD-03",

      previousLocationName:
        "Kukatpally Store",

      previousScore:
        69.64,

      newLocationCode:
        workloadPercent >= 90
          ? "WH-01"
          : locationCode,

      newLocationName:
        workloadPercent >= 90
          ? "Central Fulfillment Warehouse"
          : "Kukatpally Store",

      newScore:
        workloadPercent >= 90
          ? 67
          : 69.64,

      recommendationChanged:
        workloadPercent >= 90,
    });
  }

  async function handleStock(
    productId: string,
    locationCode: string,
    availableQuantity: number,
    reservedQuantity: number,
    reorderLevel: number,
    update: SimulationUpdate
  ): Promise<void> {
    console.log({
      productId,
      locationCode,
      availableQuantity,
      reservedQuantity,
      reorderLevel,
    });

    setSimulationChange({
      title:
        update.title,

      cause:
        update.cause,

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
    });
  }

  async function handleAskAi(
    request: ExplainDecisionRequest
  ): Promise<ExplainDecisionResponse> {
    return {
      explanation:
        request.deterministicExplanation,

      primaryReason:
        "Kukatpally Store achieved the highest deterministic score.",

      supportingReasons: [
        "Complete basket was available.",
        "Workload was 25%.",
        "Remaining capacity was 90.",
      ],

      answer:
        "Hitech City Store was closer, but its high workload and lower remaining capacity reduced its total score.",

      aiUsed:
        true,

      fallbackUsed:
        false,

      provider:
        "Azure OpenAI",

      model:
        "fulfilliq-gpt5-mini",

      generatedAtUtc:
        new Date().toISOString(),

      durationMilliseconds:
        1875,
    };
  }

  return (
    <main className="manager-mfe-preview">
      <header>
        <span>
          FulfillIQ Micro-Frontend
        </span>

        <h1>
          Manager MFE
        </h1>

        <p>
          Independent preview of manager
          simulations and AI explanation UI.
        </p>
      </header>

      <ManagerWorkspaceRemote
        decision={
          previewDecision
        }
        simulationChange={
          simulationChange
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
          handleWorkload
        }
        onUpdateStock={
          handleStock
        }
        onAskAi={
          handleAskAi
        }
        onDismissChange={
          () =>
            setSimulationChange(
              null
            )
        }
      />
    </main>
  );
}

export default App;