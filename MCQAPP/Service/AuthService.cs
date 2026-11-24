using MCQAPP.Data;
using MCQAPP.Dto;
using MCQAPP.Interface;
using MCQAPP.Models;
using MCQAPP.Utility;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace MCQAPP.Service
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IEmailService _emailService;

        public AuthService(
            AppDbContext context,
            IJwtService jwtService,
            IHttpContextAccessor httpContextAccessor,
            IEmailService emailService)
        {
            _context = context;
            _jwtService = jwtService;
            _httpContextAccessor = httpContextAccessor;
            _emailService = emailService;
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
                    IsVerified = true,
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
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow
                };
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                if (user.Role != SD.ROLE_SUPER_ADMIN)
                {
                    await UpsertUserPasswordAsync(user.Id, dto.Password);
                }

                await transaction.CommitAsync();
                return ApiResponse<string>.Success(null!, "User registered successfully");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ApiResponse<string>.Fail("Failed to register user: " + ex.Message);
            }
        }

        public async Task<ApiResponse<object>> RegisterWebStudentAsync(RegisterWebStudentDTO dto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                string cleanEmail = dto.Email.Trim().ToLower();

                // Check if user with email exists
                var existingUser = await _context.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == cleanEmail);
                if (existingUser != null)
                {
                    if (existingUser.IsVerified)
                    {
                        return ApiResponse<object>.Fail("An account with this email already exists");
                    }
                    else
                    {
                        // Update unverified user password & OTP
                        string newOtp = new Random().Next(100000, 999999).ToString();
                        existingUser.Name = dto.Name;
                        existingUser.PasswordHash = HashPassword(dto.Password);
                        existingUser.Otp = newOtp;
                        existingUser.OtpExpiry = DateTime.UtcNow.AddMinutes(15);
                        existingUser.UpdatedAt = DateTime.UtcNow;

                        _context.Users.Update(existingUser);
                        await _context.SaveChangesAsync();
                        if (existingUser.Role != SD.ROLE_SUPER_ADMIN)
                        {
                            await UpsertUserPasswordAsync(existingUser.Id, dto.Password);
                        }
                        await transaction.CommitAsync();

                        // Send OTP Email via SMTP for Franchise 1
                        bool IsemailSent = await _emailService.SendOtpEmailAsync(existingUser.Email, existingUser.Name, newOtp, 1);

                        string messages = IsemailSent
                            ? "Registration updated. OTP sent to email for verification."
                            : "Registration updated, but OTP email failed to send. Please check SMTP settings or click Resend OTP.";

                        return ApiResponse<object>.Success(
                            new { email = existingUser.Email, isVerified = false, IsemailSent },
                            messages
                        );
                    }
                }

                // Default Franchise ID = 1 and Default Role = WEB_STUDENT
                int defaultFranchiseId = 1;
                string defaultRole = SD.ROLE_WEB_STUDENT;
                string otp = new Random().Next(100000, 999999).ToString();

                var user = new User
                {
                    Name = dto.Name,
                    Email = cleanEmail,
                    PasswordHash = HashPassword(dto.Password),
                    Role = defaultRole,
                    FranchiseId = defaultFranchiseId,
                    IsVerified = false,
                    Otp = otp,
                    OtpExpiry = DateTime.UtcNow.AddMinutes(15),
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();
                await UpsertUserPasswordAsync(user.Id, dto.Password);

                string enrollmentNo = "WEB-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss")
                                      + new Random().Next(100, 999);

                var student = new Student
                {
                    UserId = user.Id,
                    FranchiseId = defaultFranchiseId,
                    EnrollmentNo = enrollmentNo,
                    Email = user.Email,
                    MobileNo = dto.Phone,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Students.AddAsync(student);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Send OTP Email via SMTP for Franchise 1
                bool emailSent = await _emailService.SendOtpEmailAsync(user.Email, user.Name, otp, defaultFranchiseId);

                string message = emailSent
                    ? "User registered successfully. An OTP has been sent to your email for verification."
                    : "User registered successfully, but OTP email failed to send. Please verify SMTP credentials or click Resend OTP.";

                return ApiResponse<object>.Success(
                    new { id = user.Id, email = user.Email, role = user.Role, franchiseId = defaultFranchiseId, isVerified = false, emailSent },
                    message
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ApiResponse<object>.Fail("Failed to register web student: " + ex.Message);
            }
        }

        public async Task<ApiResponse<string>> VerifyOtpAsync(VerifyOtpDTO dto)
        {
            string cleanEmail = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
            if (user == null)
            {
                return ApiResponse<string>.Fail("User not found");
            }

            if (user.IsVerified)
            {
                return ApiResponse<string>.Success(null!, "Email is already verified");
            }

            if (string.IsNullOrWhiteSpace(user.Otp) || user.Otp != dto.Otp.Trim())
            {
                return ApiResponse<string>.Fail("Invalid OTP code");
            }

            if (user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
            {
                return ApiResponse<string>.Fail("OTP code has expired. Please request a new OTP");
            }

            user.IsVerified = true;
            user.Otp = null;
            user.OtpExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return ApiResponse<string>.Success(null!, "Email verified successfully. You can now log in.");
        }

        public async Task<ApiResponse<string>> ResendOtpAsync(ResendOtpDTO dto)
        {
            string cleanEmail = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
            if (user == null)
            {
                return ApiResponse<string>.Fail("User not found");
            }

            if (user.IsVerified)
            {
                return ApiResponse<string>.Success(null!, "Email is already verified");
            }

            string newOtp = new Random().Next(100000, 999999).ToString();
            user.Otp = newOtp;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(15);
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            int franchiseId = user.FranchiseId ?? 1;
            await _emailService.SendOtpEmailAsync(user.Email, user.Name, newOtp, franchiseId);

            return ApiResponse<string>.Success(null!, "A new OTP has been sent to your email address.");
        }

        public async Task<ApiResponse<LoginResponseDTO>> LoginAsync(LoginDTO dto)
        {
            User user = await _context.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == dto.Email.ToLower());

            if (user == null || user.PasswordHash != HashPassword(dto.Password))
            {
                return ApiResponse<LoginResponseDTO>.Fail(
                    "Invalid email or password"
                );
            }

            if ((user.Role == SD.ROLE_WEB_STUDENT || user.Role == SD.ROLE_STUDENT) && !user.IsVerified)
            {
                return ApiResponse<LoginResponseDTO>.Fail(
                    "Your account email is not verified. Please verify the OTP sent to your email."
                );
            }

            if ((SD.ROLE_STUDENT == user.Role) && string.IsNullOrWhiteSpace(user.DeviceFingerprint))
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

            if (SD.ROLE_STUDENT == user.Role || SD.ROLE_WEB_STUDENT == user.Role)
            {
                var studentDetails = _context.Students.FirstOrDefault(s => s.UserId == user.Id);
                if (studentDetails != null && studentDetails.ValidityDate != null && studentDetails.ValidityDate < DateTime.Now)
                {
                    return ApiResponse<LoginResponseDTO>.Fail(
                        "Your subscription has expired. Please contact your franchise"
                    );
                }
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

        private async Task UpsertUserPasswordAsync(int userId, string password)
        {
            if (string.IsNullOrEmpty(password))
                return;

            var existingPassword = await _context.UserPasswords
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (existingPassword != null)
            {
                existingPassword.Password = password;
                existingPassword.UpdatedAt = DateTime.UtcNow;
                _context.UserPasswords.Update(existingPassword);
            }
            else
            {
                await _context.UserPasswords.AddAsync(new UserPassword
                {
                    UserId = userId,
                    Password = password,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
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
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();
                await UpsertUserPasswordAsync(user.Id, dto.Password);

                string enrollmentNo = "STU-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss")
                                      + new Random().Next(100, 999);

                var student = new Student
                {
                    UserId = user.Id,
                    FranchiseId = franchiseId,
                    EnrollmentNo = enrollmentNo,
                    Email = user.Email,
                    MobileNo = string.IsNullOrWhiteSpace(dto.MobileNo) ? null : dto.MobileNo.Trim(),
                    ParentName = string.IsNullOrWhiteSpace(dto.ParentName) ? null : dto.ParentName.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Students.AddAsync(student);
                await _context.SaveChangesAsync();

                // Assign categories if provided
                if (dto.CategoryIds != null && dto.CategoryIds.Any())
                {
                    var validCategoryIds = dto.CategoryIds.Where(id => id > 0).Distinct().ToList();
                    foreach (var catId in validCategoryIds)
                    {
                        await _context.Database.ExecuteSqlRawAsync(
                            "IF NOT EXISTS (SELECT 1 FROM [dbo].[student_assigned_categories] WHERE [student_user_id] = {0} AND [category_id] = {1}) " +
                            "INSERT INTO [dbo].[student_assigned_categories] ([student_user_id], [category_id], [assigned_at]) VALUES ({0}, {1}, GETDATE())",
                            user.Id, catId);
                    }
                }

                await transaction.CommitAsync();

                return ApiResponse<string>.Success(null!, "Student registered successfully");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ApiResponse<string>.Fail("Something went wrong: " + ex.Message);
            }
        }

        public async Task<ApiResponse<BulkStudentResultDTO>> BulkRegisterStudents(List<RegisterStudentDTO> dtos)
        {
            if (dtos == null || !dtos.Any())
                return ApiResponse<BulkStudentResultDTO>.Fail("No students provided for registration.");

            var currentUser = _httpContextAccessor.HttpContext?.User;
            if (currentUser == null || !currentUser.Identity!.IsAuthenticated)
                return ApiResponse<BulkStudentResultDTO>.Fail("Unauthorized");

            var role = currentUser.FindFirst(ClaimTypes.Role)?.Value;
            if (role != SD.ROLE_FRANCHISE_ADMIN && role != SD.ROLE_SUPER_ADMIN)
                return ApiResponse<BulkStudentResultDTO>.Fail("Access denied");

            var franchiseIdStr = currentUser.FindFirst("FranchiseId")?.Value;
            if (string.IsNullOrEmpty(franchiseIdStr))
                return ApiResponse<BulkStudentResultDTO>.Fail("Franchise not found");

            int franchiseId = int.Parse(franchiseIdStr);

            var result = new BulkStudentResultDTO
            {
                TotalProcessed = dtos.Count
            };

            // Pre-fetch all emails to minimize individual database round trips
            var inputEmails = dtos
                .Where(d => !string.IsNullOrWhiteSpace(d.Email))
                .Select(d => d.Email.Trim().ToLower())
                .Distinct()
                .ToList();

            var existingEmails = await _context.Users
                .Where(u => inputEmails.Contains(u.Email.ToLower()))
                .Select(u => u.Email.ToLower())
                .ToListAsync();

            var usedEmails = new HashSet<string>(existingEmails, StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < dtos.Count; i++)
            {
                var dto = dtos[i];
                int rowNumber = i + 1;
                string cleanEmail = (dto.Email ?? "").Trim().ToLower();

                if (string.IsNullOrWhiteSpace(cleanEmail))
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row #{rowNumber}: Email is required.");
                    continue;
                }

                if (usedEmails.Contains(cleanEmail))
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row #{rowNumber} ({dto.Name}): Email '{dto.Email}' already exists.");
                    continue;
                }

                if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Trim().Length < 2)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row #{rowNumber}: Student name must be at least 2 characters.");
                    continue;
                }

                if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row #{rowNumber} ({dto.Name}): Password must be at least 6 characters.");
                    continue;
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var user = new User
                    {
                        Name = dto.Name.Trim(),
                        Email = dto.Email.Trim(),
                        PasswordHash = HashPassword(dto.Password),
                        Role = SD.ROLE_STUDENT,
                        FranchiseId = franchiseId,
                        IsVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.Users.AddAsync(user);
                    await _context.SaveChangesAsync();
                    await UpsertUserPasswordAsync(user.Id, dto.Password);

                    string enrollmentNo = "STU-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss")
                                          + new Random().Next(100, 999);

                    var student = new Student
                    {
                        UserId = user.Id,
                        FranchiseId = franchiseId,
                        EnrollmentNo = enrollmentNo,
                        Email = user.Email,
                        MobileNo = string.IsNullOrWhiteSpace(dto.MobileNo) ? null : dto.MobileNo.Trim(),
                        ParentName = string.IsNullOrWhiteSpace(dto.ParentName) ? null : dto.ParentName.Trim(),
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.Students.AddAsync(student);
                    await _context.SaveChangesAsync();

                    if (dto.CategoryIds != null && dto.CategoryIds.Any())
                    {
                        var validCatIds = dto.CategoryIds.Where(id => id > 0).Distinct().ToList();
                        foreach (var catId in validCatIds)
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                "IF NOT EXISTS (SELECT 1 FROM [dbo].[student_assigned_categories] WHERE [student_user_id] = {0} AND [category_id] = {1}) " +
                                "INSERT INTO [dbo].[student_assigned_categories] ([student_user_id], [category_id], [assigned_at]) VALUES ({0}, {1}, GETDATE())",
                                user.Id, catId);
                        }
                    }

                    await transaction.CommitAsync();

                    usedEmails.Add(cleanEmail);
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    result.FailureCount++;
                    result.Errors.Add($"Row #{rowNumber} ({dto.Name}): {ex.Message}");
                }
            }

            string summary = $"{result.SuccessCount} out of {result.TotalProcessed} students registered successfully.";
            if (result.FailureCount > 0)
            {
                summary += $" {result.FailureCount} failed.";
            }

            return ApiResponse<BulkStudentResultDTO>.Success(result, summary);
        }

        public async Task<ApiResponse<List<string>>> CheckExistingEmails(List<string> emails)
        {
            if (emails == null || !emails.Any())
                return ApiResponse<List<string>>.Success(new List<string>(), "No emails provided.");

            var cleanEmails = emails
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Select(e => e.Trim().ToLower())
                .Distinct()
                .ToList();

            var existingEmails = await _context.Users
                .Where(u => cleanEmails.Contains(u.Email.ToLower()))
                .Select(u => u.Email.ToLower())
                .Distinct()
                .ToListAsync();

            return ApiResponse<List<string>>.Success(existingEmails, $"{existingEmails.Count} existing emails found in database.");
        }

        public async Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordRequestDTO dto)
        {
            string cleanEmail = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
            if (user == null)
            {
                return ApiResponse<string>.Fail("No account found with this email address.");
            }

            // Only allow password reset for WEB_STUDENT
            if (user.Role != SD.ROLE_WEB_STUDENT)
            {
                return ApiResponse<string>.Fail("Password reset via OTP is only available for online student accounts.");
            }

            string otp = new Random().Next(100000, 999999).ToString();
            user.Otp = otp;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(15);
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            int franchiseId = user.FranchiseId ?? 1;
            bool emailSent = await _emailService.SendPasswordResetOtpEmailAsync(user.Email, user.Name, otp, franchiseId);

            if (!emailSent)
            {
                return ApiResponse<string>.Fail("Failed to send OTP email. Please verify your email or try again later.");
            }

            return ApiResponse<string>.Success(null!, "A password reset OTP has been sent to your email address.");
        }

        public async Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordDTO dto)
        {
            string cleanEmail = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
            if (user == null)
            {
                return ApiResponse<string>.Fail("No account found with this email address.");
            }

            // Only allow password reset for WEB_STUDENT
            if (user.Role != SD.ROLE_WEB_STUDENT)
            {
                return ApiResponse<string>.Fail("Password reset via OTP is only available for online student accounts.");
            }

            if (string.IsNullOrWhiteSpace(user.Otp) || user.Otp != dto.Otp.Trim())
            {
                return ApiResponse<string>.Fail("Invalid OTP code.");
            }

            if (user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
            {
                return ApiResponse<string>.Fail("OTP code has expired. Please request a new OTP.");
            }

            user.PasswordHash = HashPassword(dto.NewPassword);
            user.Otp = null;
            user.OtpExpiry = null;
            user.IsVerified = true;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await UpsertUserPasswordAsync(user.Id, dto.NewPassword);

            return ApiResponse<string>.Success(null!, "Password reset successfully! You can now log in with your new password.");
        }
    }
}
