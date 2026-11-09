import {
  useEffect,
  useState,
} from "react";

import {
  explainDecision,
} from "../services/aiApi";

import {
  createAiRequest,
  type ExplainDecisionResponse,
} from "../types/ai";

import type {
  FulfillmentDecision,
} from "../types/fulfillment";

type Props = {
  decision: FulfillmentDecision;
};

const suggestedQuestions = [
  "Why was the nearest store not selected?",
  "Why is HYD-01 ineligible?",
  "Which factor influenced the result most?",
  "Why did the recommendation change?",
  "What would make Kukatpally win again?",
];

function AiAssistant({
  decision,
}: Props) {
  const [question, setQuestion] =
    useState(
      suggestedQuestions[0]
    );

  const [
    aiResponse,
    setAiResponse,
  ] =
    useState<ExplainDecisionResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * A changed fulfillment decision invalidates
   * the previous AI explanation.
   */
  useEffect(() => {
    setAiResponse(null);
    setError("");
  }, [decision.decisionId]);

  async function handleAsk() {
    const normalizedQuestion =
      question.trim();

    if (!normalizedQuestion) {
      setError(
        "Enter a manager question."
      );

      return;
    }

    if (
      normalizedQuestion.length >
      500
    ) {
      setError(
        "Question cannot exceed 500 characters."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await explainDecision(
          createAiRequest(
            decision,
            normalizedQuestion
          )
        );

      setAiResponse(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate AI explanation."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-assistant">
      <div className="ai-heading">
        <div className="ai-icon">
          AI
        </div>

        <div>
          <span className="section-label">
            Decision Intelligence
          </span>

          <h2>
            Ask FulfillIQ AI
          </h2>

          <p>
            Ask questions about the current
            deterministic fulfillment decision.
            Azure AI explains the result but never
            changes the winner.
          </p>
        </div>
      </div>

      <div className="ai-boundary">
        <strong>
          Deterministic decision authority
        </strong>

        <span>
          Winner:
          {" "}
          {decision
            .recommendedLocationCode ??
            "None"}
          {" · "}
          Score:
          {" "}
          {decision.winningScore
            ?.toFixed(2) ??
            "N/A"}
        </span>
      </div>

      <div className="suggested-questions">
        {suggestedQuestions.map(
          suggestedQuestion => (
            <button
              key={suggestedQuestion}
              type="button"
              onClick={() => {
                setQuestion(
                  suggestedQuestion
                );

                setError("");
              }}
            >
              {suggestedQuestion}
            </button>
          )
        )}
      </div>

      <label
        htmlFor="ai-question"
      >
        Manager question
      </label>

      <textarea
        id="ai-question"
        rows={4}
        maxLength={500}
        value={question}
        placeholder=
          "Ask why a location won, why another was rejected, or which factor mattered most..."
        onChange={event => {
          setQuestion(
            event.target.value
          );

          setError("");
        }}
      />

      <div className="ai-actions">
        <span>
          {question.length} / 500
        </span>

        <button
          type="button"
          className="primary-button"
          disabled={
            loading ||
            !question.trim()
          }
          onClick={handleAsk}
        >
          {loading
            ? "Asking Azure AI..."
            : "Ask AI"}
        </button>
      </div>

      {error && (
        <div className="ai-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="ai-loading">
          <div className="spinner" />

          <span>
            Grounding explanation in the
            current fulfillment decision...
          </span>
        </div>
      )}

      {!loading &&
        aiResponse && (
        <div className="ai-response">
          <div className="ai-response-status">
            <div>
              <span
                className={
                  aiResponse.aiUsed
                    ? "ai-status-live"
                    : "ai-status-fallback"
                }
              >
                {aiResponse.aiUsed
                  ? "Azure AI"
                  : "Deterministic fallback"}
              </span>

              {aiResponse.fallbackUsed && (
                <span className="fallback-badge">
                  Fallback active
                </span>
              )}
            </div>

            <small>
              {aiResponse.provider}

              {aiResponse.model !==
                "none" &&
                ` · ${aiResponse.model}`}

              {" · "}

              {(
                aiResponse
                  .durationMilliseconds /
                1000
              ).toFixed(1)}
              s
            </small>
          </div>

          <div className="ai-answer">
            <span className="ai-answer-label">
              Answer
            </span>

            <p>
              {aiResponse.answer ??
                aiResponse.explanation}
            </p>
          </div>

          <div className="ai-primary-reason">
            <span>
              Primary reason
            </span>

            <strong>
              {
                aiResponse
                  .primaryReason
              }
            </strong>
          </div>

          {aiResponse
            .supportingReasons
            .length > 0 && (
            <div className="ai-evidence">
              <span>
                Supporting evidence
              </span>

              <ul>
                {aiResponse
                  .supportingReasons
                  .map(
                    (
                      reason,
                      index
                    ) => (
                      <li
                        key={`${index}-${reason}`}
                      >
                        {reason}
                      </li>
                    )
                  )}
              </ul>
            </div>
          )}

          <details className="ai-details">
            <summary>
              Deterministic explanation
            </summary>

            <p>
              {
                aiResponse
                  .explanation
              }
            </p>
          </details>
        </div>
      )}
    </section>
  );
}

export default AiAssistant;