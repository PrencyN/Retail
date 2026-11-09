using FulfillmentService.Domain;

namespace FulfillmentService.Services;

public sealed class FulfillmentScorer
{
    public FulfillmentDecision Calculate(
        string orderReference,
        IReadOnlyCollection<OrderRequirement> requirements,
        IReadOnlyCollection<CandidateLocation> candidates,
        RoutingPolicy policy)
    {
        Validate(
            orderReference,
            requirements,
            candidates,
            policy);

        // Used to normalize distance to a 0-100 score.
        var maximumDistance = Math.Max(
            candidates.Max(x => x.DistanceKm),
            1m);

        // Used to normalize remaining capacity to a 0-100 score.
        var maximumRemainingCapacity = Math.Max(
            candidates.Max(x =>
                Math.Max(
                    0,
                    x.DailyCapacity - x.CurrentOrders)),
            1);

        var scores = candidates
            .Select(candidate =>
                ScoreCandidate(
                    candidate,
                    requirements,
                    policy,
                    maximumDistance,
                    maximumRemainingCapacity))
            .OrderByDescending(x => x.Eligible)
            .ThenByDescending(x => x.TotalScore)
            .ThenBy(x => x.DistanceKm)
            .ThenBy(x => x.WorkloadPercent)
            .ThenBy(x => x.LocationCode)
            .ToList();

        AssignRanks(scores);

        var winner = scores
            .FirstOrDefault(x => x.Eligible);

        // No single location can fulfil the complete basket.
        if (winner is null)
        {
            return new FulfillmentDecision
            {
                DecisionId = Guid.NewGuid(),

                OrderReference = orderReference,

                CalculatedAtUtc = DateTime.UtcNow,

                HasRecommendation = false,

                RecommendedLocationCode = null,

                RecommendedLocationName = null,

                WinningScore = null,

                Explanation =
                    "No single location can fulfil the complete basket.",

                Policy = policy,

                Candidates = scores
            };
        }

        return new FulfillmentDecision
        {
            DecisionId = Guid.NewGuid(),

            OrderReference = orderReference,

            CalculatedAtUtc = DateTime.UtcNow,

            HasRecommendation = true,

            RecommendedLocationCode =
                winner.LocationCode,

            RecommendedLocationName =
                winner.LocationName,

            WinningScore =
                winner.TotalScore,

            Explanation =
                BuildExplanation(
                    winner,
                    scores),

            Policy = policy,

            Candidates = scores
        };
    }

    private static CandidateScore ScoreCandidate(
        CandidateLocation candidate,
        IReadOnlyCollection<OrderRequirement> requirements,
        RoutingPolicy policy,
        decimal maximumDistance,
        int maximumRemainingCapacity)
    {
        // Build fast inventory lookup for this location.
        var inventoryByProduct = candidate.Inventory
            .GroupBy(x => x.ProductId)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(x =>
                    x.AvailableToSell));

        var missingProductIds = new List<Guid>();

        // ---------------------------------------------------
        // COMPLETE BASKET CHECK
        // ---------------------------------------------------

        foreach (var requirement in requirements)
        {
            inventoryByProduct.TryGetValue(
                requirement.ProductId,
                out var availableToSell);

            if (availableToSell < requirement.Quantity)
            {
                missingProductIds.Add(
                    requirement.ProductId);
            }
        }

        var completeBasket =
            missingProductIds.Count == 0;

        var remainingCapacity = Math.Max(
            0,
            candidate.DailyCapacity -
            candidate.CurrentOrders);

        // ---------------------------------------------------
        // INELIGIBLE LOCATION
        // ---------------------------------------------------

        if (!completeBasket)
        {
            return new CandidateScore
            {
                Rank = 0,

                LocationCode =
                    candidate.LocationCode,

                LocationName =
                    candidate.LocationName,

                CompleteBasket = false,

                Eligible = false,

                Reason =
                    $"Incomplete basket. " +
                    $"{missingProductIds.Count} product(s) " +
                    "have insufficient stock.",

                MissingProductIds =
                    missingProductIds,

                DistanceKm =
                    candidate.DistanceKm,

                WorkloadPercent =
                    candidate.WorkloadPercent,

                DailyCapacity =
                    candidate.DailyCapacity,

                CurrentOrders =
                    candidate.CurrentOrders,

                RemainingCapacity =
                    remainingCapacity,

                InventoryScore = 0,

                DistanceScore = 0,

                WorkloadScore = 0,

                CapacityScore = 0,

                TotalScore = 0
            };
        }

        // ---------------------------------------------------
        // INVENTORY SCORE
        //
        // A complete basket gets 100.
        // Incomplete baskets are rejected above.
        // ---------------------------------------------------

        const decimal inventoryScore = 100m;

        // ---------------------------------------------------
        // DISTANCE SCORE
        //
        // Shorter distance = higher score.
        // ---------------------------------------------------

        var distanceScore = Math.Clamp(
            100m -
            (
                candidate.DistanceKm /
                maximumDistance *
                100m
            ),
            0m,
            100m);

        // ---------------------------------------------------
        // WORKLOAD SCORE
        //
        // Workload 25% => score 75
        // Workload 85% => score 15
        // ---------------------------------------------------

        var workloadScore = Math.Clamp(
            100m -
            candidate.WorkloadPercent,
            0m,
            100m);

        // ---------------------------------------------------
        // CAPACITY SCORE
        // ---------------------------------------------------

        var capacityScore = Math.Clamp(
            (decimal)remainingCapacity /
            maximumRemainingCapacity *
            100m,
            0m,
            100m);

        // ---------------------------------------------------
        // FINAL WEIGHTED SCORE
        // ---------------------------------------------------

        var totalScore =
            inventoryScore *
            policy.InventoryWeight
            +
            distanceScore *
            policy.DistanceWeight
            +
            workloadScore *
            policy.WorkloadWeight
            +
            capacityScore *
            policy.CapacityWeight;

        return new CandidateScore
        {
            Rank = 0,

            LocationCode =
                candidate.LocationCode,

            LocationName =
                candidate.LocationName,

            CompleteBasket = true,

            Eligible = true,

            Reason =
                "Complete basket available.",

            MissingProductIds = [],

            DistanceKm =
                candidate.DistanceKm,

            WorkloadPercent =
                candidate.WorkloadPercent,

            DailyCapacity =
                candidate.DailyCapacity,

            CurrentOrders =
                candidate.CurrentOrders,

            RemainingCapacity =
                remainingCapacity,

            InventoryScore =
                decimal.Round(
                    inventoryScore,
                    2),

            DistanceScore =
                decimal.Round(
                    distanceScore,
                    2),

            WorkloadScore =
                decimal.Round(
                    workloadScore,
                    2),

            CapacityScore =
                decimal.Round(
                    capacityScore,
                    2),

            TotalScore =
                decimal.Round(
                    totalScore,
                    2)
        };
    }

    private static void AssignRanks(
        List<CandidateScore> scores)
    {
        var rank = 1;

        foreach (var score in scores)
        {
            if (!score.Eligible)
            {
                score.Rank = 0;
                continue;
            }

            score.Rank = rank;
            rank++;
        }
    }

    // -------------------------------------------------------
    // DETERMINISTIC EXPLANATION
    //
    // This is intentionally NOT AI.
    // Later AIService will turn these facts into a richer
    // natural-language explanation.
    // -------------------------------------------------------

    private static string BuildExplanation(
        CandidateScore winner,
        IReadOnlyCollection<CandidateScore> scores)
    {
        var nearestEligible = scores
            .Where(x => x.Eligible)
            .OrderBy(x => x.DistanceKm)
            .ThenBy(x => x.LocationCode)
            .FirstOrDefault();

        if (nearestEligible is null)
        {
            return
                $"{winner.LocationName} was selected.";
        }

        // Winner is also nearest.
        if (nearestEligible.LocationCode.Equals(
                winner.LocationCode,
                StringComparison.OrdinalIgnoreCase))
        {
            return
                $"{winner.LocationName} was selected because " +
                "the complete basket is available and the location " +
                "has the highest overall score while also being " +
                "the nearest eligible location.";
        }

        // Winner beats the nearest location due to other factors.
        return
            $"{winner.LocationName} was selected even though " +
            $"{nearestEligible.LocationName} is closer. " +
            $"{winner.LocationName} has workload of " +
            $"{winner.WorkloadPercent}% and remaining capacity of " +
            $"{winner.RemainingCapacity}, giving the location a " +
            "better overall balance of inventory availability, " +
            "distance, workload and capacity.";
    }

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    private static void Validate(
        string orderReference,
        IReadOnlyCollection<OrderRequirement> requirements,
        IReadOnlyCollection<CandidateLocation> candidates,
        RoutingPolicy policy)
    {
        if (string.IsNullOrWhiteSpace(orderReference))
        {
            throw new ArgumentException(
                "Order reference is required.");
        }

        if (requirements is null ||
            requirements.Count == 0)
        {
            throw new ArgumentException(
                "At least one order item is required.");
        }

        if (candidates is null ||
            candidates.Count == 0)
        {
            throw new ArgumentException(
                "At least one candidate location is required.");
        }

        // ---------------------------------------------------
        // ORDER VALIDATION
        // ---------------------------------------------------

        if (requirements.Any(x =>
                x.ProductId == Guid.Empty))
        {
            throw new ArgumentException(
                "Every order item must contain a valid product ID.");
        }

        if (requirements.Any(x =>
                x.Quantity <= 0))
        {
            throw new ArgumentException(
                "Order quantities must be greater than zero.");
        }

        if (requirements
            .GroupBy(x => x.ProductId)
            .Any(group =>
                group.Count() > 1))
        {
            throw new ArgumentException(
                "Duplicate products are not allowed " +
                "in the order requirements.");
        }

        // ---------------------------------------------------
        // LOCATION VALIDATION
        // ---------------------------------------------------

        if (candidates.Any(x =>
                string.IsNullOrWhiteSpace(
                    x.LocationCode)))
        {
            throw new ArgumentException(
                "Every candidate must have a location code.");
        }

        if (candidates
            .GroupBy(
                x => x.LocationCode,
                StringComparer.OrdinalIgnoreCase)
            .Any(group =>
                group.Count() > 1))
        {
            throw new ArgumentException(
                "Candidate location codes must be unique.");
        }

        if (candidates.Any(x =>
                x.DistanceKm < 0))
        {
            throw new ArgumentException(
                "Distance cannot be negative.");
        }

        if (candidates.Any(x =>
                x.WorkloadPercent < 0 ||
                x.WorkloadPercent > 100))
        {
            throw new ArgumentException(
                "Workload must be between 0 and 100.");
        }

        if (candidates.Any(x =>
                x.DailyCapacity < 0))
        {
            throw new ArgumentException(
                "Daily capacity cannot be negative.");
        }

        if (candidates.Any(x =>
                x.CurrentOrders < 0))
        {
            throw new ArgumentException(
                "Current orders cannot be negative.");
        }

        if (candidates.Any(x =>
                x.CurrentOrders >
                x.DailyCapacity))
        {
            throw new ArgumentException(
                "Current orders cannot exceed daily capacity.");
        }

        // ---------------------------------------------------
        // INVENTORY VALIDATION
        // ---------------------------------------------------

        if (candidates.Any(candidate =>
                candidate.Inventory.Any(item =>
                    item.ProductId == Guid.Empty)))
        {
            throw new ArgumentException(
                "Inventory contains an invalid product ID.");
        }

        if (candidates.Any(candidate =>
                candidate.Inventory.Any(item =>
                    item.AvailableToSell < 0)))
        {
            throw new ArgumentException(
                "Available-to-sell inventory cannot be negative.");
        }

        // ---------------------------------------------------
        // ROUTING POLICY VALIDATION
        // ---------------------------------------------------

        if (policy.InventoryWeight < 0 ||
            policy.DistanceWeight < 0 ||
            policy.WorkloadWeight < 0 ||
            policy.CapacityWeight < 0)
        {
            throw new ArgumentException(
                "Routing policy weights cannot be negative.");
        }

        var totalWeight =
            policy.InventoryWeight +
            policy.DistanceWeight +
            policy.WorkloadWeight +
            policy.CapacityWeight;

        if (decimal.Round(
                totalWeight,
                4) != 1.0000m)
        {
            throw new ArgumentException(
                "Routing policy weights must total 1.00.");
        }
    }
}