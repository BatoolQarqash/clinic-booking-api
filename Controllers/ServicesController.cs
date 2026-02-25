using ClinicBooking.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServicesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var services = await _db.Services
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                s.Id,
                s.Name
            })
            .ToListAsync();

        return Ok(services);
    }
}