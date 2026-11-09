import ScoreBreakdown
  from "./ScoreBreakdown";

import type {
  CandidateScore,
} from "../types/fulfillment";

type Props = {
  candidate: CandidateScore;

  recommended: boolean;
};

function CandidateLocationCard({
  candidate,
  recommended,
}: Props) {
  const rankText =
    candidate.eligible &&
    candidate.rank > 0
      ? `#${candidate.rank}`
      : "N/A";

  return (
    <article
      className={[
        "remote-candidate-card",

        recommended
          ? "remote-candidate-recommended"
          : "",

        !candidate.eligible
          ? "remote-candidate-ineligible"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="remote-candidate-top">
        <div>
          <div className="remote-candidate-badges">
            <span className="remote-location-code">
              {candidate.locationCode}
            </span>

            <span className="remote-rank-badge">
              {rankText}
            </span>

            {recommended && (
              <span className="remote-recommended-badge">
                Recommended
              </span>
            )}

            {!candidate.eligible && (
              <span className="remote-ineligible-badge">
                Ineligible
              </span>
            )}
          </div>

          <h3>
            {candidate.locationName}
          </h3>
        </div>

        {candidate.eligible && (
          <div className="remote-score-circle">
            <strong>
              {candidate.totalScore.toFixed(
                2
              )}
            </strong>

            <span>
              score
            </span>
          </div>
        )}
      </div>

      <div className="remote-candidate-metrics">
        <div>
          <span>
            Distance
          </span>

          <strong>
            {candidate.distanceKm} km
          </strong>
        </div>

        <div>
          <span>
            Workload
          </span>

          <strong>
            {candidate.workloadPercent}%
          </strong>
        </div>

        <div>
          <span>
            Remaining Capacity
          </span>

          <strong>
            {candidate.remainingCapacity}
          </strong>
        </div>

        <div>
          <span>
            Complete Basket
          </span>

          <strong>
            {candidate.completeBasket
              ? "Yes"
              : "No"}
          </strong>
        </div>
      </div>

      <div className="remote-candidate-reason">
        <span>
          Decision reason
        </span>

        <p>
          {candidate.reason}
        </p>
      </div>

      <ScoreBreakdown
        candidate={
          candidate
        }
      />
    </article>
  );
}

export default CandidateLocationCard;