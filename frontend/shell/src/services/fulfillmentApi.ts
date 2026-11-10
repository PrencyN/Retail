import {
  authenticatedFetch,
} from "./authenticatedFetch";

import type {
  FulfillmentDecision,
} from "../types/fulfillment";

const FULFILLMENT_API =
  import.meta.env
    .VITE_FULFILLMENT_API_URL ??
  "http://localhost:5249";

type FulfillmentDecisionResponse = {
  decisionId: string;

  authoritative: boolean;

  source: string;

  calculatedAtUtc: string;

  result: FulfillmentDecision;
};

function isFulfillmentDecision(
  value: unknown
): value is FulfillmentDecision {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const decision =
    value as Partial<FulfillmentDecision>;

  return (
    typeof decision.decisionId ===
      "string" &&
    typeof decision.orderReference ===
      "string" &&
    typeof decision.calculatedAtUtc ===
      "string" &&
    typeof decision.hasRecommendation ===
      "boolean" &&
    typeof decision.explanation ===
      "string" &&
    Array.isArray(
      decision.candidates
    )
  );
}

function isDecisionResponse(
  value: unknown
): value is FulfillmentDecisionResponse {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const response =
    value as Partial<
      FulfillmentDecisionResponse
    >;

  return (
    typeof response.decisionId ===
      "string" &&
    typeof response.authoritative ===
      "boolean" &&
    typeof response.source ===
      "string" &&
    typeof response.calculatedAtUtc ===
      "string" &&
    isFulfillmentDecision(
      response.result
    )
  );
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  const defaultMessage =
    "Unable to calculate fulfillment.";

  try {
    const body =
      (await response.json()) as {
        message?: unknown;
        detail?: unknown;
        title?: unknown;
      };

    if (
      typeof body.message ===
        "string" &&
      body.message.trim()
    ) {
      return body.message;
    }

    if (
      typeof body.detail ===
        "string" &&
      body.detail.trim()
    ) {
      return body.detail;
    }

    if (
      typeof body.title ===
        "string" &&
      body.title.trim()
    ) {
      return body.title;
    }
  } catch {
    // Preserve the safe default message.
  }

  return defaultMessage;
}

export async function calculateFulfillment(
  orderReference: string
): Promise<FulfillmentDecision> {
  const normalizedReference =
    orderReference
      .trim()
      .toUpperCase();

  if (!normalizedReference) {
    throw new Error(
      "Order reference is required."
    );
  }

  const response =
    await authenticatedFetch(
      `${FULFILLMENT_API}/api/fulfillment/orders/${encodeURIComponent(
        normalizedReference
      )}/calculate`,
      {
        method:
          "POST",
      }
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  const body: unknown =
    await response.json();

  /*
   * Current authoritative FulfillmentService contract:
   *
   * {
   *   decisionId,
   *   authoritative,
   *   source,
   *   calculatedAtUtc,
   *   result: FulfillmentDecision
   * }
   */
  if (
    isDecisionResponse(
      body
    )
  ) {
    if (!body.authoritative) {
      throw new Error(
        "FulfillmentService returned a non-authoritative decision from the authoritative endpoint."
      );
    }

    return body.result;
  }

  /*
   * Backward-compatible support for the original API
   * contract while local services transition together.
   *
   * This can be removed later after every environment
   * uses the wrapped authoritative response.
   */
  if (
    isFulfillmentDecision(
      body
    )
  ) {
    return body;
  }

  throw new Error(
    "FulfillmentService returned an invalid decision response."
  );
}