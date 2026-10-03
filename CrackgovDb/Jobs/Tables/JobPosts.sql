CREATE TABLE [Jobs].[JobPosts]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_JobPosts] PRIMARY KEY,
    [Title] NVARCHAR(200) NOT NULL,
    [Department] NVARCHAR(200) NOT NULL,
    [CategoryId] INT NOT NULL,
    [EmploymentType] NVARCHAR(40) NOT NULL,
    [Location] NVARCHAR(200) NOT NULL,
    [Vacancies] INT NOT NULL,
    [SalaryText] NVARCHAR(200) NULL,
    [Qualification] NVARCHAR(1000) NOT NULL,
    [AgeLimit] NVARCHAR(200) NULL,
    [ApplicationStartDate] DATE NULL,
    [ApplicationDeadline] DATE NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [Responsibilities] NVARCHAR(MAX) NULL,
    [Eligibility] NVARCHAR(MAX) NULL,
    [ApplicationUrl] NVARCHAR(1000) NULL,
    [NotificationUrl] NVARCHAR(1000) NULL,
    [ReferenceNumber] NVARCHAR(100) NULL,
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_JobPosts_Status] DEFAULT ('Draft'),
    [IsFeatured] BIT NOT NULL CONSTRAINT [DF_JobPosts_IsFeatured] DEFAULT (0),
    [Slug] NVARCHAR(220) NOT NULL,
    [PageTitle] NVARCHAR(200) NULL,
    [MetaTitle] NVARCHAR(200) NULL,
    [MetaDescription] NVARCHAR(320) NULL,
    [MetaKeywords] NVARCHAR(500) NULL,
    [CreatedBy] INT NULL,
    [ModifiedBy] INT NULL,
    [CreatedOn] DATETIME2 NOT NULL CONSTRAINT [DF_JobPosts_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedOn] DATETIME2 NULL,
    CONSTRAINT [FK_JobPosts_JobCategories] FOREIGN KEY ([CategoryId]) REFERENCES [Jobs].[JobCategories] ([Id]),
    CONSTRAINT [CK_JobPosts_Status] CHECK ([Status] IN ('Draft', 'Published', 'Closed')),
    CONSTRAINT [CK_JobPosts_Vacancies] CHECK ([Vacancies] > 0),
    CONSTRAINT [CK_JobPosts_ApplicationDates] CHECK ([ApplicationStartDate] IS NULL OR [ApplicationDeadline] IS NULL OR [ApplicationStartDate] <= [ApplicationDeadline])
);

CREATE INDEX [IX_JobPosts_PublicListing] ON [Jobs].[JobPosts] ([Status], [ApplicationDeadline], [IsFeatured], [CreatedOn] DESC);
CREATE INDEX [IX_JobPosts_CategoryId] ON [Jobs].[JobPosts] ([CategoryId], [Status]);
CREATE UNIQUE INDEX [UX_JobPosts_Slug] ON [Jobs].[JobPosts] ([Slug]);
