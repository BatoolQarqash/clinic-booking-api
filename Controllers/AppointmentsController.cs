using ClinicBooking.DTOs.Appointments;
using ClinicBooking.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppointmentService _appointmentService;

    public AppointmentsController(AppointmentService appointmentService)
        => _appointmentService = appointmentService;

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Book([FromBody] CreateAppointmentRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Invalid token" });

        var (ok, status, result) = await _appointmentService.BookAsync(userId, req);
        return StatusCode(status, result);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> MyAppointments()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Invalid token" });

        var items = await _appointmentService.MyAsync(userId);
        return Ok(items);
    }

    [HttpPatch("{id:int}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(int id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Invalid token" });

        var (ok, status, result) = await _appointmentService.CancelAsync(userId, id);
        return StatusCode(status, result);
    }
}