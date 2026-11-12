using System.Threading.Tasks;

namespace MCQAPP.Interface
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string toEmail, string subject, string bodyHtml, int franchiseId = 1);
        Task<bool> SendOtpEmailAsync(string toEmail, string studentName, string otp, int franchiseId = 1);
    }
}
