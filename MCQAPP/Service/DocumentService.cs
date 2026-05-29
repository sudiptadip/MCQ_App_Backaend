using MCQAPP.Data;
using MCQAPP.Dto;
using MCQAPP.Interface;
using MCQAPP.Models;
using MCQAPP.Utility;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MCQAPP.Service
{
    public class DocumentService : IDocumentService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt" };
        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        public DocumentService(AppDbContext context, IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _env = env;
            _httpContextAccessor = httpContextAccessor;
        }



        public async Task<ApiResponse<DocumentResponseDto>> UploadFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return ApiResponse<DocumentResponseDto>.Fail("No file uploaded or file is empty.");
            }

            // 0.5 Retrieve Franchise ID from Token Claims
            var currentUser = _httpContextAccessor.HttpContext?.User;
            if (currentUser == null || !currentUser.Identity!.IsAuthenticated)
            {
                return ApiResponse<DocumentResponseDto>.Fail("Unauthorized access.", null, 401);
            }

            var role = currentUser.FindFirst(ClaimTypes.Role)?.Value;
            var userFranchiseIdStr = currentUser.FindFirst("FranchiseId")?.Value;

            if (string.IsNullOrEmpty(userFranchiseIdStr))
            {
                return ApiResponse<DocumentResponseDto>.Fail("Franchise ID claim not found in token.", null, 400);
            }

            if (role != SD.ROLE_SUPER_ADMIN && role != SD.ROLE_FRANCHISE_ADMIN)
            {
                return ApiResponse<DocumentResponseDto>.Fail("Access denied: Insufficient permissions.", null, 403);
            }

            int franchiseId = int.Parse(userFranchiseIdStr);

            // 1. Validate File Size
            if (file.Length > MaxFileSize)
            {
                return ApiResponse<DocumentResponseDto>.Fail($"File size exceeds the limit of {MaxFileSize / (1024 * 1024)} MB.");
            }

            // 2. Validate File Extension
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(fileExtension))
            {
                return ApiResponse<DocumentResponseDto>.Fail($"Unsupported file type. Allowed types: {string.Join(", ", AllowedExtensions)}");
            }

            // 3. Verify Franchise Exists
            var franchiseExists = await _context.Franchises.AnyAsync(f => f.Id == franchiseId);
            if (!franchiseExists)
            {
                return ApiResponse<DocumentResponseDto>.Fail($"Franchise with ID {franchiseId} not found.", null, 404);
            }

            // 4. Resolve Storage Directory
            var webRootPath = _env.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                // Fallback if WebRootPath is not set (e.g. running in some test or console environments)
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var relativeUploadDir = Path.Combine("uploads", $"franchise-{franchiseId}");
            var absoluteUploadDir = Path.Combine(webRootPath, relativeUploadDir);

            // Create physical directory if not exists
            if (!Directory.Exists(absoluteUploadDir))
            {
                Directory.CreateDirectory(absoluteUploadDir);
            }

            // 5. Generate Safe, Unique File Name
            var originalFileName = Path.GetFileNameWithoutExtension(file.FileName);
            var sanitizedFileName = string.Concat(originalFileName.Select(c => char.IsLetterOrDigit(c) ? c : '_'));
            if (sanitizedFileName.Length > 100)
            {
                sanitizedFileName = sanitizedFileName.Substring(0, 100);
            }
            
            var uniqueFileName = $"{sanitizedFileName}_{Guid.NewGuid().ToString().Substring(0, 8)}{fileExtension}";
            var absoluteFilePath = Path.Combine(absoluteUploadDir, uniqueFileName);

            // 6. Save Physically
            try
            {
                using (var stream = new FileStream(absoluteFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
            }
            catch (Exception ex)
            {
                return ApiResponse<DocumentResponseDto>.Fail($"Failed to save file physically: {ex.Message}");
            }

            // 7. Store in Database
            // Get Request Context to generate absolute or clean path
            var request = _httpContextAccessor.HttpContext?.Request;
            string webUrl;
            
            // Normalize relative URL path
            var relativeUrl = $"/uploads/franchise-{franchiseId}/{uniqueFileName}".Replace('\\', '/');

            if (request != null)
            {
                // Build dynamic complete URL (e.g. http://localhost:7001/uploads/franchise-1/test_xyz.png)
                webUrl = $"{request.Scheme}://{request.Host}{relativeUrl}";
            }
            else
            {
                webUrl = relativeUrl;
            }

            var document = new Document
            {
                FranchiseId = franchiseId,
                FileName = uniqueFileName,
                FilePath = absoluteFilePath,
                Url = relativeUrl, // We store the relative path for flexibility, but we return both or the absolute one
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow
            };

            try
            {
                _context.Documents.Add(document);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Cleanup physical file on DB failure
                if (File.Exists(absoluteFilePath))
                {
                    File.Delete(absoluteFilePath);
                }
                return ApiResponse<DocumentResponseDto>.Fail($"Failed to save file metadata to database: {ex.Message}");
            }

            var responseDto = new DocumentResponseDto
            {
                DocumentId = document.Id,
                Url = webUrl, // Return absolute web URL to user
                FileName = uniqueFileName
            };

            return ApiResponse<DocumentResponseDto>.Success(responseDto, "File uploaded successfully.", 201);
        }

        public async Task<ApiResponse<string>> DeleteFileAsync(int documentId)
        {
            var document = await _context.Documents.FindAsync(documentId);
            if (document == null)
            {
                return ApiResponse<string>.Fail($"Document with ID {documentId} not found.", null, 404);
            }

            // 2. Verify User Claims and Authorization
            var currentUser = _httpContextAccessor.HttpContext?.User;
            if (currentUser != null && currentUser.Identity!.IsAuthenticated)
            {
                var role = currentUser.FindFirst(ClaimTypes.Role)?.Value;
                var userFranchiseIdStr = currentUser.FindFirst("FranchiseId")?.Value;

                if (role == SD.ROLE_FRANCHISE_ADMIN)
                {
                    if (string.IsNullOrEmpty(userFranchiseIdStr) || int.Parse(userFranchiseIdStr) != document.FranchiseId)
                    {
                        return ApiResponse<string>.Fail("Access denied: You can only delete files belonging to your own franchise.", null, 403);
                    }
                }
                else if (role != SD.ROLE_SUPER_ADMIN)
                {
                    return ApiResponse<string>.Fail("Access denied: Insufficient permissions.", null, 403);
                }
            }

            // Delete physically first
            try
            {
                if (File.Exists(document.FilePath))
                {
                    File.Delete(document.FilePath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DocumentService] Physical file delete failed: {ex.Message}");
                // We proceed to delete from DB anyway to prevent database inconsistency if file is missing
            }

            // Delete from DB
            try
            {
                _context.Documents.Remove(document);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return ApiResponse<string>.Fail($"Failed to delete file record from database: {ex.Message}");
            }

            return ApiResponse<string>.Success(null!, "File deleted successfully.");
        }
    }
}
