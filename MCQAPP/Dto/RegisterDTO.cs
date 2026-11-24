namespace MCQAPP.Dto
{
    public class RegisterStudentDTO
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? MobileNo { get; set; }
        public string? ParentName { get; set; }
        public List<int>? CategoryIds { get; set; }
    }
}