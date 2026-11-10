using Npgsql;

namespace OrderService.Security;

public static class DatabaseConnectionValidator
{
    public static string GetRequiredSecureConnectionString(
        IConfiguration configuration,
        string connectionName,
        IHostEnvironment environment)
    {
        var connectionString =
            configuration.GetConnectionString(
                connectionName);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Required PostgreSQL connection string '{connectionName}' is missing.");
        }

        NpgsqlConnectionStringBuilder builder;

        try
        {
            builder =
                new NpgsqlConnectionStringBuilder(
                    connectionString);
        }
        catch (Exception exception)
            when (exception is ArgumentException or FormatException)
        {
            throw new InvalidOperationException(
                $"PostgreSQL connection string '{connectionName}' is invalid.",
                exception);
        }

        if (string.IsNullOrWhiteSpace(builder.Host))
        {
            throw new InvalidOperationException(
                $"PostgreSQL connection '{connectionName}' does not define a host.");
        }

        if (string.IsNullOrWhiteSpace(builder.Database))
        {
            throw new InvalidOperationException(
                $"PostgreSQL connection '{connectionName}' does not define a database.");
        }

        if (string.IsNullOrWhiteSpace(builder.Username))
        {
            throw new InvalidOperationException(
                $"PostgreSQL connection '{connectionName}' does not define a username.");
        }

        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            throw new InvalidOperationException(
                $"PostgreSQL connection '{connectionName}' does not define a password.");
        }

        var localHost =
            string.Equals(builder.Host, "localhost", StringComparison.OrdinalIgnoreCase)
            || string.Equals(builder.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(builder.Host, "::1", StringComparison.OrdinalIgnoreCase);

        if ((!environment.IsDevelopment() || !localHost)
            && builder.SslMode is SslMode.Disable or SslMode.Allow or SslMode.Prefer)
        {
            throw new InvalidOperationException(
                $"PostgreSQL connection '{connectionName}' must require TLS.");
        }

        return connectionString;
    }
}
