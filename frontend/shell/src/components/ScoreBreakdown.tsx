import type { CandidateScore } from "../types/fulfillment";

type Props = {
  candidate: CandidateScore;
};

function ScoreBreakdown({ candidate }: Props) {
  if (!candidate.eligible) {
    return (
      <div className="score-breakdown ineligible">
        <strong>Ineligible</strong>

        <p>{candidate.reason}</p>
      </div>
    );
  }

  return (
    <div className="score-breakdown">
      <div>
        <span>Inventory</span>
        <strong>{candidate.inventoryScore.toFixed(2)}</strong>
      </div>

      <div>
        <span>Distance</span>
        <strong>{candidate.distanceScore.toFixed(2)}</strong>
      </div>

      <div>
        <span>Workload</span>
        <strong>{candidate.workloadScore.toFixed(2)}</strong>
      </div>

      <div>
        <span>Capacity</span>
        <strong>{candidate.capacityScore.toFixed(2)}</strong>
      </div>

      <div className="total-score">
        <span>Total</span>
        <strong>{candidate.totalScore.toFixed(2)}</strong>
      </div>
    </div>
  );
}

export default ScoreBreakdown;