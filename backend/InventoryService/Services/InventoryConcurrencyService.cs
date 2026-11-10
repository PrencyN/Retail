using InventoryService.Contracts;
using InventoryService.Data;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Services;

public sealed class InventoryConcurrencyService
{
    private readonly InventoryDbContext _database;

    public InventoryConcurrencyService(InventoryDbContext database)
    {
        _database = database;
    }

    public async Task<InventoryUpdateResult> UpdateAsync(
        Guid productId,
        string locationCode,
        UpdateInventoryRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = Validate(productId, locationCode, request);
        if (validationError is not null)
            return InventoryUpdateResult.BadRequest(validationError);

        var normalizedCode = locationCode.Trim().ToUpperInvariant();
        var location = await _database.Locations.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Code == normalizedCode, cancellationToken);

        if (location is null)
            return InventoryUpdateResult.NotFound($"Location '{normalizedCode}' was not found.");

        var inventory = await _database.Inventories
            .SingleOrDefaultAsync(
                x => x.ProductId == productId && x.LocationId == location.Id,
                cancellationToken);

        if (inventory is null)
            return InventoryUpdateResult.NotFound(
                "Inventory was not found for the supplied product and location.");

        if (inventory.Version != request.Version)
            return InventoryUpdateResult.Conflict(CreateConflict(inventory, location.Code));

        var previousAvailable = inventory.AvailableQuantity;
        var previousReserved = inventory.ReservedQuantity;
        var originalVersion = inventory.Version;

        _database.Entry(inventory).Property(x => x.Version).OriginalValue = originalVersion;
        inventory.AvailableQuantity = request.AvailableQuantity;
        inventory.ReservedQuantity = request.ReservedQuantity;
        inventory.ReorderLevel = request.ReorderLevel;
        inventory.Version = Guid.NewGuid();

        try
        {
            await _database.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            _database.ChangeTracker.Clear();
            var current = await _database.Inventories.AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.ProductId == productId && x.LocationId == location.Id,
                    cancellationToken);

            return current is null
                ? InventoryUpdateResult.NotFound("Inventory no longer exists.")
                : InventoryUpdateResult.Conflict(CreateConflict(current, location.Code));
        }

        var availableToSell = Math.Max(0, inventory.AvailableQuantity - inventory.ReservedQuantity);
        var status = availableToSell <= 0
            ? "Out of Stock"
            : availableToSell <= inventory.ReorderLevel ? "Low Stock" : "In Stock";

        return InventoryUpdateResult.Success(new InventoryUpdateResponse(
            "Inventory updated successfully.",
            inventory.ProductId,
            location.Code,
            location.Name,
            previousAvailable,
            previousReserved,
            inventory.AvailableQuantity,
            inventory.ReservedQuantity,
            availableToSell,
            inventory.ReorderLevel,
            status,
            inventory.Version));
    }

    private static string? Validate(
        Guid productId,
        string locationCode,
        UpdateInventoryRequest request)
    {
        if (productId == Guid.Empty) return "A valid product ID is required.";
        if (string.IsNullOrWhiteSpace(locationCode)) return "Location code is required.";
        if (request.Version == Guid.Empty) return "A valid inventory version is required.";
        if (request.AvailableQuantity < 0) return "Available quantity cannot be negative.";
        if (request.ReservedQuantity < 0) return "Reserved quantity cannot be negative.";
        if (request.ReorderLevel < 0) return "Reorder level cannot be negative.";
        if (request.ReservedQuantity > request.AvailableQuantity)
            return "Reserved quantity cannot exceed available quantity.";
        return null;
    }

    private static InventoryConflictResponse CreateConflict(
        Models.Inventory inventory,
        string locationCode) =>
        new(
            "The inventory was modified by another request. Refresh and retry using the current version.",
            inventory.ProductId,
            locationCode,
            inventory.Version,
            inventory.AvailableQuantity,
            inventory.ReservedQuantity,
            inventory.ReorderLevel);
}

public sealed record InventoryUpdateResult(InventoryUpdateResultType Type, object? Value)
{
    public static InventoryUpdateResult Success(InventoryUpdateResponse value) =>
        new(InventoryUpdateResultType.Success, value);
    public static InventoryUpdateResult BadRequest(string message) =>
        new(InventoryUpdateResultType.BadRequest, new { message });
    public static InventoryUpdateResult NotFound(string message) =>
        new(InventoryUpdateResultType.NotFound, new { message });
    public static InventoryUpdateResult Conflict(InventoryConflictResponse value) =>
        new(InventoryUpdateResultType.Conflict, value);
}

public enum InventoryUpdateResultType
{
    Success,
    BadRequest,
    NotFound,
    Conflict
}
