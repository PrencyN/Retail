using FulfillmentService.Clients;
using FulfillmentService.Contracts;
using FulfillmentService.Domain;
using FulfillmentService.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

var builder =
    WebApplication.CreateBuilder(args);

// =======================================================
// MICROSOFT ENTRA ID AUTHENTICATION
// =======================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(
        builder.Configuration,
        "AzureAd");

// =======================================================
// AUTHORIZATION
// =======================================================

builder.Services.AddAuthorization(
    options =>
    {
        options.AddPolicy(
            "FulfillmentManagerOrAdmin",
            policy =>
            {
                policy.RequireAuthenticatedUser();

                policy.RequireRole(
                    "FulfillmentManager",
                    "Admin");
            });
    });

// =======================================================
// DOMAIN SERVICES
// =======================================================

builder.Services.AddSingleton<
    FulfillmentScorer>();

builder.Services.AddScoped<
    FulfillmentOrchestrator>();

// =======================================================
// ORDER SERVICE CLIENT
// =======================================================

builder.Services.AddHttpClient<
    OrderServiceClient>(
    client =>
    {
        var baseUrl =
            builder.Configuration[
                "Services:OrderService"];

        if (string.IsNullOrWhiteSpace(
                baseUrl))
        {
            throw new InvalidOperationException(
                "OrderService URL is missing.");
        }

        client.BaseAddress =
            new Uri(baseUrl);

        client.Timeout =
            TimeSpan.FromSeconds(5);
    });

// =======================================================
// INVENTORY SERVICE CLIENT
// =======================================================

builder.Services.AddHttpClient<
    InventoryServiceClient>(
    client =>
    {
        var baseUrl =
            builder.Configuration[
                "Services:InventoryService"];

        if (string.IsNullOrWhiteSpace(
                baseUrl))
        {
            throw new InvalidOperationException(
                "InventoryService URL is missing.");
        }

        client.BaseAddress =
            new Uri(baseUrl);

        client.Timeout =
            TimeSpan.FromSeconds(5);
    });

// =======================================================
// CORS
// =======================================================

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "ReactApp",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

// =======================================================
// BUILD APP
// =======================================================

var app =
    builder.Build();

// =======================================================
// MIDDLEWARE
// =======================================================

app.UseCors(
    "ReactApp");

app.UseAuthentication();

app.UseAuthorization();

// =======================================================
// PUBLIC HEALTH CHECK
// =======================================================

app.MapGet(
    "/",
    () =>
    {
        return Results.Ok(
            new
            {
                service =
                    "FulfillIQ Fulfillment Service",

                status =
                    "Healthy",

                authentication =
                    "Microsoft Entra ID",

                timestampUtc =
                    DateTime.UtcNow
            });
    });

// =======================================================
// AUTHENTICATED USER / CLAIMS CHECK
// =======================================================

app.MapGet(
    "/api/auth/me",
    (
        HttpContext context) =>
    {
        var user =
            context.User;

        var roles =
            user.Claims
                .Where(claim =>
                    claim.Type == "roles"
                    ||
                    claim.Type.EndsWith(
                        "/claims/role",
                        StringComparison.OrdinalIgnoreCase))
                .Select(claim =>
                    claim.Value)
                .Distinct()
                .ToArray();

        var scopes =
            user.Claims
                .Where(claim =>
                    claim.Type == "scp")
                .SelectMany(claim =>
                    claim.Value.Split(
                        ' ',
                        StringSplitOptions
                            .RemoveEmptyEntries))
                .Distinct()
                .ToArray();

        return Results.Ok(
            new
            {
                authenticated =
                    user.Identity
                        ?.IsAuthenticated
                    ?? false,

                name =
                    user.Identity
                        ?.Name,

                roles,

                scopes
            });
    })
    .RequireAuthorization();

// =======================================================
// MANUAL FULFILLMENT CALCULATION
// =======================================================

app.MapPost(
    "/api/fulfillment/calculate",
    (
        CalculateFulfillmentRequest request,
        FulfillmentScorer scorer) =>
    {
        try
        {
            var policy =
                request.Policy
                ?? new RoutingPolicy();

            var decision =
                scorer.Calculate(
                    request.OrderReference,
                    request.Items,
                    request.Candidates,
                    policy);

            return Results.Ok(
                decision);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        exception.Message
                });
        }
    })
    .RequireAuthorization(
        "FulfillmentManagerOrAdmin");

// =======================================================
// LIVE ORDER FULFILLMENT CALCULATION
//
// React
//   -> Entra access token
//   -> FulfillmentService
//   -> OrderService
//   -> InventoryService
//   -> FulfillmentScorer
//   -> recommendation
// =======================================================

app.MapPost(
    "/api/fulfillment/orders/{reference}/calculate",
    async (
        string reference,
        FulfillmentOrchestrator orchestrator,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(
                reference))
        {
            return Results.BadRequest(
                new
                {
                    message =
                        "Order reference is required."
                });
        }

        var normalizedReference =
            reference
                .Trim()
                .ToUpperInvariant();

        try
        {
            var decision =
                await orchestrator
                    .CalculateForOrderAsync(
                        normalizedReference,
                        policy: null,
                        cancellationToken);

            if (decision is null)
            {
                return Results.NotFound(
                    new
                    {
                        message =
                            "Order not found."
                    });
            }

            return Results.Ok(
                decision);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    message =
                        exception.Message
                });
        }
        catch (InvalidOperationException exception)
        {
            return Results.UnprocessableEntity(
                new
                {
                    message =
                        exception.Message
                });
        }
        catch (HttpRequestException)
        {
            return Results.Problem(
                title:
                    "Dependent service unavailable",

                detail:
                    "OrderService or InventoryService " +
                    "could not be reached.",

                statusCode:
                    StatusCodes
                        .Status503ServiceUnavailable);
        }
        catch (TaskCanceledException)
        {
            return Results.Problem(
                title:
                    "Dependent service timeout",

                detail:
                    "OrderService or InventoryService " +
                    "did not respond within the " +
                    "configured timeout.",

                statusCode:
                    StatusCodes
                        .Status504GatewayTimeout);
        }
    })
    .RequireAuthorization(
        "FulfillmentManagerOrAdmin");

// =======================================================
// RUN
// =======================================================

app.Run();