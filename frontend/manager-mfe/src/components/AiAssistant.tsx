import {
  useState,
} from "react";

import type {
  AskAiHandler,
  ExplainDecisionRequest,
  ExplainDecisionResponse,
  FulfillmentDecision,
} from "../types/manager";

type Props = {
  decision: FulfillmentDecision;

  onAskAi: AskAiHandler;
};

const suggestedQuestions = [
  "Why was the nearest store not selected?",
  "Why is HYD-01 ineligible?",
  "Which factor influenced the result most?",
  "Why did the recommendation change?",
];

function createAiRequest(
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
      question.trim() ||
      null,

    candidates:
      decision.candidates,
  };
}

function AiAssistant({
  decision,
  onAskAi,
}: Props) {
  const [
    question,
    setQuestion,
  ] =
    useState(
      suggestedQuestions[0]
    );

  const [
    response,
    setResponse,
  ] =
    useState<
      ExplainDecisionResponse |
      null
    >(
      null
    );

  const [
    responseDecisionId,
    setResponseDecisionId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const currentResponse =
    responseDecisionId ===
    decision.decisionId
      ? response
      : null;

  async function handleAsk():
    Promise<void> {
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
      setLoading(
        true
      );

      setError(
        ""
      );

      const result =
        await onAskAi(
          createAiRequest(
            decision,
            normalizedQuestion
          )
        );

      setResponse(
        result
      );

      setResponseDecisionId(
        decision.decisionId
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate AI explanation."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <section className="manager-ai-card">
      <div className="manager-card-heading">
        <div>
          <span className="manager-section-label">
            Decision Intelligence
          </span>

          <h2>
            Ask FulfillIQ AI
          </h2>

          <p className="manager-card-description">
            Azure AI explains the deterministic
            result but never changes the winner.
          </p>
        </div>

        <span className="manager-code-badge">
          manager-mfe
        </span>
      </div>

      <div className="manager-ai-boundary">
        <strong>
          Deterministic authority
        </strong>

        <span>
          Winner:
          {" "}
          {decision.recommendedLocationCode ??
            "None"}
          {" · "}
          Score:
          {" "}
          {decision.winningScore
            ?.toFixed(
              2
            ) ??
            "N/A"}
        </span>
      </div>

      <div className="manager-suggested-questions">
        {suggestedQuestions.map(
          suggestedQuestion => (
            <button
              key={
                suggestedQuestion
              }
              type="button"
              onClick={
                () => {
                  setQuestion(
                    suggestedQuestion
                  );

                  setError(
                    ""
                  );
                }
              }
            >
              {suggestedQuestion}
            </button>
          )
        )}
      </div>

      <label
        htmlFor="manager-ai-question"
      >
        Manager question
      </label>

      <textarea
        id="manager-ai-question"
        rows={4}
        maxLength={500}
        value={question}
        onChange={
          event => {
            setQuestion(
              event.target.value
            );

            setError(
              ""
            );
          }
        }
      />

      <div className="manager-ai-actions">
        <span>
          {question.length} / 500
        </span>

        <button
          type="button"
          className="manager-primary-button"
          disabled={
            loading ||
            !question.trim()
          }
          onClick={
            handleAsk
          }
        >
          {loading
            ? "Asking Azure AI..."
            : "Ask AI"}
        </button>
      </div>

      {error && (
        <div
          className="manager-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="manager-ai-loading">
          <div className="manager-spinner" />

          <span>
            Grounding the explanation in the
            current fulfillment decision...
          </span>
        </div>
      )}

      {!loading &&
        currentResponse && (
        <div className="manager-ai-response">
          <div className="manager-ai-status-row">
            <div>
              <span
                className={
                  currentResponse.aiUsed
                    ? "manager-live-badge"
                    : "manager-fallback-badge"
                }
              >
                {currentResponse.aiUsed
                  ? "Azure AI"
                  : "Deterministic fallback"}
              </span>

              {currentResponse.fallbackUsed && (
                <span className="manager-fallback-badge">
                  Fallback active
                </span>
              )}
            </div>

            <small>
              {currentResponse.provider}

              {currentResponse.model !==
                "none" &&
                ` · ${currentResponse.model}`}

              {" · "}

              {(
                currentResponse
                  .durationMilliseconds /
                1000
              ).toFixed(
                1
              )}
              s
            </small>
          </div>

          <div className="manager-ai-answer">
            <span>
              Answer
            </span>

            <p>
              {currentResponse.answer ??
                currentResponse.explanation}
            </p>
          </div>

          <div className="manager-ai-primary-reason">
            <span>
              Primary reason
            </span>

            <strong>
              {currentResponse.primaryReason}
            </strong>
          </div>

          {currentResponse
            .supportingReasons
            .length > 0 && (
            <div className="manager-ai-evidence">
              <span>
                Supporting evidence
              </span>

              <ul>
                {currentResponse
                  .supportingReasons
                  .map(
                    (
                      reason,
                      index
                    ) => (
                      <li
                        key={
                          `${index}-${reason}`
                        }
                      >
                        {reason}
                      </li>
                    )
                  )}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AiAssistant;