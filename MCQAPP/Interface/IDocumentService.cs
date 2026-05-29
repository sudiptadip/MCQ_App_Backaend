using MCQAPP.Dto;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace MCQAPP.Interface
{
    public interface IDocumentService
    {
        Task<ApiResponse<DocumentResponseDto>> UploadFileAsync(IFormFile file);
        Task<ApiResponse<string>> DeleteFileAsync(int documentId);
    }
}
