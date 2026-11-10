using InventoryService.Contracts;
using InventoryService.Data;
using InventoryService.Security;
using InventoryService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    DatabaseConnectionValidator.GetRequiredSecureConnectionString(
        builder.Configuration,
        "InventoryDatabase",
        builder.Environment);

builder.Services.AddDbContext<InventoryDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging(false);
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});
builder.Services.AddScoped<InventoryConcurrencyService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration, "AzureAd");

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("FulfillmentManagerOrAdmin", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("FulfillmentManager", "Admin");
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
    await database.Database.MigrateAsync();
    await InventorySeeder.SeedAsync(database);
}

app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    service = "FulfillIQ Inventory Service",
    status = "Healthy",
    authentication = "Microsoft Entra ID",
    database = "InventoryDatabase",
    timestampUtc = DateTime.UtcNow
}));

app.MapGet("/api/locations", async (InventoryDbContext database, CancellationToken ct) =>
{
    var locations = await database.Locations.AsNoTracking()
        .OrderBy(x => x.Code)
        .Select(x => new
        {
            id = x.Id, code = x.Code, name = x.Name, city = x.City, type = x.Type,
            distanceKm = x.DistanceKm, workloadPercent = x.WorkloadPercent,
            dailyCapacity = x.DailyCapacity, currentOrders = x.CurrentOrders,
            remainingCapacity = Math.Max(0, x.DailyCapacity - x.CurrentOrders)
        }).ToListAsync(ct);
    return Results.Ok(locations);
});

app.MapGet("/api/inventory/{productId:guid}", async (
    Guid productId, InventoryDbContext database, CancellationToken ct) =>
{
    var inventory = await database.Inventories.AsNoTracking()
        .Where(x => x.ProductId == productId)
        .Join(database.Locations.AsNoTracking(), item => item.LocationId, location => location.Id,
            (item, location) => new
            {
                id = item.Id, productId = item.ProductId, locationId = location.Id,
                locationCode = location.Code, locationName = location.Name,
                locationType = location.Type, distanceKm = location.DistanceKm,
                workloadPercent = location.WorkloadPercent, dailyCapacity = location.DailyCapacity,
                currentOrders = location.CurrentOrders,
                remainingCapacity = Math.Max(0, location.DailyCapacity - location.CurrentOrders),
                availableQuantity = item.AvailableQuantity, reservedQuantity = item.ReservedQuantity,
                availableToSell = Math.Max(0, item.AvailableQuantity - item.ReservedQuantity),
                reorderLevel = item.ReorderLevel, version = item.Version,
                status = item.AvailableQuantity - item.ReservedQuantity <= 0 ? "Out of Stock"
                    : item.AvailableQuantity - item.ReservedQuantity <= item.ReorderLevel ? "Low Stock" : "In Stock"
            })
        .OrderBy(x => x.locationCode)
        .ToListAsync(ct);

    return inventory.Count == 0
        ? Results.NotFound(new { message = "Inventory not found for this product." })
        : Results.Ok(inventory);
});

app.MapPut("/api/locations/{code}/workload", async (
    string code, UpdateWorkloadRequest request, InventoryDbContext database, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(code))
        return Results.BadRequest(new { message = "Location code is required." });
    if (request.WorkloadPercent is < 0 or > 100)
        return Results.BadRequest(new { message = "Workload percentage must be between 0 and 100." });

    var normalizedCode = code.Trim().ToUpperInvariant();
    var location = await database.Locations.SingleOrDefaultAsync(x => x.Code == normalizedCode, ct);
    if (location is null)
        return Results.NotFound(new { message = $"Location '{normalizedCode}' was not found." });

    var previous = location.WorkloadPercent;
    location.WorkloadPercent = request.WorkloadPercent;
    location.CurrentOrders = (int)Math.Round(
        location.DailyCapacity * request.WorkloadPercent / 100m,
        MidpointRounding.AwayFromZero);
    await database.SaveChangesAsync(ct);

    return Results.Ok(new
    {
        message = "Location workload updated successfully.", code = location.Code,
        locationName = location.Name, previousWorkloadPercent = previous,
        workloadPercent = location.WorkloadPercent, dailyCapacity = location.DailyCapacity,
        currentOrders = location.CurrentOrders,
        remainingCapacity = Math.Max(0, location.DailyCapacity - location.CurrentOrders)
    });
}).RequireAuthorization("FulfillmentManagerOrAdmin");

app.MapPut("/api/inventory/{productId:guid}/{locationCode}", async (
    Guid productId, string locationCode, UpdateInventoryRequest request,
    InventoryConcurrencyService service, CancellationToken ct) =>
{
    var result = await service.UpdateAsync(productId, locationCode, request, ct);
    return result.Type switch
    {
        InventoryUpdateResultType.Success => Results.Ok(result.Value),
        InventoryUpdateResultType.BadRequest => Results.BadRequest(result.Value),
        InventoryUpdateResultType.NotFound => Results.NotFound(result.Value),
        InventoryUpdateResultType.Conflict => Results.Conflict(result.Value),
        _ => Results.Problem(statusCode: StatusCodes.Status500InternalServerError)
    };
}).RequireAuthorization("FulfillmentManagerOrAdmin");

app.MapGet("/api/auth/me", (HttpContext context) =>
{
    var user = context.User;
    var roles = user.Claims.Where(x => x.Type == "roles"
        || x.Type.EndsWith("/claims/role", StringComparison.OrdinalIgnoreCase))
        .Select(x => x.Value).Distinct().ToArray();
    var scopes = user.Claims.Where(x => x.Type == "scp")
        .SelectMany(x => x.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        .Distinct().ToArray();
    return Results.Ok(new
    {
        authenticated = user.Identity?.IsAuthenticated ?? false,
        name = user.Identity?.Name, roles, scopes
    });
}).RequireAuthorization();

app.Run();
