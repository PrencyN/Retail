using AIService.Contracts;
using AIService.Options;
using AIService.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

var builder =
    WebApplication.CreateBuilder(args);

// =======================================================
// AZURE OPENAI OPTIONS
// =======================================================

builder.Services
    .Configure<AzureOpenAiOptions>(
        builder.Configuration
            .GetSection(
                AzureOpenAiOptions.SectionName));

// =======================================================
// MICROSOFT ENTRA AUTHENTICATION
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
// AI SERVICES
// =======================================================

builder.Services.AddSingleton<
    DeterministicFallbackService>();

builder.Services.AddHttpClient<
    AiDecisionExplanationService>(
    (
        serviceProvider,
        httpClient) =>
    {
        var options =
            serviceProvider
                .GetRequiredService<
                    IOptions<AzureOpenAiOptions>>()
                .Value;

        httpClient.Timeout =
            TimeSpan.FromSeconds(
                Math.Clamp(
                    options.TimeoutSeconds,
                    3,
                    60));
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
// BUILD
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
    (
        IOptions<AzureOpenAiOptions> options) =>
    {
        var configuration =
            options.Value;

        var configurationComplete =
            !string.IsNullOrWhiteSpace(
                configuration.Endpoint)
            &&
            !string.IsNullOrWhiteSpace(
                configuration.ApiKey)
            &&
            !string.IsNullOrWhiteSpace(
                configuration.Model);

        return Results.Ok(
            new
            {
                service =
                    "FulfillIQ AI Service",

                status =
                    "Healthy",

                authentication =
                    "Microsoft Entra ID",

                aiEnabled =
                    configuration.Enabled,

                configurationComplete,

                provider =
                    configuration.Enabled
                        ? "Azure OpenAI"
                        : "Deterministic fallback",

                model =
                    configuration.Enabled
                        ? configuration.Model
                        : "none",

                timeoutSeconds =
                    configuration.TimeoutSeconds,

                maxOutputTokens =
                    configuration.MaxOutputTokens,

                timestampUtc =
                    DateTime.UtcNow
            });
    });

// =======================================================
// AUTHENTICATED USER TEST
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
                .Where(
                    claim =>
                        claim.Type == "roles"
                        ||
                        claim.Type.EndsWith(
                            "/claims/role",
                            StringComparison.OrdinalIgnoreCase))
                .Select(
                    claim =>
                        claim.Value)
                .Distinct()
                .ToArray();

        var scopes =
            user.Claims
                .Where(
                    claim =>
                        claim.Type == "scp")
                .SelectMany(
                    claim =>
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
                    user.Identity?.Name,

                roles,

                scopes
            });
    })
    .RequireAuthorization();

// =======================================================
// PROTECTED AI EXPLANATION
// =======================================================

app.MapPost(
    "/api/ai/explain",
    async (
        ExplainDecisionRequest request,
        AiDecisionExplanationService service,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var result =
                await service.ExplainAsync(
                    request,
                    cancellationToken);

            return Results.Ok(
                result);
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
// RUN
// =======================================================

app.Run();