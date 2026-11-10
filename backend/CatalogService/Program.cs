using CatalogService.Data;
using CatalogService.Security;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    DatabaseConnectionValidator.GetRequiredSecureConnectionString(
        builder.Configuration,
        "CatalogDatabase",
        builder.Environment);

builder.Services.AddDbContext<CatalogDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging(false);
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors("ReactApp");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    await ProductSeeder.SeedAsync(db);
}

app.MapGet("/", () => Results.Ok(new
{
    service = "RetailIQ Catalog Service",
    status = "Healthy"
}));

app.MapGet("/api/products", async (CatalogDbContext db) =>
{
    var products = await db.Products.AsNoTracking()
        .OrderBy(p => p.Name)
        .ToListAsync();
    return Results.Ok(products);
});

app.MapGet("/api/products/{id:guid}", async (Guid id, CatalogDbContext db) =>
{
    var product = await db.Products.AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == id);
    return product is null
        ? Results.NotFound(new { message = "Product not found" })
        : Results.Ok(product);
});

app.MapGet("/api/products/search", async (string? q, CatalogDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(q))
        return Results.BadRequest(new { message = "Search query is required" });

    var searchTerm = q.Trim();
    if (searchTerm.Length > 100)
        return Results.BadRequest(new { message = "Search query cannot exceed 100 characters" });

    var pattern = $"%{searchTerm}%";
    var products = await db.Products.AsNoTracking()
        .Where(p => EF.Functions.ILike(p.Name, pattern)
            || EF.Functions.ILike(p.Description, pattern)
            || EF.Functions.ILike(p.Category, pattern)
            || EF.Functions.ILike(p.Brand, pattern)
            || EF.Functions.ILike(p.Color, pattern))
        .OrderBy(p => p.Name)
        .ToListAsync();
    return Results.Ok(products);
});

app.MapGet("/api/products/filter", async (
    string? category,
    string? brand,
    string? color,
    decimal? minPrice,
    decimal? maxPrice,
    CatalogDbContext db) =>
{
    if (minPrice is < 0)
        return Results.BadRequest(new { message = "Minimum price cannot be negative" });
    if (maxPrice is < 0)
        return Results.BadRequest(new { message = "Maximum price cannot be negative" });
    if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > maxPrice.Value)
        return Results.BadRequest(new { message = "Minimum price cannot be greater than maximum price" });

    var query = db.Products.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(category))
    {
        var pattern = $"%{category.Trim()}%";
        query = query.Where(p => EF.Functions.ILike(p.Category, pattern));
    }
    if (!string.IsNullOrWhiteSpace(brand))
    {
        var pattern = $"%{brand.Trim()}%";
        query = query.Where(p => EF.Functions.ILike(p.Brand, pattern));
    }
    if (!string.IsNullOrWhiteSpace(color))
    {
        var pattern = $"%{color.Trim()}%";
        query = query.Where(p => EF.Functions.ILike(p.Color, pattern));
    }
    if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
    if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);

    var products = await query.OrderBy(p => p.Price).ThenBy(p => p.Name).ToListAsync();
    return Results.Ok(products);
});

app.MapGet("/api/products/count", async (CatalogDbContext db) =>
    Results.Ok(new { count = await db.Products.CountAsync() }));

app.Run();
