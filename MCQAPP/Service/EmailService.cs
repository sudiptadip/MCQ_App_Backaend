using MCQAPP.Data;
using MCQAPP.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using System;
using System.Threading.Tasks;

namespace MCQAPP.Service
{
    public class EmailService : IEmailService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public EmailService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string bodyHtml, int franchiseId = 1)
        {
            try
            {
                var franchise = await _context.Franchises.FirstOrDefaultAsync(f => f.Id == franchiseId)
                                ?? await _context.Franchises.FirstOrDefaultAsync(f => f.Id == 1);

                bool useFranchiseSmtp = franchise != null
                    && !string.IsNullOrWhiteSpace(franchise.SmtpHost)
                    && !string.IsNullOrWhiteSpace(franchise.SmtpEmail)
                    && !string.IsNullOrWhiteSpace(franchise.SmtpPassword)
                    && franchise.SmtpPassword != "Admin@123";

                if (useFranchiseSmtp)
                {
                    int port = (franchise!.SmtpPort.HasValue && franchise.SmtpPort.Value > 0) ? franchise.SmtpPort.Value : 587;
                    string sender = !string.IsNullOrWhiteSpace(franchise.SmtpSenderName)
                        ? franchise.SmtpSenderName
                        : (!string.IsNullOrWhiteSpace(franchise.Name) ? franchise.Name : "CrackGov Portal");

                    bool sent = await TrySendViaSmtpAsync(franchise.SmtpHost!, port, franchise.SmtpEmail!, franchise.SmtpPassword!, sender, toEmail, subject, bodyHtml);
                    if (sent) return true;

                    Console.WriteLine($"[MailKit Warning] Franchise SMTP failed for franchiseId={franchiseId}. Falling back to default system SMTP.");
                }

                // Default system SMTP
                string sysHost = _configuration["SmtpSettings:Host"] ?? "smtp.gmail.com";
                int sysPort = int.Parse(_configuration["SmtpSettings:Port"] ?? "465");
                string sysEmail = _configuration["SmtpSettings:Email"] ?? "drstrange9098304193@gmail.com";
                string sysPassword = _configuration["SmtpSettings:Password"] ?? "odtoxjahfbqxiskv";
                string sysSender = _configuration["SmtpSettings:SenderName"] ?? "CrackGov Portal";

                return await TrySendViaSmtpAsync(sysHost, sysPort, sysEmail, sysPassword, sysSender, toEmail, subject, bodyHtml);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MailKit Error] Failed to send email to {toEmail}: {ex}");
                return false;
            }
        }

        private static async Task<bool> TrySendViaSmtpAsync(string smtpHost, int smtpPort, string smtpEmail, string smtpPassword, string senderName, string toEmail, string subject, string bodyHtml)
        {
            try
            {
                smtpHost = smtpHost.Trim();
                smtpEmail = smtpEmail.Trim();
                smtpPassword = smtpPassword.Replace(" ", "").Trim();

                Console.WriteLine($"[MailKit] Connecting to SMTP Host={smtpHost}, Port={smtpPort}, Email={smtpEmail}...");

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, smtpEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder { HtmlBody = bodyHtml };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

                // Select socket options based on port: 465 -> SslOnConnect, 587 -> StartTls, else Auto
                SecureSocketOptions socketOptions = smtpPort == 465
                    ? SecureSocketOptions.SslOnConnect
                    : (smtpPort == 587 ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);

                await client.ConnectAsync(smtpHost, smtpPort, socketOptions);
                await client.AuthenticateAsync(smtpEmail, smtpPassword);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                Console.WriteLine($"[MailKit] Email successfully sent to {toEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MailKit Error] Failed sending to {toEmail} via {smtpHost}:{smtpPort} - {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendOtpEmailAsync(string toEmail, string studentName, string otp, int franchiseId = 1)
        {
            var franchise = await _context.Franchises.FirstOrDefaultAsync(f => f.Id == franchiseId);
            string franchiseName = franchise?.Name ?? "CrackGov Portal";

            string subject = $"Your OTP Code for {franchiseName} - {otp}";
            
            string bodyHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                    <h2 style='color: #2563eb; text-align: center;'>{franchiseName}</h2>
                    <hr style='border: 0; border-top: 1px solid #eee;' />
                    <p>Dear <strong>{studentName}</strong>,</p>
                    <p>Thank you for registering. Your One-Time Password (OTP) for email verification is:</p>
                    <div style='background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #1f2937;'>
                        {otp}
                    </div>
                    <p style='margin-top: 20px; font-size: 14px; color: #6b7280;'>This OTP is valid for 15 minutes. Please do not share this OTP with anyone.</p>
                    <p style='font-size: 14px; color: #6b7280;'>If you did not request this, please ignore this email.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin-top: 30px;' />
                    <p style='text-align: center; font-size: 12px; color: #9ca3af;'>&copy; {DateTime.UtcNow.Year} {franchiseName}. All rights reserved.</p>
                </div>";

            return await SendEmailAsync(toEmail, subject, bodyHtml, franchiseId);
        }

        public async Task<bool> SendPasswordResetOtpEmailAsync(string toEmail, string studentName, string otp, int franchiseId = 1)
        {
            var franchise = await _context.Franchises.FirstOrDefaultAsync(f => f.Id == franchiseId);
            string franchiseName = franchise?.Name ?? "CrackGov Portal";

            string subject = $"Password Reset OTP for {franchiseName} - {otp}";

            string bodyHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                    <h2 style='color: #2563eb; text-align: center;'>{franchiseName}</h2>
                    <hr style='border: 0; border-top: 1px solid #eee;' />
                    <p>Dear <strong>{studentName}</strong>,</p>
                    <p>We received a request to reset your password. Your One-Time Password (OTP) for password recovery is:</p>
                    <div style='background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #1f2937;'>
                        {otp}
                    </div>
                    <p style='margin-top: 20px; font-size: 14px; color: #6b7280;'>This OTP is valid for 15 minutes. Please do not share this code with anyone.</p>
                    <p style='font-size: 14px; color: #6b7280;'>If you did not request a password reset, please ignore this email.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin-top: 30px;' />
                    <p style='text-align: center; font-size: 12px; color: #9ca3af;'>&copy; {DateTime.UtcNow.Year} {franchiseName}. All rights reserved.</p>
                </div>";

            return await SendEmailAsync(toEmail, subject, bodyHtml, franchiseId);
        }
    }
}
