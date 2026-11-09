import {
  authenticatedFetch,
} from "./authenticatedFetch";

import type {
  ExplainDecisionRequest,
  ExplainDecisionResponse,
} from "../types/ai";

const AI_API =
  import.meta.env
    .VITE_AI_API_URL ??
  "http://localhost:5143";

export async function explainDecision(
  request: ExplainDecisionRequest
): Promise<ExplainDecisionResponse> {
  const response =
    await authenticatedFetch(
      `${AI_API}/api/ai/explain`,
      {
        method:
          "POST",

        body:
          JSON.stringify(
            request
          ),
      }
    );

  if (!response.ok) {
    let message =
      "Unable to generate AI explanation.";

    try {
      const body =
        await response.json();

      message =
        body.message ??
        body.detail ??
        body.title ??
        message;
    } catch {
      // Retain the default message.
    }

    throw new Error(
      message
    );
  }

  return response.json();
}