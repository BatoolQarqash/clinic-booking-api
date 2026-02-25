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
}