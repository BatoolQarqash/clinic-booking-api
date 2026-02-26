using ClinicBooking.Data;
using ClinicBooking.DTOs.Admin;
using ClinicBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/admin/slots")]
[Authorize(Roles = "Admin")]
public class AdminSlotsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminSlotsController(AppDbContext db) => _db = db;

    // POST /api/admin/slots/bulk
    // Creates multiple availability slots for a doctor within a given time range.
    [HttpPost("bulk")]
    public async Task<IActionResult> CreateBulk([FromBody] CreateSlotsRequest req)
    {
        // 1) Validate doctor existence
        var doctorExists = await _db.Doctors.AnyAsync(d => d.Id == req.DoctorId);
        if (!doctorExists)
            return BadRequest(new { message = "Invalid DoctorId" });

        // 2) Parse date/time strings safely (because Swagger/JSON can struggle with DateOnly/TimeOnly)
        if (!DateOnly.TryParse(req.Date, out var date))
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD (e.g. 2026-02-22)" });

        if (!TimeOnly.TryParse(req.StartTime, out var startTime))
            return BadRequest(new { message = "Invalid startTime format. Use HH:mm (e.g. 09:00)" });

        if (!TimeOnly.TryParse(req.EndTime, out var endTime))
            return BadRequest(new { message = "Invalid endTime format. Use HH:mm (e.g. 12:00)" });

        // Convert DateOnly + TimeOnly into DateTime
        var start = date.ToDateTime(startTime);
        var end = date.ToDateTime(endTime);

        if (end <= start)
            return BadRequest(new { message = "EndTime must be after StartTime" });

        if (req.SlotMinutes <= 0)
            return BadRequest(new { message = "SlotMinutes must be greater than 0" });

        // 3) Generate slots (e.g. every 30 minutes)
        var generatedSlots = new List<AvailabilitySlot>();
        var cursor = start;

        while (cursor.AddMinutes(req.SlotMinutes) <= end)
        {
            var slotEnd = cursor.AddMinutes(req.SlotMinutes);

            generatedSlots.Add(new AvailabilitySlot
            {
                DoctorId = req.DoctorId,
                StartTime = cursor,
                EndTime = slotEnd,
                IsBooked = false
            });

            cursor = slotEnd;
        }

        if (generatedSlots.Count == 0)
            return BadRequest(new { message = "No slots generated. Check time range and SlotMinutes." });

        // 4) Avoid duplicates: fetch existing slots for this doctor on the same day
        var dayStart = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = date.ToDateTime(TimeOnly.MaxValue);

        var existingStartTimes = await _db.AvailabilitySlots
            .Where(s => s.DoctorId == req.DoctorId &&
                        s.StartTime >= dayStart &&
                        s.StartTime <= dayEnd)
            .Select(s => s.StartTime)
            .ToListAsync();

        // Filter out any generated slots that already exist (same StartTime)
        var newSlots = generatedSlots
            .Where(s => !existingStartTimes.Contains(s.StartTime))
            .ToList();

        if (newSlots.Count == 0)
            return Ok(new { message = "No new slots created (all already exist)" });

        // 5) Save to database
        await _db.AvailabilitySlots.AddRangeAsync(newSlots);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // In case the unique index (DoctorId + StartTime) blocks duplicates
            return Conflict(new { message = "Some slots already exist (unique constraint)." });
        }

        return Ok(new
        {
            message = "Slots created",
            created = newSlots.Count
        });
    }

    // DELETE /api/admin/slots/{slotId}
    // Deletes a slot only if it is NOT booked.
    [HttpDelete("{slotId:int}")]
    public async Task<IActionResult> DeleteSlot(int slotId)
    {
        var slot = await _db.AvailabilitySlots.FirstOrDefaultAsync(s => s.Id == slotId);
        if (slot == null) return NotFound(new { message = "Slot not found" });

        // Do not allow deleting booked slots (important for consistency)
        if (slot.IsBooked)
            return BadRequest(new { message = "Cannot delete a booked slot" });

        _db.AvailabilitySlots.Remove(slot);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Slot deleted" });
    }
}