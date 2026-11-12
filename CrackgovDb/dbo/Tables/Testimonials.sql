CREATE TABLE [dbo].[Testimonials] (
    [Id]           INT             IDENTITY (1, 1) NOT NULL,
    [StudentName]  NVARCHAR (150)  NOT NULL,
    [ExamName]     NVARCHAR (150)  NULL,
    [RankOrScore]  NVARCHAR (100)  NULL,
    [AvatarUrl]    NVARCHAR (1000) NULL,
    [Content]      NVARCHAR (MAX)  NOT NULL,
    [Rating]       INT             CONSTRAINT [DF_Testimonials_Rating] DEFAULT ((5)) NOT NULL,
    [DisplayOrder] INT             CONSTRAINT [DF_Testimonials_DisplayOrder] DEFAULT ((0)) NOT NULL,
    [IsActive]     BIT             CONSTRAINT [DF_Testimonials_IsActive] DEFAULT ((1)) NOT NULL,
    [CreatedBy]    INT             NULL,
    [CreatedOn]    DATETIME2 (0)   CONSTRAINT [DF_Testimonials_CreatedOn] DEFAULT (sysutcdatetime()) NOT NULL,
    [ModifiedBy]   INT             NULL,
    [ModifiedOn]   DATETIME2 (0)   NULL,
    CONSTRAINT [PK_Testimonials] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
CREATE NONCLUSTERED INDEX [IX_Testimonials_IsActiveOrder]
    ON [dbo].[Testimonials]([IsActive] ASC, [DisplayOrder] ASC, [CreatedOn] DESC);

