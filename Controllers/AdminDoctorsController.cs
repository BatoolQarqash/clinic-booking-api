using ClinicBooking.Data;
using ClinicBooking.DTOs.Admin;
using ClinicBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/admin/doctors")]
[Authorize(Roles = "Admin")]
public class AdminDoctorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminDoctorsController(AppDbContext db) => _db = db;

    // GET /api/admin/doctors
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var doctors = await _db.Doctors
            .Include(d => d.Service)
            .OrderByDescending(d => d.Id)
            .Select(d => new
            {
                d.Id,
                d.FullName,
                d.Title,
                d.ClinicName,
                d.Fee,
                d.Rating,
                d.IsActive,
                d.ServiceId,
                ServiceName = d.Service!.Name
            })
            .ToListAsync();

        return Ok(doctors);
    }

    // POST /api/admin/doctors
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertDoctorRequest req)
    {
        // تحقق إن Service موجود
        var serviceExists = await _db.Services.AnyAsync(s => s.Id == req.ServiceId);
        if (!serviceExists)
            return BadRequest(new { message = "Invalid ServiceId" });

        var doctor = new Doctor
        {
            FullName = req.FullName,
            Title = req.Title,
            Bio = req.Bio,
            ImageUrl = req.ImageUrl,
            ClinicName = req.ClinicName,
            Fee = req.Fee,
            Rating = req.Rating,
            ServiceId = req.ServiceId,
            IsActive = req.IsActive
        };

        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = doctor.Id }, new { doctor.Id });
    }

    // GET /api/admin/doctors/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var doctor = await _db.Doctors
            .Include(d => d.Service)
            .Where(d => d.Id == id)
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
                d.IsActive,
                d.ServiceId,
                ServiceName = d.Service!.Name
            })
            .FirstOrDefaultAsync();

        if (doctor == null) return NotFound(new { message = "Doctor not found" });
        return Ok(doctor);
    }

    // PUT /api/admin/doctors/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertDoctorRequest req)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == id);
        if (doctor == null) return NotFound(new { message = "Doctor not found" });

        var serviceExists = await _db.Services.AnyAsync(s => s.Id == req.ServiceId);
        if (!serviceExists)
            return BadRequest(new { message = "Invalid ServiceId" });

        doctor.FullName = req.FullName;
        doctor.Title = req.Title;
        doctor.Bio = req.Bio;
        doctor.ImageUrl = req.ImageUrl;
        doctor.ClinicName = req.ClinicName;
        doctor.Fee = req.Fee;
        doctor.Rating = req.Rating;
        doctor.ServiceId = req.ServiceId;
        doctor.IsActive = req.IsActive;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Updated" });
    }

    // DELETE /api/admin/doctors/{id}  (Soft delete)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == id);
        if (doctor == null) return NotFound(new { message = "Doctor not found" });

        doctor.IsActive = false;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Doctor deactivated (IsActive=false)" });
    }
}