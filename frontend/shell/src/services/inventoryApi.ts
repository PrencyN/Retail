import {
  authenticatedFetch,
} from "./authenticatedFetch";

const INVENTORY_API =
  import.meta.env
    .VITE_INVENTORY_API_URL ??
  "http://localhost:5284";

const EMPTY_GUID =
  "00000000-0000-0000-0000-000000000000";

const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WorkloadUpdateResponse = {
  message: string;

  code: string;

  previousWorkloadPercent: number;

  workloadPercent: number;

  currentOrders: number;

  dailyCapacity: number;

  remainingCapacity: number;
};

export type InventoryRecord = {
  id: string;

  productId: string;

  locationId: string;

  locationCode: string;

  locationName: string;

  locationType: string;

  distanceKm: number;

  workloadPercent: number;

  dailyCapacity: number;

  currentOrders: number;

  remainingCapacity: number;

  availableQuantity: number;

  reservedQuantity: number;

  availableToSell: number;

  reorderLevel: number;

  version: string;

  status: string;
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

  version: string;
};

type InventoryConflictResponse = {
  message?: unknown;

  productId?: unknown;

  locationCode?: unknown;

  currentVersion?: unknown;

  currentAvailableQuantity?: unknown;

  currentReservedQuantity?: unknown;

  currentReorderLevel?: unknown;
};

function normalizeProductId(
  productId: string
): string {
  const normalizedProductId =
    productId.trim();

  if (!normalizedProductId) {
    throw new Error(
      "Product ID is required."
    );
  }

  return normalizedProductId;
}

function normalizeLocationCode(
  locationCode: string
): string {
  const normalizedLocationCode =
    locationCode
      .trim()
      .toUpperCase();

  if (!normalizedLocationCode) {
    throw new Error(
      "Location code is required."
    );
  }

  return normalizedLocationCode;
}

function isValidConcurrencyVersion(
  value: unknown
): value is string {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  const normalizedVersion =
    value
      .trim()
      .toLowerCase();

  if (
    !normalizedVersion ||
    normalizedVersion ===
      EMPTY_GUID
  ) {
    return false;
  }

  return GUID_PATTERN.test(
    normalizedVersion
  );
}

function validateInventoryQuantities(
  availableQuantity: number,
  reservedQuantity: number,
  reorderLevel: number
): void {
  if (
    !Number.isInteger(
      availableQuantity
    ) ||
    availableQuantity < 0
  ) {
    throw new Error(
      "Available quantity must be a non-negative whole number."
    );
  }

  if (
    !Number.isInteger(
      reservedQuantity
    ) ||
    reservedQuantity < 0
  ) {
    throw new Error(
      "Reserved quantity must be a non-negative whole number."
    );
  }

  if (
    !Number.isInteger(
      reorderLevel
    ) ||
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
}

function isInventoryRecord(
  value: unknown
): value is InventoryRecord {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return false;
  }

  const inventory =
    value as Partial<
      InventoryRecord
    >;

  return (
    typeof inventory.id ===
      "string" &&
    typeof inventory.productId ===
      "string" &&
    typeof inventory.locationId ===
      "string" &&
    typeof inventory.locationCode ===
      "string" &&
    typeof inventory.locationName ===
      "string" &&
    typeof inventory.availableQuantity ===
      "number" &&
    typeof inventory.reservedQuantity ===
      "number" &&
    typeof inventory.reorderLevel ===
      "number" &&
    isValidConcurrencyVersion(
      inventory.version
    )
  );
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const body =
      (await response.json()) as {
        message?: unknown;
        detail?: unknown;
        title?: unknown;
      };

    if (
      typeof body.message ===
        "string" &&
      body.message.trim()
    ) {
      return body.message;
    }

    if (
      typeof body.detail ===
        "string" &&
      body.detail.trim()
    ) {
      return body.detail;
    }

    if (
      typeof body.title ===
        "string" &&
      body.title.trim()
    ) {
      return body.title;
    }
  } catch {
    // Preserve the safe fallback message.
  }

  return fallbackMessage;
}

async function getInventoryRecord(
  productId: string,
  locationCode: string
): Promise<InventoryRecord> {
  const response =
    await authenticatedFetch(
      `${INVENTORY_API}/api/inventory/${encodeURIComponent(
        productId
      )}`,
      {
        method:
          "GET",

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load the current inventory version."
      )
    );
  }

  const body: unknown =
    await response.json();

  if (!Array.isArray(body)) {
    throw new Error(
      "InventoryService returned an invalid inventory response."
    );
  }

  const matchingRecord =
    body.find(
      (
        value
      ): value is InventoryRecord =>
        isInventoryRecord(
          value
        ) &&
        value.locationCode
          .trim()
          .toUpperCase() ===
          locationCode
    );

  if (!matchingRecord) {
    const unversionedRecord =
      body.find(
        value => {
          if (
            typeof value !==
              "object" ||
            value === null
          ) {
            return false;
          }

          const candidate =
            value as {
              locationCode?:
                unknown;
            };

          return (
            typeof candidate
              .locationCode ===
              "string" &&
            candidate
              .locationCode
              .trim()
              .toUpperCase() ===
              locationCode
          );
        }
      );

    if (unversionedRecord) {
      throw new Error(
        `Inventory at location '${locationCode}' does not have a valid concurrency version. Restart InventoryService to repair legacy inventory versions.`
      );
    }

    throw new Error(
      `Inventory was not found for location '${locationCode}'.`
    );
  }

  return matchingRecord;
}

async function sendInventoryUpdate(
  productId: string,
  locationCode: string,
  availableQuantity: number,
  reservedQuantity: number,
  reorderLevel: number,
  version: string
): Promise<Response> {
  if (
    !isValidConcurrencyVersion(
      version
    )
  ) {
    throw new Error(
      "A valid inventory version is required."
    );
  }

  return authenticatedFetch(
    `${INVENTORY_API}/api/inventory/${encodeURIComponent(
      productId
    )}/${encodeURIComponent(
      locationCode
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify({
          availableQuantity,
          reservedQuantity,
          reorderLevel,
          version:
            version
              .trim()
              .toLowerCase(),
        }),
    }
  );
}

export async function updateWorkload(
  locationCode: string,
  workloadPercent: number
): Promise<WorkloadUpdateResponse> {
  const normalizedLocationCode =
    normalizeLocationCode(
      locationCode
    );

  if (
    !Number.isInteger(
      workloadPercent
    ) ||
    workloadPercent < 0 ||
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
        method:
          "PUT",

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

  return response.json() as
    Promise<
      WorkloadUpdateResponse
    >;
}

export async function updateInventory(
  productId: string,
  locationCode: string,
  availableQuantity: number,
  reservedQuantity: number,
  reorderLevel: number
): Promise<InventoryUpdateResponse> {
  const normalizedProductId =
    normalizeProductId(
      productId
    );

  const normalizedLocationCode =
    normalizeLocationCode(
      locationCode
    );

  validateInventoryQuantities(
    availableQuantity,
    reservedQuantity,
    reorderLevel
  );

  let currentInventory =
    await getInventoryRecord(
      normalizedProductId,
      normalizedLocationCode
    );

  let response =
    await sendInventoryUpdate(
      normalizedProductId,
      normalizedLocationCode,
      availableQuantity,
      reservedQuantity,
      reorderLevel,
      currentInventory.version
    );

  /*
   * Another request may update the row between the
   * version GET and inventory PUT. Refresh the version
   * and retry once when InventoryService returns 409.
   */
  if (
    response.status ===
    409
  ) {
    const conflictBody =
      (await response
        .clone()
        .json()
        .catch(
          () =>
            null
        )) as
        InventoryConflictResponse |
        null;

    const conflictVersion =
      isValidConcurrencyVersion(
        conflictBody
          ?.currentVersion
      )
        ? conflictBody
            .currentVersion
        : null;

    if (conflictVersion) {
      currentInventory = {
        ...currentInventory,

        version:
          conflictVersion,
      };
    } else {
      currentInventory =
        await getInventoryRecord(
          normalizedProductId,
          normalizedLocationCode
        );
    }

    response =
      await sendInventoryUpdate(
        normalizedProductId,
        normalizedLocationCode,
        availableQuantity,
        reservedQuantity,
        reorderLevel,
        currentInventory.version
      );
  }

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        response.status ===
          409
          ? "Inventory changed concurrently. Refresh and try again."
          : "Unable to update inventory."
      )
    );
  }

  const body: unknown =
    await response.json();

  if (
    typeof body !==
      "object" ||
    body === null
  ) {
    throw new Error(
      "InventoryService returned an invalid update response."
    );
  }

  const result =
    body as Partial<
      InventoryUpdateResponse
    >;

  if (
    typeof result.productId !==
      "string" ||
    typeof result.locationCode !==
      "string" ||
    typeof result.availableQuantity !==
      "number" ||
    typeof result.reservedQuantity !==
      "number" ||
    typeof result.reorderLevel !==
      "number" ||
    !isValidConcurrencyVersion(
      result.version
    )
  ) {
    throw new Error(
      "InventoryService returned an incomplete update response."
    );
  }

  return body as
    InventoryUpdateResponse;
}