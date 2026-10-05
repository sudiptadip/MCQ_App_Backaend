CREATE TABLE [dbo].[ContactSubmissions]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_ContactSubmissions] PRIMARY KEY,
    [Name] NVARCHAR(150) NOT NULL,
    [ContactInfo] NVARCHAR(200) NOT NULL,
    [Title] NVARCHAR(250) NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [IsRead] BIT NOT NULL CONSTRAINT [DF_ContactSubmissions_IsRead] DEFAULT (0),
    [CreatedOn] DATETIME2(0) NOT NULL CONSTRAINT [DF_ContactSubmissions_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedOn] DATETIME2(0) NULL
);
GO
CREATE INDEX [IX_ContactSubmissions_CreatedOn] ON [dbo].[ContactSubmissions] ([IsRead], [CreatedOn] DESC);
