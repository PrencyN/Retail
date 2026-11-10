using System.Security.Claims;

using AIService.Contracts;
using AIService.Options;
using AIService.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;

const string ManagerOrAdminPolicy =
    "FulfillmentManagerOrAdmin";

var builder =
    WebApplication.CreateBuilder(args);

// =======================================================
// CONFIGURATION VALIDATION
// =======================================================

var tenantId =
    GetRequiredConfiguration(
        builder.Configuration,
        "AzureAd:TenantId");

var clientId =
    GetRequiredConfiguration(
        builder.Configuration,
        "AzureAd:ClientId");

var instance =
    GetRequiredConfiguration(
        builder.Configuration,
        "AzureAd:Instance");

if (!Uri.TryCreate(
        instance,
        UriKind.Absolute,
        out var authorityUri))
{
    throw new InvalidOperationException(
        "AzureAd:Instance must be a valid absolute HTTPS URL.");
}

if (!string.Equals(
        authorityUri.Scheme,
        Uri.UriSchemeHttps,
        StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "AzureAd:Instance must use HTTPS.");
}

if (!Guid.TryParse(
        tenantId,
        out _))
{
    throw new InvalidOperationException(
        "AzureAd:TenantId must contain a valid Microsoft Entra tenant GUID.");
}

if (!Guid.TryParse(
        clientId,
        out _))
{
    throw new InvalidOperationException(
        "AzureAd:ClientId must contain a valid application client GUID.");
}

// =======================================================
// AZURE OPENAI OPTIONS
// =======================================================

builder.Services
    .AddOptions<AzureOpenAiOptions>()
    .Bind(
        builder.Configuration.GetSection(
            AzureOpenAiOptions.SectionName))
    .Validate(
        options =>
            options.TimeoutSeconds is >= 3 and <= 60,
        "AzureOpenAI:TimeoutSeconds must be between 3 and 60.")
    .Validate(
        options =>
            options.MaxQuestionLength is >= 1 and <= 4000,
        "AzureOpenAI:MaxQuestionLength must be between 1 and 4000.")
    .Validate(
        options =>
            options.MaxOutputTokens is >= 1 and <= 8000,
        "AzureOpenAI:MaxOutputTokens must be between 1 and 8000.")
    .Validate(
        options =>
            !options.Enabled
            ||
            (
                Uri.TryCreate(
                    options.Endpoint,
                    UriKind.Absolute,
                    out var endpoint)
                &&
                string.Equals(
                    endpoint.Scheme,
                    Uri.UriSchemeHttps,
                    StringComparison.OrdinalIgnoreCase)
                &&
                !string.IsNullOrWhiteSpace(
                    options.ApiKey)
                &&
                !string.IsNullOrWhiteSpace(
                    options.Model)
            ),
        "When Azure OpenAI is enabled, Endpoint must use HTTPS and ApiKey and Model must be configured.")
    .ValidateOnStart();

// =======================================================
// MICROSOFT ENTRA AUTHENTICATION
// =======================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(
        builder.Configuration,
        "AzureAd");

builder.Services
    .Configure<JwtBearerOptions>(
        JwtBearerDefaults.AuthenticationScheme,
        options =>
        {
            options.MapInboundClaims =
                false;

            options.TokenValidationParameters
                .ValidateIssuer =
                true;

            options.TokenValidationParameters
                .ValidateAudience =
                true;

            options.TokenValidationParameters
                .ValidateLifetime =
                true;

            options.TokenValidationParameters
                .ValidateIssuerSigningKey =
                true;

            options.TokenValidationParameters
                .RequireExpirationTime =
                true;

            options.TokenValidationParameters
                .RequireSignedTokens =
                true;

            options.TokenValidationParameters
                .ClockSkew =
                TimeSpan.FromMinutes(2);

            options.TokenValidationParameters
                .NameClaimType =
                "name";

            options.TokenValidationParameters
                .RoleClaimType =
                "roles";

            options.Events ??=
                new JwtBearerEvents();

            options.Events.OnTokenValidated =
                context =>
                {
                    var principal =
                        context.Principal;

                    if (principal is null)
                    {
                        context.Fail(
                            "The access token did not create an authenticated principal.");

                        return Task.CompletedTask;
                    }

                    var tokenTenantId =
                        principal.FindFirstValue(
                            "tid");

                    if (!string.Equals(
                            tokenTenantId,
                            tenantId,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        context.Fail(
                            "The access token was not issued by the configured Microsoft Entra tenant.");

                        return Task.CompletedTask;
                    }

                    var objectId =
                        principal.FindFirstValue(
                            "oid");

                    var subject =
                        principal.FindFirstValue(
                            "sub");

                    if (string.IsNullOrWhiteSpace(
                            objectId)
                        &&
                        string.IsNullOrWhiteSpace(
                            subject))
                    {
                        context.Fail(
                            "The access token does not contain an oid or sub claim.");

                        return Task.CompletedTask;
                    }

                    return Task.CompletedTask;
                };

            options.Events.OnAuthenticationFailed =
                context =>
                {
                    context.NoResult();

                    return Task.CompletedTask;
                };

            options.Events.OnChallenge =
                context =>
                {
                    context.Response.Headers
                        .CacheControl =
                        "no-store";

                    return Task.CompletedTask;
                };

            options.Events.OnForbidden =
                context =>
                {
                    context.Response.Headers
                        .CacheControl =
                        "no-store";

                    return Task.CompletedTask;
                };
        });

// =======================================================
// AUTHORIZATION
// =======================================================

builder.Services.AddAuthorization(
    options =>
    {
        var authenticatedUserPolicy =
            new AuthorizationPolicyBuilder(
                    JwtBearerDefaults
                        .AuthenticationScheme)
                .RequireAuthenticatedUser()
                .Build();

        // Default-deny behavior:
        // every endpoint requires authentication unless
        // it explicitly calls AllowAnonymous().
        options.FallbackPolicy =
            authenticatedUserPolicy;

        options.AddPolicy(
            ManagerOrAdminPolicy,
            policy =>
            {
                policy.AddAuthenticationSchemes(
                    JwtBearerDefaults
                        .AuthenticationScheme);

                policy.RequireAuthenticatedUser();

                policy.RequireClaim(
                    "tid",
                    tenantId);

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
        var azureOpenAiOptions =
            serviceProvider
                .GetRequiredService<
                    IOptions<AzureOpenAiOptions>>()
                .Value;

        httpClient.Timeout =
            TimeSpan.FromSeconds(
                Math.Clamp(
                    azureOpenAiOptions
                        .TimeoutSeconds,
                    3,
                    60));

        httpClient.DefaultRequestHeaders
            .UserAgent
            .ParseAdd(
                "FulfillIQ-AIService/1.0");
    });

// =======================================================
// CORS
// =======================================================

var allowedOrigins =
    builder.Configuration
        .GetSection(
            "Cors:AllowedOrigins")
        .Get<string[]>()
    ??
    [];

var normalizedAllowedOrigins =
    allowedOrigins
        .Where(
            origin =>
                !string.IsNullOrWhiteSpace(
                    origin))
        .Select(
            origin =>
                origin.Trim()
                    .TrimEnd('/'))
        .Distinct(
            StringComparer.OrdinalIgnoreCase)
        .ToArray();

if (normalizedAllowedOrigins.Length == 0)
{
    throw new InvalidOperationException(
        "At least one trusted origin must be configured in Cors:AllowedOrigins.");
}

foreach (var origin in normalizedAllowedOrigins)
{
    if (!Uri.TryCreate(
            origin,
            UriKind.Absolute,
            out var originUri))
    {
        throw new InvalidOperationException(
            $"Invalid CORS origin: {origin}");
    }

    var validDevelopmentOrigin =
        builder.Environment.IsDevelopment()
        &&
        string.Equals(
            originUri.Scheme,
            Uri.UriSchemeHttp,
            StringComparison.OrdinalIgnoreCase)
        &&
        (
            string.Equals(
                originUri.Host,
                "localhost",
                StringComparison.OrdinalIgnoreCase)
            ||
            string.Equals(
                originUri.Host,
                "127.0.0.1",
                StringComparison.OrdinalIgnoreCase)
        );

    var validSecureOrigin =
        string.Equals(
            originUri.Scheme,
            Uri.UriSchemeHttps,
            StringComparison.OrdinalIgnoreCase);

    if (!validDevelopmentOrigin
        &&
        !validSecureOrigin)
    {
        throw new InvalidOperationException(
            $"CORS origin must use HTTPS outside local development: {origin}");
    }
}

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "ReactApp",
            policy =>
            {
                policy
                    .WithOrigins(
                        normalizedAllowedOrigins)
                    .WithMethods(
                        "GET",
                        "POST",
                        "OPTIONS")
                    .WithHeaders(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "X-Correlation-ID")
                    .SetPreflightMaxAge(
                        TimeSpan.FromMinutes(10));
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

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

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
            !configuration.Enabled
            ||
            (
                Uri.TryCreate(
                    configuration.Endpoint,
                    UriKind.Absolute,
                    out var endpoint)
                &&
                string.Equals(
                    endpoint.Scheme,
                    Uri.UriSchemeHttps,
                    StringComparison.OrdinalIgnoreCase)
                &&
                !string.IsNullOrWhiteSpace(
                    configuration.ApiKey)
                &&
                !string.IsNullOrWhiteSpace(
                    configuration.Model)
            );

        return Results.Ok(
            new
            {
                service =
                    "FulfillIQ AI Service",

                status =
                    "Healthy",

                authentication =
                    "Microsoft Entra ID",

                tenantValidation =
                    "Enabled",

                audienceValidation =
                    "Enabled",

                roleAuthorization =
                    ManagerOrAdminPolicy,

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

                timestampUtc =
                    DateTime.UtcNow
            });
    })
    .AllowAnonymous();

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
                        string.Equals(
                            claim.Type,
                            "roles",
                            StringComparison.OrdinalIgnoreCase)
                        ||
                        claim.Type.EndsWith(
                            "/claims/role",
                            StringComparison.OrdinalIgnoreCase))
                .Select(
                    claim =>
                        claim.Value)
                .Distinct(
                    StringComparer.OrdinalIgnoreCase)
                .OrderBy(
                    role =>
                        role)
                .ToArray();

        var scopes =
            user.Claims
                .Where(
                    claim =>
                        string.Equals(
                            claim.Type,
                            "scp",
                            StringComparison.OrdinalIgnoreCase))
                .SelectMany(
                    claim =>
                        claim.Value.Split(
                            ' ',
                            StringSplitOptions
                                .RemoveEmptyEntries))
                .Distinct(
                    StringComparer.OrdinalIgnoreCase)
                .OrderBy(
                    scope =>
                        scope)
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

                tenantId =
                    user.FindFirstValue(
                        "tid"),

                objectId =
                    user.FindFirstValue(
                        "oid"),

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
        ManagerOrAdminPolicy);

// =======================================================
// RUN
// =======================================================

app.Run();

static string GetRequiredConfiguration(
    IConfiguration configuration,
    string key)
{
    var value =
        configuration[key];

    if (string.IsNullOrWhiteSpace(
        value))
    {
        throw new InvalidOperationException(
            $"Required configuration value '{key}' is missing.");
    }

    return value.Trim();
}