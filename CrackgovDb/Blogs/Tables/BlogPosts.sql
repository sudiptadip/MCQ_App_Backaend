CREATE TABLE [Blogs].[BlogPosts] (
    [Id]              INT             IDENTITY (1, 1) NOT NULL,
    [Title]           NVARCHAR (200)  NOT NULL,
    [Slug]            NVARCHAR (220)  NOT NULL,
    [Category]        NVARCHAR (100)  NULL,
    [Excerpt]         NVARCHAR (500)  NULL,
    [ImageUrl]        NVARCHAR (1000) NULL,
    [HtmlContent]     NVARCHAR (MAX)  NOT NULL,
    [TemplateKey]     NVARCHAR (40)   CONSTRAINT [DF_BlogPosts_TemplateKey] DEFAULT ('editorial') NOT NULL,
    [AuthorName]      NVARCHAR (120)  NULL,
    [Status]          NVARCHAR (20)   CONSTRAINT [DF_BlogPosts_Status] DEFAULT ('Draft') NOT NULL,
    [IsFeatured]      BIT             CONSTRAINT [DF_BlogPosts_IsFeatured] DEFAULT ((0)) NOT NULL,
    [PageTitle]       NVARCHAR (200)  NULL,
    [MetaTitle]       NVARCHAR (200)  NULL,
    [MetaDescription] NVARCHAR (320)  NULL,
    [MetaKeywords]    NVARCHAR (500)  NULL,
    [CanonicalUrl]    NVARCHAR (1000) NULL,
    [PublishedOn]     DATETIME2 (0)   NULL,
    [CreatedBy]       INT             NULL,
    [CreatedOn]       DATETIME2 (0)   CONSTRAINT [DF_BlogPosts_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    [ModifiedBy]      INT             NULL,
    [ModifiedOn]      DATETIME2 (0)   NULL,
    CONSTRAINT [PK_BlogPosts] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [CK_BlogPosts_Status] CHECK ([Status]='Archived' OR [Status]='Published' OR [Status]='Draft'),
    CONSTRAINT [UQ_BlogPosts_Slug] UNIQUE NONCLUSTERED ([Slug] ASC)
);


GO
CREATE NONCLUSTERED INDEX [IX_BlogPosts_StatusPublishedOn]
    ON [Blogs].[BlogPosts]([Status] ASC, [PublishedOn] DESC, [IsFeatured] DESC);

