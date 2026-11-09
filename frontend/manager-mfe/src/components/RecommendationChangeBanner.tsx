import type {
  SimulationChange,
} from "../types/manager";

type Props = {
  change: SimulationChange;

  onDismiss: () => void;
};

function formatScore(
  score: number | null
): string {
  return score === null
    ? "N/A"
    : score.toFixed(
        2
      );
}

function RecommendationChangeBanner({
  change,
  onDismiss,
}: Props) {
  return (
    <section
      className={[
        "manager-change-banner",

        change.recommendationChanged
          ? "manager-change-success"
          : "manager-change-neutral",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
    >
      <div className="manager-change-header">
        <div>
          <span className="manager-section-label">
            What-If Result
          </span>

          <h2>
            {change.recommendationChanged
              ? "Recommendation Changed"
              : change.title}
          </h2>
        </div>

        <button
          type="button"
          className="manager-dismiss-button"
          aria-label="Dismiss notification"
          onClick={
            onDismiss
          }
        >
          ×
        </button>
      </div>

      <p>
        {change.cause}
      </p>

      {change.recommendationChanged && (
        <div className="manager-change-comparison">
          <div>
            <span>
              Previous
            </span>

            <strong>
              {change.previousLocationName ??
                "No recommendation"}
            </strong>

            <small>
              {change.previousLocationCode ??
                "N/A"}
              {" · "}
              {formatScore(
                change.previousScore
              )}
            </small>
          </div>

          <div
            className="manager-change-arrow"
            aria-hidden="true"
          >
            →
          </div>

          <div>
            <span>
              New
            </span>

            <strong>
              {change.newLocationName ??
                "No recommendation"}
            </strong>

            <small>
              {change.newLocationCode ??
                "N/A"}
              {" · "}
              {formatScore(
                change.newScore
              )}
            </small>
          </div>
        </div>
      )}
    </section>
  );
}

export default RecommendationChangeBanner;