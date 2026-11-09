import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AiAssistant
  from "../components/AiAssistant";

import CandidateLocationCard
  from "../components/CandidateLocationCard";

import OrderSummary
  from "../components/OrderSummary";

import RecommendationCard
  from "../components/RecommendationCard";

import RecommendationChangeBanner, {
  type SimulationChange,
} from "../components/RecommendationChangeBanner";

import StockSimulator
  from "../components/StockSimulator";

import UserMenu
  from "../components/UserMenu";

import WorkloadSimulator, {
  type SimulationUpdate,
} from "../components/WorkloadSimulator";

import {
  calculateFulfillment,
} from "../services/fulfillmentApi";

import {
  updateInventory,
  updateWorkload,
} from "../services/inventoryApi";

import type {
  FulfillmentDecision,
} from "../types/fulfillment";

const ORDER_REFERENCE =
  "SYN-1001";

const KUKATPALLY_LOCATION_CODE =
  "HYD-03";

const KUKATPALLY_DEFAULT_WORKLOAD =
  25;

const HITECH_LOCATION_CODE =
  "HYD-02";

const ELECTRONICS_PRODUCT_ID =
  "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99";

const HITECH_DEFAULT_AVAILABLE_QUANTITY =
  4;

const HITECH_DEFAULT_RESERVED_QUANTITY =
  1;

const HITECH_DEFAULT_REORDER_LEVEL =
  2;

function FulfillmentPage() {
  const [
    decision,
    setDecision,
  ] =
    useState<FulfillmentDecision | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    resetting,
    setResetting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    simulationChange,
    setSimulationChange,
  ] =
    useState<SimulationChange | null>(
      null
    );

  const [
    resetVersion,
    setResetVersion,
  ] =
    useState(0);

  const fetchDecision =
    useCallback(
      async (): Promise<FulfillmentDecision> => {
        return calculateFulfillment(
          ORDER_REFERENCE
        );
      },
      []
    );

  const loadDecision =
    useCallback(
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");

          const result =
            await fetchDecision();

          setDecision(
            result
          );
        } catch (requestError) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to calculate fulfillment."
          );
        } finally {
          setLoading(false);
        }
      },
      [fetchDecision]
    );

  async function recalculateAfterSimulation(
    update: SimulationUpdate
  ): Promise<void> {
    const previousDecision =
      decision;

    try {
      setError("");

      const newDecision =
        await fetchDecision();

      setDecision(
        newDecision
      );

      const recommendationChanged =
        previousDecision
          ?.recommendedLocationCode !==
        newDecision
          .recommendedLocationCode;

      setSimulationChange({
        title:
          update.title,

        cause:
          update.cause,

        previousLocationCode:
          previousDecision
            ?.recommendedLocationCode ??
          null,

        previousLocationName:
          previousDecision
            ?.recommendedLocationName ??
          null,

        previousScore:
          previousDecision
            ?.winningScore ??
          null,

        newLocationCode:
          newDecision
            .recommendedLocationCode,

        newLocationName:
          newDecision
            .recommendedLocationName,

        newScore:
          newDecision
            .winningScore,

        recommendationChanged,
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to recalculate fulfillment.";

      setError(
        message
      );

      throw requestError;
    }
  }

  async function resetDemo():
    Promise<void> {
    const previousDecision =
      decision;

    try {
      setResetting(true);
      setError("");

      await Promise.all([
        updateWorkload(
          KUKATPALLY_LOCATION_CODE,
          KUKATPALLY_DEFAULT_WORKLOAD
        ),

        updateInventory(
          ELECTRONICS_PRODUCT_ID,
          HITECH_LOCATION_CODE,
          HITECH_DEFAULT_AVAILABLE_QUANTITY,
          HITECH_DEFAULT_RESERVED_QUANTITY,
          HITECH_DEFAULT_REORDER_LEVEL
        ),
      ]);

      const newDecision =
        await fetchDecision();

      setDecision(
        newDecision
      );

      setResetVersion(
        currentVersion =>
          currentVersion + 1
      );

      const recommendationChanged =
        previousDecision
          ?.recommendedLocationCode !==
        newDecision
          .recommendedLocationCode;

      setSimulationChange({
        title:
          "Demo Reset",

        cause:
          "Kukatpally Store workload was restored " +
          "to 25%, and Hitech City Store electronics " +
          "inventory was restored to the original " +
          "demo values.",

        previousLocationCode:
          previousDecision
            ?.recommendedLocationCode ??
          null,

        previousLocationName:
          previousDecision
            ?.recommendedLocationName ??
          null,

        previousScore:
          previousDecision
            ?.winningScore ??
          null,

        newLocationCode:
          newDecision
            .recommendedLocationCode,

        newLocationName:
          newDecision
            .recommendedLocationName,

        newScore:
          newDecision
            .winningScore,

        recommendationChanged,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reset the demo."
      );
    } finally {
      setResetting(false);
    }
  }

  useEffect(
    () => {
      void loadDecision();
    },
    [loadDecision]
  );

  const hyd03 =
    useMemo(
      () =>
        decision
          ?.candidates
          .find(
            candidate =>
              candidate.locationCode ===
              KUKATPALLY_LOCATION_CODE
          ),
      [decision]
    );

  const busy =
    loading ||
    resetting;

  return (
    <main className="fulfillment-page">
      <header className="hero-header">
        <div>
          <span className="eyebrow">
            POD 14 · OMNICHANNEL
            FULFILLMENT
          </span>

          <h1>
            FulfillIQ
          </h1>

          <p>
            Intelligent, deterministic and
            explainable fulfillment decisions
          </p>
        </div>

        <div className="header-account-area">
          <UserMenu />

          <div className="header-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={resetDemo}
              disabled={busy}
            >
              {resetting
                ? "Resetting..."
                : "Reset Demo"}
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={
                () =>
                  void loadDecision()
              }
              disabled={busy}
            >
              {loading
                ? "Calculating..."
                : "Recalculate"}
            </button>
          </div>
        </div>
      </header>

      <OrderSummary />

      {simulationChange && (
        <RecommendationChangeBanner
          change={
            simulationChange
          }
          onDismiss={
            () =>
              setSimulationChange(
                null
              )
          }
        />
      )}

      {error && (
        <div
          className="error-banner"
          role="alert"
        >
          <strong>
            Unable to complete request
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={
              () =>
                void loadDecision()
            }
            disabled={busy}
          >
            Try again
          </button>
        </div>
      )}

      {loading &&
        !decision && (
        <div
          className="loading-card"
          aria-live="polite"
        >
          <div
            className="spinner"
            aria-hidden="true"
          />

          <p>
            Evaluating inventory,
            distance, workload and
            capacity...
          </p>
        </div>
      )}

      {decision && (
        <>
          <RecommendationCard
            decision={
              decision
            }
          />

          <section className="candidate-section">
            <div className="section-heading">
              <div>
                <span className="section-label">
                  Fulfillment Analysis
                </span>

                <h2>
                  Candidate Locations
                </h2>
              </div>

              <span className="evaluated-count">
                {
                  decision
                    .candidates
                    .length
                }
                {" "}
                locations evaluated
              </span>
            </div>

            <div className="candidate-grid">
              {decision
                .candidates
                .map(
                  candidate => (
                    <CandidateLocationCard
                      key={
                        candidate
                          .locationCode
                      }
                      candidate={
                        candidate
                      }
                      recommended={
                        candidate
                          .locationCode ===
                        decision
                          .recommendedLocationCode
                      }
                    />
                  )
                )}
            </div>
          </section>

          <section className="simulation-section">
            <div className="section-heading">
              <div>
                <span className="section-label">
                  What-If Analysis
                </span>

                <h2>
                  Fulfillment Simulator
                </h2>

                <p>
                  Change operational data and
                  immediately see how the
                  deterministic recommendation
                  responds.
                </p>
              </div>
            </div>

            <div className="simulator-grid">
              <WorkloadSimulator
                locationCode={
                  KUKATPALLY_LOCATION_CODE
                }
                locationName={
                  "Kukatpally Store"
                }
                currentWorkload={
                  hyd03
                    ?.workloadPercent ??
                  KUKATPALLY_DEFAULT_WORKLOAD
                }
                onUpdated={
                  recalculateAfterSimulation
                }
              />

              <StockSimulator
                key={
                  resetVersion
                }
                resetVersion={
                  resetVersion
                }
                onUpdated={
                  recalculateAfterSimulation
                }
              />
            </div>
          </section>

          <section className="ai-section">
            <AiAssistant
              decision={
                decision
              }
            />
          </section>
        </>
      )}
    </main>
  );
}

export default FulfillmentPage;