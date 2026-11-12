CREATE TABLE [dbo].[Faqs] (
    [Id]           INT            IDENTITY (1, 1) NOT NULL,
    [Question]     NVARCHAR (500) NOT NULL,
    [Answer]       NVARCHAR (MAX) NOT NULL,
    [Category]     NVARCHAR (100) CONSTRAINT [DF_Faqs_Category] DEFAULT ('General') NULL,
    [DisplayOrder] INT            CONSTRAINT [DF_Faqs_DisplayOrder] DEFAULT ((0)) NOT NULL,
    [IsActive]     BIT            CONSTRAINT [DF_Faqs_IsActive] DEFAULT ((1)) NOT NULL,
    [CreatedBy]    INT            NULL,
    [CreatedOn]    DATETIME2 (0)  CONSTRAINT [DF_Faqs_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    [ModifiedBy]   INT            NULL,
    [ModifiedOn]   DATETIME2 (0)  NULL,
    CONSTRAINT [PK_Faqs] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
CREATE NONCLUSTERED INDEX [IX_Faqs_IsActiveOrder]
    ON [dbo].[Faqs]([IsActive] ASC, [DisplayOrder] ASC, [CreatedOn] DESC);

