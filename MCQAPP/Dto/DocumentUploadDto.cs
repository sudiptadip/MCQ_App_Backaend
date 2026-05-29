using Microsoft.AspNetCore.Http;

namespace MCQAPP.Dto
{
    public class DocumentUploadDto
    {
        public IFormFile File { get; set; } = null!;
    }
}
