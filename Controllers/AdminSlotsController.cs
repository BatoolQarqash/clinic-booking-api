using ClinicBooking.DTOs.Admin;
using ClinicBooking.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/admin/slots")]
[Authorize(Roles = "Admin")]
public class AdminSlotsController : ControllerBase
{
    private readonly SlotService _slotService;

    public AdminSlotsController(SlotService slotService) => _slotService = slotService;

    [HttpPost("bulk")]
    public async Task<IActionResult> CreateBulk([FromBody] CreateSlotsRequest req)
    {
        var (ok, status, result) = await _slotService.CreateBulkAsync(req);
        return StatusCode(status, result);
    }

    [HttpDelete("{slotId:int}")]
    public async Task<IActionResult> DeleteSlot(int slotId)
    {
        var (ok, status, result) = await _slotService.DeleteSlotAsync(slotId);
        return StatusCode(status, result);
    }
}