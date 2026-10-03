CREATE TABLE [dbo].[student_assigned_categories] (
    [id]              INT           IDENTITY (1, 1) NOT NULL,
    [student_user_id] INT           NOT NULL,
    [category_id]     INT           NOT NULL,
    [assigned_at]     DATETIME2 (7) DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_student_assigned_categories_categories] FOREIGN KEY ([category_id]) REFERENCES [dbo].[categories] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_student_assigned_categories_users] FOREIGN KEY ([student_user_id]) REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE,
    CONSTRAINT [UQ_student_assigned_categories] UNIQUE NONCLUSTERED ([student_user_id] ASC, [category_id] ASC)
);


GO
CREATE NONCLUSTERED INDEX [IX_student_assigned_categories_student]
    ON [dbo].[student_assigned_categories]([student_user_id] ASC, [category_id] ASC);

