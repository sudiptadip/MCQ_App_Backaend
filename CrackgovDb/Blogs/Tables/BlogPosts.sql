CREATE TABLE [Blogs].[BlogPosts]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_BlogPosts] PRIMARY KEY,
    [Title] NVARCHAR(200) NOT NULL,
    [Slug] NVARCHAR(220) NOT NULL,
    [Category] NVARCHAR(100) NULL,
    [Excerpt] NVARCHAR(500) NULL,
    [ImageUrl] NVARCHAR(1000) NULL,
    [HtmlContent] NVARCHAR(MAX) NOT NULL,
    [TemplateKey] NVARCHAR(40) NOT NULL CONSTRAINT [DF_BlogPosts_TemplateKey] DEFAULT ('editorial'),
    [AuthorName] NVARCHAR(120) NULL,
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_BlogPosts_Status] DEFAULT ('Draft'),
    [IsFeatured] BIT NOT NULL CONSTRAINT [DF_BlogPosts_IsFeatured] DEFAULT (0),
    [PageTitle] NVARCHAR(200) NULL,
    [MetaTitle] NVARCHAR(200) NULL,
    [MetaDescription] NVARCHAR(320) NULL,
    [MetaKeywords] NVARCHAR(500) NULL,
    [CanonicalUrl] NVARCHAR(1000) NULL,
    [PublishedOn] DATETIME2(0) NULL,
    [CreatedBy] INT NULL,
    [CreatedOn] DATETIME2(0) NOT NULL CONSTRAINT [DF_BlogPosts_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedBy] INT NULL,
    [ModifiedOn] DATETIME2(0) NULL,
    CONSTRAINT [UQ_BlogPosts_Slug] UNIQUE ([Slug]),
    CONSTRAINT [CK_BlogPosts_Status] CHECK ([Status] IN ('Draft','Published','Archived'))
);
GO
CREATE INDEX [IX_BlogPosts_StatusPublishedOn] ON [Blogs].[BlogPosts] ([Status], [PublishedOn] DESC, [IsFeatured] DESC);
