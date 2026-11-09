export type CandidateScore = {
  rank: number;

  locationCode: string;

  locationName: string;

  completeBasket: boolean;

  eligible: boolean;

  reason: string;

  missingProductIds: string[];

  distanceKm: number;

  workloadPercent: number;

  dailyCapacity: number;

  currentOrders: number;

  remainingCapacity: number;

  inventoryScore: number;

  distanceScore: number;

  workloadScore: number;

  capacityScore: number;

  totalScore: number;
};

export type RoutingPolicy = {
  inventoryWeight: number;

  distanceWeight: number;

  workloadWeight: number;

  capacityWeight: number;

  totalWeight: number;
};

export type FulfillmentDecision = {
  decisionId: string;

  orderReference: string;

  calculatedAtUtc: string;

  hasRecommendation: boolean;

  recommendedLocationCode: string | null;

  recommendedLocationName: string | null;

  winningScore: number | null;

  explanation: string;

  policy: RoutingPolicy;

  candidates: CandidateScore[];
};