using System.Text.Json;
using ClinicBooking.DTOs.Admin;
using ClinicBooking.Models;

namespace ClinicBooking.Tests;

public class SlotServiceTests : IDisposable
{
    private readonly TestDb _t = new();

    public void Dispose() => _t.Dispose();

    [Fact]
    public async Task Delete_SlotWithBookedAppointment_Returns409()
    {
        var slot = _t.AddSlot(TestDb.ClinicNow.AddDays(1), isBooked: true);
        _t.AddAppointment(slot.Id, AppointmentStatus.Booked);

        var (_, status, _) = await _t.Slots().DeleteSlotAsync(slot.Id);

        Assert.Equal(409, status);
        Assert.True(_t.NewContext().AvailabilitySlots.Any(s => s.Id == slot.Id));
    }

    [Fact]
    public async Task Delete_SlotWithOnlyCancelledAppointment_Returns200AndRemovesRows()
    {
        var slot = _t.AddSlot(TestDb.ClinicNow.AddDays(1));
        _t.AddAppointment(slot.Id, AppointmentStatus.Cancelled);

        var (ok, status, _) = await _t.Slots().DeleteSlotAsync(slot.Id);

        Assert.True(ok);
        Assert.Equal(200, status);
        using var db = _t.NewContext();
        Assert.False(db.AvailabilitySlots.Any(s => s.Id == slot.Id));
        Assert.False(db.Appointments.Any(a => a.SlotId == slot.Id));
    }

    [Fact]
    public async Task Delete_UnknownSlot_Returns404()
    {
        var (_, status, _) = await _t.Slots().DeleteSlotAsync(12345);

        Assert.Equal(404, status);
    }

    [Fact]
    public async Task CreateBulk_OverlappingRequests_DoNotCreateDuplicates()
    {
        CreateSlotsRequest Request(string end) =>
            new() { DoctorId = _t.DoctorId, Date = "2026-06-02", StartTime = "09:00", EndTime = end, SlotMinutes = 30 };

        var first = await _t.Slots().CreateBulkAsync(Request("11:00"));   // 09:00 - 10:30: 4 slots
        var second = await _t.Slots().CreateBulkAsync(Request("12:00"));  // only 11:00 and 11:30 are new
        var third = await _t.Slots().CreateBulkAsync(Request("12:00"));   // nothing new

        Assert.Equal(4, Created(first.result));
        Assert.Equal(2, Created(second.result));
        Assert.Equal(200, third.statusCode);
        Assert.Equal(0, Created(third.result));
        Assert.Equal(6, _t.NewContext().AvailabilitySlots.Count());
    }

    private static int Created(object result) =>
        JsonSerializer.SerializeToElement(result).TryGetProperty("created", out var c) ? c.GetInt32() : 0;
}
