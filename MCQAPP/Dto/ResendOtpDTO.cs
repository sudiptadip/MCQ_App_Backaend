using System.ComponentModel.DataAnnotations;

namespace MCQAPP.Dto
{
    public class ResendOtpDTO
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        public string Email { get; set; } = null!;
    }
}
