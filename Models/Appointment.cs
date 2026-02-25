namespace ClinicBooking.Models;

public enum AppointmentStatus
{
    Booked = 0,
    Cancelled = 1,
    Completed = 2
}

public class Appointment
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public int SlotId { get; set; }
    public AvailabilitySlot? Slot { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Booked;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}