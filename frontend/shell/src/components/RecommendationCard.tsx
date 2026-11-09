import type { FulfillmentDecision } from "../types/fulfillment";

type Props = {
  decision: FulfillmentDecision;
};

function RecommendationCard({ decision }: Props) {
  if (!decision.hasRecommendation) {
    return (
      <section className="recommendation-card no-recommendation">
        <h2>No Fulfillment Location Available</h2>

        <p>{decision.explanation}</p>
      </section>
    );
  }

  return (
    <section className="recommendation-card">
      <div className="recommendation-label">
        Recommended Fulfillment Location
      </div>

      <h2>
        {decision.recommendedLocationName}
      </h2>

      <div className="recommendation-code">
        {decision.recommendedLocationCode}
      </div>

      <div className="winning-score">
        {decision.winningScore?.toFixed(2)}
        <span> / 100</span>
      </div>

      <div className="why-box">
        <strong>Why this location?</strong>

        <p>{decision.explanation}</p>
      </div>
    </section>
  );
}

export default RecommendationCard;
