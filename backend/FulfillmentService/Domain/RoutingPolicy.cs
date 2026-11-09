namespace FulfillmentService.Domain;

public sealed class RoutingPolicy
{
    public decimal InventoryWeight { get; init; } = 0.40m;

    public decimal DistanceWeight { get; init; } = 0.25m;

    public decimal WorkloadWeight { get; init; } = 0.20m;

    public decimal CapacityWeight { get; init; } = 0.15m;

    public decimal TotalWeight =>
        InventoryWeight +
        DistanceWeight +
        WorkloadWeight +
        CapacityWeight;
}