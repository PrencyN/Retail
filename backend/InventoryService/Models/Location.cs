namespace InventoryService.Models;

public class Location
{
    public Guid Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public decimal DistanceKm { get; set; }

    public int WorkloadPercent { get; set; }

    public int DailyCapacity { get; set; }

    public int CurrentOrders { get; set; }
}