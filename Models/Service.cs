using System.ComponentModel.DataAnnotations;

namespace ClinicBooking.Models;

public class Service
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}