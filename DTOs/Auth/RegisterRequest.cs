using System.ComponentModel.DataAnnotations;
namespace ClinicBooking.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6), MaxLength(100)]
        public string Password { get; set; } = string.Empty;
    }
}
