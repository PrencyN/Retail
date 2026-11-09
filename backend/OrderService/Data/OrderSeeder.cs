using Microsoft.EntityFrameworkCore;
using OrderService.Models;

namespace OrderService.Data;

public static class OrderSeeder
{
    private static readonly Guid ProductAId =
        Guid.Parse(
            "03af967f-d714-444e-a396-14de174b45ca");

    private static readonly Guid ProductBId =
        Guid.Parse(
            "b624d6fe-8111-4b14-8189-894bcb54d7ba");

    private static readonly Guid ProductCId =
        Guid.Parse(
            "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99");

    public static async Task SeedAsync(
        OrderDbContext db)
    {
        if (await db.Orders.AnyAsync())
        {
            return;
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),

            Reference = "SYN-1001",

            CustomerZone = "ZONE-HYD-03",

            Status = "Created",

            CreatedAtUtc = DateTime.UtcNow
        };

        order.Items =
        [
            new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = ProductAId,
                Quantity = 2
            },

            new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = ProductBId,
                Quantity = 1
            },

            new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = ProductCId,
                Quantity = 1
            }
        ];

        await db.Orders.AddAsync(order);

        await db.SaveChangesAsync();
    }
}