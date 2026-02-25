using ClinicBooking.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")] // ✅ أي شيء هون لازم يكون Admin
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/admin/health
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            message = "Admin access granted ✅",
            time = DateTime.UtcNow
        });
    }

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                role = u.Role.ToString(),
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }
}