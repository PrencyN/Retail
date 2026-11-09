using FulfillmentService.Clients;
using FulfillmentService.Domain;

namespace FulfillmentService.Services;

public sealed class FulfillmentOrchestrator
{
    private readonly OrderServiceClient
        _orderServiceClient;

    private readonly InventoryServiceClient
        _inventoryServiceClient;

    private readonly FulfillmentScorer
        _fulfillmentScorer;

    public FulfillmentOrchestrator(
        OrderServiceClient orderServiceClient,
        InventoryServiceClient inventoryServiceClient,
        FulfillmentScorer fulfillmentScorer)
    {
        _orderServiceClient =
            orderServiceClient;

        _inventoryServiceClient =
            inventoryServiceClient;

        _fulfillmentScorer =
            fulfillmentScorer;
    }

    public async Task<FulfillmentDecision?>
        CalculateForOrderAsync(
            string orderReference,
            RoutingPolicy? policy,
            CancellationToken cancellationToken)
    {
        var order =
            await _orderServiceClient
                .GetByReferenceAsync(
                    orderReference,
                    cancellationToken);

        if (order is null)
        {
            return null;
        }

        if (order.Items.Count == 0)
        {
            throw new InvalidOperationException(
                "The order does not contain any items.");
        }

        var locations =
            await _inventoryServiceClient
                .GetLocationsAsync(
                    cancellationToken);

        if (locations.Count == 0)
        {
            throw new InvalidOperationException(
                "No fulfillment locations are available.");
        }

        var productIds =
            order.Items
                .Select(item => item.ProductId)
                .Distinct()
                .ToList();

        /*
         * Load inventory for all required products
         * concurrently instead of making sequential calls.
         */
        var inventoryTasks =
            productIds.Select(productId =>
                _inventoryServiceClient
                    .GetInventoryByProductAsync(
                        productId,
                        cancellationToken));

        var inventoryResults =
            await Task.WhenAll(inventoryTasks);

        var allInventory =
            inventoryResults
                .SelectMany(result => result)
                .ToList();

        var requirements =
            order.Items
                .Select(item =>
                    new OrderRequirement(
                        item.ProductId,
                        item.Quantity))
                .ToList();

        var candidates =
            locations.Select(location =>
            {
                var locationInventory =
                    productIds.Select(productId =>
                    {
                        var inventory =
                            allInventory.FirstOrDefault(row =>
                                row.ProductId == productId &&
                                row.LocationCode.Equals(
                                    location.Code,
                                    StringComparison
                                        .OrdinalIgnoreCase));

                        return new ProductAvailability(
                            productId,
                            inventory?.AvailableToSell ?? 0);
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
            })
            .ToList();

        return _fulfillmentScorer.Calculate(
            order.Reference,
            requirements,
            candidates,
            policy ?? new RoutingPolicy());
    }
}