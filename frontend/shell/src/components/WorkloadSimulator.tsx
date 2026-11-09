import {
  useEffect,
  useState,
} from "react";

import { updateWorkload }
  from "../services/inventoryApi";

export type SimulationUpdate = {
  title: string;
  cause: string;
};

type Props = {
  locationCode: string;
  locationName: string;
  currentWorkload: number;

  onUpdated: (
    update: SimulationUpdate
  ) => Promise<void>;
};

function WorkloadSimulator({
  locationCode,
  locationName,
  currentWorkload,
  onUpdated,
}: Props) {
  const [workload, setWorkload] =
    useState(currentWorkload);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setWorkload(currentWorkload);
  }, [currentWorkload]);

  async function handleApply() {
    if (!Number.isInteger(workload)) {
      setError(
        "Workload must be a whole number."
      );

      return;
    }

    if (workload < 0 || workload > 100) {
      setError(
        "Workload must be between 0 and 100."
      );

      return;
    }

    const previousWorkload =
      currentWorkload;

    try {
      setSaving(true);
      setError("");

      await updateWorkload(
        locationCode,
        workload
      );

      await onUpdated({
        title: "Workload Updated",

        cause:
          `${locationName} workload changed ` +
          `from ${previousWorkload}% to ` +
          `${workload}%.`,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update workload."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="simulator-card">
      <div className="simulator-card-heading">
        <div className="simulator-icon workload-icon">
          %
        </div>

        <div>
          <span className="section-label">
            Operational Condition
          </span>

          <h3>Workload What-If</h3>
        </div>
      </div>

      <p>
        Change the workload for{" "}
        <strong>{locationName}</strong> and
        recalculate the recommended location.
      </p>

      <label htmlFor="workload">
        Workload percentage
      </label>

      <div className="simulator-input-group">
        <input
          id="workload"
          type="number"
          min="0"
          max="100"
          step="1"
          value={workload}
          onChange={(event) =>
            setWorkload(
              Number(event.target.value)
            )
          }
        />

        <span className="input-suffix">
          %
        </span>
      </div>

      <div className="range-labels">
        <span>Low workload</span>
        <span>High workload</span>
      </div>

      <input
        className="range-input"
        type="range"
        min="0"
        max="100"
        value={workload}
        onChange={(event) =>
          setWorkload(
            Number(event.target.value)
          )
        }
      />

      <button
        type="button"
        className="primary-button full-width"
        disabled={
          saving ||
          workload === currentWorkload
        }
        onClick={handleApply}
      >
        {saving
          ? "Applying and recalculating..."
          : "Apply & Recalculate"}
      </button>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}

export default WorkloadSimulator;