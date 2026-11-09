namespace AIService.Options;

public sealed class AzureOpenAiOptions
{
    public const string SectionName =
        "AzureOpenAI";

    public bool Enabled { get; init; }

    public string Endpoint { get; init; }
        = string.Empty;

    public string ApiKey { get; init; }
        = string.Empty;

    public string Model { get; init; }
        = string.Empty;

    public int TimeoutSeconds { get; init; }
        = 30;

    public int MaxQuestionLength { get; init; }
        = 500;

    public int MaxOutputTokens { get; init; }
        = 2000;
}