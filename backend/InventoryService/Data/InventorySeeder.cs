using InventoryService.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Data;

public static class InventorySeeder
{
    // =====================================================
    // REAL PRODUCT IDS FROM CATALOG SERVICE
    // =====================================================

    private static readonly Guid RunningShoeProductId =
        Guid.Parse(
            "03af967f-d714-444e-a396-14de174b45ca");

    private static readonly Guid ClothingProductId =
        Guid.Parse(
            "b624d6fe-8111-4b14-8189-894bcb54d7ba");

    private static readonly Guid ElectronicsProductId =
        Guid.Parse(
            "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99");

    // =====================================================
    // MAIN SEED METHOD
    // =====================================================

    public static async Task SeedAsync(
        InventoryDbContext db)
    {
        await SeedLocationsAsync(db);

        await SeedInventoryAsync(db);
    }

    // =====================================================
    // LOCATIONS
    // =====================================================

    private static async Task SeedLocationsAsync(
        InventoryDbContext db)
    {
        if (await db.Locations.AnyAsync())
        {
            return;
        }

        var locations = new List<Location>
        {
            new()
            {
                Id = Guid.NewGuid(),

                Code = "HYD-01",

                Name = "Hyderabad Central Store",

                City = "Hyderabad",

                Type = "Store",

                DistanceKm = 8,

                WorkloadPercent = 60,

                DailyCapacity = 100,

                CurrentOrders = 60
            },

            new()
            {
                Id = Guid.NewGuid(),

                Code = "HYD-02",

                Name = "Hitech City Store",

                City = "Hyderabad",

                Type = "Store",

                DistanceKm = 5,

                WorkloadPercent = 85,

                DailyCapacity = 80,

                CurrentOrders = 68
            },

            new()
            {
                Id = Guid.NewGuid(),

                Code = "HYD-03",

                Name = "Kukatpally Store",

                City = "Hyderabad",

                Type = "Store",

                DistanceKm = 10,

                WorkloadPercent = 25,

                DailyCapacity = 120,

                CurrentOrders = 30
            },

            new()
            {
                Id = Guid.NewGuid(),

                Code = "WH-01",

                Name =
                    "Central Fulfillment Warehouse",

                City = "Hyderabad",

                Type = "Warehouse",

                DistanceKm = 14,

                WorkloadPercent = 40,

                DailyCapacity = 300,

                CurrentOrders = 120
            }
        };

        await db.Locations.AddRangeAsync(
            locations);

        await db.SaveChangesAsync();
    }

    // =====================================================
    // INVENTORY
    // =====================================================

    private static async Task SeedInventoryAsync(
        InventoryDbContext db)
    {
        var requiredProductIds =
            new[]
            {
                RunningShoeProductId,
                ClothingProductId,
                ElectronicsProductId
            };

        // Check specifically for our Pod 14 demo inventory.
        var existingCount =
            await db.Inventories.CountAsync(
                inventory =>
                    requiredProductIds.Contains(
                        inventory.ProductId));

        // 3 products x 4 locations = 12 rows.
        if (existingCount >= 12)
        {
            return;
        }

        var locations =
            await db.Locations
                .ToDictionaryAsync(
                    location => location.Code);

        var hyd01 =
            locations["HYD-01"];

        var hyd02 =
            locations["HYD-02"];

        var hyd03 =
            locations["HYD-03"];

        var warehouse =
            locations["WH-01"];

        // Remove partial rows for these products
        // before recreating the complete matrix.
        var oldRows =
            await db.Inventories
                .Where(inventory =>
                    requiredProductIds.Contains(
                        inventory.ProductId))
                .ToListAsync();

        if (oldRows.Count > 0)
        {
            db.Inventories.RemoveRange(
                oldRows);

            await db.SaveChangesAsync();
        }

        var inventory =
            new List<Inventory>
            {
                // =========================================
                // RUNNING SHOE
                // =========================================

                Create(
                    RunningShoeProductId,
                    hyd01.Id,
                    available: 10,
                    reserved: 2,
                    reorderLevel: 3),

                Create(
                    RunningShoeProductId,
                    hyd02.Id,
                    available: 8,
                    reserved: 1,
                    reorderLevel: 3),

                Create(
                    RunningShoeProductId,
                    hyd03.Id,
                    available: 20,
                    reserved: 2,
                    reorderLevel: 4),

                Create(
                    RunningShoeProductId,
                    warehouse.Id,
                    available: 35,
                    reserved: 5,
                    reorderLevel: 8),

                // =========================================
                // CLOTHING
                // =========================================

                Create(
                    ClothingProductId,
                    hyd01.Id,
                    available: 7,
                    reserved: 1,
                    reorderLevel: 2),

                Create(
                    ClothingProductId,
                    hyd02.Id,
                    available: 5,
                    reserved: 1,
                    reorderLevel: 2),

                Create(
                    ClothingProductId,
                    hyd03.Id,
                    available: 10,
                    reserved: 2,
                    reorderLevel: 3),

                Create(
                    ClothingProductId,
                    warehouse.Id,
                    available: 25,
                    reserved: 3,
                    reorderLevel: 6),

                // =========================================
                // ELECTRONICS
                //
                // HYD-01 intentionally has ZERO stock.
                // This creates the incomplete-basket
                // negative case required for Pod 14.
                // =========================================

                Create(
                    ElectronicsProductId,
                    hyd01.Id,
                    available: 0,
                    reserved: 0,
                    reorderLevel: 2),

                Create(
                    ElectronicsProductId,
                    hyd02.Id,
                    available: 4,
                    reserved: 1,
                    reorderLevel: 2),

                Create(
                    ElectronicsProductId,
                    hyd03.Id,
                    available: 8,
                    reserved: 1,
                    reorderLevel: 2),

                Create(
                    ElectronicsProductId,
                    warehouse.Id,
                    available: 30,
                    reserved: 4,
                    reorderLevel: 6)
            };

        await db.Inventories.AddRangeAsync(
            inventory);

        await db.SaveChangesAsync();
    }

    // =====================================================
    // HELPER
    // =====================================================

    private static Inventory Create(
        Guid productId,
        Guid locationId,
        int available,
        int reserved,
        int reorderLevel)
    {
        return new Inventory
        {
            Id = Guid.NewGuid(),

            ProductId = productId,

            LocationId = locationId,

            AvailableQuantity = available,

            ReservedQuantity = reserved,

            ReorderLevel = reorderLevel
        };
    }
}