using MCQAPP.Data;
using MCQAPP.Utility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Security.Claims;
using System.Text.Json;

namespace MCQAPP.Controllers
{
    [Authorize]
    [Route("api/execute-sp")]
    [ApiController]
    public class ExecuteAuthSPController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ExecuteAuthSPController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost("auth-admin-franchise/{spName}/{mode}")]
        [Authorize(Roles = $"{SD.ROLE_SUPER_ADMIN},{SD.ROLE_FRANCHISE_ADMIN}")]
        public async Task<IActionResult> ExecuteSPFranchise(string spName, int mode, object? data)
        {
            try
            {
                // 🔒 Prevent SQL Injection
                //var allowedSPs = new[] { "SpUsers" };
                //if (!allowedSPs.Contains(spName))
                //    return BadRequest(new
                //    {
                //        statusCode = 400,
                //        isSuccess = false,
                //        message = "Invalid stored procedure"
                //    });

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var franchiseId = User.FindFirst("FranchiseId")?.Value;
                var jsonString = JsonSerializer.Serialize(data ?? new { });

                var modeParam = new SqlParameter("@Mode", mode);
                var franchiseIdParams = new SqlParameter("@FranchiseId", franchiseId);
                var jsonParam = new SqlParameter("@Json", jsonString);
                var userIdParam = new SqlParameter("@UserId", userId ?? (object)DBNull.Value);

                var outputParam = new SqlParameter("@Output", SqlDbType.NVarChar, -1)
                {
                    Direction = ParameterDirection.Output
                };

                await _db.Database.ExecuteSqlRawAsync(
                    $"EXEC {spName} @Mode, @Json, @UserId, @FranchiseId, @Output OUTPUT",
                    modeParam, jsonParam, userIdParam, @franchiseIdParams, outputParam
                );

                var output = outputParam.Value?.ToString() ?? "{}";

                // ✅ Parse JSON safely
                using var doc = JsonDocument.Parse(output);
                var root = doc.RootElement;

                int statusCode = 0;
                bool isSuccess = false;
                string? message = null;
                object? responseData = null;

                // ✅ StatusCode
                if (root.TryGetProperty("StatusCode", out var statusProp) &&
                    statusProp.ValueKind == JsonValueKind.Number)
                {
                    statusCode = statusProp.GetInt32();
                }

                // ✅ IsSuccess
                if (root.TryGetProperty("IsSuccess", out var successProp) &&
                    successProp.ValueKind == JsonValueKind.Number)
                {
                    isSuccess = successProp.GetInt32() == 1;
                }

                // ✅ Message
                if (root.TryGetProperty("Message", out var messageProp) &&
                    messageProp.ValueKind != JsonValueKind.Null)
                {
                    message = messageProp.GetString();
                }

                // ✅ Response
                if (root.TryGetProperty("Response", out var dataProp) &&
                    dataProp.ValueKind != JsonValueKind.Null)
                {
                    responseData = dataProp.Clone(); // 🔥 IMPORTANT
                }

                var result = new
                {
                    statusCode,
                    isSuccess,
                    message,
                    data = responseData
                };

                return StatusCode(statusCode == 0 ? 200 : statusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    isSuccess = false,
                    message = "Internal Server Error",
                    errors = new[] { ex.Message }
                });
            }
        }


        [Authorize(Roles = $"{SD.ROLE_SUPER_ADMIN}")]
        [HttpPost("auth-admin/{spName}/{mode}")]
        public async Task<IActionResult> ExecuteSPAdmin(string spName, int mode, object? data)
        {
            try
            {
                // 🔒 Prevent SQL Injection
                //var allowedSPs = new[] { "SpUsers" };
                //if (!allowedSPs.Contains(spName))
                //    return BadRequest(new
                //    {
                //        statusCode = 400,
                //        isSuccess = false,
                //        message = "Invalid stored procedure"
                //    });

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var franchiseId = User.FindFirst("FranchiseId")?.Value;
                var jsonString = JsonSerializer.Serialize(data ?? new { });

                var modeParam = new SqlParameter("@Mode", mode);
                var franchiseIdParams = new SqlParameter("@FranchiseId", franchiseId);
                var jsonParam = new SqlParameter("@Json", jsonString);
                var userIdParam = new SqlParameter("@UserId", userId ?? (object)DBNull.Value);

                var outputParam = new SqlParameter("@Output", SqlDbType.NVarChar, -1)
                {
                    Direction = ParameterDirection.Output
                };

                await _db.Database.ExecuteSqlRawAsync(
                    $"EXEC {spName} @Mode, @Json, @UserId, @FranchiseId, @Output OUTPUT",
                    modeParam, jsonParam, userIdParam, @franchiseIdParams, outputParam
                );

                var output = outputParam.Value?.ToString() ?? "{}";

                // ✅ Parse JSON safely
                using var doc = JsonDocument.Parse(output);
                var root = doc.RootElement;

                int statusCode = 0;
                bool isSuccess = false;
                string? message = null;
                object? responseData = null;

                // ✅ StatusCode
                if (root.TryGetProperty("StatusCode", out var statusProp) &&
                    statusProp.ValueKind == JsonValueKind.Number)
                {
                    statusCode = statusProp.GetInt32();
                }

                // ✅ IsSuccess
                if (root.TryGetProperty("IsSuccess", out var successProp) &&
                    successProp.ValueKind == JsonValueKind.Number)
                {
                    isSuccess = successProp.GetInt32() == 1;
                }

                // ✅ Message
                if (root.TryGetProperty("Message", out var messageProp) &&
                    messageProp.ValueKind != JsonValueKind.Null)
                {
                    message = messageProp.GetString();
                }

                // ✅ Response
                if (root.TryGetProperty("Response", out var dataProp) &&
                    dataProp.ValueKind != JsonValueKind.Null)
                {
                    responseData = dataProp.Clone(); // 🔥 IMPORTANT
                }

                var result = new
                {
                    statusCode,
                    isSuccess,
                    message,
                    data = responseData
                };

                return StatusCode(statusCode == 0 ? 200 : statusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    isSuccess = false,
                    message = "Internal Server Error",
                    errors = new[] { ex.Message }
                });
            }
        }


        [Authorize]
        [HttpPost("auth-all/{spName}/{mode}")]
        public async Task<IActionResult> ExecuteSPAll(string spName, int mode, object? data)
        {
            try
            {
                // 🔒 Prevent SQL Injection
                //var allowedSPs = new[] { "SpUsers" };
                //if (!allowedSPs.Contains(spName))
                //    return BadRequest(new
                //    {
                //        statusCode = 400,
                //        isSuccess = false,
                //        message = "Invalid stored procedure"
                //    });

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var franchiseId = User.FindFirst("FranchiseId")?.Value;
                var jsonString = JsonSerializer.Serialize(data ?? new { });

                var modeParam = new SqlParameter("@Mode", mode);
                var franchiseIdParams = new SqlParameter("@FranchiseId", franchiseId);
                var jsonParam = new SqlParameter("@Json", jsonString);
                var userIdParam = new SqlParameter("@UserId", userId ?? (object)DBNull.Value);

                var outputParam = new SqlParameter("@Output", SqlDbType.NVarChar, -1)
                {
                    Direction = ParameterDirection.Output
                };

                await _db.Database.ExecuteSqlRawAsync(
                    $"EXEC {spName} @Mode, @Json, @UserId, @FranchiseId, @Output OUTPUT",
                    modeParam, jsonParam, userIdParam, @franchiseIdParams, outputParam
                );

                var output = outputParam.Value?.ToString() ?? "{}";

                // ✅ Parse JSON safely
                using var doc = JsonDocument.Parse(output);
                var root = doc.RootElement;

                int statusCode = 0;
                bool isSuccess = false;
                string? message = null;
                object? responseData = null;

                // ✅ StatusCode
                if (root.TryGetProperty("StatusCode", out var statusProp) &&
                    statusProp.ValueKind == JsonValueKind.Number)
                {
                    statusCode = statusProp.GetInt32();
                }

                // ✅ IsSuccess
                if (root.TryGetProperty("IsSuccess", out var successProp) &&
                    successProp.ValueKind == JsonValueKind.Number)
                {
                    isSuccess = successProp.GetInt32() == 1;
                }

                // ✅ Message
                if (root.TryGetProperty("Message", out var messageProp) &&
                    messageProp.ValueKind != JsonValueKind.Null)
                {
                    message = messageProp.GetString();
                }

                // ✅ Response
                if (root.TryGetProperty("Response", out var dataProp) &&
                    dataProp.ValueKind != JsonValueKind.Null)
                {
                    responseData = dataProp.Clone(); // 🔥 IMPORTANT
                }

                var result = new
                {
                    statusCode,
                    isSuccess,
                    message,
                    data = responseData
                };

                return StatusCode(statusCode == 0 ? 200 : statusCode, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    isSuccess = false,
                    message = "Internal Server Error",
                    errors = new[] { ex.Message }
                });
            }
        }


    }
}