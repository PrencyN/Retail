using InventoryService.Contracts;
using InventoryService.Data;
using InventoryService.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

var builder =
    WebApplication.CreateBuilder(args);

// =======================================================
// DATABASE
// =======================================================

var connectionString =
    builder.Configuration
        .GetConnectionString(
            "InventoryDatabase");

if (string.IsNullOrWhiteSpace(
        connectionString))
{
    throw new InvalidOperationException(
        "InventoryService database connection string " +
        "'InventoryDatabase' is missing.");
}

builder.Services.AddDbContext<
    InventoryDbContext>(
    options =>
    {
        options.UseNpgsql(
            connectionString);
    });

builder.Services.AddScoped<
    InventoryConcurrencyService>();

// =======================================================
// MICROSOFT ENTRA ID AUTHENTICATION
// =======================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults
            .AuthenticationScheme)
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
                        "http://localhost:5173",
                        "https://fulfilliq-shell.pages.dev")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

// =======================================================
// BUILD APP
// =======================================================

var app =
    builder.Build();

// =======================================================
// DATABASE MIGRATION, SEED AND VERSION REPAIR
// =======================================================

using (var scope =
       app.Services.CreateScope())
{
    var database =
        scope.ServiceProvider
            .GetRequiredService<
                InventoryDbContext>();

    await database.Database
        .MigrateAsync();

    await InventorySeeder.SeedAsync(
        database);

    /*
     * Older rows may contain Guid.Empty when the Version
     * column was introduced after inventory data already
     * existed.
     *
     * Every inventory row must contain a real optimistic
     * concurrency token before the API starts accepting
     * update requests.
     */

    var inventoriesWithoutVersion =
        await database.Inventories
            .Where(
                inventory =>
                    inventory.Version ==
                    Guid.Empty)
            .ToListAsync();

    if (
        inventoriesWithoutVersion
            .Count >
        0
    )
    {
        foreach (
            var inventory in
            inventoriesWithoutVersion
        )
        {
            inventory.Version =
                Guid.NewGuid();
        }

        await database
            .SaveChangesAsync();
    }
}

// =======================================================
// MIDDLEWARE
// =======================================================

app.UseCors(
    "ReactApp");

app.UseAuthentication();

app.UseAuthorization();

// =======================================================
// HEALTH CHECK
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
// LOCATIONS
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
                                location
                                    .WorkloadPercent,

                            dailyCapacity =
                                location
                                    .DailyCapacity,

                            currentOrders =
                                location
                                    .CurrentOrders,

                            remainingCapacity =
                                Math.Max(
                                    0,
                                    location
                                        .DailyCapacity -
                                    location
                                        .CurrentOrders)
                        })
                .ToListAsync(
                    cancellationToken);

        return Results.Ok(
            locations);
    });

// =======================================================
// INVENTORY BY PRODUCT
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
                                location
                                    .WorkloadPercent,

                            dailyCapacity =
                                location
                                    .DailyCapacity,

                            currentOrders =
                                location
                                    .CurrentOrders,

                            remainingCapacity =
                                Math.Max(
                                    0,
                                    location
                                        .DailyCapacity -
                                    location
                                        .CurrentOrders),

                            availableQuantity =
                                item.AvailableQuantity,

                            reservedQuantity =
                                item.ReservedQuantity,

                            availableToSell =
                                Math.Max(
                                    0,
                                    item
                                        .AvailableQuantity -
                                    item
                                        .ReservedQuantity),

                            reorderLevel =
                                item.ReorderLevel,

                            version =
                                item.Version,

                            status =
                                item
                                    .AvailableQuantity -
                                item
                                    .ReservedQuantity <=
                                0
                                    ? "Out of Stock"

                                    : item
                                        .AvailableQuantity -
                                      item
                                        .ReservedQuantity <=
                                      item.ReorderLevel

                                        ? "Low Stock"

                                        : "In Stock"
                        })
                .OrderBy(
                    item =>
                        item.locationCode)
                .ToListAsync(
                    cancellationToken);

        if (
            inventory.Count ==
            0
        )
        {
            return Results.NotFound(
                new
                {
                    message =
                        "Inventory not found for this product."
                });
        }

        return Results.Ok(
            inventory);
    });

// =======================================================
// WORKLOAD UPDATE
// =======================================================

app.MapPut(
    "/api/locations/{code}/workload",
    async (
        string code,
        UpdateWorkloadRequest request,
        InventoryDbContext database,
        CancellationToken cancellationToken) =>
    {
        if (
            string.IsNullOrWhiteSpace(
                code)
        )
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Location code is required."
                });
        }

        if (
            request.WorkloadPercent
                is < 0 or > 100
        )
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

        location.CurrentOrders =
            (int)Math.Round(
                location.DailyCapacity *
                request.WorkloadPercent /
                100m,
                MidpointRounding
                    .AwayFromZero);

        await database
            .SaveChangesAsync(
                cancellationToken);

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

                remainingCapacity =
                    Math.Max(
                        0,
                        location.DailyCapacity -
                        location.CurrentOrders)
            });
    })
    .RequireAuthorization(
        "FulfillmentManagerOrAdmin");

// =======================================================
// INVENTORY UPDATE
// =======================================================

app.MapPut(
    "/api/inventory/{productId:guid}/{locationCode}",
    async (
        Guid productId,
        string locationCode,
        UpdateInventoryRequest request,
        InventoryConcurrencyService service,
        CancellationToken cancellationToken) =>
    {
        var result =
            await service.UpdateAsync(
                productId,
                locationCode,
                request,
                cancellationToken);

        return result.Type switch
        {
            InventoryUpdateResultType
                .Success =>
                Results.Ok(
                    result.Value),

            InventoryUpdateResultType
                .BadRequest =>
                Results.BadRequest(
                    result.Value),

            InventoryUpdateResultType
                .NotFound =>
                Results.NotFound(
                    result.Value),

            InventoryUpdateResultType
                .Conflict =>
                Results.Conflict(
                    result.Value),

            _ =>
                Results.Problem(
                    statusCode:
                        StatusCodes
                            .Status500InternalServerError)
        };
    })
    .RequireAuthorization(
        "FulfillmentManagerOrAdmin");

// =======================================================
// AUTHENTICATED USER
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
                        claim.Type ==
                        "roles" ||
                        claim.Type.EndsWith(
                            "/claims/role",
                            StringComparison
                                .OrdinalIgnoreCase))
                .Select(
                    claim =>
                        claim.Value)
                .Distinct()
                .ToArray();

        var scopes =
            user.Claims
                .Where(
                    claim =>
                        claim.Type ==
                        "scp")
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
                        ?.IsAuthenticated ??
                    false,

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