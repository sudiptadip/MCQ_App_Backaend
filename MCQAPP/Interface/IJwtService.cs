using MCQAPP.Models;

namespace MCQAPP.Interface
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}