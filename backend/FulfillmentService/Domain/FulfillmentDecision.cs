namespace FulfillmentService.Domain;

public sealed class FulfillmentDecision
{
    public Guid DecisionId { get; init; }

    public string OrderReference { get; init; } = string.Empty;

    public DateTime CalculatedAtUtc { get; init; }

    public bool HasRecommendation { get; init; }

    public string? RecommendedLocationCode { get; init; }

    public string? RecommendedLocationName { get; init; }

    public decimal? WinningScore { get; init; }

    public string Explanation { get; init; } = string.Empty;

    public RoutingPolicy Policy { get; init; } = new();

    public IReadOnlyList<CandidateScore> Candidates { get; init; } = [];
}