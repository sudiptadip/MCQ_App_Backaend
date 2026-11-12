using System.ComponentModel.DataAnnotations;

namespace MCQAPP.Dto
{
    public class RegisterWebStudentDTO
    {
        [Required(ErrorMessage = "Name is required")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Email is required")]
       // [EmailAddress(ErrorMessage = "Invalid email address format")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = null!;

        public string? Phone { get; set; }
    }
}
