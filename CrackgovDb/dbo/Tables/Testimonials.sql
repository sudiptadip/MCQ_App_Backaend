CREATE TABLE [dbo].[Testimonials]
(
    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Testimonials] PRIMARY KEY,
    [StudentName] NVARCHAR(150) NOT NULL,
    [ExamName] NVARCHAR(150) NULL,
    [RankOrScore] NVARCHAR(100) NULL,
    [AvatarUrl] NVARCHAR(1000) NULL,
    [Content] NVARCHAR(MAX) NOT NULL,
    [Rating] INT NOT NULL CONSTRAINT [DF_Testimonials_Rating] DEFAULT (5),
    [DisplayOrder] INT NOT NULL CONSTRAINT [DF_Testimonials_DisplayOrder] DEFAULT (0),
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Testimonials_IsActive] DEFAULT (1),
    [CreatedBy] INT NULL,
    [CreatedOn] DATETIME2(0) NOT NULL CONSTRAINT [DF_Testimonials_CreatedOn] DEFAULT (SYSUTCDATETIME()),
    [ModifiedBy] INT NULL,
    [ModifiedOn] DATETIME2(0) NULL
);
GO
CREATE INDEX [IX_Testimonials_IsActiveOrder] ON [dbo].[Testimonials] ([IsActive], [DisplayOrder] ASC, [CreatedOn] DESC);
