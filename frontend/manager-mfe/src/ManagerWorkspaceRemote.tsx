import AiAssistant
  from "./components/AiAssistant";

import RecommendationChangeBanner
  from "./components/RecommendationChangeBanner";

import StockSimulator
  from "./components/StockSimulator";

import WorkloadSimulator
  from "./components/WorkloadSimulator";

import type {
  AskAiHandler,
  FulfillmentDecision,
  SimulationChange,
  UpdateStockHandler,
  UpdateWorkloadHandler,
} from "./types/manager";

import "./manager-workspace.css";

export type ManagerWorkspaceRemoteProps = {
  decision: FulfillmentDecision;

  simulationChange:
    SimulationChange |
    null;

  resetVersion: number;

  workloadLocationCode: string;

  workloadLocationName: string;

  currentWorkload: number;

  stockProductId: string;

  stockProductName: string;

  stockLocationCode: string;

  stockLocationName: string;

  initialAvailableQuantity: number;

  initialReservedQuantity: number;

  initialReorderLevel: number;

  onUpdateWorkload:
    UpdateWorkloadHandler;

  onUpdateStock:
    UpdateStockHandler;

  onAskAi:
    AskAiHandler;

  onDismissChange:
    () => void;
};

function ManagerWorkspaceRemote({
  decision,
  simulationChange,
  resetVersion,
  workloadLocationCode,
  workloadLocationName,
  currentWorkload,
  stockProductId,
  stockProductName,
  stockLocationCode,
  stockLocationName,
  initialAvailableQuantity,
  initialReservedQuantity,
  initialReorderLevel,
  onUpdateWorkload,
  onUpdateStock,
  onAskAi,
  onDismissChange,
}: ManagerWorkspaceRemoteProps) {
  return (
    <div className="manager-workspace">
      {simulationChange && (
        <RecommendationChangeBanner
          change={
            simulationChange
          }
          onDismiss={
            onDismissChange
          }
        />
      )}

      <section className="manager-simulation-section">
        <div className="manager-section-heading">
          <div>
            <span className="manager-section-label">
              What-If Analysis
            </span>

            <h2>
              Fulfillment Simulator
            </h2>

            <p>
              Modify operational data and
              immediately observe how the
              deterministic recommendation responds.
            </p>
          </div>

          <span className="manager-domain-badge">
            manager-mfe
          </span>
        </div>

        <div className="manager-simulator-grid">
          <WorkloadSimulator
            key={
              `${workloadLocationCode}-${currentWorkload}-${resetVersion}`
            }
            locationCode={
              workloadLocationCode
            }
            locationName={
              workloadLocationName
            }
            currentWorkload={
              currentWorkload
            }
            onUpdateWorkload={
              onUpdateWorkload
            }
          />

          <StockSimulator
            productId={
              stockProductId
            }
            productName={
              stockProductName
            }
            locationCode={
              stockLocationCode
            }
            locationName={
              stockLocationName
            }
            initialAvailableQuantity={
              initialAvailableQuantity
            }
            initialReservedQuantity={
              initialReservedQuantity
            }
            initialReorderLevel={
              initialReorderLevel
            }
            resetVersion={
              resetVersion
            }
            onUpdateStock={
              onUpdateStock
            }
          />
        </div>
      </section>

      <AiAssistant
        decision={
          decision
        }
        onAskAi={
          onAskAi
        }
      />
    </div>
  );
}

export default ManagerWorkspaceRemote;