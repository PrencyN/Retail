using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Data;

public static class ProductSeeder
{
    public static async Task SeedAsync(CatalogDbContext db)
    {
        // Never insert duplicates every time the application starts.
        if (await db.Products.AnyAsync())
        {
            return;
        }

        var products = new List<Product>();

        var categories = new[]
        {
            "Running Shoes",
            "Formal Shoes",
            "Sports Shoes",
            "Clothing",
            "Electronics"
        };

        var brands = new[]
        {
            "Nike",
            "Adidas",
            "Puma",
            "Reebok",
            "RetailIQ"
        };

        var colors = new[]
        {
            "Black",
            "White",
            "Blue",
            "Grey",
            "Red"
        };

        // -------------------------------------------------
        // Generate 100 demo products
        // -------------------------------------------------

        for (var i = 1; i <= 100; i++)
        {
            var category =
                categories[(i - 1) % categories.Length];

            var brand =
                brands[(i - 1) % brands.Length];

            var color =
                colors[(i - 1) % colors.Length];

            var price =
                1999 + ((i % 12) * 500);

            products.Add(
                new Product
                {
                    Id = Guid.NewGuid(),

                    Name =
                        $"{brand} {color} {category} {i}",

                    Description =
                        $"Comfortable {color.ToLowerInvariant()} " +
                        $"{category.ToLowerInvariant()} from {brand}.",

                    Category = category,

                    Brand = brand,

                    Price = price,

                    Color = color,

                    ImageUrl = ""
                });
        }

        // -------------------------------------------------
        // Special hackathon demo products
        // -------------------------------------------------

        products.Add(
            new Product
            {
                Id = Guid.NewGuid(),

                Name =
                    "Nike Black Performance Running Shoe",

                Description =
                    "Lightweight black running shoe designed " +
                    "for everyday running and training.",

                Category = "Running Shoes",

                Brand = "Nike",

                Price = 4499,

                Color = "Black",

                ImageUrl = ""
            });

        products.Add(
            new Product
            {
                Id = Guid.NewGuid(),

                Name =
                    "Black Executive Office Shoe",

                Description =
                    "Comfortable black formal footwear " +
                    "designed for office use.",

                Category = "Formal Shoes",

                Brand = "RetailIQ",

                Price = 3799,

                Color = "Black",

                ImageUrl = ""
            });

        products.Add(
            new Product
            {
                Id = Guid.NewGuid(),

                Name =
                    "Adidas White Performance Runner",

                Description =
                    "Lightweight white running shoe " +
                    "for daily exercise.",

                Category = "Running Shoes",

                Brand = "Adidas",

                Price = 5299,

                Color = "White",

                ImageUrl = ""
            });

        await db.Products.AddRangeAsync(products);

        await db.SaveChangesAsync();
    }
}