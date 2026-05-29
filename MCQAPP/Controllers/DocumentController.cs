using MCQAPP.Dto;
using MCQAPP.Interface;
using MCQAPP.Utility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace MCQAPP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Enforce authorization globally on this controller
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentController(IDocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpPost("upload")]
        [Authorize(Roles = $"{SD.ROLE_SUPER_ADMIN},{SD.ROLE_FRANCHISE_ADMIN}")]
        public async Task<IActionResult> Upload([FromForm] DocumentUploadDto dto)
        {
            if (dto == null || dto.File == null)
            {
                return BadRequest(ApiResponse<string>.Fail("File is required."));
            }

            var result = await _documentService.UploadFileAsync(dto.File);

            if (!result.IsSuccess)
            {
                if (result.StatusCode == 404)
                    return NotFound(result);
                if (result.StatusCode == 403)
                    return StatusCode(StatusCodes.Status403Forbidden, result);
                
                return BadRequest(result);
            }

            return StatusCode(result.StatusCode, result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{SD.ROLE_SUPER_ADMIN},{SD.ROLE_FRANCHISE_ADMIN}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _documentService.DeleteFileAsync(id);

            if (!result.IsSuccess)
            {
                if (result.StatusCode == 404)
                    return NotFound(result);
                if (result.StatusCode == 403)
                    return StatusCode(StatusCodes.Status403Forbidden, result);

                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
