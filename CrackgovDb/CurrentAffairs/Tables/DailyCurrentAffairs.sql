CREATE TABLE [CurrentAffairs].[DailyCurrentAffairs]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_DailyCurrentAffairs] PRIMARY KEY,
    [AffairDate] DATE NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Slug] NVARCHAR(220) NOT NULL,
    [Category] NVARCHAR(100) NULL,
    [ExamRelevance] NVARCHAR(20) NOT NULL CONSTRAINT [DF_DailyCurrentAffairs_ExamRelevance] DEFAULT ('Medium'),
    [Excerpt] NVARCHAR(500) NULL,
    [ImageUrl] NVARCHAR(1000) NULL,
    [HtmlContent] NVARCHAR(MAX) NOT NULL,
    [TemplateKey] NVARCHAR(40) NOT NULL CONSTRAINT [DF_DailyCurrentAffairs_TemplateKey] DEFAULT ('daily-brief'),
    [SourceName] NVARCHAR(200) NULL,
    [SourceUrl] NVARCHAR(1000) NULL,
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_DailyCurrentAffairs_Status] DEFAULT ('Draft'),
    [IsFeatured] BIT NOT NULL CONSTRAINT [DF_DailyCurrentAffairs_IsFeatured] DEFAULT (0),
    [PageTitle] NVARCHAR(200) NULL,
    [MetaTitle] NVARCHAR(200) NULL,
    [MetaDescription] NVARCHAR(320) NULL,
    [MetaKeywords] NVARCHAR(500) NULL,
    [CanonicalUrl] NVARCHAR(1000) NULL,
    [PublishedOn] DATETIME2(0) NULL,
    [CreatedBy] INT NULL,
    [CreatedOn] DATETIME2(0) NOT NULL CONSTRAINT [DF_DailyCurrentAffairs_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedBy] INT NULL,
    [ModifiedOn] DATETIME2(0) NULL,
    CONSTRAINT [UQ_DailyCurrentAffairs_Slug] UNIQUE ([Slug]),
    CONSTRAINT [CK_DailyCurrentAffairs_Status] CHECK ([Status] IN ('Draft','Published','Archived')),
    CONSTRAINT [CK_DailyCurrentAffairs_Relevance] CHECK ([ExamRelevance] IN ('High','Medium','Low'))
);
GO
CREATE INDEX [IX_DailyCurrentAffairs_DateStatus] ON [CurrentAffairs].[DailyCurrentAffairs] ([Status], [AffairDate] DESC, [IsFeatured] DESC);
