using ClinicBooking.Data;
using ClinicBooking.DTOs.Appointments;
using ClinicBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Services;

public class AppointmentService
{
    private const string DefaultTimeZoneId = "Asia/Amman";
    private const string FallbackTimeZoneId = "Jordan Standard Time";

    private readonly AppDbContext _db;
    private readonly TimeProvider _timeProvider;
    private readonly TimeZoneInfo _clinicTimeZone;

    public AppointmentService(AppDbContext db, TimeProvider timeProvider, IConfiguration config)
    {
        _db = db;
        _timeProvider = timeProvider;
        _clinicTimeZone = ResolveTimeZone(config["Clinic:TimeZoneId"]);
    }

    // Slot times are stored as clinic-local wall-clock times, so compare them against the
    // clinic's local "now" rather than the server clock (which is UTC on Azure).
    private DateTime ClinicNow => TimeZoneInfo.ConvertTime(_timeProvider.GetUtcNow(), _clinicTimeZone).DateTime;

    private static TimeZoneInfo ResolveTimeZone(string? id)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(string.IsNullOrWhiteSpace(id) ? DefaultTimeZoneId : id);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById(FallbackTimeZoneId);
        }
    }

    public async Task<(bool ok, int statusCode, object result)> BookAsync(int userId, CreateAppointmentRequest req)
    {
        var slot = await _db.AvailabilitySlots.FirstOrDefaultAsync(s => s.Id == req.SlotId);
        if (slot == null)
            return (false, 404, new { message = "Slot not found" });

        if (slot.DoctorId != req.DoctorId)
            return (false, 400, new { message = "Slot does not belong to this doctor" });

        if (slot.StartTime <= ClinicNow)
            return (false, 400, new { message = "You cannot book a slot in the past." });

        if (slot.IsBooked)
            return (false, 409, new { message = "Slot already booked" });

        slot.IsBooked = true;

        var appointment = new Appointment
        {
            UserId = userId,
            DoctorId = req.DoctorId,
            SlotId = req.SlotId,
            Status = AppointmentStatus.Booked
        };

        _db.Appointments.Add(appointment);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return (false, 409, new { message = "Slot already booked (unique constraint)" });
        }

        return (true, 200, new { message = "Booked successfully", appointmentId = appointment.Id });
    }

    public async Task<object> MyAsync(int userId)
    {
        var items = await _db.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Slot)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                status = a.Status.ToString(),
                a.CreatedAt,
                Doctor = new { a.Doctor!.Id, a.Doctor.FullName, a.Doctor.ClinicName },
                Slot = new { a.Slot!.Id, a.Slot.StartTime, a.Slot.EndTime }
            })
            .ToListAsync();

        return items;
    }

    public async Task<(bool ok, int statusCode, object result)> CancelAsync(int userId, int appointmentId)
    {
        var appt = await _db.Appointments
            .Include(a => a.Slot)
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.UserId == userId);

        if (appt == null)
            return (false, 404, new { message = "Appointment not found" });

        if (appt.Status == AppointmentStatus.Cancelled)
            return (true, 200, new { message = "Already cancelled" });

        if (appt.Slot == null)
            return (false, 400, new { message = "Slot data is missing." });

        var minutesLeft = (appt.Slot.StartTime - ClinicNow).TotalMinutes;

        if (minutesLeft <= 60)
            return (false, 400, new { message = "Cancellation is not allowed within 1 hour of the appointment." });

        appt.Status = AppointmentStatus.Cancelled;
        appt.Slot.IsBooked = false;

        await _db.SaveChangesAsync();

        return (true, 200, new { message = "Cancelled" });
    }
}