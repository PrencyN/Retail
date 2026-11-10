namespace FulfillmentService.Domain;

public sealed record DecisionAuditSnapshot
{
    public Guid DecisionId { get; init; }

    public string OrderReference { get; init; } =
        string.Empty;

    public DateTime CalculatedAtUtc { get; init; }

    public DecisionSource Source { get; init; }

    public bool Authoritative { get; init; }

    public bool HasRecommendation { get; init; }

    public string? RecommendedLocationCode { get; init; }

    public decimal? WinningScore { get; init; }

    public int OrderItemCount { get; init; }

    public int CandidateCount { get; init; }

    public int EligibleCandidateCount { get; init; }

    public IReadOnlyList<DecisionAuditCandidate>
        Candidates { get; init; } =
        [];
}

public sealed record DecisionAuditCandidate
{
    public string LocationCode { get; init; } =
        string.Empty;

    public bool Eligible { get; init; }

    public bool CompleteBasket { get; init; }

    public int Rank { get; init; }

    public decimal DistanceKm { get; init; }

    public int WorkloadPercent { get; init; }

    public int DailyCapacity { get; init; }

    public int CurrentOrders { get; init; }

    public int RemainingCapacity { get; init; }

    public decimal TotalScore { get; init; }
}

public enum DecisionSource
{
    OrderServiceAndInventoryService,
    ClientProvidedSimulation
}