namespace FulfillmentService.Domain;

public sealed class CandidateScore
{
    public int Rank { get; set; }

    public string LocationCode { get; init; } = string.Empty;

    public string LocationName { get; init; } = string.Empty;

    public bool CompleteBasket { get; init; }

    public bool Eligible { get; init; }

    public string Reason { get; init; } = string.Empty;

    public List<Guid> MissingProductIds { get; init; } = [];

    public decimal DistanceKm { get; init; }

    public int WorkloadPercent { get; init; }

    public int DailyCapacity { get; init; }

    public int CurrentOrders { get; init; }

    public int RemainingCapacity { get; init; }

    public decimal InventoryScore { get; init; }

    public decimal DistanceScore { get; init; }

    public decimal WorkloadScore { get; init; }

    public decimal CapacityScore { get; init; }

    public decimal TotalScore { get; init; }
}