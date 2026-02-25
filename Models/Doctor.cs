using System.ComponentModel.DataAnnotations;

namespace ClinicBooking.Models;

public class Doctor
{
    public int Id { get; set; }

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

    public decimal Fee { get; set; }

    public double? Rating { get; set; }

    public bool IsActive { get; set; } = true;

    public int ServiceId { get; set; }
    public Service? Service { get; set; }

    public ICollection<AvailabilitySlot> Slots { get; set; } = new List<AvailabilitySlot>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}