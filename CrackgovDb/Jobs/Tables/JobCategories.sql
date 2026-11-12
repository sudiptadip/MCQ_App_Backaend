CREATE TABLE [Jobs].[JobCategories] (
    [Id]        INT            IDENTITY (1, 1) NOT NULL,
    [Name]      NVARCHAR (100) NOT NULL,
    [IsActive]  BIT            CONSTRAINT [DF_JobCategories_IsActive] DEFAULT ((1)) NOT NULL,
    [CreatedBy] INT            NULL,
    [CreatedOn] DATETIME2 (7)  CONSTRAINT [DF_JobCategories_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    CONSTRAINT [PK_JobCategories] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_JobCategories_Name] UNIQUE NONCLUSTERED ([Name] ASC)
);

