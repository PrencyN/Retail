import type {
  CandidateScore,
  FulfillmentDecision,
} from "../types/fulfillment";

export const hyd03Candidate:
  CandidateScore = {
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
  };

export const warehouseCandidate:
  CandidateScore = {
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
  };

export const hyd02Candidate:
  CandidateScore = {
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
  };

export const hyd01IneligibleCandidate:
  CandidateScore = {
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
      "Incomplete basket. 1 product(s) have insufficient stock.",

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
  };

export const fulfilledDecision:
  FulfillmentDecision = {
    decisionId:
      "decision-test-001",

    orderReference:
      "SYN-1001",

    calculatedAtUtc:
      "2026-11-09T05:00:00Z",

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
      hyd03Candidate,
      warehouseCandidate,
      hyd02Candidate,
      hyd01IneligibleCandidate,
    ],
  };

export const warehouseDecision:
  FulfillmentDecision = {
    ...fulfilledDecision,

    decisionId:
      "decision-test-002",

    recommendedLocationCode:
      "WH-01",

    recommendedLocationName:
      "Central Fulfillment Warehouse",

    winningScore:
      67,

    explanation:
      "Central Fulfillment Warehouse was selected after " +
      "Kukatpally Store workload increased.",

    candidates: [
      {
        ...warehouseCandidate,

        rank:
          1,
      },

      {
        ...hyd02Candidate,

        rank:
          2,
      },

      {
        ...hyd03Candidate,

        rank:
          3,

        workloadPercent:
          95,

        currentOrders:
          114,

        remainingCapacity:
          6,

        workloadScore:
          5,

        capacityScore:
          3.33,

        totalScore:
          48.64,
      },

      hyd01IneligibleCandidate,
    ],
  };

export const noRecommendationDecision:
  FulfillmentDecision = {
    ...fulfilledDecision,

    decisionId:
      "decision-test-003",

    hasRecommendation:
      false,

    recommendedLocationCode:
      null,

    recommendedLocationName:
      null,

    winningScore:
      null,

    explanation:
      "No single fulfillment location can supply " +
      "the complete order basket.",

    candidates: [
      hyd01IneligibleCandidate,
    ],
  };