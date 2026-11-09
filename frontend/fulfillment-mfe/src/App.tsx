import FulfillmentAnalysisRemote
  from "./FulfillmentAnalysisRemote";

import type {
  FulfillmentDecision,
} from "./types/fulfillment";

import "./App.css";

const previewDecision:
  FulfillmentDecision = {
    decisionId:
      "fulfillment-preview-001",

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
      "Kukatpally Store was selected because it provides " +
      "the best overall balance of inventory availability, " +
      "distance, workload and capacity.",

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

      {
        rank:
          3,

        locationCode:
          "HYD-02",

        locationName:
          "Hitech City Store",

        completeBasket:
          true,

        eligible:
          true,

        reason:
          "Complete basket available.",

        missingProductIds:
          [],

        distanceKm:
          5,

        workloadPercent:
          85,

        dailyCapacity:
          80,

        currentOrders:
          68,

        remainingCapacity:
          12,

        inventoryScore:
          100,

        distanceScore:
          64.29,

        workloadScore:
          15,

        capacityScore:
          6.67,

        totalScore:
          60.07,
      },

      {
        rank:
          0,

        locationCode:
          "HYD-01",

        locationName:
          "Hyderabad Central Store",

        completeBasket:
          false,

        eligible:
          false,

        reason:
          "Incomplete basket. 1 product has insufficient stock.",

        missingProductIds: [
          "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99",
        ],

        distanceKm:
          8,

        workloadPercent:
          60,

        dailyCapacity:
          100,

        currentOrders:
          60,

        remainingCapacity:
          40,

        inventoryScore:
          0,

        distanceScore:
          0,

        workloadScore:
          0,

        capacityScore:
          0,

        totalScore:
          0,
      },
    ],
  };

function App() {
  return (
    <main className="fulfillment-mfe-preview">
      <header>
        <span>
          FulfillIQ Micro-Frontend
        </span>

        <h1>
          Fulfillment MFE
        </h1>

        <p>
          Independent preview of the federated
          recommendation and candidate analysis.
        </p>
      </header>

      <FulfillmentAnalysisRemote
        decision={
          previewDecision
        }
      />
    </main>
  );
}

export default App;