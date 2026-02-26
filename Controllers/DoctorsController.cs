using ClinicBooking.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DoctorsController(AppDbContext db) => _db = db;

    // GET /api/doctors?serviceId=1&q=lina
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? serviceId, [FromQuery] string? q)
    {
        var query = _db.Doctors
            .Include(d => d.Service)
            .Where(d => d.IsActive)
            .AsQueryable();

        if (serviceId.HasValue)
            query = query.Where(d => d.ServiceId == serviceId.Value);

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(d => d.FullName.Contains(q) || (d.Title != null && d.Title.Contains(q)));

        var doctors = await query
            .OrderBy(d => d.FullName)
            .Select(d => new
            {
                d.Id,
                d.FullName,
                d.Title,
                d.ClinicName,
                d.Fee,
                d.Rating,
                Service = new { d.Service!.Id, d.Service!.Name }
            })
            .ToListAsync();

        return Ok(doctors);
    }

    // GET /api/doctors/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var doctor = await _db.Doctors
            .Include(d => d.Service)
            .Where(d => d.IsActive && d.Id == id)
            .Select(d => new
            {
                d.Id,
                d.FullName,
                d.Title,
                d.Bio,
                d.ImageUrl,
                d.ClinicName,
                d.Fee,
                d.Rating,
                d.ServiceId,
                Service = new { d.Service!.Id, d.Service!.Name }
            })
            .FirstOrDefaultAsync();

        if (doctor == null) return NotFound(new { message = "Doctor not found" });

        return Ok(doctor);
    }
    // GET /api/doctors/{id}/slots?date=2026-02-22
    [HttpGet("{id:int}/slots")]
    public async Task<IActionResult> GetAvailableSlots(int id, [FromQuery] string date)
    {
        // 1) Validate doctor exists and active
        var doctorExists = await _db.Doctors.AnyAsync(d => d.Id == id && d.IsActive);
        if (!doctorExists)
            return NotFound(new { message = "Doctor not found" });

        // 2) Parse date safely
        if (!DateOnly.TryParse(date, out var day))
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD" });

        var dayStart = day.ToDateTime(TimeOnly.MinValue);
        var dayEnd = day.ToDateTime(TimeOnly.MaxValue);

        // 3) Get only available (not booked) slots for that day
        var slots = await _db.AvailabilitySlots
            .Where(s => s.DoctorId == id
                        && s.StartTime >= dayStart
                        && s.StartTime <= dayEnd
                        && s.IsBooked == false)
            .OrderBy(s => s.StartTime)
            .Select(s => new
            {
                s.Id,
                s.StartTime,
                s.EndTime
            })
            .ToListAsync();

        return Ok(slots);
    }
}