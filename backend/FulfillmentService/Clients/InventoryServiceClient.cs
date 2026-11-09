using System.Net;
using System.Net.Http.Json;
using FulfillmentService.Contracts;

namespace FulfillmentService.Clients;

public sealed class InventoryServiceClient
{
    private readonly HttpClient _httpClient;

    public InventoryServiceClient(
        HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<LocationResponse>>
        GetLocationsAsync(
            CancellationToken cancellationToken)
    {
        using var response =
            await _httpClient.GetAsync(
                "/api/locations",
                cancellationToken);

        response.EnsureSuccessStatusCode();

        var locations =
            await response.Content
                .ReadFromJsonAsync<List<LocationResponse>>(
                    cancellationToken:
                        cancellationToken);

        return locations ?? [];
    }

    public async Task<IReadOnlyList<InventoryResponse>>
        GetInventoryByProductAsync(
            Guid productId,
            CancellationToken cancellationToken)
    {
        if (productId == Guid.Empty)
        {
            throw new ArgumentException(
                "A valid product ID is required.",
                nameof(productId));
        }

        using var response =
            await _httpClient.GetAsync(
                $"/api/inventory/{productId}",
                cancellationToken);

        if (response.StatusCode ==
            HttpStatusCode.NotFound)
        {
            return [];
        }

        response.EnsureSuccessStatusCode();

        var inventory =
            await response.Content
                .ReadFromJsonAsync<List<InventoryResponse>>(
                    cancellationToken:
                        cancellationToken);

        return inventory ?? [];
    }
}