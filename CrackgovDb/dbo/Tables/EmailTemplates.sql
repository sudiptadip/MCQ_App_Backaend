CREATE TABLE [dbo].[EmailTemplates]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_EmailTemplates] PRIMARY KEY,
    [TemplateKey] NVARCHAR(100) NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Subject] NVARCHAR(500) NOT NULL,
    [BodyHtml] NVARCHAR(MAX) NOT NULL,
    [BodyText] NVARCHAR(MAX) NULL,
    [DynamicVariables] NVARCHAR(MAX) NULL,
    [FranchiseId] INT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_EmailTemplates_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedOn] DATETIME2(7) NOT NULL CONSTRAINT [DF_EmailTemplates_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedBy] INT NULL,
    [ModifiedOn] DATETIME2(7) NULL,
    CONSTRAINT [FK_EmailTemplates_franchises] FOREIGN KEY ([FranchiseId]) REFERENCES [dbo].[franchises] ([id]) ON DELETE SET NULL
);
GO

CREATE INDEX [IX_EmailTemplates_FranchiseId_Key] ON [dbo].[EmailTemplates] ([FranchiseId], [TemplateKey]);
GO

-- Seed initial standard email templates if table is empty
IF NOT EXISTS (SELECT 1 FROM [dbo].[EmailTemplates])
BEGIN
    INSERT INTO [dbo].[EmailTemplates] 
        ([TemplateKey], [Name], [Subject], [BodyHtml], [BodyText], [DynamicVariables], [FranchiseId], [IsActive])
    VALUES
    (
        N'otp-email-template',
        N'OTP Verification Email',
        N'Your OTP Code for {{franchise_name}} Login is {{otp}}',
        N'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb; text-align: center;">{{franchise_name}}</h2>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p>Dear <strong>{{student_name}}</strong>,</p>
            <p>Your One-Time Password (OTP) for verification is:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">
                {{otp}}
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">This OTP will expire in {{expiry_minutes}} minutes. Please do not share this code with anyone.</p>
            <p style="font-size: 14px; color: #6b7280;">If you did not request this OTP, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="text-align: center; font-size: 12px; color: #9ca3af;">&copy; {{current_year}} {{franchise_name}}. All rights reserved.</p>
        </div>',
        N'Dear {{student_name}}, Your OTP code for {{franchise_name}} is {{otp}}. This code expires in {{expiry_minutes}} minutes.',
        N'{{otp}}, {{student_name}}, {{franchise_name}}, {{expiry_minutes}}, {{current_year}}',
        NULL,
        1
    ),
    (
        N'invoice-email-template',
        N'Fee Payment Invoice Email',
        N'Payment Receipt #{{invoice_no}} - {{franchise_name}}',
        N'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #059669; text-align: center;">Payment Receipt</h2>
            <p style="text-align: center; color: #6b7280; font-size: 14px;">Invoice #{{invoice_no}} | Date: {{payment_date}}</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p>Hello <strong>{{student_name}}</strong>,</p>
            <p>Thank you for your payment! Here are the details of your fee transaction:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Student ID</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">{{student_id}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Course / Fee Structure</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">{{fee_structure_name}}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Amount Paid</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #059669;">₹{{amount_paid}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Payment Mode</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">{{payment_mode}}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Transaction Ref</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">{{transaction_ref}}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">If you have any questions regarding this invoice, please contact <strong>{{franchise_name}}</strong> support.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="text-align: center; font-size: 12px; color: #9ca3af;">&copy; {{current_year}} {{franchise_name}}. All rights reserved.</p>
        </div>',
        N'Payment Receipt #{{invoice_no}}. Dear {{student_name}}, Amount Paid: Rs.{{amount_paid}} for {{fee_structure_name}} on {{payment_date}} via {{payment_mode}}.',
        N'{{invoice_no}}, {{payment_date}}, {{student_name}}, {{student_id}}, {{fee_structure_name}}, {{amount_paid}}, {{payment_mode}}, {{transaction_ref}}, {{franchise_name}}, {{current_year}}',
        NULL,
        1
    ),
    (
        N'welcome-email-template',
        N'Student Welcome Email',
        N'Welcome to {{franchise_name}} - Get Started with Your Learning!',
        N'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #7c3aed; text-align: center;">Welcome to {{franchise_name}}!</h2>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p>Dear <strong>{{student_name}}</strong>,</p>
            <p>We are thrilled to welcome you to <strong>{{franchise_name}}</strong>. Your student account has been successfully created!</p>
            <div style="background-color: #f5f3ff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0 0 5px 0;"><strong>User ID:</strong> {{email}}</p>
                <p style="margin: 0;"><strong>Role:</strong> Student</p>
            </div>
            <p>Log in now to access your mock tests, practice questions, and study materials.</p>
            <div style="text-align: center; margin: 25px 0;">
                <a href="{{login_url}}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In to Portal</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">Best of luck with your preparation!</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="text-align: center; font-size: 12px; color: #9ca3af;">&copy; {{current_year}} {{franchise_name}}. All rights reserved.</p>
        </div>',
        N'Welcome {{student_name}} to {{franchise_name}}! Log in at {{login_url}} with your email {{email}}.',
        N'{{student_name}}, {{franchise_name}}, {{email}}, {{login_url}}, {{current_year}}',
        NULL,
        1
    );
END;
GO
