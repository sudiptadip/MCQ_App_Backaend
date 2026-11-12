CREATE TABLE [dbo].[ContactSubmissions] (
    [Id]          INT            IDENTITY (1, 1) NOT NULL,
    [Name]        NVARCHAR (150) NOT NULL,
    [ContactInfo] NVARCHAR (200) NOT NULL,
    [Title]       NVARCHAR (250) NOT NULL,
    [Description] NVARCHAR (MAX) NOT NULL,
    [IsRead]      BIT            CONSTRAINT [DF_ContactSubmissions_IsRead] DEFAULT ((0)) NOT NULL,
    [CreatedOn]   DATETIME2 (0)  CONSTRAINT [DF_ContactSubmissions_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    [ModifiedOn]  DATETIME2 (0)  NULL,
    CONSTRAINT [PK_ContactSubmissions] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
CREATE NONCLUSTERED INDEX [IX_ContactSubmissions_CreatedOn]
    ON [dbo].[ContactSubmissions]([IsRead] ASC, [CreatedOn] DESC);

