using MCQAPP.Data;
using MCQAPP.Utility;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MCQAPP.Middleware
{
    public class DeviceValidationMiddleware
    {
        private readonly RequestDelegate _next;

        public DeviceValidationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(
            HttpContext context,
            AppDbContext db
        )
        {
            //---------------------------------------
            // CHECK AUTHENTICATED USER
            //---------------------------------------

            if (context.User.Identity?.IsAuthenticated == true)
            {
                try
                {
                    //---------------------------------------
                    // GET USER ID FROM JWT
                    //---------------------------------------

                    var userId = context.User
                        .FindFirst(ClaimTypes.NameIdentifier)
                        ?.Value;

                    if (string.IsNullOrWhiteSpace(userId))
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Unauthorized user"
                        });

                        return;
                    }

                    //---------------------------------------
                    // GET JWT DEVICE FINGERPRINT
                    //---------------------------------------

                    var tokenFingerprint = context.User
                        .FindFirst("DeviceFingerprint")
                        ?.Value;

                    //---------------------------------------
                    // GET REQUEST HEADER FINGERPRINT
                    //---------------------------------------

                    var requestFingerprint = context
                        .Request
                        .Headers["X-Device-Fingerprint"]
                        .ToString();

                    //---------------------------------------
                    // VALIDATE REQUEST HEADER
                    //---------------------------------------

                    if (string.IsNullOrWhiteSpace(requestFingerprint))
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Device fingerprint missing"
                        });

                        return;
                    }

                    //---------------------------------------
                    // GET USER FROM DATABASE
                    //---------------------------------------

                    var user = await db.Users.FirstOrDefaultAsync(x => x.Id == Convert.ToInt32(userId));

                    //---------------------------------------
                    // INVALID USER
                    //---------------------------------------

                    if (user == null)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Unauthorized access"
                        });

                        return;
                    }

                    //---------------------------------------
                    // ONLY VALIDATE STUDENTS
                    //---------------------------------------

                    if (user.Role == SD.ROLE_STUDENT)
                    {
                        //---------------------------------------
                        // DATABASE FINGERPRINT
                        //---------------------------------------

                        var databaseFingerprint =
                            user.DeviceFingerprint;

                        //---------------------------------------
                        // VALIDATE ALL FINGERPRINTS
                        //---------------------------------------

                        bool isValid =
                            !string.IsNullOrWhiteSpace(tokenFingerprint) &&
                            !string.IsNullOrWhiteSpace(databaseFingerprint) &&
                            tokenFingerprint == databaseFingerprint &&
                            requestFingerprint == tokenFingerprint;

                        //---------------------------------------
                        // INVALID DEVICE
                        //---------------------------------------

                        if (!isValid)
                        {
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                            await context.Response.WriteAsJsonAsync(new
                            {
                                message = "This account is already logged in on another device"
                            });

                            return;
                        }
                    }
                }
                catch
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                    await context.Response.WriteAsJsonAsync(new
                    {
                        message = "Unauthorized access"
                    });

                    return;
                }
            }

            //---------------------------------------
            // CONTINUE REQUEST PIPELINE
            //---------------------------------------

            await _next(context);
        }
    }
}
