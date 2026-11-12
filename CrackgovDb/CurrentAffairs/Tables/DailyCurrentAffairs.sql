CREATE TABLE [CurrentAffairs].[DailyCurrentAffairs] (
    [Id]              INT             IDENTITY (1, 1) NOT NULL,
    [AffairDate]      DATE            NOT NULL,
    [Title]           NVARCHAR (200)  NOT NULL,
    [Slug]            NVARCHAR (220)  NOT NULL,
    [Category]        NVARCHAR (100)  NULL,
    [ExamRelevance]   NVARCHAR (20)   CONSTRAINT [DF_DailyCurrentAffairs_ExamRelevance] DEFAULT ('Medium') NOT NULL,
    [Excerpt]         NVARCHAR (500)  NULL,
    [ImageUrl]        NVARCHAR (1000) NULL,
    [HtmlContent]     NVARCHAR (MAX)  NOT NULL,
    [TemplateKey]     NVARCHAR (40)   CONSTRAINT [DF_DailyCurrentAffairs_TemplateKey] DEFAULT ('daily-brief') NOT NULL,
    [SourceName]      NVARCHAR (200)  NULL,
    [SourceUrl]       NVARCHAR (1000) NULL,
    [Status]          NVARCHAR (20)   CONSTRAINT [DF_DailyCurrentAffairs_Status] DEFAULT ('Draft') NOT NULL,
    [IsFeatured]      BIT             CONSTRAINT [DF_DailyCurrentAffairs_IsFeatured] DEFAULT ((0)) NOT NULL,
    [PageTitle]       NVARCHAR (200)  NULL,
    [MetaTitle]       NVARCHAR (200)  NULL,
    [MetaDescription] NVARCHAR (320)  NULL,
    [MetaKeywords]    NVARCHAR (500)  NULL,
    [CanonicalUrl]    NVARCHAR (1000) NULL,
    [PublishedOn]     DATETIME2 (0)   NULL,
    [CreatedBy]       INT             NULL,
    [CreatedOn]       DATETIME2 (0)   CONSTRAINT [DF_DailyCurrentAffairs_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    [ModifiedBy]      INT             NULL,
    [ModifiedOn]      DATETIME2 (0)   NULL,
    CONSTRAINT [PK_DailyCurrentAffairs] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_DailyCurrentAffairs_Relevance] CHECK ([ExamRelevance]='Low' OR [ExamRelevance]='Medium' OR [ExamRelevance]='High'),
    CONSTRAINT [CK_DailyCurrentAffairs_Status] CHECK ([Status]='Archived' OR [Status]='Published' OR [Status]='Draft'),
    CONSTRAINT [UQ_DailyCurrentAffairs_Slug] UNIQUE NONCLUSTERED ([Slug] ASC)
);


GO
CREATE NONCLUSTERED INDEX [IX_DailyCurrentAffairs_DateStatus]
    ON [CurrentAffairs].[DailyCurrentAffairs]([Status] ASC, [AffairDate] DESC, [IsFeatured] DESC);

