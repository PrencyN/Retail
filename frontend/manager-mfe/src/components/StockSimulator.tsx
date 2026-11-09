import {
  useEffect,
  useState,
} from "react";

import type {
  UpdateStockHandler,
} from "../types/manager";

type Props = {
  productId: string;

  productName: string;

  locationCode: string;

  locationName: string;

  initialAvailableQuantity: number;

  initialReservedQuantity: number;

  initialReorderLevel: number;

  resetVersion: number;

  onUpdateStock:
    UpdateStockHandler;
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
}: Props) {
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
    applying,
    setApplying,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(
    () => {
      setAvailableQuantity(
        initialAvailableQuantity
      );

      setReservedQuantity(
        initialReservedQuantity
      );

      setReorderLevel(
        initialReorderLevel
      );

      setError(
        ""
      );
    },
    [
      initialAvailableQuantity,
      initialReservedQuantity,
      initialReorderLevel,
      resetVersion,
    ]
  );

  const availableToSell =
    Math.max(
      0,
      availableQuantity -
      reservedQuantity
    );

  async function handleApply():
    Promise<void> {
    if (
      !Number.isInteger(
        availableQuantity
      )
      ||
      availableQuantity < 0
    ) {
      setError(
        "Available quantity must be a non-negative whole number."
      );

      return;
    }

    if (
      !Number.isInteger(
        reservedQuantity
      )
      ||
      reservedQuantity < 0
    ) {
      setError(
        "Reserved quantity must be a non-negative whole number."
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

    if (
      !Number.isInteger(
        reorderLevel
      )
      ||
      reorderLevel < 0
    ) {
      setError(
        "Reorder level must be a non-negative whole number."
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
            `was changed to ${availableQuantity} available ` +
            `and ${reservedQuantity} reserved.`,
        }
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update stock."
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
        Change product inventory and observe
        how complete-basket eligibility changes.
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
            value={availableQuantity}
            onChange={
              event => {
                setAvailableQuantity(
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
        </label>

        <label>
          <span>
            Reserved
          </span>

          <input
            type="number"
            min={0}
            value={reservedQuantity}
            onChange={
              event => {
                setReservedQuantity(
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
        </label>

        <label>
          <span>
            Reorder level
          </span>

          <input
            type="number"
            min={0}
            value={reorderLevel}
            onChange={
              event => {
                setReorderLevel(
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

      <div className="manager-preset-row">
        <button
          type="button"
          onClick={
            () => {
              setAvailableQuantity(
                0
              );

              setReservedQuantity(
                0
              );

              setError(
                ""
              );
            }
          }
        >
          Out of stock
        </button>

        <button
          type="button"
          onClick={
            () => {
              setAvailableQuantity(
                initialAvailableQuantity
              );

              setReservedQuantity(
                initialReservedQuantity
              );

              setReorderLevel(
                initialReorderLevel
              );

              setError(
                ""
              );
            }
          }
        >
          Restore values
        </button>
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
          : "Apply Stock & Recalculate"}
      </button>
    </article>
  );
}

export default StockSimulator;