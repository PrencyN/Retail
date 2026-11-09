import { useState } from "react";

import { updateInventory }
  from "../services/inventoryApi";

import type { SimulationUpdate }
  from "./WorkloadSimulator";

const ELECTRONICS_PRODUCT_ID =
  "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99";

const LOCATION_CODE =
  "HYD-02";

type Props = {
  resetVersion: number;

  onUpdated: (
    update: SimulationUpdate
  ) => Promise<void>;
};

function StockSimulator({
  resetVersion,
  onUpdated,
}: Props) {
  const [availableQuantity, setAvailableQuantity] =
    useState(4);

  const [reservedQuantity, setReservedQuantity] =
    useState(1);

  const [reorderLevel, setReorderLevel] =
    useState(2);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Remounting the component with resetVersion
   * restores these initial values.
   */

  async function handleApply() {
    if (
      availableQuantity < 0 ||
      reservedQuantity < 0 ||
      reorderLevel < 0
    ) {
      setError(
        "Inventory values cannot be negative."
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

      await updateInventory(
        ELECTRONICS_PRODUCT_ID,
        LOCATION_CODE,
        availableQuantity,
        reservedQuantity,
        reorderLevel
      );

      await onUpdated({
        title: "Stock Updated",

        cause:
          "Hitech City electronics stock " +
          `changed to ${availableQuantity} ` +
          `available and ${reservedQuantity} ` +
          "reserved.",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update stock."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="simulator-card"
      data-reset-version={resetVersion}
    >
      <div className="simulator-card-heading">
        <div className="simulator-icon stock-icon">
          ▦
        </div>

        <div>
          <span className="section-label">
            Inventory Condition
          </span>

          <h3>Stock What-If</h3>
        </div>
      </div>

      <div className="simulator-context">
        <div>
          <span>Location</span>
          <strong>
            HYD-02 · Hitech City Store
          </strong>
        </div>

        <div>
          <span>Product</span>
          <strong>
            RetailIQ Red Electronics 25
          </strong>
        </div>
      </div>

      <div className="stock-input-grid">
        <label>
          Available quantity

          <input
            type="number"
            min="0"
            value={availableQuantity}
            onChange={(event) =>
              setAvailableQuantity(
                Number(event.target.value)
              )
            }
          />
        </label>

        <label>
          Reserved quantity

          <input
            type="number"
            min="0"
            value={reservedQuantity}
            onChange={(event) =>
              setReservedQuantity(
                Number(event.target.value)
              )
            }
          />
        </label>

        <label>
          Reorder level

          <input
            type="number"
            min="0"
            value={reorderLevel}
            onChange={(event) =>
              setReorderLevel(
                Number(event.target.value)
              )
            }
          />
        </label>
      </div>

      <div className="available-to-sell">
        <span>Available to sell</span>

        <strong>
          {Math.max(
            0,
            availableQuantity -
              reservedQuantity
          )}
        </strong>
      </div>

      <p className="simulator-tip">
        Set available quantity and reserved
        quantity to zero to make Hitech City
        ineligible for the complete basket.
      </p>

      <button
        type="button"
        className="primary-button full-width"
        disabled={saving}
        onClick={handleApply}
      >
        {saving
          ? "Applying and recalculating..."
          : "Apply Stock & Recalculate"}
      </button>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}

export default StockSimulator;