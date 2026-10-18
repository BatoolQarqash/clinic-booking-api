using ClinicBooking.DTOs.Appointments;
using ClinicBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Tests;

public class AppointmentServiceTests : IDisposable
{
    private readonly TestDb _t = new();

    public void Dispose() => _t.Dispose();

    private CreateAppointmentRequest Request(int slotId) => new() { DoctorId = _t.DoctorId, SlotId = slotId };

    [Fact]
    public async Task Book_FreeSlot_Succeeds()
    {
        var slot = _t.AddSlot(TestDb.ClinicNow.AddDays(1));

        var (ok, status, _) = await _t.Appointments().BookAsync(_t.UserId, Request(slot.Id));

        Assert.True(ok);
        Assert.Equal(200, status);
        Assert.True(_t.NewContext().AvailabilitySlots.Single(s => s.Id == slot.Id).IsBooked);
    }

    [Fact]
    public async Task Book_SameActiveSlotTwice_Returns409()
    {
        var slot = _t.AddSlot(TestDb.ClinicNow.AddDays(1));
        await _t.Appointments().BookAsync(_t.UserId, Request(slot.Id));

        var (_, status, _) = await _t.Appointments().BookAsync(_t.OtherUserId, Request(slot.Id));

        Assert.Equal(409, status);
    }

    [Fact]
    public async Task Book_SlotEarlierToday_Returns400()
    {
        // 12:00 clinic time is in the past (clinic now = 13:00), but a UTC server clock
        // reads 10:00, so the old DateTime.Now check would have accepted it.
        var slot = _t.AddSlot(TestDb.ClinicNow.AddHours(-1));

        var (_, status, _) = await _t.Appointments().BookAsync(_t.UserId, Request(slot.Id));

        Assert.Equal(400, status);
    }

    [Fact]
    public async Task Cancel_MoreThanOneHourBefore_SucceedsAndFreesSlot()
    {
        var slot = _t.AddSlot(TestDb.ClinicNow.AddHours(2));
        var appt = _t.AddAppointment(slot.Id, AppointmentStatus.Booked);

        var (ok, status, _) = await _t.Appointments().CancelAsync(_t.UserId, appt.Id);

        Assert.True(ok);
        Assert.Equal(200, status);
        using var db = _t.NewContext();
        Assert.Equal(AppointmentStatus.Cancelled, db.Appointments.Single(a => a.Id == appt.Id).Status);
        Assert.False(db.AvailabilitySlots.Single(s => s.Id == slot.Id).IsBooked);
    }

    [Fact]
    public async Task Cancel_WithinOneHour_Returns400()
    {
        // 30 minutes ahead in clinic time; a UTC server clock would think it is 3.5 hours ahead.
        var slot = _t.AddSlot(TestDb.ClinicNow.AddMinutes(30), isBooked: true);
        var appt = _t.AddAppointment(slot.Id, AppointmentStatus.Booked);

        var (_, status, _) = await _t.Appointments().CancelAsync(_t.UserId, appt.Id);

        Assert.Equal(400, status);
    }

    [Fact]
    public async Task CancelThenRebook_SameSlot_Succeeds()
    {
        var slot = _t.AddSlot(TestDb.ClinicNow.AddDays(1));
        await _t.Appointments().BookAsync(_t.UserId, Request(slot.Id));
        var firstId = _t.Db.Appointments.Single().Id;
        await _t.Appointments().CancelAsync(_t.UserId, firstId);

        var (ok, status, _) = await _t.Appointments().BookAsync(_t.OtherUserId, Request(slot.Id));

        Assert.True(ok);
        Assert.Equal(200, status);
        // The cancelled appointment is kept as history.
        Assert.Equal(2, _t.NewContext().Appointments.Count(a => a.SlotId == slot.Id));
    }

    [Fact]
    public void UniqueIndex_StillBlocksTwoActiveAppointmentsOnOneSlot()
    {
        var slot = _t.AddSlot(TestDb.ClinicNow.AddDays(1));
        _t.AddAppointment(slot.Id, AppointmentStatus.Booked);

        Assert.Throws<DbUpdateException>(() => _t.AddAppointment(slot.Id, AppointmentStatus.Booked));
    }
}
