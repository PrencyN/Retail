using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InventoryService.Migrations
{
    /// <inheritdoc />
    public partial class AddFulfillmentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Locations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CurrentOrders",
                table: "Locations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DailyCapacity",
                table: "Locations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DistanceKm",
                table: "Locations",
                type: "numeric(8,2)",
                precision: 8,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "WorkloadPercent",
                table: "Locations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Locations_Code",
                table: "Locations",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Locations_Code",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "CurrentOrders",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "DailyCapacity",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "DistanceKm",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "WorkloadPercent",
                table: "Locations");
        }
    }
}
