using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Data;

public class CatalogDbContext : DbContext
{
    public CatalogDbContext(
        DbContextOptions<CatalogDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(p => p.Description)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(p => p.Category)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(p => p.Brand)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(p => p.Color)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(p => p.ImageUrl)
                .HasMaxLength(1000);

            entity.Property(p => p.Price)
                .HasPrecision(12, 2);

            entity.HasIndex(p => p.Category);

            entity.HasIndex(p => p.Brand);

            entity.HasIndex(p => p.Price);
        });
    }
}