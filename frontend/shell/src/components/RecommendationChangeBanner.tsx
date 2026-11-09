export type SimulationChange = {
  title: string;
  cause: string;

  previousLocationCode: string | null;
  previousLocationName: string | null;
  previousScore: number | null;

  newLocationCode: string | null;
  newLocationName: string | null;
  newScore: number | null;

  recommendationChanged: boolean;
};

type Props = {
  change: SimulationChange;
  onDismiss: () => void;
};

function RecommendationChangeBanner({
  change,
  onDismiss,
}: Props) {
  return (
    <section
      className={[
        "change-banner",
        change.recommendationChanged
          ? "changed"
          : "unchanged",
      ].join(" ")}
    >
      <div className="change-banner-header">
        <div>
          <span className="change-icon">
            {change.recommendationChanged
              ? "⚡"
              : "✓"}
          </span>

          <div>
            <h2>
              {change.recommendationChanged
                ? "Recommendation Changed"
                : change.title}
            </h2>

            <p>{change.cause}</p>
          </div>
        </div>

        <button
          type="button"
          className="dismiss-button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>

      {change.recommendationChanged && (
        <div className="change-comparison">
          <div className="change-location">
            <span>Previous</span>

            <strong>
              {change.previousLocationName ??
                "No recommendation"}
            </strong>

            <small>
              {change.previousLocationCode ?? ""}
            </small>

            {change.previousScore !== null && (
              <b>
                {change.previousScore.toFixed(2)}
              </b>
            )}
          </div>

          <div className="change-arrow">
            →
          </div>

          <div className="change-location new">
            <span>New</span>

            <strong>
              {change.newLocationName ??
                "No recommendation"}
            </strong>

            <small>
              {change.newLocationCode ?? ""}
            </small>

            {change.newScore !== null && (
              <b>{change.newScore.toFixed(2)}</b>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default RecommendationChangeBanner;