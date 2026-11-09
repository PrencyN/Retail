using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;

using AIService.Contracts;
using AIService.Options;
using AIService.Prompts;

using Microsoft.Extensions.Options;

namespace AIService.Services;

public sealed class AiDecisionExplanationService
{
    private readonly HttpClient _httpClient;

    private readonly AzureOpenAiOptions _options;

    private readonly DeterministicFallbackService _fallback;

    private readonly ILogger<AiDecisionExplanationService>
        _logger;

    public AiDecisionExplanationService(
        HttpClient httpClient,
        IOptions<AzureOpenAiOptions> options,
        DeterministicFallbackService fallback,
        ILogger<AiDecisionExplanationService> logger)
    {
        _httpClient =
            httpClient;

        _options =
            options.Value;

        _fallback =
            fallback;

        _logger =
            logger;
    }

    public async Task<ExplainDecisionResponse>
        ExplainAsync(
            ExplainDecisionRequest request,
            CancellationToken cancellationToken)
    {
        var stopwatch =
            Stopwatch.StartNew();

        ValidateRequest(request);

        if (!_options.Enabled)
        {
            stopwatch.Stop();

            return _fallback.Create(
                request,
                "AI is disabled",
                stopwatch.ElapsedMilliseconds);
        }

        if (!HasCompleteConfiguration())
        {
            stopwatch.Stop();

            return _fallback.Create(
                request,
                "AI configuration is incomplete",
                stopwatch.ElapsedMilliseconds);
        }

        try
        {
            using var message =
                CreateRequestMessage(request);

            using var response =
                await _httpClient.SendAsync(
                    message,
                    HttpCompletionOption
                        .ResponseHeadersRead,
                    cancellationToken);

            var responseBody =
                await response.Content
                    .ReadAsStringAsync(
                        cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Azure OpenAI returned HTTP {StatusCode}. " +
                    "Response body: {ResponseBody}",
                    (int)response.StatusCode,
                    Truncate(responseBody));

                stopwatch.Stop();

                return _fallback.Create(
                    request,
                    $"Azure OpenAI returned HTTP " +
                    $"{(int)response.StatusCode}",
                    stopwatch.ElapsedMilliseconds);
            }

            _logger.LogInformation(
                "Azure OpenAI response received. " +
                "Response length: {ResponseLength}",
                responseBody.Length);

            var extractionResult =
                ExtractResponseResult(
                    responseBody);

            if (string.IsNullOrWhiteSpace(
                    extractionResult.Text))
            {
                _logger.LogWarning(
                    "Azure OpenAI returned no visible output text. " +
                    "Status: {Status}. " +
                    "Incomplete reason: {IncompleteReason}. " +
                    "Response body: {ResponseBody}",
                    extractionResult.Status,
                    extractionResult.IncompleteReason,
                    Truncate(responseBody));

                stopwatch.Stop();

                var reason =
                    !string.IsNullOrWhiteSpace(
                        extractionResult.IncompleteReason)
                        ? $"Azure response incomplete: " +
                          extractionResult.IncompleteReason
                        : "Azure OpenAI returned no text";

                return _fallback.Create(
                    request,
                    reason,
                    stopwatch.ElapsedMilliseconds);
            }

            stopwatch.Stop();

            return ParseAiResponse(
                extractionResult.Text,
                stopwatch.ElapsedMilliseconds);
        }
        catch (OperationCanceledException)
            when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                "Azure OpenAI request timed out after " +
                "{TimeoutSeconds} seconds.",
                _options.TimeoutSeconds);

            stopwatch.Stop();

            return _fallback.Create(
                request,
                "Azure OpenAI request timed out",
                stopwatch.ElapsedMilliseconds);
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(
                exception,
                "Azure OpenAI request failed.");

            stopwatch.Stop();

            return _fallback.Create(
                request,
                "Azure OpenAI was unavailable",
                stopwatch.ElapsedMilliseconds);
        }
        catch (JsonException exception)
        {
            _logger.LogWarning(
                exception,
                "Azure OpenAI returned invalid JSON.");

            stopwatch.Stop();

            return _fallback.Create(
                request,
                "Azure OpenAI returned invalid JSON",
                stopwatch.ElapsedMilliseconds);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Unexpected Azure OpenAI explanation failure.");

            stopwatch.Stop();

            return _fallback.Create(
                request,
                "Unexpected Azure OpenAI failure",
                stopwatch.ElapsedMilliseconds);
        }
    }

    private HttpRequestMessage CreateRequestMessage(
        ExplainDecisionRequest request)
    {
        var message =
            new HttpRequestMessage(
                HttpMethod.Post,
                _options.Endpoint);

        message.Headers.Add(
            "api-key",
            _options.ApiKey);

        var instructions =
            FulfillmentExplanationPrompt
                .BuildSystemPrompt();

        var input =
            FulfillmentExplanationPrompt
                .BuildUserPrompt(request);

        /*
         * GPT-5-mini is only explaining an existing
         * deterministic decision.
         *
         * Minimal reasoning and low verbosity reduce
         * unnecessary reasoning/output consumption.
         */

        message.Content =
            JsonContent.Create(
                new
                {
                    model =
                        _options.Model,

                    instructions,

                    input,

                    reasoning =
                        new
                        {
                            effort =
                                "minimal"
                        },

                    text =
                        new
                        {
                            verbosity =
                                "low"
                        },

                    max_output_tokens =
                        _options.MaxOutputTokens
                });

        return message;
    }

    private bool HasCompleteConfiguration()
    {
        return
            !string.IsNullOrWhiteSpace(
                _options.Endpoint)
            &&
            !string.IsNullOrWhiteSpace(
                _options.ApiKey)
            &&
            !string.IsNullOrWhiteSpace(
                _options.Model);
    }

    private static ResponseExtractionResult
        ExtractResponseResult(
            string json)
    {
        using var document =
            JsonDocument.Parse(json);

        var root =
            document.RootElement;

        var status =
            GetStringProperty(
                root,
                "status");

        var incompleteReason =
            ExtractIncompleteReason(root);

        /*
         * Some clients or endpoints may expose
         * output_text directly.
         */

        if (root.TryGetProperty(
                "output_text",
                out var directOutput))
        {
            var directText =
                ExtractTextValue(
                    directOutput);

            if (!string.IsNullOrWhiteSpace(
                    directText))
            {
                return new ResponseExtractionResult
                {
                    Text =
                        directText,

                    Status =
                        status,

                    IncompleteReason =
                        incompleteReason
                };
            }
        }

        if (!root.TryGetProperty(
                "output",
                out var output) ||
            output.ValueKind !=
                JsonValueKind.Array)
        {
            return new ResponseExtractionResult
            {
                Text =
                    string.Empty,

                Status =
                    status,

                IncompleteReason =
                    incompleteReason
            };
        }

        var textParts =
            new List<string>();

        foreach (var outputItem
                 in output.EnumerateArray())
        {
            /*
             * Handle an output item that itself
             * contains a direct text value.
             */

            if (outputItem.TryGetProperty(
                    "text",
                    out var outputItemText))
            {
                var directItemText =
                    ExtractTextValue(
                        outputItemText);

                if (!string.IsNullOrWhiteSpace(
                        directItemText))
                {
                    textParts.Add(
                        directItemText);
                }
            }

            if (!outputItem.TryGetProperty(
                    "content",
                    out var content))
            {
                continue;
            }

            if (content.ValueKind !=
                JsonValueKind.Array)
            {
                var contentText =
                    ExtractTextValue(
                        content);

                if (!string.IsNullOrWhiteSpace(
                        contentText))
                {
                    textParts.Add(
                        contentText);
                }

                continue;
            }

            foreach (var contentItem
                     in content.EnumerateArray())
            {
                if (contentItem.ValueKind ==
                    JsonValueKind.String)
                {
                    var stringValue =
                        contentItem.GetString();

                    if (!string.IsNullOrWhiteSpace(
                            stringValue))
                    {
                        textParts.Add(
                            stringValue);
                    }

                    continue;
                }

                if (contentItem.ValueKind !=
                    JsonValueKind.Object)
                {
                    continue;
                }

                if (contentItem.TryGetProperty(
                        "text",
                        out var textElement))
                {
                    var textValue =
                        ExtractTextValue(
                            textElement);

                    if (!string.IsNullOrWhiteSpace(
                            textValue))
                    {
                        textParts.Add(
                            textValue);
                    }
                }

                if (contentItem.TryGetProperty(
                        "output_text",
                        out var outputTextElement))
                {
                    var outputTextValue =
                        ExtractTextValue(
                            outputTextElement);

                    if (!string.IsNullOrWhiteSpace(
                            outputTextValue))
                    {
                        textParts.Add(
                            outputTextValue);
                    }
                }
            }
        }

        var combinedText =
            string.Join(
                Environment.NewLine,
                textParts
                    .Where(value =>
                        !string.IsNullOrWhiteSpace(
                            value))
                    .Distinct());

        return new ResponseExtractionResult
        {
            Text =
                combinedText,

            Status =
                status,

            IncompleteReason =
                incompleteReason
        };
    }

    private static string ExtractTextValue(
        JsonElement element)
    {
        if (element.ValueKind ==
            JsonValueKind.String)
        {
            return
                element.GetString()
                ?? string.Empty;
        }

        if (element.ValueKind ==
            JsonValueKind.Object)
        {
            if (element.TryGetProperty(
                    "value",
                    out var valueElement) &&
                valueElement.ValueKind ==
                    JsonValueKind.String)
            {
                return
                    valueElement.GetString()
                    ?? string.Empty;
            }

            if (element.TryGetProperty(
                    "text",
                    out var nestedText))
            {
                return
                    ExtractTextValue(
                        nestedText);
            }
        }

        return string.Empty;
    }

    private static string ExtractIncompleteReason(
        JsonElement root)
    {
        if (!root.TryGetProperty(
                "incomplete_details",
                out var incompleteDetails) ||
            incompleteDetails.ValueKind !=
                JsonValueKind.Object)
        {
            return string.Empty;
        }

        return GetStringProperty(
            incompleteDetails,
            "reason");
    }

    private static string GetStringProperty(
        JsonElement element,
        string propertyName)
    {
        if (!element.TryGetProperty(
                propertyName,
                out var property) ||
            property.ValueKind !=
                JsonValueKind.String)
        {
            return string.Empty;
        }

        return
            property.GetString()
            ?? string.Empty;
    }

    private ExplainDecisionResponse ParseAiResponse(
        string content,
        long durationMilliseconds)
    {
        var explanation =
            ExtractSection(
                content,
                "Explanation:");

        var primaryReason =
            ExtractSection(
                content,
                "Primary reason:");

        var supportingReasons =
            ExtractBulletSection(
                content,
                "Supporting reasons:");

        var answer =
            ExtractSection(
                content,
                "Answer:");

        if (string.IsNullOrWhiteSpace(
                explanation))
        {
            explanation =
                content.Trim();
        }

        if (string.IsNullOrWhiteSpace(
                primaryReason))
        {
            primaryReason =
                "Azure GPT-5-mini explained the " +
                "deterministic fulfillment decision.";
        }

        if (string.IsNullOrWhiteSpace(
                answer))
        {
            answer =
                explanation;
        }

        return new ExplainDecisionResponse
        {
            Explanation =
                explanation,

            PrimaryReason =
                primaryReason,

            SupportingReasons =
                supportingReasons,

            Answer =
                answer,

            AiUsed =
                true,

            FallbackUsed =
                false,

            Provider =
                "Azure OpenAI",

            Model =
                _options.Model,

            GeneratedAtUtc =
                DateTime.UtcNow,

            DurationMilliseconds =
                durationMilliseconds
        };
    }

    private void ValidateRequest(
        ExplainDecisionRequest request)
    {
        if (string.IsNullOrWhiteSpace(
                request.OrderReference))
        {
            throw new ArgumentException(
                "Order reference is required.");
        }

        if (request.Candidates.Count == 0)
        {
            throw new ArgumentException(
                "At least one candidate is required.");
        }

        if (request.Question?.Length >
            _options.MaxQuestionLength)
        {
            throw new ArgumentException(
                $"Question cannot exceed " +
                $"{_options.MaxQuestionLength} characters.");
        }

        if (request.Candidates.Any(
                candidate =>
                    string.IsNullOrWhiteSpace(
                        candidate.LocationCode)))
        {
            throw new ArgumentException(
                "Every candidate requires a location code.");
        }
    }

    private static string ExtractSection(
        string text,
        string sectionName)
    {
        var start =
            text.IndexOf(
                sectionName,
                StringComparison.OrdinalIgnoreCase);

        if (start < 0)
        {
            return string.Empty;
        }

        start +=
            sectionName.Length;

        var remaining =
            text[start..].Trim();

        var sectionNames =
            new[]
            {
                "Explanation:",
                "Primary reason:",
                "Supporting reasons:",
                "Answer:"
            };

        var end =
            remaining.Length;

        foreach (var possibleSection
                 in sectionNames)
        {
            var index =
                remaining.IndexOf(
                    possibleSection,
                    StringComparison.OrdinalIgnoreCase);

            if (index >= 0 &&
                index < end)
            {
                end =
                    index;
            }
        }

        return
            remaining[..end].Trim();
    }

    private static List<string>
        ExtractBulletSection(
            string text,
            string sectionName)
    {
        var section =
            ExtractSection(
                text,
                sectionName);

        if (string.IsNullOrWhiteSpace(
                section))
        {
            return [];
        }

        return section
            .Split(
                '\n',
                StringSplitOptions
                    .RemoveEmptyEntries |
                StringSplitOptions
                    .TrimEntries)
            .Select(line =>
                line.TrimStart(
                    '-',
                    '*',
                    ' ',
                    '\t'))
            .Where(line =>
                !string.IsNullOrWhiteSpace(
                    line))
            .ToList();
    }

    private static string Truncate(
        string value)
    {
        if (string.IsNullOrWhiteSpace(
                value))
        {
            return string.Empty;
        }

        const int maximumLength =
            2500;

        return value.Length <=
               maximumLength
            ? value
            : value[..maximumLength];
    }

    private sealed class ResponseExtractionResult
    {
        public string Text { get; init; }
            = string.Empty;

        public string Status { get; init; }
            = string.Empty;

        public string IncompleteReason { get; init; }
            = string.Empty;
    }
}