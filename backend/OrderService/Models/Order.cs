namespace OrderService.Models;

public class Order
{
    public Guid Id { get; set; }

    public string Reference { get; set; } = string.Empty;

    public string CustomerZone { get; set; } = string.Empty;

    public string Status { get; set; } = "Created";

    public DateTime CreatedAtUtc { get; set; }

    public List<OrderItem> Items { get; set; } = [];
}