CREATE TABLE [dbo].[HeroSection]
(
    [Id] INT NOT NULL CONSTRAINT [PK_HeroSection] PRIMARY KEY (Id),
    [BadgeText] NVARCHAR(200) NOT NULL CONSTRAINT [DF_HeroSection_BadgeText] DEFAULT (N'Prepare. Practice. Progress.'),
    [Title] NVARCHAR(500) NOT NULL CONSTRAINT [DF_HeroSection_Title] DEFAULT (N'Crack Government Exams & Unlock Your Dream Career'),
    [HighlightTitle] NVARCHAR(200) NULL CONSTRAINT [DF_HeroSection_HighlightTitle] DEFAULT (N'Dream Career'),
    [Description] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_HeroSection_Description] DEFAULT (N'Master competitive exams with topic-wise practice modules, instant score evaluation, daily current affairs, and real-time public sector job notifications.'),
    [PrimaryBtnText] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_PrimaryBtnText] DEFAULT (N'Start Free Practice'),
    [PrimaryBtnUrl] NVARCHAR(200) NOT NULL CONSTRAINT [DF_HeroSection_PrimaryBtnUrl] DEFAULT (N'/practice'),
    [SecondaryBtnText] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_SecondaryBtnText] DEFAULT (N'Browse Govt Jobs'),
    [SecondaryBtnUrl] NVARCHAR(200) NOT NULL CONSTRAINT [DF_HeroSection_SecondaryBtnUrl] DEFAULT (N'/jobs'),
    [Stat1Value] NVARCHAR(50) NOT NULL CONSTRAINT [DF_HeroSection_Stat1Value] DEFAULT (N'100+'),
    [Stat1Label] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_Stat1Label] DEFAULT (N'Exam Categories'),
    [Stat2Value] NVARCHAR(50) NOT NULL CONSTRAINT [DF_HeroSection_Stat2Value] DEFAULT (N'50,000+'),
    [Stat2Label] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_Stat2Label] DEFAULT (N'Practice MCQs'),
    [Stat3Value] NVARCHAR(50) NOT NULL CONSTRAINT [DF_HeroSection_Stat3Value] DEFAULT (N'Daily'),
    [Stat3Label] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_Stat3Label] DEFAULT (N'Current Affairs'),
    [Stat4Value] NVARCHAR(50) NOT NULL CONSTRAINT [DF_HeroSection_Stat4Value] DEFAULT (N'100% Free'),
    [Stat4Label] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_Stat4Label] DEFAULT (N'Verified Job Alerts'),
    [ImageUrl] NVARCHAR(1000) NOT NULL CONSTRAINT [DF_HeroSection_ImageUrl] DEFAULT (N'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop'),
    [ImageTitle] NVARCHAR(200) NOT NULL CONSTRAINT [DF_HeroSection_ImageTitle] DEFAULT (N'Structured Exam Mock Tests & Instant Analytics'),
    [Badge1Text] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_Badge1Text] DEFAULT (N'Live Exam Alerts'),
    [Badge2Text] NVARCHAR(100) NOT NULL CONSTRAINT [DF_HeroSection_Badge2Text] DEFAULT (N'Instant Performance Analysis'),
    [IsActive] BIT NOT NULL CONSTRAINT [DF_HeroSection_IsActive] DEFAULT ((1)),
    [CreatedOn] DATETIME2(7) NOT NULL CONSTRAINT [DF_HeroSection_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedOn] DATETIME2(7) NULL
);
GO

-- Seed initial row
IF NOT EXISTS (SELECT 1 FROM [dbo].[HeroSection] WHERE Id = 1)
BEGIN
    INSERT INTO [dbo].[HeroSection] (Id) VALUES (1);
END;
GO
