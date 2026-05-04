using MCQAPP.Models;

namespace MCQAPP.Dto
{

    public class LoginResponseDTO
    {
        public string Token { get; set; }
        public User User { get; set; }
    }

}
