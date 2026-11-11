using FulfillmentService.Clients;
using FulfillmentService.Contracts;
using FulfillmentService.Domain;
using FulfillmentService.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

var builder =
    WebApplication.CreateBuilder(args);

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(
        builder.Configuration,
        "AzureAd");

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

builder.Services.AddSingleton<
    FulfillmentScorer>();

builder.Services.AddScoped<
    FulfillmentOrchestrator>();

builder.Services.AddScoped<
    DecisionAuditService>();

builder.Services.AddHttpClient<
    OrderServiceClient>(
    client =>
    {
        client.BaseAddress =
            GetRequiredServiceUri(
                builder.Configuration,
                "Services:OrderService");

        client.Timeout =
            TimeSpan.FromSeconds(30);
    });

builder.Services.AddHttpClient<
    InventoryServiceClient>(
    client =>
    {
        client.BaseAddress =
            GetRequiredServiceUri(
                builder.Configuration,
                "Services:InventoryService");

        client.Timeout =
            TimeSpan.FromSeconds(30);
    });

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "ReactApp",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173",
                        "https://fulfilliq-shell.pages.dev")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

var app =
    builder.Build();

app.UseCors(
    "ReactApp");

app.UseAuthentication();

app.UseAuthorization();

app.MapGet(
    "/",
    () =>
        Results.Ok(
            new
            {
                service =
                    "FulfillIQ Fulfillment Service",

                status =
                    "Healthy",

                authentication =
                    "Microsoft Entra ID",

                authoritativeEndpoint =
                    "/api/fulfillment/orders/{reference}/calculate",

                simulationEndpoint =
                    app.Environment.IsDevelopment()
                        ? "/api/fulfillment/simulate"
                        : "Disabled",

                timestampUtc =
                    DateTime.UtcNow
            }));

app.MapGet(
    "/api/auth/me",
    (
        HttpContext context) =>
    {
        var user =
            context.User;

        var roles =
            user.Claims
                .Where(
                    claim =>
                        claim.Type ==
                        "roles"
                        ||
                        claim.Type.EndsWith(
                            "/claims/role",
                            StringComparison
                                .OrdinalIgnoreCase))
                .Select(
                    claim =>
                        claim.Value)
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

                roles
            });
    })
    .RequireAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapPost(
        "/api/fulfillment/simulate",
        (
            CalculateFulfillmentRequest request,
            FulfillmentScorer scorer,
            DecisionAuditService auditService) =>
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

                var snapshot =
                    auditService
                        .CreateSnapshot(
                            decision,
                            request.Items,
                            DecisionSource
                                .ClientProvidedSimulation);

                auditService.Record(
                    snapshot);

                return Results.Ok(
                    DecisionResponse
                        .Simulation(
                            decision));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(
                    new
                    {
                        message =
                            exception.Message,

                        authoritative =
                            false
                    });
            }
        })
        .RequireAuthorization(
            "FulfillmentManagerOrAdmin");
}

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

        try
        {
            var decision =
                await orchestrator
                    .CalculateForOrderAsync(
                        reference,
                        policy:
                            null,
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
                DecisionResponse
                    .AuthoritativeDecision(
                        decision));
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
                    "OrderService or InventoryService could not be reached.",

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
                    "OrderService or InventoryService did not respond within the configured timeout.",

                statusCode:
                    StatusCodes
                        .Status504GatewayTimeout);
        }
    })
    .RequireAuthorization(
        "FulfillmentManagerOrAdmin");

app.Run();

static Uri GetRequiredServiceUri(
    IConfiguration configuration,
    string key)
{
    var rawValue =
        configuration[key];

    if (string.IsNullOrWhiteSpace(
            rawValue))
    {
        throw new InvalidOperationException(
            $"Required service URL '{key}' is missing.");
    }

    if (!Uri.TryCreate(
            rawValue,
            UriKind.Absolute,
            out var uri))
    {
        throw new InvalidOperationException(
            $"Service URL '{key}' must be an absolute URI.");
    }

    var localDevelopmentUri =
        uri.Scheme ==
        Uri.UriSchemeHttp
        &&
        (
            uri.Host.Equals(
                "localhost",
                StringComparison.OrdinalIgnoreCase)
            ||
            uri.Host.Equals(
                "127.0.0.1",
                StringComparison.OrdinalIgnoreCase)
        );

    if (uri.Scheme != Uri.UriSchemeHttps
        &&
        !localDevelopmentUri)
    {
        throw new InvalidOperationException(
            $"Service URL '{key}' must use HTTPS unless it targets localhost.");
    }

    return uri;
}