CREATE TABLE [dbo].[ExamCategories] (
    [Id]           INT             IDENTITY (1, 1) NOT NULL,
    [Title]        NVARCHAR (200)  NOT NULL,
    [Description]  NVARCHAR (500)  NULL,
    [Href]         NVARCHAR (200)  CONSTRAINT [DF_ExamCategories_Href] DEFAULT (N'/practice') NOT NULL,
    [ImageUrl]     NVARCHAR (1000) NULL,
    [IconName]     NVARCHAR (100)  CONSTRAINT [DF_ExamCategories_IconName] DEFAULT (N'Landmark') NOT NULL,
    [AccentColor]  NVARCHAR (200)  CONSTRAINT [DF_ExamCategories_AccentColor] DEFAULT (N'from-blue-600/90 to-indigo-900/90') NULL,
    [DisplayOrder] INT             CONSTRAINT [DF_ExamCategories_DisplayOrder] DEFAULT ((0)) NOT NULL,
    [IsActive]     BIT             CONSTRAINT [DF_ExamCategories_IsActive] DEFAULT ((1)) NOT NULL,
    [CreatedBy]    INT             NULL,
    [CreatedOn]    DATETIME2 (7)   CONSTRAINT [DF_ExamCategories_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    [ModifiedBy]   INT             NULL,
    [ModifiedOn]   DATETIME2 (7)   NULL,
    CONSTRAINT [PK_ExamCategories] PRIMARY KEY CLUSTERED ([Id] ASC)
);

