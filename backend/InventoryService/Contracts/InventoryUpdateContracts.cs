namespace InventoryService.Contracts;

public sealed record UpdateWorkloadRequest(int WorkloadPercent);

public sealed record UpdateInventoryRequest(
    int AvailableQuantity,
    int ReservedQuantity,
    int ReorderLevel,
    Guid Version);

public sealed record InventoryConflictResponse(
    string Message,
    Guid ProductId,
    string LocationCode,
    Guid CurrentVersion,
    int CurrentAvailableQuantity,
    int CurrentReservedQuantity,
    int CurrentReorderLevel);

public sealed record InventoryUpdateResponse(
    string Message,
    Guid ProductId,
    string LocationCode,
    string LocationName,
    int PreviousAvailableQuantity,
    int PreviousReservedQuantity,
    int AvailableQuantity,
    int ReservedQuantity,
    int AvailableToSell,
    int ReorderLevel,
    string Status,
    Guid Version);
