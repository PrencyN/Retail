import {
  useEffect,
  useMemo,
  useState,
} from "react";

export type StockSimulationUpdate = {
  title: string;

  cause: string;
};

export type StockSimulatorProps = {
  productId: string;

  productName: string;

  locationCode: string;

  locationName: string;

  initialAvailableQuantity: number;

  initialReservedQuantity: number;

  initialReorderLevel: number;

  resetVersion: number;

  onUpdateStock: (
    productId: string,
    locationCode: string,
    availableQuantity: number,
    reservedQuantity: number,
    reorderLevel: number,
    update: StockSimulationUpdate
  ) => Promise<void>;
};

function StockSimulator({
  productId,
  productName,
  locationCode,
  locationName,
  initialAvailableQuantity,
  initialReservedQuantity,
  initialReorderLevel,
  resetVersion,
  onUpdateStock,
}: StockSimulatorProps) {
  const [
    availableQuantity,
    setAvailableQuantity,
  ] =
    useState(
      initialAvailableQuantity
    );

  const [
    reservedQuantity,
    setReservedQuantity,
  ] =
    useState(
      initialReservedQuantity
    );

  const [
    reorderLevel,
    setReorderLevel,
  ] =
    useState(
      initialReorderLevel
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  /*
   * resetVersion is an explicit synchronization
   * signal sent by the shell after Reset Demo.
   *
   * Local simulator values intentionally need to
   * synchronize with the new baseline values here.
   */
  useEffect(
    () => {
      /* eslint-disable react-hooks/set-state-in-effect */

      setAvailableQuantity(
        initialAvailableQuantity
      );

      setReservedQuantity(
        initialReservedQuantity
      );

      setReorderLevel(
        initialReorderLevel
      );

      setError("");

      /* eslint-enable react-hooks/set-state-in-effect */
    },
    [
      resetVersion,
      initialAvailableQuantity,
      initialReservedQuantity,
      initialReorderLevel,
    ]
  );

  const availableToSell =
    useMemo(
      () =>
        Math.max(
          0,
          availableQuantity -
            reservedQuantity
        ),
      [
        availableQuantity,
        reservedQuantity,
      ]
    );

  function handleAvailableChange(
    value: string
  ): void {
    const parsedValue =
      Number(value);

    if (
      Number.isNaN(
        parsedValue
      )
    ) {
      setAvailableQuantity(
        0
      );

      return;
    }

    setAvailableQuantity(
      parsedValue
    );

    setError("");
  }

  function handleReservedChange(
    value: string
  ): void {
    const parsedValue =
      Number(value);

    if (
      Number.isNaN(
        parsedValue
      )
    ) {
      setReservedQuantity(
        0
      );

      return;
    }

    setReservedQuantity(
      parsedValue
    );

    setError("");
  }

  function handleReorderLevelChange(
    value: string
  ): void {
    const parsedValue =
      Number(value);

    if (
      Number.isNaN(
        parsedValue
      )
    ) {
      setReorderLevel(
        0
      );

      return;
    }

    setReorderLevel(
      parsedValue
    );

    setError("");
  }

  function handleOutOfStock():
    void {
    setAvailableQuantity(
      0
    );

    setReservedQuantity(
      0
    );

    setError("");
  }

  function handleRestoreValues():
    void {
    setAvailableQuantity(
      initialAvailableQuantity
    );

    setReservedQuantity(
      initialReservedQuantity
    );

    setReorderLevel(
      initialReorderLevel
    );

    setError("");
  }

  async function handleApply():
    Promise<void> {
    if (
      availableQuantity < 0
    ) {
      setError(
        "Available quantity cannot be negative."
      );

      return;
    }

    if (
      reservedQuantity < 0
    ) {
      setError(
        "Reserved quantity cannot be negative."
      );

      return;
    }

    if (
      reorderLevel < 0
    ) {
      setError(
        "Reorder level cannot be negative."
      );

      return;
    }

    if (
      reservedQuantity >
      availableQuantity
    ) {
      setError(
        "Reserved quantity cannot exceed available quantity."
      );

      return;
    }

    try {
      setSaving(true);

      setError("");

      await onUpdateStock(
        productId,
        locationCode,
        availableQuantity,
        reservedQuantity,
        reorderLevel,
        {
          title:
            "Stock Updated",

          cause:
            `${productName} stock at ${locationName} ` +
            `changed to ${availableQuantity} available, ` +
            `${reservedQuantity} reserved and ` +
            `${reorderLevel} reorder level.`,
        }
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update inventory."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="manager-simulator-card">
      <div className="manager-card-heading">
        <div>
          <span className="manager-section-label">
            Inventory Input
          </span>

          <h3>
            Stock Simulator
          </h3>
        </div>

        <span className="manager-code-badge">
          {locationCode}
        </span>
      </div>

      <p className="manager-card-description">
        Change product inventory and observe how
        complete-basket eligibility changes.
      </p>

      <div className="manager-stock-context">
        <strong>
          {productName}
        </strong>

        <span>
          {locationName}
        </span>
      </div>

      <div className="manager-field-grid">
        <label>
          <span>
            Available
          </span>

          <input
            type="number"
            min={0}
            value={
              availableQuantity
            }
            onChange={
              event =>
                handleAvailableChange(
                  event.target.value
                )
            }
          />
        </label>

        <label>
          <span>
            Reserved
          </span>

          <input
            type="number"
            min={0}
            value={
              reservedQuantity
            }
            onChange={
              event =>
                handleReservedChange(
                  event.target.value
                )
            }
          />
        </label>

        <label>
          <span>
            Reorder level
          </span>

          <input
            type="number"
            min={0}
            value={
              reorderLevel
            }
            onChange={
              event =>
                handleReorderLevelChange(
                  event.target.value
                )
            }
          />
        </label>

        <div className="manager-ats-card">
          <span>
            Available to sell
          </span>

          <strong>
            {availableToSell}
          </strong>
        </div>
      </div>

      {error && (
        <div
          className="manager-error-message"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="manager-preset-row">
        <button
          type="button"
          onClick={
            handleOutOfStock
          }
          disabled={
            saving
          }
        >
          Out of stock
        </button>

        <button
          type="button"
          onClick={
            handleRestoreValues
          }
          disabled={
            saving
          }
        >
          Restore values
        </button>
      </div>

      <button
        type="button"
        className="manager-primary-button"
        onClick={
          () =>
            void handleApply()
        }
        disabled={
          saving
        }
      >
        {saving
          ? "Applying..."
          : "Apply Stock & Recalculate"}
      </button>
    </article>
  );
}

export default StockSimulator;