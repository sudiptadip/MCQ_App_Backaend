using MCQAPP.Dto;
using System.Threading.Tasks;

namespace MCQAPP.Interface
{
    public interface IAuthService
    {
        Task<ApiResponse<string>> RegisterAsync(RegisterDTO dto);
        Task<ApiResponse<string>> RegisterStudent(RegisterStudentDTO dto);
        Task<ApiResponse<LoginResponseDTO>> LoginAsync(LoginDTO dto);
    }
}
