using MCQAPP.Dto;
using System.Threading.Tasks;

namespace MCQAPP.Interface
{
    public interface IAuthService
    {
        Task<ApiResponse<string>> RegisterAsync(RegisterDTO dto);
        Task<ApiResponse<string>> RegisterStudent(RegisterStudentDTO dto);
        Task<ApiResponse<BulkStudentResultDTO>> BulkRegisterStudents(List<RegisterStudentDTO> dtos);
        Task<ApiResponse<List<string>>> CheckExistingEmails(List<string> emails);
        Task<ApiResponse<object>> RegisterWebStudentAsync(RegisterWebStudentDTO dto);
        Task<ApiResponse<string>> VerifyOtpAsync(VerifyOtpDTO dto);
        Task<ApiResponse<string>> ResendOtpAsync(ResendOtpDTO dto);
        Task<ApiResponse<LoginResponseDTO>> LoginAsync(LoginDTO dto);
        Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordRequestDTO dto);
        Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordDTO dto);
    }
}
