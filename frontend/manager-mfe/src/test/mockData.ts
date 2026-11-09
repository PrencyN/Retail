import type {
  ExplainDecisionResponse,
  FulfillmentDecision,
  SimulationChange,
} from "../types/manager";

export const fulfilledDecision:
  FulfillmentDecision = {
    decisionId:
      "manager-test-001",

    orderReference:
      "SYN-1001",

    calculatedAtUtc:
      "2026-11-09T15:00:00Z",

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
      inventoryWeight: 0.4,
      distanceWeight: 0.25,
      workloadWeight: 0.2,
      capacityWeight: 0.15,
      totalWeight: 1,
    },

    candidates: [
      {
        rank: 1,
        locationCode: "HYD-03",
        locationName: "Kukatpally Store",
        completeBasket: true,
        eligible: true,
        reason: "Complete basket available.",
        missingProductIds: [],
        distanceKm: 10,
        workloadPercent: 25,
        dailyCapacity: 120,
        currentOrders: 30,
        remainingCapacity: 90,
        inventoryScore: 100,
        distanceScore: 28.57,
        workloadScore: 75,
        capacityScore: 50,
        totalScore: 69.64,
      },

      {
        rank: 2,
        locationCode: "WH-01",
        locationName:
          "Central Fulfillment Warehouse",
        completeBasket: true,
        eligible: true,
        reason: "Complete basket available.",
        missingProductIds: [],
        distanceKm: 14,
        workloadPercent: 40,
        dailyCapacity: 300,
        currentOrders: 120,
        remainingCapacity: 180,
        inventoryScore: 100,
        distanceScore: 0,
        workloadScore: 60,
        capacityScore: 100,
        totalScore: 67,
      },
    ],
  };

export const recommendationChange:
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

export const unchangedChange:
  SimulationChange = {
    title:
      "Stock Updated",

    cause:
      "Stock values were updated.",

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

export const aiResponse:
  ExplainDecisionResponse = {
    explanation:
      "Kukatpally Store achieved the highest deterministic score.",

    primaryReason:
      "Kukatpally Store provided the best balance of workload and capacity.",

    supportingReasons: [
      "Complete basket was available.",
      "Workload was 25%.",
      "Remaining capacity was 90.",
    ],

    answer:
      "Hitech City Store was closer, but its higher workload and lower remaining capacity reduced its score.",

    aiUsed: true,
    fallbackUsed: false,
    provider: "Azure OpenAI",
    model: "fulfilliq-gpt5-mini",

    generatedAtUtc:
      "2026-11-09T15:30:00Z",

    durationMilliseconds:
      1875,
  };