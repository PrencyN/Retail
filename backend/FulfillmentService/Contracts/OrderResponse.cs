namespace FulfillmentService.Contracts;

public sealed class OrderResponse
{
    public Guid Id { get; init; }

    public string Reference { get; init; } = string.Empty;

    public string CustomerZone { get; init; } = string.Empty;

    public string Status { get; init; } = string.Empty;

    public DateTime CreatedAtUtc { get; init; }

    public List<OrderItemResponse> Items { get; init; } = [];
}

public sealed class OrderItemResponse
{
    public Guid ProductId { get; init; }

    public int Quantity { get; init; }
}