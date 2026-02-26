using ClinicBooking.Data;
using ClinicBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/admin/appointments")]
[Authorize(Roles = "Admin")]
public class AdminAppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminAppointmentsController(AppDbContext db) => _db = db;

    // GET /api/admin/appointments?page=1&pageSize=20&status=Booked&doctorId=2&userEmail=gmail&from=2026-02-22&to=2026-02-28
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? doctorId = null,
        [FromQuery] string? userEmail = null,
        [FromQuery] string? from = null,
        [FromQuery] string? to = null
    )
    {
        // 1) Normalize pagination inputs (clean + safe)
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        // 2) Base query (AsQueryable enables dynamic filters)
        var query = _db.Appointments
            .Include(a => a.User)
            .Include(a => a.Doctor)
            .Include(a => a.Slot)
            .AsQueryable();

        // 3) Filters

        // Status filter (Booked/Cancelled/Completed)
        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<AppointmentStatus>(status, ignoreCase: true, out var parsedStatus))
        {
            query = query.Where(a => a.Status == parsedStatus);
        }

        // Doctor filter
        if (doctorId.HasValue)
            query = query.Where(a => a.DoctorId == doctorId.Value);

        // User email partial search
        if (!string.IsNullOrWhiteSpace(userEmail))
            query = query.Where(a => a.User != null && a.User.Email.Contains(userEmail));

        // Date range filter based on Slot.StartTime
        if (!string.IsNullOrWhiteSpace(from) && DateOnly.TryParse(from, out var fromDate))
        {
            var fromDt = fromDate.ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.Slot != null && a.Slot.StartTime >= fromDt);
        }

        if (!string.IsNullOrWhiteSpace(to) && DateOnly.TryParse(to, out var toDate))
        {
            var toDt = toDate.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(a => a.Slot != null && a.Slot.StartTime <= toDt);
        }

        // 4) Total count (for pagination metadata)
        var total = await query.CountAsync();

        // 5) Page data
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                status = a.Status.ToString(),
                a.CreatedAt,
                User = new { a.User!.Id, a.User.Email, a.User.FullName },
                Doctor = new { a.Doctor!.Id, a.Doctor.FullName },
                Slot = new { a.Slot!.StartTime, a.Slot!.EndTime }
            })
            .ToListAsync();

        // 6) Return with metadata (clean API response)
        return Ok(new
        {
            page,
            pageSize,
            total,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
            items
        });
    }
}