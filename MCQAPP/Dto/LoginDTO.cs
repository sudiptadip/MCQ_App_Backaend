namespace MCQAPP.Dto
{
    public class LoginDTO
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string DeviceFingerprint { get; set; }
    }
}
