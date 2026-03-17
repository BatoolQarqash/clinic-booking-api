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
    private readonly IWebHostEnvironment _env;

    public AdminDoctorsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

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
                d.ImageUrl,
                ServiceName = d.Service!.Name
            })
            .ToListAsync();

        return Ok(doctors);
    }

    // POST /api/admin/doctors
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] UpsertDoctorRequest req)
    {
        var serviceExists = await _db.Services.AnyAsync(s => s.Id == req.ServiceId);
        if (!serviceExists)
            return BadRequest(new { message = "Invalid ServiceId" });

        string? imageUrl = null;

        if (req.ImageFile != null)
        {
            var saveResult = await SaveDoctorImageAsync(req.ImageFile);
            if (!saveResult.Success)
                return BadRequest(new { message = saveResult.Error });

            imageUrl = saveResult.RelativeUrl;
        }

        var doctor = new Doctor
        {
            FullName = req.FullName,
            Title = req.Title,
            Bio = req.Bio,
            ImageUrl = imageUrl,
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
    public async Task<IActionResult> Update(int id, [FromForm] UpsertDoctorRequest req)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == id);
        if (doctor == null) return NotFound(new { message = "Doctor not found" });

        var serviceExists = await _db.Services.AnyAsync(s => s.Id == req.ServiceId);
        if (!serviceExists)
            return BadRequest(new { message = "Invalid ServiceId" });

        doctor.FullName = req.FullName;
        doctor.Title = req.Title;
        doctor.Bio = req.Bio;
        doctor.ClinicName = req.ClinicName;
        doctor.Fee = req.Fee;
        doctor.Rating = req.Rating;
        doctor.ServiceId = req.ServiceId;
        doctor.IsActive = req.IsActive;

        // Update image only if admin selected a new file
        if (req.ImageFile != null)
        {
            var saveResult = await SaveDoctorImageAsync(req.ImageFile);
            if (!saveResult.Success)
                return BadRequest(new { message = saveResult.Error });

            // Optional: delete old image from disk
            DeleteOldImageIfExists(doctor.ImageUrl);

            doctor.ImageUrl = saveResult.RelativeUrl;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Updated" });
    }

    // DELETE /api/admin/doctors/{id} (Soft delete)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == id);
        if (doctor == null) return NotFound(new { message = "Doctor not found" });

        doctor.IsActive = false;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Doctor deactivated (IsActive=false)" });
    }

    /* --------------------------------------------------
       Image helpers
    -------------------------------------------------- */

    private async Task<(bool Success, string? RelativeUrl, string? Error)> SaveDoctorImageAsync(IFormFile file)
    {
        if (file.Length <= 0)
            return (false, null, "Image file is empty.");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(ext))
            return (false, null, "Only .jpg, .jpeg, .png, and .webp images are allowed.");

        // Optional size limit: 3 MB
        const long maxBytes = 3 * 1024 * 1024;
        if (file.Length > maxBytes)
            return (false, null, "Image size must be 3 MB or less.");

        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "doctors");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/doctors/{fileName}";
        return (true, relativeUrl, null);
    }

    private void DeleteOldImageIfExists(string? oldImageUrl)
    {
        if (string.IsNullOrWhiteSpace(oldImageUrl))
            return;

        // Example oldImageUrl: /uploads/doctors/abc.jpg
        var relativePath = oldImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), relativePath);

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }
    }
}