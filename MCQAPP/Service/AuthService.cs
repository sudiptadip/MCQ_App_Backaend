using MCQAPP.Data;
using MCQAPP.Dto;
using MCQAPP.Interface;
using MCQAPP.Models;
using MCQAPP.Utility;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MCQAPP.Service
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            AppDbContext context,
            IJwtService jwtService,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _jwtService = jwtService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<string>> RegisterAsync(RegisterDTO dto)
        {
            // Email exists check
            if (await _context.Users.AnyAsync(x => x.Email == dto.Email))
                return ApiResponse<string>.Fail("Email already exists");

            var currentUser = _httpContextAccessor.HttpContext?.User;

            User user;

            // First user → Super Admin
            if (!await _context.Users.AnyAsync())
            {
                user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    PasswordHash = HashPassword(dto.Password),
                    Role = SD.ROLE_SUPER_ADMIN,
                    FranchiseId = 1,
                    CreatedAt = DateTime.UtcNow
                };
            }
            else
            {
                if (currentUser == null || !currentUser.Identity!.IsAuthenticated)
                    return ApiResponse<string>.Fail("Unauthorized");

                var role = currentUser.FindFirst(ClaimTypes.Role)?.Value;
                var franchiseIdStr = currentUser.FindFirst("FranchiseId")?.Value;

                int? franchiseId = string.IsNullOrEmpty(franchiseIdStr)
                    ? null
                    : int.Parse(franchiseIdStr);

                franchiseId = (role == SD.ROLE_SUPER_ADMIN) ? dto.FranchiseId : franchiseId;

                string newRole;

                if (role == SD.ROLE_SUPER_ADMIN)
                    newRole = SD.ROLE_FRANCHISE_ADMIN;
                else if (role == SD.ROLE_FRANCHISE_ADMIN)
                    newRole = SD.ROLE_STUDENT;
                else
                    return ApiResponse<string>.Fail("Access denied");

                user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    PasswordHash = HashPassword(dto.Password),
                    Role = newRole,
                    FranchiseId = franchiseId,
                    CreatedAt = DateTime.UtcNow
                };
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return ApiResponse<string>.Success(null!, "User registered successfully");
        }

        public async Task<ApiResponse<LoginResponseDTO>> LoginAsync(LoginDTO dto)
        {
            User user = await _context.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null || user.PasswordHash != HashPassword(dto.Password))
            {
                return ApiResponse<LoginResponseDTO>.Fail(
                    "Invalid email or password"
                );
            }

            if ((SD.ROLE_STUDENT == user.Role) &&  string.IsNullOrWhiteSpace(user.DeviceFingerprint))
            {
                user.DeviceFingerprint = dto.DeviceFingerprint;

                _context.Users.Update(user);

                await _context.SaveChangesAsync();
            }

            if ((SD.ROLE_STUDENT == user.Role) && (user.DeviceFingerprint != dto.DeviceFingerprint))
            {
                return ApiResponse<LoginResponseDTO>.Fail(
                    "This account is already logged in on another device. Please login using your registered device."
                );
            }

            string token = _jwtService.GenerateToken(user);

            var userResData = new LoginResponseDTO
            {
                Token = token,
                User = user
            };

            return ApiResponse<LoginResponseDTO>.Success(
                userResData,
                "Login successful"
            );
        }

        private string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            return Convert.ToBase64String(
                sha.ComputeHash(Encoding.UTF8.GetBytes(password))
            );
        }

        public async Task<ApiResponse<string>> RegisterStudent(RegisterStudentDTO dto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Email exists check
                if (await _context.Users.AnyAsync(x => x.Email == dto.Email))
                    return ApiResponse<string>.Fail("Email already exists");

                if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
                    return ApiResponse<string>.Fail("Password must be at least 6 characters");

                var currentUser = _httpContextAccessor.HttpContext?.User;

                if (currentUser == null || !currentUser.Identity!.IsAuthenticated)
                    return ApiResponse<string>.Fail("Unauthorized");

                var role = currentUser.FindFirst(ClaimTypes.Role)?.Value;

                if (role != SD.ROLE_FRANCHISE_ADMIN && role != SD.ROLE_SUPER_ADMIN)
                    return ApiResponse<string>.Fail("Access denied");

                var franchiseIdStr = currentUser.FindFirst("FranchiseId")?.Value;

                if (string.IsNullOrEmpty(franchiseIdStr))
                    return ApiResponse<string>.Fail("Franchise not found");

                int franchiseId = int.Parse(franchiseIdStr);

                //----------------------------------------
                // Create User
                //----------------------------------------
                var user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    PasswordHash = HashPassword(dto.Password),
                    Role = SD.ROLE_STUDENT,
                    FranchiseId = franchiseId,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();


                string enrollmentNo = "STU-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss")
                                      + new Random().Next(100, 999);


                var student = new Student
                {
                    UserId = user.Id,
                    FranchiseId = franchiseId,
                    EnrollmentNo = enrollmentNo,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Students.AddAsync(student);
                await _context.SaveChangesAsync();

                //----------------------------------------
                // Commit
                //----------------------------------------
                await transaction.CommitAsync();

                return ApiResponse<string>.Success(null!, "Student registered successfully");
            }
            catch (Exception ex)
            {
                //----------------------------------------
                // Rollback
                //----------------------------------------
                await transaction.RollbackAsync();

                return ApiResponse<string>.Fail("Something went wrong: " + ex.Message);
            }
        }

    }
}
