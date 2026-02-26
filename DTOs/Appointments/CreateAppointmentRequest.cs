using System.ComponentModel.DataAnnotations;

namespace ClinicBooking.DTOs.Appointments;

public class CreateAppointmentRequest
{
    [Required]
    public int DoctorId { get; set; }

    [Required]
    public int SlotId { get; set; }
}