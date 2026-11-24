using System.ComponentModel.DataAnnotations;

namespace MCQAPP.Dto
{
    public class ForgotPasswordRequestDTO
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address format")]
        public string Email { get; set; } = null!;
    }
}
