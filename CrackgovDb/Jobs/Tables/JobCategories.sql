CREATE TABLE [Jobs].[JobCategories]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_JobCategories] PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_JobCategories_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedOn] DATETIME2 NOT NULL CONSTRAINT [DF_JobCategories_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [UQ_JobCategories_Name] UNIQUE ([Name])
);
