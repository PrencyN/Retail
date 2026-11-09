import {
  useState,
} from "react";

import type {
  UpdateWorkloadHandler,
} from "../types/manager";

type Props = {
  locationCode: string;

  locationName: string;

  currentWorkload: number;

  onUpdateWorkload:
    UpdateWorkloadHandler;
};

function WorkloadSimulator({
  locationCode,
  locationName,
  currentWorkload,
  onUpdateWorkload,
}: Props) {
  const [
    workload,
    setWorkload,
  ] =
    useState(
      currentWorkload
    );

  const [
    applying,
    setApplying,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function handleApply():
    Promise<void> {
    if (
      !Number.isInteger(
        workload
      )
      ||
      workload < 0
      ||
      workload > 100
    ) {
      setError(
        "Workload must be a whole number between 0 and 100."
      );

      return;
    }

    try {
      setApplying(
        true
      );

      setError(
        ""
      );

      await onUpdateWorkload(
        locationCode,
        workload,
        {
          title:
            "Workload Updated",

          cause:
            `${locationName} workload changed ` +
            `from ${currentWorkload}% to ${workload}%.`,
        }
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update workload."
      );
    } finally {
      setApplying(
        false
      );
    }
  }

  return (
    <article className="manager-simulator-card">
      <div className="manager-card-heading">
        <div>
          <span className="manager-section-label">
            Operational Input
          </span>

          <h3>
            Workload Simulator
          </h3>
        </div>

        <span className="manager-code-badge">
          {locationCode}
        </span>
      </div>

      <p className="manager-card-description">
        Increase the selected store workload
        and recalculate the deterministic
        recommendation.
      </p>

      <div className="manager-value-row">
        <span>
          Location
        </span>

        <strong>
          {locationName}
        </strong>
      </div>

      <div className="manager-value-row">
        <span>
          Current workload
        </span>

        <strong>
          {currentWorkload}%
        </strong>
      </div>

      <label
        htmlFor="manager-workload"
      >
        New workload
      </label>

      <div className="manager-range-row">
        <input
          id="manager-workload"
          type="range"
          min={0}
          max={100}
          step={5}
          value={workload}
          onChange={
            event => {
              setWorkload(
                Number(
                  event.target.value
                )
              );

              setError(
                ""
              );
            }
          }
        />

        <input
          type="number"
          min={0}
          max={100}
          value={workload}
          onChange={
            event => {
              setWorkload(
                Number(
                  event.target.value
                )
              );

              setError(
                ""
              );
            }
          }
          aria-label="Workload percentage"
        />

        <span>
          %
        </span>
      </div>

      <div className="manager-preset-row">
        {[25, 50, 75, 95].map(
          value => (
            <button
              key={value}
              type="button"
              onClick={
                () => {
                  setWorkload(
                    value
                  );

                  setError(
                    ""
                  );
                }
              }
            >
              {value}%
            </button>
          )
        )}
      </div>

      {error && (
        <div
          className="manager-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        className="manager-primary-button"
        disabled={
          applying
        }
        onClick={
          handleApply
        }
      >
        {applying
          ? "Applying..."
          : "Apply & Recalculate"}
      </button>
    </article>
  );
}

export default WorkloadSimulator;