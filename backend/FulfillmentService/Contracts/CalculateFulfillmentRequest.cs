using FulfillmentService.Domain;

namespace FulfillmentService.Contracts;

public sealed class CalculateFulfillmentRequest
{
    public string OrderReference { get; init; } = string.Empty;

    public string CustomerZone { get; init; } = string.Empty;

    public List<OrderRequirement> Items { get; init; } = [];

    public List<CandidateLocation> Candidates { get; init; } = [];

    public RoutingPolicy? Policy { get; init; }
}