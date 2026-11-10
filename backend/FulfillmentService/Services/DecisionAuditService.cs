using FulfillmentService.Domain;

namespace FulfillmentService.Services;

public sealed class DecisionAuditService
{
    private readonly ILogger<DecisionAuditService>
        _logger;

    public DecisionAuditService(
        ILogger<DecisionAuditService> logger)
    {
        _logger =
            logger;
    }

    public DecisionAuditSnapshot CreateSnapshot(
        FulfillmentDecision decision,
        IReadOnlyCollection<OrderRequirement> requirements,
        DecisionSource source)
    {
        ArgumentNullException.ThrowIfNull(
            decision);

        ArgumentNullException.ThrowIfNull(
            requirements);

        var authoritative =
            source ==
            DecisionSource
                .OrderServiceAndInventoryService;

        return new DecisionAuditSnapshot
        {
            DecisionId =
                decision.DecisionId,

            OrderReference =
                decision.OrderReference,

            CalculatedAtUtc =
                decision.CalculatedAtUtc,

            Source =
                source,

            Authoritative =
                authoritative,

            HasRecommendation =
                decision.HasRecommendation,

            RecommendedLocationCode =
                decision.RecommendedLocationCode,

            WinningScore =
                decision.WinningScore,

            OrderItemCount =
                requirements.Count,

            CandidateCount =
                decision.Candidates.Count,

            EligibleCandidateCount =
                decision.Candidates.Count(
                    candidate =>
                        candidate.Eligible),

            Candidates =
                decision.Candidates
                    .Select(
                        candidate =>
                            new DecisionAuditCandidate
                            {
                                LocationCode =
                                    candidate.LocationCode,

                                Eligible =
                                    candidate.Eligible,

                                CompleteBasket =
                                    candidate.CompleteBasket,

                                Rank =
                                    candidate.Rank,

                                DistanceKm =
                                    candidate.DistanceKm,

                                WorkloadPercent =
                                    candidate.WorkloadPercent,

                                DailyCapacity =
                                    candidate.DailyCapacity,

                                CurrentOrders =
                                    candidate.CurrentOrders,

                                RemainingCapacity =
                                    candidate.RemainingCapacity,

                                TotalScore =
                                    candidate.TotalScore
                            })
                    .OrderBy(
                        candidate =>
                            candidate.Eligible
                                ? candidate.Rank
                                : int.MaxValue)
                    .ThenBy(
                        candidate =>
                            candidate.LocationCode,
                        StringComparer.OrdinalIgnoreCase)
                    .ToArray()
        };
    }

    public void Record(
        DecisionAuditSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(
            snapshot);

        _logger.LogInformation(
            """
            Fulfillment decision calculated.
            DecisionId={DecisionId}
            OrderReference={OrderReference}
            Source={Source}
            Authoritative={Authoritative}
            HasRecommendation={HasRecommendation}
            RecommendedLocationCode={RecommendedLocationCode}
            WinningScore={WinningScore}
            OrderItemCount={OrderItemCount}
            CandidateCount={CandidateCount}
            EligibleCandidateCount={EligibleCandidateCount}
            CalculatedAtUtc={CalculatedAtUtc}
            """,
            snapshot.DecisionId,
            snapshot.OrderReference,
            snapshot.Source,
            snapshot.Authoritative,
            snapshot.HasRecommendation,
            snapshot.RecommendedLocationCode,
            snapshot.WinningScore,
            snapshot.OrderItemCount,
            snapshot.CandidateCount,
            snapshot.EligibleCandidateCount,
            snapshot.CalculatedAtUtc);
    }
}