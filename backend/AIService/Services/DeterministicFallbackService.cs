using AIService.Contracts;

namespace AIService.Services;

public sealed class DeterministicFallbackService
{
    public ExplainDecisionResponse Create(
        ExplainDecisionRequest request,
        string fallbackReason,
        long durationMilliseconds)
    {
        var winner =
            request.Candidates
                .FirstOrDefault(candidate =>
                    candidate.Eligible &&
                    candidate.LocationCode.Equals(
                        request.RecommendedLocationCode,
                        StringComparison.OrdinalIgnoreCase));

        var nearestEligible =
            request.Candidates
                .Where(candidate =>
                    candidate.Eligible)
                .OrderBy(candidate =>
                    candidate.DistanceKm)
                .ThenBy(candidate =>
                    candidate.LocationCode)
                .FirstOrDefault();

        var supportingReasons =
            new List<string>();

        if (winner is not null)
        {
            supportingReasons.Add(
                $"Complete basket is available at " +
                $"{winner.LocationName}.");

            supportingReasons.Add(
                $"{winner.LocationName} has " +
                $"{winner.WorkloadPercent}% workload.");

            supportingReasons.Add(
                $"{winner.LocationName} has " +
                $"{winner.RemainingCapacity} remaining capacity.");

            supportingReasons.Add(
                $"{winner.LocationName} achieved a deterministic " +
                $"score of {winner.TotalScore:0.00}.");
        }

        var rejectedLocations =
            request.Candidates
                .Where(candidate =>
                    !candidate.Eligible)
                .ToList();

        if (rejectedLocations.Count > 0)
        {
            supportingReasons.Add(
                $"{rejectedLocations.Count} location(s) were rejected " +
                "because the complete basket was unavailable.");
        }

        var answer =
            BuildAnswer(
                request,
                winner,
                nearestEligible);

        var explanation =
            string.IsNullOrWhiteSpace(
                request.DeterministicExplanation)
                ? answer
                : request.DeterministicExplanation;

        return new ExplainDecisionResponse
        {
            Explanation =
                explanation,

            PrimaryReason =
                winner is null
                    ? "No eligible single-location fulfillment option exists."
                    : $"{winner.LocationName} received the highest " +
                      "deterministic fulfillment score.",

            SupportingReasons =
                supportingReasons,

            Answer =
                answer,

            AiUsed =
                false,

            FallbackUsed =
                true,

            Provider =
                $"Deterministic fallback: {fallbackReason}",

            Model =
                "none",

            GeneratedAtUtc =
                DateTime.UtcNow,

            DurationMilliseconds =
                durationMilliseconds
        };
    }

    private static string BuildAnswer(
        ExplainDecisionRequest request,
        AiCandidateFact? winner,
        AiCandidateFact? nearestEligible)
    {
        if (winner is null)
        {
            return
                "No single location can fulfill the complete basket.";
        }

        var question =
            request.Question?
                .Trim()
                .ToLowerInvariant()
            ?? string.Empty;

        if (question.Contains("nearest") &&
            nearestEligible is not null)
        {
            if (nearestEligible.LocationCode.Equals(
                    winner.LocationCode,
                    StringComparison.OrdinalIgnoreCase))
            {
                return
                    $"{winner.LocationName} is both the nearest " +
                    "eligible location and the highest-scoring location.";
            }

            return
                $"{nearestEligible.LocationName} is closer at " +
                $"{nearestEligible.DistanceKm:0.##} km, but " +
                $"{winner.LocationName} has a stronger operational " +
                $"profile with {winner.WorkloadPercent}% workload " +
                $"and {winner.RemainingCapacity} remaining capacity. " +
                $"{winner.LocationName} therefore achieved the higher " +
                $"deterministic score of {winner.TotalScore:0.00}.";
        }

        if (question.Contains("ineligible") ||
            question.Contains("rejected"))
        {
            var rejected =
                request.Candidates
                    .Where(candidate =>
                        !candidate.Eligible)
                    .Select(candidate =>
                        $"{candidate.LocationCode}: " +
                        candidate.Reason)
                    .ToList();

            return rejected.Count == 0
                ? "No candidate locations were rejected."
                : string.Join(
                    " ",
                    rejected);
        }

        if (question.Contains("factor"))
        {
            var factors =
                new Dictionary<string, decimal>
                {
                    ["inventory"] =
                        winner.InventoryScore,

                    ["distance"] =
                        winner.DistanceScore,

                    ["workload"] =
                        winner.WorkloadScore,

                    ["capacity"] =
                        winner.CapacityScore
                };

            var strongest =
                factors
                    .OrderByDescending(item =>
                        item.Value)
                    .First();

            return
                $"The winner's highest component score is " +
                $"{strongest.Key} at {strongest.Value:0.00}. " +
                $"The final recommendation still uses the weighted " +
                "combination of all four factors.";
        }

        return
            $"{winner.LocationName} was selected because it can " +
            "fulfill the complete basket and achieved the highest " +
            "deterministic score across inventory, distance, workload, " +
            "and capacity.";
    }
}