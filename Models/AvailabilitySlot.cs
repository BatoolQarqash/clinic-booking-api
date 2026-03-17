using System.ComponentModel.DataAnnotations;

namespace ClinicBooking.Models;

public class AvailabilitySlot
{
    public int Id { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    // For MVP we keep DateTime simple
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public bool IsBooked { get; set; } = false;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}