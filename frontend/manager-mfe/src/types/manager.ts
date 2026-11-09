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

export type SimulationUpdate = {
  title: string;

  cause: string;
};

export type SimulationChange = {
  title: string;

  cause: string;

  previousLocationCode: string | null;

  previousLocationName: string | null;

  previousScore: number | null;

  newLocationCode: string | null;

  newLocationName: string | null;

  newScore: number | null;

  recommendationChanged: boolean;
};

export type ExplainDecisionRequest = {
  orderReference: string;

  recommendedLocationCode: string | null;

  recommendedLocationName: string | null;

  winningScore: number | null;

  deterministicExplanation: string;

  question: string | null;

  candidates: CandidateScore[];
};

export type ExplainDecisionResponse = {
  explanation: string;

  primaryReason: string;

  supportingReasons: string[];

  answer: string | null;

  aiUsed: boolean;

  fallbackUsed: boolean;

  provider: string;

  model: string;

  generatedAtUtc: string;

  durationMilliseconds: number;
};

export type UpdateWorkloadHandler = (
  locationCode: string,
  workloadPercent: number,
  update: SimulationUpdate
) => Promise<void>;

export type UpdateStockHandler = (
  productId: string,
  locationCode: string,
  availableQuantity: number,
  reservedQuantity: number,
  reorderLevel: number,
  update: SimulationUpdate
) => Promise<void>;

export type AskAiHandler = (
  request: ExplainDecisionRequest
) => Promise<ExplainDecisionResponse>;