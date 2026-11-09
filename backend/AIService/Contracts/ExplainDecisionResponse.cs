namespace AIService.Contracts;

public sealed class ExplainDecisionResponse
{
    public string Explanation { get; init; } = string.Empty;

    public string PrimaryReason { get; init; } = string.Empty;

    public List<string> SupportingReasons { get; init; } = [];

    public string? Answer { get; init; }

    public bool AiUsed { get; init; }

    public bool FallbackUsed { get; init; }

    public string Provider { get; init; } = string.Empty;

    public string Model { get; init; } = string.Empty;

    public DateTime GeneratedAtUtc { get; init; }

    public long DurationMilliseconds { get; init; }
}