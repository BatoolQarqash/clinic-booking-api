using System.ComponentModel.DataAnnotations;

namespace ClinicBooking.DTOs.Admin;

public class UpsertDoctorRequest
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Bio { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(200)]
    public string? ClinicName { get; set; }

    [Range(0, 10000)]
    public decimal Fee { get; set; }

    [Range(0, 5)]
    public double? Rating { get; set; }

    [Required]
    public int ServiceId { get; set; }

    public bool IsActive { get; set; } = true;
}