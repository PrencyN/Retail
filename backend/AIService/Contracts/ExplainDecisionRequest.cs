namespace AIService.Contracts;

public sealed class ExplainDecisionRequest
{
    public string OrderReference { get; init; } = string.Empty;

    public string? RecommendedLocationCode { get; init; }

    public string? RecommendedLocationName { get; init; }

    public decimal? WinningScore { get; init; }

    public string DeterministicExplanation { get; init; }
        = string.Empty;

    public string? Question { get; init; }

    public List<AiCandidateFact> Candidates { get; init; } = [];
}

public sealed class AiCandidateFact
{
    public int Rank { get; init; }

    public string LocationCode { get; init; } = string.Empty;

    public string LocationName { get; init; } = string.Empty;

    public bool Eligible { get; init; }

    public bool CompleteBasket { get; init; }

    public string Reason { get; init; } = string.Empty;

    public decimal DistanceKm { get; init; }

    public int WorkloadPercent { get; init; }

    public int RemainingCapacity { get; init; }

    public decimal InventoryScore { get; init; }

    public decimal DistanceScore { get; init; }

    public decimal WorkloadScore { get; init; }

    public decimal CapacityScore { get; init; }

    public decimal TotalScore { get; init; }
}