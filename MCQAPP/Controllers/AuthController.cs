using MCQAPP.Data;
using MCQAPP.Dto;
using MCQAPP.Interface;
using MCQAPP.Utility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MCQAPP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        [Authorize(Roles = $"{SD.ROLE_SUPER_ADMIN}")]
        public async Task<IActionResult> Register(RegisterDTO dto)
        {
            var result = await _authService.RegisterAsync(dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("register-student")]
        [Authorize(Roles = $"{SD.ROLE_SUPER_ADMIN},{SD.ROLE_FRANCHISE_ADMIN}")]
        public async Task<IActionResult> RegisterStudent(RegisterStudentDTO dto)
        {
            var result = await _authService.RegisterStudent(dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("register-web-student")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterWebStudent(RegisterWebStudentDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(dto);

            var result = await _authService.RegisterWebStudentAsync(dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOtp(VerifyOtpDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(dto);

            var result = await _authService.VerifyOtpAsync(dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("resend-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendOtp(ResendOtpDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(dto);

            var result = await _authService.ResendOtpAsync(dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            if(string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.DeviceFingerprint))
            {
                return BadRequest(ApiResponse<LoginResponseDTO>.Fail("Invalid email or password"));
            }

            var result = await _authService.LoginAsync(dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
