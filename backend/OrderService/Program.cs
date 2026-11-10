using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Security;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    DatabaseConnectionValidator.GetRequiredSecureConnectionString(
        builder.Configuration,
        "OrderDatabase",
        builder.Environment);

builder.Services.AddDbContext<OrderDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging(false);
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();
app.UseCors("ReactApp");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    await OrderSeeder.SeedAsync(db);
}

app.MapGet("/", () => Results.Ok(new
{
    service = "FulfillIQ Order Service",
    status = "Healthy"
}));

app.MapGet("/api/orders", async (OrderDbContext db, CancellationToken ct) =>
{
    var orders = await db.Orders.AsNoTracking()
        .Include(x => x.Items)
        .OrderByDescending(x => x.CreatedAtUtc)
        .ToListAsync(ct);
    return Results.Ok(orders);
});

app.MapGet("/api/orders/{reference}", async (
    string reference, OrderDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(reference))
        return Results.BadRequest(new { message = "Order reference is required" });

    var normalizedReference = reference.Trim().ToUpperInvariant();
    var order = await db.Orders.AsNoTracking()
        .Include(x => x.Items)
        .FirstOrDefaultAsync(x => x.Reference == normalizedReference, ct);

    if (order is null)
        return Results.NotFound(new { message = "Order not found" });

    return Results.Ok(new
    {
        order.Id, order.Reference, order.CustomerZone, order.Status, order.CreatedAtUtc,
        Items = order.Items.Select(item => new { item.ProductId, item.Quantity })
    });
});

app.Run();
