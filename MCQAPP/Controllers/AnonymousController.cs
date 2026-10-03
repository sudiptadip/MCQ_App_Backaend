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

        public AnonymousController(AppDbContext db) => _db = db;

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
                var modeParam = new SqlParameter("@Mode", mode);
                var jsonParam = new SqlParameter("@Json", SqlDbType.NVarChar, -1) { Value = json };
                var outputParam = new SqlParameter("@Output", SqlDbType.NVarChar, -1) { Direction = ParameterDirection.Output };

                await _db.Database.ExecuteSqlRawAsync(
                    $"EXEC {quotedProcedureName} @Mode, @Json, @Output OUTPUT",
                    modeParam, jsonParam, outputParam);

                using var document = JsonDocument.Parse(outputParam.Value?.ToString() ?? "{}");
                var root = document.RootElement;
                var statusCode = root.TryGetProperty("StatusCode", out var status) ? status.GetInt32() : 500;
                var success = root.TryGetProperty("IsSuccess", out var isSuccess) && isSuccess.GetInt32() == 1;
                var message = root.TryGetProperty("Message", out var messageValue) ? messageValue.GetString() : null;
                object? responseData = root.TryGetProperty("Response", out var response) && response.ValueKind != JsonValueKind.Null
                    ? response.Clone()
                    : null;
                return StatusCode(statusCode, new { statusCode, isSuccess = success, message, data = responseData });
            }
            catch
            {
                return StatusCode(500, new { statusCode = 500, isSuccess = false, message = "Unable to process anonymous request." });
            }
        }

        private static string? QuoteProcedureName(string procedureName)
        {
            var parts = procedureName.Split('.');
            if (parts.Length is < 1 or > 4 || parts.Any(string.IsNullOrWhiteSpace))
            {
                return null;
            }

            // Quote each identifier segment and escape closing brackets so route text
            // cannot become executable SQL. This does not restrict the procedure list.
            return string.Join(".", parts.Select(part => $"[{part.Replace("]", "]]")}]"));
        }
    }
}
