namespace FulfillmentService.Domain;

public sealed record OrderRequirement(
    Guid ProductId,
    int Quantity);