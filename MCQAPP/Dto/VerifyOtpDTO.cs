using System.ComponentModel.DataAnnotations;

namespace MCQAPP.Dto
{
    public class VerifyOtpDTO
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "OTP is required")]
        [StringLength(10, MinimumLength = 4, ErrorMessage = "Invalid OTP length")]
        public string Otp { get; set; } = null!;
    }
}
