namespace FulfillmentService.Domain;

public sealed class CandidateLocation
{
    public string LocationCode { get; init; } = string.Empty;

    public string LocationName { get; init; } = string.Empty;

    public decimal DistanceKm { get; init; }

    public int WorkloadPercent { get; init; }

    public int DailyCapacity { get; init; }

    public int CurrentOrders { get; init; }

    public List<ProductAvailability> Inventory { get; init; } = [];
}

public sealed record ProductAvailability(
    Guid ProductId,
    int AvailableToSell);