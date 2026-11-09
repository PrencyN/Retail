import type { CandidateScore } from "../types/fulfillment";
import ScoreBreakdown from "./ScoreBreakdown";

type Props = {
  candidate: CandidateScore;
  recommended: boolean;
};

function CandidateLocationCard({
  candidate,
  recommended,
}: Props) {
  return (
    <article
      className={[
        "candidate-card",
        recommended ? "recommended" : "",
        !candidate.eligible ? "candidate-ineligible" : "",
      ].join(" ")}
    >
      <div className="candidate-heading">
        <div>
          <span className="location-code">
            {candidate.locationCode}
          </span>

          <h3>{candidate.locationName}</h3>
        </div>

        {recommended && (
          <span className="recommended-badge">
            Recommended
          </span>
        )}

        {!candidate.eligible && (
          <span className="ineligible-badge">
            Ineligible
          </span>
        )}
      </div>

      <div className="candidate-metrics">
        <div>
          <span>Rank</span>
          <strong>
            {candidate.eligible
              ? `#${candidate.rank}`
              : "N/A"}
          </strong>
        </div>

        <div>
          <span>Distance</span>
          <strong>{candidate.distanceKm} km</strong>
        </div>

        <div>
          <span>Workload</span>
          <strong>
            {candidate.workloadPercent}%
          </strong>
        </div>

        <div>
          <span>Capacity left</span>
          <strong>
            {candidate.remainingCapacity}
          </strong>
        </div>

        <div>
          <span>Complete basket</span>

          <strong>
            {candidate.completeBasket ? "Yes" : "No"}
          </strong>
        </div>
      </div>

      <ScoreBreakdown candidate={candidate} />
    </article>
  );
}

export default CandidateLocationCard;