import type {
  CandidateScore,
  FulfillmentDecision,
} from "./fulfillment";

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

export function createAiRequest(
  decision: FulfillmentDecision,
  question: string
): ExplainDecisionRequest {
  return {
    orderReference:
      decision.orderReference,

    recommendedLocationCode:
      decision.recommendedLocationCode,

    recommendedLocationName:
      decision.recommendedLocationName,

    winningScore:
      decision.winningScore,

    deterministicExplanation:
      decision.explanation,

    question:
      question.trim() || null,

    candidates:
      decision.candidates,
  };
}