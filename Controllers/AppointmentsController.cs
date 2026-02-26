using ClinicBooking.Data;
using ClinicBooking.DTOs.Appointments;
using ClinicBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppointmentsController(AppDbContext db) => _db = db;

    // POST /api/appointments
    [HttpPost]
    [Authorize] // ✅ user must be logged in
    public async Task<IActionResult> Book([FromBody] CreateAppointmentRequest req)
    {
        // 1) Read UserId from JWT token (ClaimTypes.NameIdentifier)
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Invalid token" });

        // 2) Load slot and validate
        var slot = await _db.AvailabilitySlots.FirstOrDefaultAsync(s => s.Id == req.SlotId);
        if (slot == null)
            return NotFound(new { message = "Slot not found" });

        if (slot.DoctorId != req.DoctorId)
            return BadRequest(new { message = "Slot does not belong to this doctor" });

        // Prevent booking past slots
        if (slot.StartTime <= DateTime.Now)
            return BadRequest(new { message = "You cannot book a slot in the past." });

        if (slot.IsBooked)
            return Conflict(new { message = "Slot already booked" });

        // 3) Create appointment + mark slot booked
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
            // safety net: unique index on Appointments.SlotId prevents double booking
            return Conflict(new { message = "Slot already booked (unique constraint)" });
        }

        return Ok(new
        {
            message = "Booked successfully",
            appointmentId = appointment.Id
        });
    }

    // GET /api/appointments/my

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> MyAppointments()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Invalid token" });

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
                Doctor = new
                {
                    a.Doctor!.Id,
                    a.Doctor.FullName,
                    a.Doctor.ClinicName
                },
                Slot = new
                {
                    a.Slot!.Id,
                    a.Slot.StartTime,
                    a.Slot.EndTime
                }
            })
            .ToListAsync();

        return Ok(items);
    }
    // PATCH /api/appointments/{id}/cancel
    [HttpPatch("{id:int}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(int id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Invalid token" });

        var appt = await _db.Appointments
            .Include(a => a.Slot)
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (appt == null)
            return NotFound(new { message = "Appointment not found" });

        if (appt.Status == AppointmentStatus.Cancelled)
            return Ok(new { message = "Already cancelled" });
        if (appt.Slot == null)
            return BadRequest(new { message = "Slot data is missing." });

        var minutesLeft = (appt.Slot.StartTime - DateTime.Now).TotalMinutes;

        // If appointment is within 60 minutes, reject cancellation
        if (minutesLeft <= 60)
            return BadRequest(new { message = "Cancellation is not allowed within 1 hour of the appointment." });

        // Change status + free the slot (MVP policy)
        appt.Status = AppointmentStatus.Cancelled;
        if (appt.Slot != null) appt.Slot.IsBooked = false;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Cancelled" });
    }
}