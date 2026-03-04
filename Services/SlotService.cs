using ClinicBooking.Data;
using ClinicBooking.DTOs.Admin;
using ClinicBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Services;

public class SlotService
{
    private readonly AppDbContext _db;

    public SlotService(AppDbContext db) => _db = db;

    public async Task<(bool ok, int statusCode, object result)> CreateBulkAsync(CreateSlotsRequest req)
    {
        var doctorExists = await _db.Doctors.AnyAsync(d => d.Id == req.DoctorId);
        if (!doctorExists)
            return (false, 400, new { message = "Invalid DoctorId" });

        if (!DateOnly.TryParse(req.Date, out var date))
            return (false, 400, new { message = "Invalid date format. Use YYYY-MM-DD (e.g. 2026-02-22)" });

        if (!TimeOnly.TryParse(req.StartTime, out var startTime))
            return (false, 400, new { message = "Invalid startTime format. Use HH:mm (e.g. 09:00)" });

        if (!TimeOnly.TryParse(req.EndTime, out var endTime))
            return (false, 400, new { message = "Invalid endTime format. Use HH:mm (e.g. 12:00)" });

        var start = date.ToDateTime(startTime);
        var end = date.ToDateTime(endTime);

        if (end <= start)
            return (false, 400, new { message = "EndTime must be after StartTime" });

        if (req.SlotMinutes <= 0)
            return (false, 400, new { message = "SlotMinutes must be greater than 0" });

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
            return (false, 400, new { message = "No slots generated. Check time range and SlotMinutes." });

        var dayStart = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = date.ToDateTime(TimeOnly.MaxValue);

        var existingStartTimes = await _db.AvailabilitySlots
            .Where(s => s.DoctorId == req.DoctorId &&
                        s.StartTime >= dayStart &&
                        s.StartTime <= dayEnd)
            .Select(s => s.StartTime)
            .ToListAsync();

        var newSlots = generatedSlots
            .Where(s => !existingStartTimes.Contains(s.StartTime))
            .ToList();

        if (newSlots.Count == 0)
            return (true, 200, new { message = "No new slots created (all already exist)" });

        await _db.AvailabilitySlots.AddRangeAsync(newSlots);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return (false, 409, new { message = "Some slots already exist (unique constraint)." });
        }

        return (true, 200, new { message = "Slots created", created = newSlots.Count });
    }

    public async Task<(bool ok, int statusCode, object result)> DeleteSlotAsync(int slotId)
    {
        var slot = await _db.AvailabilitySlots.FirstOrDefaultAsync(s => s.Id == slotId);
        if (slot == null) return (false, 404, new { message = "Slot not found" });

        if (slot.IsBooked)
            return (false, 400, new { message = "Cannot delete a booked slot" });

        _db.AvailabilitySlots.Remove(slot);
        await _db.SaveChangesAsync();

        return (true, 200, new { message = "Slot deleted" });
    }
}