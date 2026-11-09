import {
  authenticatedFetch,
} from "./authenticatedFetch";

const INVENTORY_API =
  import.meta.env
    .VITE_INVENTORY_API_URL ??
  "http://localhost:5284";

export type WorkloadUpdateResponse = {
  message: string;

  code: string;

  previousWorkloadPercent: number;

  workloadPercent: number;

  currentOrders: number;

  dailyCapacity: number;

  remainingCapacity: number;
};

export type InventoryUpdateResponse = {
  message: string;

  productId: string;

  locationCode: string;

  locationName: string;

  previousAvailableQuantity: number;

  previousReservedQuantity: number;

  availableQuantity: number;

  reservedQuantity: number;

  availableToSell: number;

  reorderLevel: number;

  status: string;
};

export async function updateWorkload(
  locationCode: string,
  workloadPercent: number
): Promise<WorkloadUpdateResponse> {
  const normalizedLocationCode =
    locationCode
      .trim()
      .toUpperCase();

  if (!normalizedLocationCode) {
    throw new Error(
      "Location code is required."
    );
  }

  if (
    !Number.isInteger(
      workloadPercent
    )
    ||
    workloadPercent < 0
    ||
    workloadPercent > 100
  ) {
    throw new Error(
      "Workload percentage must be a whole number between 0 and 100."
    );
  }

  const response =
    await authenticatedFetch(
      `${INVENTORY_API}/api/locations/${encodeURIComponent(
        normalizedLocationCode
      )}/workload`,
      {
        method: "PUT",

        body:
          JSON.stringify({
            workloadPercent,
          }),
      }
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to update workload."
      )
    );
  }

  return response.json();
}

export async function updateInventory(
  productId: string,
  locationCode: string,
  availableQuantity: number,
  reservedQuantity: number,
  reorderLevel: number
): Promise<InventoryUpdateResponse> {
  const normalizedProductId =
    productId.trim();

  const normalizedLocationCode =
    locationCode
      .trim()
      .toUpperCase();

  if (!normalizedProductId) {
    throw new Error(
      "Product ID is required."
    );
  }

  if (!normalizedLocationCode) {
    throw new Error(
      "Location code is required."
    );
  }

  if (
    !Number.isInteger(
      availableQuantity
    )
    ||
    availableQuantity < 0
  ) {
    throw new Error(
      "Available quantity must be a non-negative whole number."
    );
  }

  if (
    !Number.isInteger(
      reservedQuantity
    )
    ||
    reservedQuantity < 0
  ) {
    throw new Error(
      "Reserved quantity must be a non-negative whole number."
    );
  }

  if (
    !Number.isInteger(
      reorderLevel
    )
    ||
    reorderLevel < 0
  ) {
    throw new Error(
      "Reorder level must be a non-negative whole number."
    );
  }

  if (
    reservedQuantity >
    availableQuantity
  ) {
    throw new Error(
      "Reserved quantity cannot exceed available quantity."
    );
  }

  const response =
    await authenticatedFetch(
      `${INVENTORY_API}/api/inventory/${encodeURIComponent(
        normalizedProductId
      )}/${encodeURIComponent(
        normalizedLocationCode
      )}`,
      {
        method: "PUT",

        body:
          JSON.stringify({
            availableQuantity,
            reservedQuantity,
            reorderLevel,
          }),
      }
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to update inventory."
      )
    );
  }

  return response.json();
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const body =
      await response.json();

    return (
      body.message ??
      body.detail ??
      body.title ??
      fallbackMessage
    );
  } catch {
    return fallbackMessage;
  }
}