using MCQAPP.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Text.Json;

namespace MCQAPP.Controllers
{
    // Generic anonymous stored-procedure executor.
    [AllowAnonymous]
    [Route("api/anonymous")]
    [ApiController]
    public sealed class AnonymousController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<AnonymousController> _logger;
        private readonly IWebHostEnvironment _env;

        public AnonymousController(AppDbContext db, ILogger<AnonymousController> logger, IWebHostEnvironment env)
        {
            _db = db;
            _logger = logger;
            _env = env;
        }

        [HttpPost("{spName}/{mode:int}")]
        public async Task<IActionResult> ExecuteAnonymousSP(string spName, int mode, [FromBody] object? data)
        {
            var quotedProcedureName = QuoteProcedureName(spName);
            if (quotedProcedureName == null)
            {
                return BadRequest(new { statusCode = 400, isSuccess = false, message = "Invalid stored procedure name." });
            }

            try
            {
                var json = JsonSerializer.Serialize(data ?? new { });
                var outputParam = new SqlParameter("@Output", SqlDbType.NVarChar, -1) { Direction = ParameterDirection.Output };

                try
                {
                    var modeParam = new SqlParameter("@Mode", mode);
                    var jsonParam = new SqlParameter("@Json", SqlDbType.NVarChar, -1) { Value = (object?)json ?? DBNull.Value };

                    await _db.Database.ExecuteSqlRawAsync(
                        $"EXEC {quotedProcedureName} @Mode = @Mode, @Json = @Json, @Output = @Output OUTPUT",
                        modeParam, jsonParam, outputParam);
                }
                catch (SqlException ex) when (ex.Number == 201 ||
                                              ex.Message.Contains("@UserId", StringComparison.OrdinalIgnoreCase) ||
                                              ex.Message.Contains("@FranchiseId", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Retrying {ProcedureName} with @UserId and @FranchiseId parameters: {Error}", quotedProcedureName, ex.Message);

                    var modeParam = new SqlParameter("@Mode", mode);
                    var jsonParam = new SqlParameter("@Json", SqlDbType.NVarChar, -1) { Value = (object?)json ?? DBNull.Value };
                    var userIdParam = new SqlParameter("@UserId", SqlDbType.Int) { Value = DBNull.Value };
                    var franchiseIdParam = new SqlParameter("@FranchiseId", SqlDbType.Int) { Value = DBNull.Value };
                    outputParam = new SqlParameter("@Output", SqlDbType.NVarChar, -1) { Direction = ParameterDirection.Output };

                    await _db.Database.ExecuteSqlRawAsync(
                        $"EXEC {quotedProcedureName} @Mode = @Mode, @Json = @Json, @UserId = @UserId, @FranchiseId = @FranchiseId, @Output = @Output OUTPUT",
                        modeParam, jsonParam, userIdParam, franchiseIdParam, outputParam);
                }

                var outputString = outputParam.Value?.ToString();
                if (string.IsNullOrWhiteSpace(outputString))
                {
                    return StatusCode(500, new { statusCode = 500, isSuccess = false, message = "Empty response from procedure." });
                }

                using var document = JsonDocument.Parse(outputString);
                var root = document.RootElement;

                int statusCode = 200;
                if (root.TryGetProperty("StatusCode", out var status))
                {
                    if (status.ValueKind == JsonValueKind.Number) statusCode = status.GetInt32();
                    else if (status.ValueKind == JsonValueKind.String && int.TryParse(status.GetString(), out var s)) statusCode = s;
                }

                bool success = false;
                if (root.TryGetProperty("IsSuccess", out var isSuccess))
                {
                    if (isSuccess.ValueKind == JsonValueKind.Number) success = isSuccess.GetInt32() == 1;
                    else if (isSuccess.ValueKind == JsonValueKind.True || isSuccess.ValueKind == JsonValueKind.False) success = isSuccess.GetBoolean();
                }

                var message = root.TryGetProperty("Message", out var messageValue) ? messageValue.GetString() : null;
                object? responseData = root.TryGetProperty("Response", out var response) && response.ValueKind != JsonValueKind.Null
                    ? response.Clone()
                    : null;

                return StatusCode(statusCode, new { statusCode, isSuccess = success, message, data = responseData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute anonymous stored procedure {ProcedureName} with mode {Mode}", spName, mode);
                return StatusCode(500, new 
                { 
                    statusCode = 500, 
                    isSuccess = false, 
                    message = "Unable to process anonymous request.",
                    error = _env.IsDevelopment() ? ex.Message : null 
                });
            }
        }

        private static string? QuoteProcedureName(string procedureName)
        {
            var parts = procedureName.Split('.');
            if (parts.Length is < 1 or > 4 || parts.Any(string.IsNullOrWhiteSpace))
            {
                return null;
            }

            if (parts.Length == 1)
            {
                return $"[dbo].[{parts[0].Replace("]", "]]")}]";
            }

            // Quote each identifier segment and escape closing brackets so route text
            // cannot become executable SQL. This does not restrict the procedure list.
            return string.Join(".", parts.Select(part => $"[{part.Replace("]", "]]")}]"));
        }
    }
}
