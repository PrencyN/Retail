namespace InventoryService.Models;

public class Inventory
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public Guid LocationId { get; set; }

    public int AvailableQuantity { get; set; }

    public int ReservedQuantity { get; set; }

    public int ReorderLevel { get; set; }

    public Location Location { get; set; } = null!;
}