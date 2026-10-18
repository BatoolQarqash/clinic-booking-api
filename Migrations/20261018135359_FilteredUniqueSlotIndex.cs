using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicBooking.Migrations
{
    /// <inheritdoc />
    public partial class FilteredUniqueSlotIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_SlotId",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_SlotId",
                table: "Appointments",
                column: "SlotId",
                unique: true,
                filter: "[Status] <> 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_SlotId",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_SlotId",
                table: "Appointments",
                column: "SlotId",
                unique: true);
        }
    }
}
