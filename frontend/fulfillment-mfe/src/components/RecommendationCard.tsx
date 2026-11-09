import type {
  FulfillmentDecision,
} from "../types/fulfillment";

type Props = {
  decision: FulfillmentDecision;
};

function RecommendationCard({
  decision,
}: Props) {
  if (
    !decision.hasRecommendation ||
    !decision.recommendedLocationCode ||
    !decision.recommendedLocationName ||
    decision.winningScore === null
  ) {
    return (
      <section className="remote-no-recommendation-card">
        <span className="remote-section-label">
          Fulfillment Decision
        </span>

        <h2>
          No fulfillment location available
        </h2>

        <p>
          {decision.explanation}
        </p>
      </section>
    );
  }

  return (
    <section className="remote-recommendation-card">
      <div className="remote-recommendation-content">
        <span className="remote-section-label">
          Recommended Fulfillment Location
        </span>

        <h2>
          {decision.recommendedLocationName}
        </h2>

        <div className="remote-recommendation-code">
          {decision.recommendedLocationCode}
        </div>

        <p>
          {decision.explanation}
        </p>
      </div>

      <div className="remote-winning-score">
        <span>
          Winning Score
        </span>

        <strong>
          {decision.winningScore.toFixed(
            2
          )}
        </strong>

        <small>
          Deterministic result
        </small>
      </div>
    </section>
  );
}

export default RecommendationCard;