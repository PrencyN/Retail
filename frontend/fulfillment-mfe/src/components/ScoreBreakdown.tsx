import type {
  CandidateScore,
} from "../types/fulfillment";

type Props = {
  candidate: CandidateScore;
};

type ScoreItem = {
  label: string;

  value: number;

  weight: string;
};

function ScoreBreakdown({
  candidate,
}: Props) {
  if (!candidate.eligible) {
    return (
      <div className="remote-ineligible-score">
        <strong>
          Ineligible
        </strong>

        <p>
          {candidate.reason}
        </p>
      </div>
    );
  }

  const scoreItems:
    ScoreItem[] = [
      {
        label:
          "Inventory",

        value:
          candidate.inventoryScore,

        weight:
          "40%",
      },

      {
        label:
          "Distance",

        value:
          candidate.distanceScore,

        weight:
          "25%",
      },

      {
        label:
          "Workload",

        value:
          candidate.workloadScore,

        weight:
          "20%",
      },

      {
        label:
          "Capacity",

        value:
          candidate.capacityScore,

        weight:
          "15%",
      },
    ];

  return (
    <div className="remote-score-breakdown">
      <div className="remote-score-grid">
        {scoreItems.map(
          item => (
            <div
              key={
                item.label
              }
              className="remote-score-item"
            >
              <span>
                {item.label}
              </span>

              <strong>
                {item.value.toFixed(
                  2
                )}
              </strong>

              <small>
                Weight {item.weight}
              </small>
            </div>
          )
        )}
      </div>

      <div className="remote-total-score">
        <span>
          Total
        </span>

        <strong>
          {candidate.totalScore.toFixed(
            2
          )}
        </strong>
      </div>
    </div>
  );
}

export default ScoreBreakdown;