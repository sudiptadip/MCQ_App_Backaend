CREATE TABLE [dbo].[EmailTemplates] (
    [Id]               INT            IDENTITY (1, 1) NOT NULL,
    [TemplateKey]      NVARCHAR (100) NOT NULL,
    [Name]             NVARCHAR (200) NOT NULL,
    [Subject]          NVARCHAR (500) NOT NULL,
    [BodyHtml]         NVARCHAR (MAX) NOT NULL,
    [BodyText]         NVARCHAR (MAX) NULL,
    [DynamicVariables] NVARCHAR (MAX) NULL,
    [FranchiseId]      INT            NULL,
    [IsActive]         BIT            CONSTRAINT [DF_EmailTemplates_IsActive] DEFAULT ((1)) NOT NULL,
    [CreatedBy]        INT            NULL,
    [CreatedOn]        DATETIME2 (7)  CONSTRAINT [DF_EmailTemplates_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    [ModifiedBy]       INT            NULL,
    [ModifiedOn]       DATETIME2 (7)  NULL,
    CONSTRAINT [PK_EmailTemplates] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_EmailTemplates_franchises] FOREIGN KEY ([FranchiseId]) REFERENCES [dbo].[franchises] ([id]) ON DELETE SET NULL
);


GO
CREATE NONCLUSTERED INDEX [IX_EmailTemplates_FranchiseId_Key]
    ON [dbo].[EmailTemplates]([FranchiseId] ASC, [TemplateKey] ASC);

