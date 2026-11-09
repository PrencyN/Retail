using CatalogService.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// =======================================================
// DATABASE
// =======================================================

var connectionString =
    builder.Configuration
        .GetConnectionString("CatalogDatabase");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "CatalogDatabase connection string is missing."
    );
}

builder.Services.AddDbContext<CatalogDbContext>(
    options =>
    {
        options.UseNpgsql(connectionString);
    });

// =======================================================
// CORS
// =======================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "ReactApp",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173"
                )
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

var app = builder.Build();

// =======================================================
// MIDDLEWARE
// =======================================================

app.UseCors("ReactApp");

// =======================================================
// DATABASE SEEDING
// =======================================================

using (var scope = app.Services.CreateScope())
{
    var db =
        scope.ServiceProvider
            .GetRequiredService<CatalogDbContext>();

    await ProductSeeder.SeedAsync(db);
}

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
                    "RetailIQ Catalog Service",

                status = "Healthy"
            });
    });

// =======================================================
// GET ALL PRODUCTS
// =======================================================

app.MapGet(
    "/api/products",
    async (CatalogDbContext db) =>
    {
        var products =
            await db.Products
                .AsNoTracking()
                .OrderBy(p => p.Name)
                .ToListAsync();

        return Results.Ok(products);
    });

// =======================================================
// GET PRODUCT BY ID
// =======================================================

app.MapGet(
    "/api/products/{id:guid}",
    async (
        Guid id,
        CatalogDbContext db) =>
    {
        var product =
            await db.Products
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.Id == id);

        if (product is null)
        {
            return Results.NotFound(
                new
                {
                    message =
                        "Product not found"
                });
        }

        return Results.Ok(product);
    });

// =======================================================
// SEARCH PRODUCTS
// =======================================================

app.MapGet(
    "/api/products/search",
    async (
        string? q,
        CatalogDbContext db) =>
    {
        // -----------------------------------------------
        // Negative case:
        // Missing query
        // -----------------------------------------------

        if (string.IsNullOrWhiteSpace(q))
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Search query is required"
                });
        }

        var searchTerm = q.Trim();

        // -----------------------------------------------
        // Negative case:
        // Excessively large input
        // -----------------------------------------------

        if (searchTerm.Length > 100)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Search query cannot exceed 100 characters"
                });
        }

        var pattern =
            $"%{searchTerm}%";

        var products =
            await db.Products
                .AsNoTracking()
                .Where(p =>
                    EF.Functions.ILike(
                        p.Name,
                        pattern)
                    ||
                    EF.Functions.ILike(
                        p.Description,
                        pattern)
                    ||
                    EF.Functions.ILike(
                        p.Category,
                        pattern)
                    ||
                    EF.Functions.ILike(
                        p.Brand,
                        pattern)
                    ||
                    EF.Functions.ILike(
                        p.Color,
                        pattern))
                .OrderBy(p => p.Name)
                .ToListAsync();

        return Results.Ok(products);
    });

// =======================================================
// FILTERED SEARCH
//
// Examples:
//
// /api/products/filter?color=Black
//
// /api/products/filter?category=Running%20Shoes
//
// /api/products/filter?color=Black&maxPrice=5000
// =======================================================

app.MapGet(
    "/api/products/filter",
    async (
        string? category,
        string? brand,
        string? color,
        decimal? minPrice,
        decimal? maxPrice,
        CatalogDbContext db) =>
    {
        // -----------------------------------------------
        // Negative price validation
        // -----------------------------------------------

        if (minPrice.HasValue &&
            minPrice.Value < 0)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Minimum price cannot be negative"
                });
        }

        if (maxPrice.HasValue &&
            maxPrice.Value < 0)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Maximum price cannot be negative"
                });
        }

        if (minPrice.HasValue &&
            maxPrice.HasValue &&
            minPrice.Value > maxPrice.Value)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Minimum price cannot be greater than maximum price"
                });
        }

        var query =
            db.Products
                .AsNoTracking()
                .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var categoryPattern =
                $"%{category.Trim()}%";

            query =
                query.Where(
                    p =>
                        EF.Functions.ILike(
                            p.Category,
                            categoryPattern));
        }

        if (!string.IsNullOrWhiteSpace(brand))
        {
            var brandPattern =
                $"%{brand.Trim()}%";

            query =
                query.Where(
                    p =>
                        EF.Functions.ILike(
                            p.Brand,
                            brandPattern));
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            var colorPattern =
                $"%{color.Trim()}%";

            query =
                query.Where(
                    p =>
                        EF.Functions.ILike(
                            p.Color,
                            colorPattern));
        }

        if (minPrice.HasValue)
        {
            query =
                query.Where(
                    p =>
                        p.Price >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query =
                query.Where(
                    p =>
                        p.Price <= maxPrice.Value);
        }

        var products =
            await query
                .OrderBy(p => p.Price)
                .ThenBy(p => p.Name)
                .ToListAsync();

        return Results.Ok(products);
    });

// =======================================================
// PRODUCT COUNT
// =======================================================

app.MapGet(
    "/api/products/count",
    async (CatalogDbContext db) =>
    {
        var count =
            await db.Products.CountAsync();

        return Results.Ok(
            new
            {
                count
            });
    });

app.Run();