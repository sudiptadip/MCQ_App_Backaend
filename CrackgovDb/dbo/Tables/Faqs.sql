CREATE TABLE [dbo].[Faqs]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Faqs] PRIMARY KEY,
    [Question] NVARCHAR(500) NOT NULL,
    [Answer] NVARCHAR(MAX) NOT NULL,
    [Category] NVARCHAR(100) NULL CONSTRAINT [DF_Faqs_Category] DEFAULT ('General'),
    [DisplayOrder] INT NOT NULL CONSTRAINT [DF_Faqs_DisplayOrder] DEFAULT (0),
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Faqs_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedOn] DATETIME2(0) NOT NULL CONSTRAINT [DF_Faqs_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedBy] INT NULL,
    [ModifiedOn] DATETIME2(0) NULL
);
GO
CREATE INDEX [IX_Faqs_IsActiveOrder] ON [dbo].[Faqs] ([IsActive], [DisplayOrder] ASC, [CreatedOn] DESC);
