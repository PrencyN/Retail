using System.Net;
using System.Net.Http.Json;
using FulfillmentService.Contracts;

namespace FulfillmentService.Clients;

public sealed class OrderServiceClient
{
    private readonly HttpClient _httpClient;

    public OrderServiceClient(
        HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<OrderResponse?> GetByReferenceAsync(
        string reference,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(reference))
        {
            throw new ArgumentException(
                "Order reference is required.",
                nameof(reference));
        }

        var normalizedReference =
            reference.Trim().ToUpperInvariant();

        using var response =
            await _httpClient.GetAsync(
                $"/api/orders/{Uri.EscapeDataString(normalizedReference)}",
                cancellationToken);

        if (response.StatusCode ==
            HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();

        return await response.Content
            .ReadFromJsonAsync<OrderResponse>(
                cancellationToken: cancellationToken);
    }
}