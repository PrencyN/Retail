using FulfillmentService.Domain;

namespace FulfillmentService.Contracts;

public sealed record DecisionResponse(
    Guid DecisionId,
    bool Authoritative,
    string Source,
    DateTime CalculatedAtUtc,
    FulfillmentDecision Result)
{
    public static DecisionResponse AuthoritativeDecision(
        FulfillmentDecision decision)
    {
        return new DecisionResponse(
            DecisionId:
                decision.DecisionId,

            Authoritative:
                true,

            Source:
                "OrderService+InventoryService",

            CalculatedAtUtc:
                decision.CalculatedAtUtc,

            Result:
                decision);
    }

    public static DecisionResponse Simulation(
        FulfillmentDecision decision)
    {
        return new DecisionResponse(
            DecisionId:
                decision.DecisionId,

            Authoritative:
                false,

            Source:
                "ClientProvidedSimulation",

            CalculatedAtUtc:
                decision.CalculatedAtUtc,

            Result:
                decision);
    }
}