using FulfillmentService.Clients;
using FulfillmentService.Domain;

namespace FulfillmentService.Services;

public sealed class FulfillmentOrchestrator
{
    private const int MaximumOrderItems =
        100;

    private const int MaximumLocations =
        500;

    private readonly OrderServiceClient
        _orderServiceClient;

    private readonly InventoryServiceClient
        _inventoryServiceClient;

    private readonly FulfillmentScorer
        _fulfillmentScorer;

    private readonly DecisionAuditService
        _decisionAuditService;

    public FulfillmentOrchestrator(
        OrderServiceClient orderServiceClient,
        InventoryServiceClient inventoryServiceClient,
        FulfillmentScorer fulfillmentScorer,
        DecisionAuditService decisionAuditService)
    {
        _orderServiceClient =
            orderServiceClient;

        _inventoryServiceClient =
            inventoryServiceClient;

        _fulfillmentScorer =
            fulfillmentScorer;

        _decisionAuditService =
            decisionAuditService;
    }

    public async Task<FulfillmentDecision?>
        CalculateForOrderAsync(
            string orderReference,
            RoutingPolicy? policy,
            CancellationToken cancellationToken)
    {
        var normalizedReference =
            NormalizeOrderReference(
                orderReference);

        var order =
            await _orderServiceClient
                .GetByReferenceAsync(
                    normalizedReference,
                    cancellationToken);

        if (order is null)
        {
            return null;
        }

        ValidateOrder(
            order.Reference,
            order.Items);

        var locations =
            await _inventoryServiceClient
                .GetLocationsAsync(
                    cancellationToken);

        ValidateLocations(
            locations);

        var productIds =
            order.Items
                .Select(
                    item =>
                        item.ProductId)
                .Distinct()
                .ToArray();

        var inventoryTasks =
            productIds.Select(
                productId =>
                    _inventoryServiceClient
                        .GetInventoryByProductAsync(
                            productId,
                            cancellationToken));

        var inventoryResults =
            await Task.WhenAll(
                inventoryTasks);

        var allInventory =
            inventoryResults
                .SelectMany(
                    result =>
                        result)
                .ToArray();

        ValidateInventoryResponses(
            allInventory);

        var requirements =
            order.Items
                .Select(
                    item =>
                        new OrderRequirement(
                            item.ProductId,
                            item.Quantity))
                .ToArray();

        var candidates =
            locations
                .Select(
                    location =>
                        CreateCandidate(
                            location,
                            productIds,
                            allInventory))
                .ToArray();

        var decision =
            _fulfillmentScorer.Calculate(
                order.Reference,
                requirements,
                candidates,
                policy ?? new RoutingPolicy());

        var snapshot =
            _decisionAuditService
                .CreateSnapshot(
                    decision,
                    requirements,
                    DecisionSource
                        .OrderServiceAndInventoryService);

        _decisionAuditService.Record(
            snapshot);

        return decision;
    }

    private static CandidateLocation CreateCandidate(
        Contracts.LocationResponse location,
        IReadOnlyCollection<Guid> productIds,
        IReadOnlyCollection<
            Contracts.InventoryResponse> allInventory)
    {
        var locationInventory =
            productIds
                .Select(
                    productId =>
                    {
                        var inventory =
                            allInventory
                                .SingleOrDefault(
                                    row =>
                                        row.ProductId ==
                                        productId
                                        &&
                                        row.LocationCode.Equals(
                                            location.Code,
                                            StringComparison
                                                .OrdinalIgnoreCase));

                        return new ProductAvailability(
                            productId,
                            inventory
                                ?.AvailableToSell
                            ?? 0);
                    })
                .ToList();

        return new CandidateLocation
        {
            LocationCode =
                location.Code,

            LocationName =
                location.Name,

            DistanceKm =
                location.DistanceKm,

            WorkloadPercent =
                location.WorkloadPercent,

            DailyCapacity =
                location.DailyCapacity,

            CurrentOrders =
                location.CurrentOrders,

            Inventory =
                locationInventory
        };
    }

    private static string NormalizeOrderReference(
        string orderReference)
    {
        if (string.IsNullOrWhiteSpace(
                orderReference))
        {
            throw new ArgumentException(
                "Order reference is required.");
        }

        var normalized =
            orderReference
                .Trim()
                .ToUpperInvariant();

        if (normalized.Length > 100)
        {
            throw new ArgumentException(
                "Order reference cannot exceed 100 characters.");
        }

        if (normalized.Any(
                character =>
                    !char.IsLetterOrDigit(
                        character)
                    &&
                    character != '-'
                    &&
                    character != '_'))
        {
            throw new ArgumentException(
                "Order reference contains unsupported characters.");
        }

        return normalized;
    }

    private static void ValidateOrder(
        string orderReference,
        IReadOnlyCollection<
            Contracts.OrderItemResponse> items)
    {
        if (string.IsNullOrWhiteSpace(
                orderReference))
        {
            throw new InvalidOperationException(
                "OrderService returned an empty order reference.");
        }

        if (items.Count == 0)
        {
            throw new InvalidOperationException(
                "The order does not contain any items.");
        }

        if (items.Count > MaximumOrderItems)
        {
            throw new InvalidOperationException(
                $"The order exceeds the maximum of {MaximumOrderItems} items.");
        }

        if (items.Any(
                item =>
                    item.ProductId ==
                    Guid.Empty))
        {
            throw new InvalidOperationException(
                "OrderService returned an invalid product ID.");
        }

        if (items.Any(
                item =>
                    item.Quantity <= 0))
        {
            throw new InvalidOperationException(
                "OrderService returned a non-positive quantity.");
        }

        if (items
            .GroupBy(
                item =>
                    item.ProductId)
            .Any(
                group =>
                    group.Count() > 1))
        {
            throw new InvalidOperationException(
                "OrderService returned duplicate products.");
        }
    }

    private static void ValidateLocations(
        IReadOnlyCollection<
            Contracts.LocationResponse> locations)
    {
        if (locations.Count == 0)
        {
            throw new InvalidOperationException(
                "No fulfillment locations are available.");
        }

        if (locations.Count > MaximumLocations)
        {
            throw new InvalidOperationException(
                $"InventoryService returned more than {MaximumLocations} locations.");
        }

        if (locations.Any(
                location =>
                    location.Id ==
                    Guid.Empty
                    ||
                    string.IsNullOrWhiteSpace(
                        location.Code)
                    ||
                    string.IsNullOrWhiteSpace(
                        location.Name)))
        {
            throw new InvalidOperationException(
                "InventoryService returned an invalid location.");
        }

        if (locations
            .GroupBy(
                location =>
                    location.Code,
                StringComparer.OrdinalIgnoreCase)
            .Any(
                group =>
                    group.Count() > 1))
        {
            throw new InvalidOperationException(
                "InventoryService returned duplicate location codes.");
        }

        if (locations.Any(
                location =>
                    location.DistanceKm < 0
                    ||
                    location.WorkloadPercent
                        is < 0 or > 100
                    ||
                    location.DailyCapacity < 0
                    ||
                    location.CurrentOrders < 0
                    ||
                    location.CurrentOrders >
                    location.DailyCapacity))
        {
            throw new InvalidOperationException(
                "InventoryService returned invalid operational values.");
        }
    }

    private static void ValidateInventoryResponses(
        IReadOnlyCollection<
            Contracts.InventoryResponse> inventory)
    {
        if (inventory.Any(
                row =>
                    row.Id ==
                    Guid.Empty
                    ||
                    row.ProductId ==
                    Guid.Empty
                    ||
                    row.LocationId ==
                    Guid.Empty
                    ||
                    string.IsNullOrWhiteSpace(
                        row.LocationCode)))
        {
            throw new InvalidOperationException(
                "InventoryService returned an invalid inventory identity.");
        }

        if (inventory.Any(
                row =>
                    row.AvailableQuantity < 0
                    ||
                    row.ReservedQuantity < 0
                    ||
                    row.AvailableToSell < 0
                    ||
                    row.ReorderLevel < 0
                    ||
                    row.ReservedQuantity >
                    row.AvailableQuantity))
        {
            throw new InvalidOperationException(
                "InventoryService returned invalid inventory quantities.");
        }

        if (inventory
            .GroupBy(
                row =>
                    new
                    {
                        row.ProductId,

                        LocationCode =
                            row.LocationCode
                                .ToUpperInvariant()
                    })
            .Any(
                group =>
                    group.Count() > 1))
        {
            throw new InvalidOperationException(
                "InventoryService returned duplicate product/location inventory.");
        }
    }
}