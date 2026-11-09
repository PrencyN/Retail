using Microsoft.EntityFrameworkCore;
using OrderService.Data;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration
        .GetConnectionString("OrderDatabase");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "OrderDatabase connection string is missing.");
}

builder.Services.AddDbContext<OrderDbContext>(
    options =>
    {
        options.UseNpgsql(connectionString);
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "ReactApp",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

var app = builder.Build();

app.UseCors("ReactApp");

// Seed one synthetic Pod 14 order.
using (var scope = app.Services.CreateScope())
{
    var db =
        scope.ServiceProvider
            .GetRequiredService<OrderDbContext>();

    await OrderSeeder.SeedAsync(db);
}

// Health
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        service = "FulfillIQ Order Service",
        status = "Healthy"
    });
});

// All orders
app.MapGet(
    "/api/orders",
    async (
        OrderDbContext db,
        CancellationToken cancellationToken) =>
    {
        var orders =
            await db.Orders
                .AsNoTracking()
                .Include(x => x.Items)
                .OrderByDescending(x => x.CreatedAtUtc)
                .ToListAsync(cancellationToken);

        return Results.Ok(orders);
    });

// Order by reference
app.MapGet(
    "/api/orders/{reference}",
    async (
        string reference,
        OrderDbContext db,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(reference))
        {
            return Results.BadRequest(new
            {
                message = "Order reference is required"
            });
        }

        var normalizedReference =
            reference.Trim().ToUpperInvariant();

        var order =
            await db.Orders
                .AsNoTracking()
                .Include(x => x.Items)
                .FirstOrDefaultAsync(
                    x =>
                        x.Reference ==
                        normalizedReference,
                    cancellationToken);

        if (order is null)
        {
            return Results.NotFound(new
            {
                message = "Order not found"
            });
        }

        return Results.Ok(new
        {
            order.Id,

            order.Reference,

            order.CustomerZone,

            order.Status,

            order.CreatedAtUtc,

            Items = order.Items.Select(
                item => new
                {
                    item.ProductId,
                    item.Quantity
                })
        });
    });

app.Run();