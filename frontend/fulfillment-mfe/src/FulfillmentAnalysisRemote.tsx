import CandidateLocationCard
  from "./components/CandidateLocationCard";

import RecommendationCard
  from "./components/RecommendationCard";

import type {
  FulfillmentDecision,
} from "./types/fulfillment";

import "./fulfillment-analysis.css";

export type FulfillmentAnalysisRemoteProps = {
  decision: FulfillmentDecision;
};

function FulfillmentAnalysisRemote({
  decision,
}: FulfillmentAnalysisRemoteProps) {
  return (
    <div className="remote-fulfillment-analysis">
      <div className="remote-domain-badge">
        fulfillment-mfe
      </div>

      <RecommendationCard
        decision={
          decision
        }
      />

      <section className="remote-candidate-section">
        <div className="remote-section-heading">
          <div>
            <span className="remote-section-label">
              Fulfillment Analysis
            </span>

            <h2>
              Candidate Locations
            </h2>
          </div>

          <span className="remote-evaluated-count">
            {
              decision
                .candidates
                .length
            }
            {" "}
            locations evaluated
          </span>
        </div>

        <div className="remote-candidate-grid">
          {decision
            .candidates
            .map(
              candidate => (
                <CandidateLocationCard
                  key={
                    candidate.locationCode
                  }
                  candidate={
                    candidate
                  }
                  recommended={
                    candidate.locationCode ===
                    decision.recommendedLocationCode
                  }
                />
              )
            )}
        </div>
      </section>
    </div>
  );
}

export default FulfillmentAnalysisRemote;