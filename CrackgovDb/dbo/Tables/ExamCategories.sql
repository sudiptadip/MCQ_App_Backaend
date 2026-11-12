CREATE TABLE [dbo].[ExamCategories]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_ExamCategories] PRIMARY KEY,
    [Title] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [Href] NVARCHAR(200) NOT NULL CONSTRAINT [DF_ExamCategories_Href] DEFAULT (N'/practice'),
    [ImageUrl] NVARCHAR(1000) NULL,
    [IconName] NVARCHAR(100) NOT NULL CONSTRAINT [DF_ExamCategories_IconName] DEFAULT (N'Landmark'),
    [AccentColor] NVARCHAR(200) NULL CONSTRAINT [DF_ExamCategories_AccentColor] DEFAULT (N'from-blue-600/90 to-indigo-900/90'),
    [DisplayOrder] INT NOT NULL CONSTRAINT [DF_ExamCategories_DisplayOrder] DEFAULT ((0)),
    [IsActive] BIT NOT NULL CONSTRAINT [DF_ExamCategories_IsActive] DEFAULT ((1)),
    [CreatedBy] INT NULL,
    [CreatedOn] DATETIME2(7) NOT NULL CONSTRAINT [DF_ExamCategories_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedBy] INT NULL,
    [ModifiedOn] DATETIME2(7) NULL
);
GO

-- Seed initial 5 exam categories
IF NOT EXISTS (SELECT 1 FROM [dbo].[ExamCategories])
BEGIN
    INSERT INTO [dbo].[ExamCategories] ([Title], [Description], [Href], [ImageUrl], [IconName], [AccentColor], [DisplayOrder], [IsActive])
    VALUES 
    (N'SSC Exams', N'CGL, CHSL, MTS, CPO', N'/practice', N'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=600&auto=format&fit=crop', N'Landmark', N'from-blue-600/90 to-indigo-900/90', 1, 1),
    (N'Railways (RRB)', N'NTPC, Group D, ALP', N'/practice', N'https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=600&auto=format&fit=crop', N'Train', N'from-amber-600/90 to-orange-900/90', 2, 1),
    (N'Banking & PO', N'IBPS, SBI PO, Clerk, RBI', N'/practice', N'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=600&auto=format&fit=crop', N'Building2', N'from-emerald-600/90 to-teal-900/90', 3, 1),
    (N'Defense & Police', N'NDA, CDS, Police Constable', N'/practice', N'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=600&auto=format&fit=crop', N'Shield', N'from-purple-600/90 to-pink-900/90', 4, 1),
    (N'State PSCs & Others', N'State PCS, Teacher & Allied', N'/practice', N'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop', N'Award', N'from-sky-600/90 to-blue-900/90', 5, 1);
END;
GO
