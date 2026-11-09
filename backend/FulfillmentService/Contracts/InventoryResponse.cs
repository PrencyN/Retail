namespace FulfillmentService.Contracts;

public sealed class InventoryResponse
{
    public Guid Id { get; init; }

    public Guid ProductId { get; init; }

    public Guid LocationId { get; init; }

    public string LocationCode { get; init; } = string.Empty;

    public string LocationName { get; init; } = string.Empty;

    public string LocationType { get; init; } = string.Empty;

    public decimal DistanceKm { get; init; }

    public int WorkloadPercent { get; init; }

    public int DailyCapacity { get; init; }

    public int CurrentOrders { get; init; }

    public int RemainingCapacity { get; init; }

    public int AvailableQuantity { get; init; }

    public int ReservedQuantity { get; init; }

    public int AvailableToSell { get; init; }

    public int ReorderLevel { get; init; }

    public string Status { get; init; } = string.Empty;
}