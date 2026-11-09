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
        method: "POST",
      }
    );

  if (!response.ok) {
    let message =
      "Unable to calculate fulfillment.";

    try {
      const body =
        await response.json();

      message =
        body.message ??
        body.detail ??
        body.title ??
        message;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}