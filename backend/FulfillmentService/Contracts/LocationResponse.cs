namespace FulfillmentService.Contracts;

public sealed class LocationResponse
{
    public Guid Id { get; init; }

    public string Code { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public string City { get; init; } = string.Empty;

    public string Type { get; init; } = string.Empty;

    public decimal DistanceKm { get; init; }

    public int WorkloadPercent { get; init; }

    public int DailyCapacity { get; init; }

    public int CurrentOrders { get; init; }

    public int RemainingCapacity { get; init; }
}
