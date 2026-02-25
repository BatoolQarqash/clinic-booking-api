using System.ComponentModel.DataAnnotations;

namespace ClinicBooking.Models;

public class AvailabilitySlot
{
    public int Id { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    // نخليها DateOnly/TimeOnly لاحقًا، للـ MVP نخلي DateTime بسيط
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public bool IsBooked { get; set; } = false;
}