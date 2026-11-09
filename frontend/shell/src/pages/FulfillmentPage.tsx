import {
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import RemoteLoader
  from "../components/RemoteLoader";

import UserMenu
  from "../components/UserMenu";

import {
  explainDecision,
} from "../services/aiApi";

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

import type {
  ManagerAiRequest,
  ManagerAiResponse,
  ManagerSimulationChange,
  ManagerSimulationUpdate,
} from "manager_mfe/ManagerWorkspace";

const RemoteOrderSummary =
  lazy(
    () =>
      import(
        "order_mfe/OrderSummary"
      )
  );

const RemoteFulfillmentAnalysis =
  lazy(
    () =>
      import(
        "fulfillment_mfe/FulfillmentAnalysis"
      )
  );

const RemoteManagerWorkspace =
  lazy(
    () =>
      import(
        "manager_mfe/ManagerWorkspace"
      )
  );

const ORDER_REFERENCE =
  "SYN-1001";

const KUKATPALLY_LOCATION_CODE =
  "HYD-03";

const KUKATPALLY_LOCATION_NAME =
  "Kukatpally Store";

const KUKATPALLY_DEFAULT_WORKLOAD =
  25;

const HITECH_LOCATION_CODE =
  "HYD-02";

const HITECH_LOCATION_NAME =
  "Hitech City Store";

const ELECTRONICS_PRODUCT_ID =
  "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99";

const ELECTRONICS_PRODUCT_NAME =
  "RetailIQ Red Electronics 25";

const HITECH_DEFAULT_AVAILABLE_QUANTITY =
  4;

const HITECH_DEFAULT_RESERVED_QUANTITY =
  1;

const HITECH_DEFAULT_REORDER_LEVEL =
  2;

const orderItems = [
  {
    productName:
      "Nike Black Performance Running Shoe",

    quantity: 2,
  },

  {
    productName:
      "Reebok Grey Clothing 24",

    quantity: 1,
  },

  {
    productName:
      ELECTRONICS_PRODUCT_NAME,

    quantity: 1,
  },
];

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
    useState<
      ManagerSimulationChange |
      null
    >(null);

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
    update: ManagerSimulationUpdate
  ): Promise<void> {
    const previousDecision =
      decision;

    const newDecision =
      await fetchDecision();

    setDecision(
      newDecision
    );

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

      recommendationChanged:
        previousDecision
          ?.recommendedLocationCode !==
        newDecision
          .recommendedLocationCode,
    });
  }

  async function handleWorkloadUpdate(
    locationCode: string,
    workloadPercent: number,
    update: ManagerSimulationUpdate
  ): Promise<void> {
    try {
      setError("");

      await updateWorkload(
        locationCode,
        workloadPercent
      );

      await recalculateAfterSimulation(
        update
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to update workload.";

      setError(
        message
      );

      throw requestError;
    }
  }

  async function handleStockUpdate(
    productId: string,
    locationCode: string,
    availableQuantity: number,
    reservedQuantity: number,
    reorderLevel: number,
    update: ManagerSimulationUpdate
  ): Promise<void> {
    try {
      setError("");

      await updateInventory(
        productId,
        locationCode,
        availableQuantity,
        reservedQuantity,
        reorderLevel
      );

      await recalculateAfterSimulation(
        update
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to update inventory.";

      setError(
        message
      );

      throw requestError;
    }
  }

  async function handleAskAi(
    request: ManagerAiRequest
  ): Promise<ManagerAiResponse> {
    try {
      setError("");

      return await explainDecision(
        request
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate AI explanation.";

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
        current =>
          current + 1
      );

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

        recommendationChanged:
          previousDecision
            ?.recommendedLocationCode !==
          newDecision
            .recommendedLocationCode,
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

/*
 * Initial deterministic fulfillment calculation.
 *
 * loadDecision intentionally synchronizes the shell
 * with FulfillmentService and updates local loading,
 * error and decision state.
 */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(
    () => {
      void loadDecision();
    },
    [loadDecision]
  );
  /* eslint-enable react-hooks/set-state-in-effect */

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
            POD 14 · OMNICHANNEL FULFILLMENT
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
              onClick={
                resetDemo
              }
              disabled={
                busy
              }
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
              disabled={
                busy
              }
            >
              {loading
                ? "Calculating..."
                : "Recalculate"}
            </button>
          </div>
        </div>
      </header>

      <RemoteLoader
        remoteName="Order MFE"
        title="Order Summary could not load"
        port={5174}
        loadingMessage={
          "Loading Order Summary micro-frontend..."
        }
      >
        <RemoteOrderSummary
          orderReference={
            ORDER_REFERENCE
          }
          customerName={
            "Synthetic Customer"
          }
          fulfillmentZone={
            "Hyderabad"
          }
          items={
            orderItems
          }
        />
      </RemoteLoader>

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
            disabled={
              busy
            }
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
          <RemoteLoader
            remoteName="Fulfillment MFE"
            title="Fulfillment Analysis could not load"
            port={5175}
            loadingMessage={
              "Loading Fulfillment Analysis micro-frontend..."
            }
          >
            <RemoteFulfillmentAnalysis
              decision={
                decision
              }
            />
          </RemoteLoader>

          <RemoteLoader
            remoteName="Manager MFE"
            title="Manager Workspace could not load"
            port={5176}
            loadingMessage={
              "Loading Manager Workspace micro-frontend..."
            }
          >
            <RemoteManagerWorkspace
              decision={
                decision
              }
              simulationChange={
                simulationChange
              }
              resetVersion={
                resetVersion
              }
              workloadLocationCode={
                KUKATPALLY_LOCATION_CODE
              }
              workloadLocationName={
                KUKATPALLY_LOCATION_NAME
              }
              currentWorkload={
                hyd03
                  ?.workloadPercent ??
                KUKATPALLY_DEFAULT_WORKLOAD
              }
              stockProductId={
                ELECTRONICS_PRODUCT_ID
              }
              stockProductName={
                ELECTRONICS_PRODUCT_NAME
              }
              stockLocationCode={
                HITECH_LOCATION_CODE
              }
              stockLocationName={
                HITECH_LOCATION_NAME
              }
              initialAvailableQuantity={
                HITECH_DEFAULT_AVAILABLE_QUANTITY
              }
              initialReservedQuantity={
                HITECH_DEFAULT_RESERVED_QUANTITY
              }
              initialReorderLevel={
                HITECH_DEFAULT_REORDER_LEVEL
              }
              onUpdateWorkload={
                handleWorkloadUpdate
              }
              onUpdateStock={
                handleStockUpdate
              }
              onAskAi={
                handleAskAi
              }
              onDismissChange={
                () =>
                  setSimulationChange(
                    null
                  )
              }
            />
          </RemoteLoader>
        </>
      )}
    </main>
  );
}

export default FulfillmentPage;