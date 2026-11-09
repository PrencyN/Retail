using Microsoft.EntityFrameworkCore;
using OrderService.Models;

namespace OrderService.Data;

public class OrderDbContext : DbContext
{
    public OrderDbContext(
        DbContextOptions<OrderDbContext> options)
        : base(options)
    {
    }

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Reference)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(x => x.Reference)
                .IsUnique();

            entity.Property(x => x.CustomerZone)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(30);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Quantity)
                .IsRequired();

            entity.HasIndex(x => x.OrderId);

            entity.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}