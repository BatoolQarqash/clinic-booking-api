using System.ComponentModel.DataAnnotations;

namespace ClinicBooking.DTOs.Admin;

public class CreateSlotsRequest
{
    [Required]
    public int DoctorId { get; set; }

    // مثال: "2026-02-22"
    [Required]
    public string Date { get; set; } = string.Empty;

    // مثال: "09:00"
    [Required]
    public string StartTime { get; set; } = string.Empty;

    // مثال: "13:00"
    [Required]
    public string EndTime { get; set; } = string.Empty;

    // مثال: 30
    [Range(5, 240)]
    public int SlotMinutes { get; set; } = 30;
}