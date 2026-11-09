using InventoryService.Data;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// =======================================================
// DATABASE
// =======================================================

var connectionString =
    builder.Configuration.GetConnectionString(
        "InventoryDatabase");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "InventoryService database connection string " +
        "'InventoryDatabase' is missing.");
}

builder.Services.AddDbContext<InventoryDbContext>(
    options =>
    {
        options.UseNpgsql(connectionString);
    });

// =======================================================
// MICROSOFT ENTRA ID AUTHENTICATION
// =======================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(
        builder.Configuration,
        "AzureAd");

// =======================================================
// AUTHORIZATION
// =======================================================

builder.Services.AddAuthorization(
    options =>
    {
        options.AddPolicy(
            "FulfillmentManagerOrAdmin",
            policy =>
            {
                policy.RequireAuthenticatedUser();

                policy.RequireRole(
                    "FulfillmentManager",
                    "Admin");
            });
    });

// =======================================================
// CORS
// =======================================================

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "ReactApp",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

// =======================================================
// BUILD
// =======================================================

var app = builder.Build();

// =======================================================
// DATABASE MIGRATION + SEED
// =======================================================

using (var scope = app.Services.CreateScope())
{
    var database =
        scope.ServiceProvider
            .GetRequiredService<InventoryDbContext>();

    await database.Database.MigrateAsync();

    await InventorySeeder.SeedAsync(
        database);
}

// =======================================================
// MIDDLEWARE
// =======================================================

app.UseCors("ReactApp");

app.UseAuthentication();

app.UseAuthorization();

// =======================================================
// PUBLIC HEALTH CHECK
// =======================================================

app.MapGet(
    "/",
    () =>
    {
        return Results.Ok(
            new
            {
                service =
                    "FulfillIQ Inventory Service",

                status =
                    "Healthy",

                authentication =
                    "Microsoft Entra ID",

                database =
                    "InventoryDatabase",

                timestampUtc =
                    DateTime.UtcNow
            });
    });

// =======================================================
// PUBLIC LOCATIONS
//
// Public temporarily because FulfillmentService
// calls InventoryService without a service token.
// =======================================================

app.MapGet(
    "/api/locations",
    async (
        InventoryDbContext database,
        CancellationToken cancellationToken) =>
    {
        var locations =
            await database.Locations
                .AsNoTracking()
                .OrderBy(
                    location =>
                        location.Code)
                .Select(
                    location =>
                        new
                        {
                            id =
                                location.Id,

                            code =
                                location.Code,

                            name =
                                location.Name,

                            city =
                                location.City,

                            type =
                                location.Type,

                            distanceKm =
                                location.DistanceKm,

                            workloadPercent =
                                location.WorkloadPercent,

                            dailyCapacity =
                                location.DailyCapacity,

                            currentOrders =
                                location.CurrentOrders,

                            remainingCapacity =
                                Math.Max(
                                    0,
                                    location.DailyCapacity -
                                    location.CurrentOrders)
                        })
                .ToListAsync(
                    cancellationToken);

        return Results.Ok(locations);
    });

// =======================================================
// PUBLIC INVENTORY BY PRODUCT
//
// Public temporarily because FulfillmentService
// retrieves inventory through this endpoint.
// =======================================================

app.MapGet(
    "/api/inventory/{productId:guid}",
    async (
        Guid productId,
        InventoryDbContext database,
        CancellationToken cancellationToken) =>
    {
        var inventory =
            await database.Inventories
                .AsNoTracking()
                .Where(
                    item =>
                        item.ProductId ==
                        productId)
                .Join(
                    database.Locations
                        .AsNoTracking(),

                    item =>
                        item.LocationId,

                    location =>
                        location.Id,

                    (
                        item,
                        location) =>
                        new
                        {
                            id =
                                item.Id,

                            productId =
                                item.ProductId,

                            locationId =
                                location.Id,

                            locationCode =
                                location.Code,

                            locationName =
                                location.Name,

                            locationType =
                                location.Type,

                            distanceKm =
                                location.DistanceKm,

                            workloadPercent =
                                location.WorkloadPercent,

                            dailyCapacity =
                                location.DailyCapacity,

                            currentOrders =
                                location.CurrentOrders,

                            remainingCapacity =
                                Math.Max(
                                    0,
                                    location.DailyCapacity -
                                    location.CurrentOrders),

                            availableQuantity =
                                item.AvailableQuantity,

                            reservedQuantity =
                                item.ReservedQuantity,

                            availableToSell =
                                Math.Max(
                                    0,
                                    item.AvailableQuantity -
                                    item.ReservedQuantity),

                            reorderLevel =
                                item.ReorderLevel,

                            status =
                                item.AvailableQuantity -
                                item.ReservedQuantity <= 0
                                    ? "Out of Stock"

                                    : item.AvailableQuantity -
                                      item.ReservedQuantity <=
                                      item.ReorderLevel

                                        ? "Low Stock"

                                        : "In Stock"
                        })
                .OrderBy(
                    item =>
                        item.locationCode)
                .ToListAsync(
                    cancellationToken);

        if (inventory.Count == 0)
        {
            return Results.NotFound(
                new
                {
                    message =
                        "Inventory not found for this product."
                });
        }

        return Results.Ok(inventory);
    });

// =======================================================
// PROTECTED WORKLOAD UPDATE
//
// Requires:
// FulfillmentManager OR Admin
// =======================================================

app.MapPut(
    "/api/locations/{code}/workload",
    async (
        string code,
        UpdateWorkloadRequest request,
        InventoryDbContext database,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Location code is required."
                });
        }

        if (request.WorkloadPercent is < 0 or > 100)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Workload percentage must be " +
                        "between 0 and 100."
                });
        }

        var normalizedCode =
            code
                .Trim()
                .ToUpperInvariant();

        var location =
            await database.Locations
                .SingleOrDefaultAsync(
                    item =>
                        item.Code ==
                        normalizedCode,
                    cancellationToken);

        if (location is null)
        {
            return Results.NotFound(
                new
                {
                    message =
                        $"Location '{normalizedCode}' " +
                        "was not found."
                });
        }

        var previousWorkloadPercent =
            location.WorkloadPercent;

        location.WorkloadPercent =
            request.WorkloadPercent;

        // Keep CurrentOrders consistent with workload.
        //
        // Example:
        // DailyCapacity = 120
        // Workload = 95%
        // CurrentOrders = 114
        // RemainingCapacity = 6

        location.CurrentOrders =
            (int)Math.Round(
                location.DailyCapacity *
                request.WorkloadPercent /
                100m,
                MidpointRounding.AwayFromZero);

        await database.SaveChangesAsync(
            cancellationToken);

        var remainingCapacity =
            Math.Max(
                0,
                location.DailyCapacity -
                location.CurrentOrders);

        return Results.Ok(
            new
            {
                message =
                    "Location workload updated successfully.",

                code =
                    location.Code,

                locationName =
                    location.Name,

                previousWorkloadPercent,

                workloadPercent =
                    location.WorkloadPercent,

                dailyCapacity =
                    location.DailyCapacity,

                currentOrders =
                    location.CurrentOrders,

                remainingCapacity
            });
    })
    .RequireAuthorization(
        "FulfillmentManagerOrAdmin");

// =======================================================
// PROTECTED INVENTORY UPDATE
//
// Requires:
// FulfillmentManager OR Admin
// =======================================================

app.MapPut(
    "/api/inventory/{productId:guid}/{locationCode}",
    async (
        Guid productId,
        string locationCode,
        UpdateInventoryRequest request,
        InventoryDbContext database,
        CancellationToken cancellationToken) =>
    {
        // ------------------------------------------------
        // VALIDATION
        // ------------------------------------------------

        if (productId == Guid.Empty)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "A valid product ID is required."
                });
        }

        if (string.IsNullOrWhiteSpace(
                locationCode))
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Location code is required."
                });
        }

        if (request.AvailableQuantity < 0)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Available quantity cannot be negative."
                });
        }

        if (request.ReservedQuantity < 0)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Reserved quantity cannot be negative."
                });
        }

        if (request.ReorderLevel < 0)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Reorder level cannot be negative."
                });
        }

        if (request.ReservedQuantity >
            request.AvailableQuantity)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Reserved quantity cannot exceed " +
                        "available quantity."
                });
        }

        // ------------------------------------------------
        // LOCATION
        // ------------------------------------------------

        var normalizedLocationCode =
            locationCode
                .Trim()
                .ToUpperInvariant();

        var location =
            await database.Locations
                .SingleOrDefaultAsync(
                    item =>
                        item.Code ==
                        normalizedLocationCode,
                    cancellationToken);

        if (location is null)
        {
            return Results.NotFound(
                new
                {
                    message =
                        $"Location '{normalizedLocationCode}' " +
                        "was not found."
                });
        }

        // ------------------------------------------------
        // INVENTORY
        // ------------------------------------------------

        var inventory =
            await database.Inventories
                .SingleOrDefaultAsync(
                    item =>
                        item.ProductId ==
                        productId
                        &&
                        item.LocationId ==
                        location.Id,
                    cancellationToken);

        if (inventory is null)
        {
            return Results.NotFound(
                new
                {
                    message =
                        "Inventory was not found for the " +
                        "supplied product and location."
                });
        }

        // ------------------------------------------------
        // STORE PREVIOUS VALUES
        // ------------------------------------------------

        var previousAvailableQuantity =
            inventory.AvailableQuantity;

        var previousReservedQuantity =
            inventory.ReservedQuantity;

        // ------------------------------------------------
        // UPDATE
        // ------------------------------------------------

        inventory.AvailableQuantity =
            request.AvailableQuantity;

        inventory.ReservedQuantity =
            request.ReservedQuantity;

        inventory.ReorderLevel =
            request.ReorderLevel;

        await database.SaveChangesAsync(
            cancellationToken);

        // ------------------------------------------------
        // CALCULATE DERIVED VALUES
        // ------------------------------------------------

        var availableToSell =
            Math.Max(
                0,
                inventory.AvailableQuantity -
                inventory.ReservedQuantity);

        var status =
            availableToSell <= 0

                ? "Out of Stock"

                : availableToSell <=
                  inventory.ReorderLevel

                    ? "Low Stock"

                    : "In Stock";

        // ------------------------------------------------
        // RESPONSE
        // ------------------------------------------------

        return Results.Ok(
            new
            {
                message =
                    "Inventory updated successfully.",

                productId =
                    inventory.ProductId,

                locationCode =
                    location.Code,

                locationName =
                    location.Name,

                previousAvailableQuantity,

                previousReservedQuantity,

                availableQuantity =
                    inventory.AvailableQuantity,

                reservedQuantity =
                    inventory.ReservedQuantity,

                availableToSell,

                reorderLevel =
                    inventory.ReorderLevel,

                status
            });
    })
    .RequireAuthorization(
        "FulfillmentManagerOrAdmin");

// =======================================================
// AUTHENTICATED USER / CLAIMS TEST
// =======================================================

app.MapGet(
    "/api/auth/me",
    (
        HttpContext context) =>
    {
        var user =
            context.User;

        var roles =
            user.Claims
                .Where(
                    claim =>
                        claim.Type == "roles"
                        ||
                        claim.Type.EndsWith(
                            "/claims/role",
                            StringComparison.OrdinalIgnoreCase))
                .Select(
                    claim =>
                        claim.Value)
                .Distinct()
                .ToArray();

        var scopes =
            user.Claims
                .Where(
                    claim =>
                        claim.Type == "scp")
                .SelectMany(
                    claim =>
                        claim.Value.Split(
                            ' ',
                            StringSplitOptions
                                .RemoveEmptyEntries))
                .Distinct()
                .ToArray();

        return Results.Ok(
            new
            {
                authenticated =
                    user.Identity
                        ?.IsAuthenticated
                    ?? false,

                name =
                    user.Identity
                        ?.Name,

                roles,

                scopes
            });
    })
    .RequireAuthorization();

// =======================================================
// RUN
// =======================================================

app.Run();

// =======================================================
// REQUEST CONTRACTS
// =======================================================

public sealed record UpdateWorkloadRequest(
    int WorkloadPercent);

public sealed record UpdateInventoryRequest(
    int AvailableQuantity,
    int ReservedQuantity,
    int ReorderLevel);