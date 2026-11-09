using FulfillmentService.Domain;
using FulfillmentService.Services;

namespace FulfillmentService.Tests;

public sealed class FulfillmentScorerTests
{
    // =====================================================
    // REAL PRODUCT IDS USED ACROSS THE PROJECT
    // =====================================================

    private static readonly Guid ShoeProductId =
        Guid.Parse(
            "03af967f-d714-444e-a396-14de174b45ca");

    private static readonly Guid ClothingProductId =
        Guid.Parse(
            "b624d6fe-8111-4b14-8189-894bcb54d7ba");

    private static readonly Guid ElectronicsProductId =
        Guid.Parse(
            "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99");

    private readonly FulfillmentScorer _scorer = new();

    // =====================================================
    // HELPERS
    // =====================================================

    private static RoutingPolicy DefaultPolicy()
    {
        return new RoutingPolicy
        {
            InventoryWeight = 0.40m,
            DistanceWeight = 0.25m,
            WorkloadWeight = 0.20m,
            CapacityWeight = 0.15m
        };
    }

    private static List<OrderRequirement> CreateRequirements()
    {
        return
        [
            new OrderRequirement(
                ShoeProductId,
                2),

            new OrderRequirement(
                ClothingProductId,
                1),

            new OrderRequirement(
                ElectronicsProductId,
                1)
        ];
    }

    private static ProductAvailability Stock(
        Guid productId,
        int availableToSell)
    {
        return new ProductAvailability(
            productId,
            availableToSell);
    }

    private static CandidateLocation CreateCandidate(
        string code,
        string name,
        decimal distanceKm,
        int workloadPercent,
        int dailyCapacity,
        int currentOrders,
        int shoeStock,
        int clothingStock,
        int electronicsStock)
    {
        return new CandidateLocation
        {
            LocationCode = code,

            LocationName = name,

            DistanceKm = distanceKm,

            WorkloadPercent = workloadPercent,

            DailyCapacity = dailyCapacity,

            CurrentOrders = currentOrders,

            Inventory =
            [
                Stock(
                    ShoeProductId,
                    shoeStock),

                Stock(
                    ClothingProductId,
                    clothingStock),

                Stock(
                    ElectronicsProductId,
                    electronicsStock)
            ]
        };
    }

    private static List<CandidateLocation> CreateCurrentScenario()
    {
        return
        [
            CreateCandidate(
                "HYD-01",
                "Hyderabad Central Store",
                8,
                60,
                100,
                60,
                8,
                6,
                0),

            CreateCandidate(
                "HYD-02",
                "Hitech City Store",
                5,
                85,
                80,
                68,
                7,
                4,
                3),

            CreateCandidate(
                "HYD-03",
                "Kukatpally Store",
                10,
                25,
                120,
                30,
                18,
                8,
                7),

            CreateCandidate(
                "WH-01",
                "Central Fulfillment Warehouse",
                14,
                40,
                300,
                120,
                30,
                22,
                26)
        ];
    }

    // =====================================================
    // 1. COMPLETE BASKET
    // =====================================================

    [Fact]
    public void CompleteBasket_ShouldBeEligible()
    {
        var decision =
            _scorer.Calculate(
                "SYN-1001",
                CreateRequirements(),
                CreateCurrentScenario(),
                DefaultPolicy());

        var hyd03 =
            decision.Candidates.Single(
                x => x.LocationCode == "HYD-03");

        Assert.True(hyd03.CompleteBasket);
        Assert.True(hyd03.Eligible);
        Assert.Empty(hyd03.MissingProductIds);
    }

    // =====================================================
    // 2. INCOMPLETE BASKET
    // =====================================================

    [Fact]
    public void IncompleteBasket_ShouldBeIneligible()
    {
        var decision =
            _scorer.Calculate(
                "SYN-1001",
                CreateRequirements(),
                CreateCurrentScenario(),
                DefaultPolicy());

        var hyd01 =
            decision.Candidates.Single(
                x => x.LocationCode == "HYD-01");

        Assert.False(hyd01.CompleteBasket);
        Assert.False(hyd01.Eligible);
        Assert.Equal(0, hyd01.Rank);
        Assert.Equal(0m, hyd01.TotalScore);

        Assert.Contains(
            ElectronicsProductId,
            hyd01.MissingProductIds);
    }

    // =====================================================
    // 3. CURRENT POD 14 SCENARIO
    // =====================================================

    [Fact]
    public void Kukatpally_ShouldWin_CurrentScenario()
    {
        var decision =
            _scorer.Calculate(
                "SYN-1001",
                CreateRequirements(),
                CreateCurrentScenario(),
                DefaultPolicy());

        Assert.True(decision.HasRecommendation);

        Assert.Equal(
            "HYD-03",
            decision.RecommendedLocationCode);

        Assert.Equal(
            "Kukatpally Store",
            decision.RecommendedLocationName);

        Assert.Equal(
            69.64m,
            decision.WinningScore);
    }

    // =====================================================
    // 4. NEAREST WINS WHEN OTHER FACTORS ARE EQUAL
    // =====================================================

    [Fact]
    public void NearestLocation_ShouldWin_WhenOtherFactorsEqual()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "LOC-A",
                    "Nearest Store",
                    5,
                    30,
                    100,
                    30,
                    10,
                    10,
                    10),

                CreateCandidate(
                    "LOC-B",
                    "Far Store",
                    15,
                    30,
                    100,
                    30,
                    10,
                    10,
                    10)
            };

        var decision =
            _scorer.Calculate(
                "TEST-NEAREST",
                CreateRequirements(),
                candidates,
                DefaultPolicy());

        Assert.Equal(
            "LOC-A",
            decision.RecommendedLocationCode);
    }

    // =====================================================
    // 5. OVERLOADED NEAREST STORE LOSES
    // =====================================================

    [Fact]
    public void OverloadedNearestLocation_ShouldLose()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "NEAR",
                    "Near Overloaded Store",
                    5,
                    95,
                    100,
                    95,
                    10,
                    10,
                    10),

                CreateCandidate(
                    "FAR",
                    "Far Low Workload Store",
                    10,
                    10,
                    100,
                    10,
                    10,
                    10,
                    10)
            };

        var decision =
            _scorer.Calculate(
                "TEST-WORKLOAD",
                CreateRequirements(),
                candidates,
                DefaultPolicy());

        Assert.Equal(
            "FAR",
            decision.RecommendedLocationCode);
    }

    // =====================================================
    // 6. INVALID QUANTITY
    // =====================================================

    [Fact]
    public void InvalidQuantity_ShouldThrow()
    {
        var requirements =
            new List<OrderRequirement>
            {
                new(
                    ShoeProductId,
                    0)
            };

        var exception =
            Assert.Throws<ArgumentException>(
                () => _scorer.Calculate(
                    "INVALID-QUANTITY",
                    requirements,
                    CreateCurrentScenario(),
                    DefaultPolicy()));

        Assert.Contains(
            "greater than zero",
            exception.Message);
    }

    // =====================================================
    // 7. WORKLOAD ABOVE 100
    // =====================================================

    [Fact]
    public void WorkloadAbove100_ShouldThrow()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "BAD",
                    "Invalid Store",
                    5,
                    101,
                    100,
                    50,
                    10,
                    10,
                    10)
            };

        var exception =
            Assert.Throws<ArgumentException>(
                () => _scorer.Calculate(
                    "INVALID-WORKLOAD",
                    CreateRequirements(),
                    candidates,
                    DefaultPolicy()));

        Assert.Contains(
            "between 0 and 100",
            exception.Message);
    }

    // =====================================================
    // 8. NO ELIGIBLE LOCATION
    // =====================================================

    [Fact]
    public void NoEligibleLocation_ShouldReturnNoRecommendation()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "LOC-A",
                    "Store A",
                    5,
                    20,
                    100,
                    20,
                    0,
                    10,
                    10),

                CreateCandidate(
                    "LOC-B",
                    "Store B",
                    10,
                    20,
                    100,
                    20,
                    10,
                    0,
                    10),

                CreateCandidate(
                    "LOC-C",
                    "Store C",
                    15,
                    20,
                    100,
                    20,
                    10,
                    10,
                    0)
            };

        var decision =
            _scorer.Calculate(
                "NO-WINNER",
                CreateRequirements(),
                candidates,
                DefaultPolicy());

        Assert.False(decision.HasRecommendation);
        Assert.Null(decision.RecommendedLocationCode);
        Assert.Null(decision.RecommendedLocationName);
        Assert.Null(decision.WinningScore);

        Assert.All(
            decision.Candidates,
            candidate =>
                Assert.False(candidate.Eligible));
    }

    // =====================================================
    // 9. TIE BREAK USES SHORTER DISTANCE
    // =====================================================

    [Fact]
    public void Tie_ShouldPreferShorterDistance()
    {
        var policy =
            new RoutingPolicy
            {
                InventoryWeight = 0.40m,
                DistanceWeight = 0m,
                WorkloadWeight = 0.30m,
                CapacityWeight = 0.30m
            };

        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "NEAR",
                    "Near Store",
                    5,
                    20,
                    100,
                    20,
                    10,
                    10,
                    10),

                CreateCandidate(
                    "FAR",
                    "Far Store",
                    10,
                    20,
                    100,
                    20,
                    10,
                    10,
                    10)
            };

        var decision =
            _scorer.Calculate(
                "TIE-TEST",
                CreateRequirements(),
                candidates,
                policy);

        Assert.Equal(
            "NEAR",
            decision.RecommendedLocationCode);
    }

    // =====================================================
    // 10. DETERMINISTIC RESULT
    // =====================================================

    [Fact]
    public void SameInputs_ShouldAlwaysReturnSameWinner()
    {
        var winners =
            new HashSet<string?>();

        for (var i = 0; i < 100; i++)
        {
            var decision =
                _scorer.Calculate(
                    "SYN-1001",
                    CreateRequirements(),
                    CreateCurrentScenario(),
                    DefaultPolicy());

            winners.Add(
                decision.RecommendedLocationCode);
        }

        Assert.Single(winners);

        Assert.Contains(
            "HYD-03",
            winners);
    }

    // =====================================================
    // 11. WORKLOAD BELOW ZERO
    // =====================================================

    [Fact]
    public void WorkloadBelowZero_ShouldThrow()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "BAD",
                    "Invalid Store",
                    5,
                    -1,
                    100,
                    10,
                    10,
                    10,
                    10)
            };

        Assert.Throws<ArgumentException>(
            () => _scorer.Calculate(
                "BAD-WORKLOAD",
                CreateRequirements(),
                candidates,
                DefaultPolicy()));
    }

    // =====================================================
    // 12. INVALID ROUTING WEIGHTS
    // =====================================================

    [Fact]
    public void RoutingWeightsNotEqualToOne_ShouldThrow()
    {
        var invalidPolicy =
            new RoutingPolicy
            {
                InventoryWeight = 0.50m,
                DistanceWeight = 0.25m,
                WorkloadWeight = 0.20m,
                CapacityWeight = 0.15m
            };

        var exception =
            Assert.Throws<ArgumentException>(
                () => _scorer.Calculate(
                    "BAD-POLICY",
                    CreateRequirements(),
                    CreateCurrentScenario(),
                    invalidPolicy));

        Assert.Contains(
            "must total 1.00",
            exception.Message);
    }

    // =====================================================
    // 13. CURRENT ORDERS CANNOT EXCEED CAPACITY
    // =====================================================

    [Fact]
    public void CurrentOrdersGreaterThanCapacity_ShouldThrow()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "BAD",
                    "Invalid Capacity Store",
                    5,
                    50,
                    100,
                    101,
                    10,
                    10,
                    10)
            };

        var exception =
            Assert.Throws<ArgumentException>(
                () => _scorer.Calculate(
                    "BAD-CAPACITY",
                    CreateRequirements(),
                    candidates,
                    DefaultPolicy()));

        Assert.Contains(
            "cannot exceed daily capacity",
            exception.Message);
    }

    // =====================================================
    // 14. EXACT STOCK BOUNDARY
    // =====================================================

    [Fact]
    public void ExactAvailableStock_ShouldBeEligible()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "EXACT",
                    "Exact Stock Store",
                    5,
                    20,
                    100,
                    20,

                    // Exactly matches order requirements.
                    shoeStock: 2,
                    clothingStock: 1,
                    electronicsStock: 1)
            };

        var decision =
            _scorer.Calculate(
                "EXACT-STOCK",
                CreateRequirements(),
                candidates,
                DefaultPolicy());

        var candidate =
            Assert.Single(
                decision.Candidates);

        Assert.True(candidate.CompleteBasket);
        Assert.True(candidate.Eligible);
        Assert.True(decision.HasRecommendation);

        Assert.Equal(
            "EXACT",
            decision.RecommendedLocationCode);
    }

    // =====================================================
    // 15. STOCK ONE BELOW REQUIRED
    // =====================================================

    [Fact]
    public void StockBelowRequiredQuantity_ShouldBeIneligible()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "LOW-STOCK",
                    "Low Stock Store",
                    5,
                    20,
                    100,
                    20,

                    // Order requires two shoes.
                    shoeStock: 1,
                    clothingStock: 1,
                    electronicsStock: 1)
            };

        var decision =
            _scorer.Calculate(
                "LOW-STOCK",
                CreateRequirements(),
                candidates,
                DefaultPolicy());

        var candidate =
            Assert.Single(
                decision.Candidates);

        Assert.False(candidate.CompleteBasket);
        Assert.False(candidate.Eligible);
        Assert.False(decision.HasRecommendation);

        Assert.Contains(
            ShoeProductId,
            candidate.MissingProductIds);
    }

    // =====================================================
    // 16. MISSING INVENTORY RECORD
    // =====================================================

    [Fact]
    public void MissingInventoryRecord_ShouldMakeLocationIneligible()
    {
        var candidate =
            new CandidateLocation
            {
                LocationCode =
                    "MISSING",

                LocationName =
                    "Missing Inventory Store",

                DistanceKm = 5,

                WorkloadPercent = 20,

                DailyCapacity = 100,

                CurrentOrders = 20,

                Inventory =
                [
                    new ProductAvailability(
                        ShoeProductId,
                        10),

                    new ProductAvailability(
                        ClothingProductId,
                        10)

                    // Electronics deliberately absent.
                ]
            };

        var decision =
            _scorer.Calculate(
                "MISSING-INVENTORY",
                CreateRequirements(),
                [candidate],
                DefaultPolicy());

        var result =
            Assert.Single(
                decision.Candidates);

        Assert.False(result.CompleteBasket);
        Assert.False(result.Eligible);
        Assert.False(decision.HasRecommendation);

        Assert.Contains(
            ElectronicsProductId,
            result.MissingProductIds);
    }

    // =====================================================
    // 17. ZERO REMAINING CAPACITY
    // =====================================================

    [Fact]
    public void ZeroRemainingCapacity_ShouldProduceZeroCapacityScore()
    {
        var candidates =
            new List<CandidateLocation>
            {
                CreateCandidate(
                    "FULL",
                    "Fully Loaded Store",
                    5,
                    100,
                    100,
                    100,
                    10,
                    10,
                    10),

                CreateCandidate(
                    "AVAILABLE",
                    "Available Store",
                    10,
                    20,
                    100,
                    20,
                    10,
                    10,
                    10)
            };

        var decision =
            _scorer.Calculate(
                "ZERO-CAPACITY",
                CreateRequirements(),
                candidates,
                DefaultPolicy());

        var fullStore =
            decision.Candidates.Single(
                x =>
                    x.LocationCode ==
                    "FULL");

        Assert.True(fullStore.Eligible);

        Assert.Equal(
            0,
            fullStore.RemainingCapacity);

        Assert.Equal(
            0m,
            fullStore.CapacityScore);

        Assert.Equal(
            0m,
            fullStore.WorkloadScore);

        Assert.Equal(
            "AVAILABLE",
            decision.RecommendedLocationCode);
    }

    // =====================================================
    // 18. NEGATIVE AVAILABLE-TO-SELL
    // =====================================================

    [Fact]
    public void NegativeAvailableToSell_ShouldThrow()
    {
        var candidate =
            new CandidateLocation
            {
                LocationCode =
                    "BAD-STOCK",

                LocationName =
                    "Invalid Stock Store",

                DistanceKm = 5,

                WorkloadPercent = 20,

                DailyCapacity = 100,

                CurrentOrders = 20,

                Inventory =
                [
                    new ProductAvailability(
                        ShoeProductId,
                        -1),

                    new ProductAvailability(
                        ClothingProductId,
                        10),

                    new ProductAvailability(
                        ElectronicsProductId,
                        10)
                ]
            };

        var exception =
            Assert.Throws<ArgumentException>(
                () => _scorer.Calculate(
                    "NEGATIVE-STOCK",
                    CreateRequirements(),
                    [candidate],
                    DefaultPolicy()));

        Assert.Contains(
            "cannot be negative",
            exception.Message);
    }
}