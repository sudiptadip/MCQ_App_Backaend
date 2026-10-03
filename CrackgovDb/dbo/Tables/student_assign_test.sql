CREATE TABLE [dbo].[student_assign_test] (
    [id]              INT IDENTITY (1, 1) NOT NULL,
    [student_user_id] INT NOT NULL,
    [display_view_id] INT NOT NULL,
    [is_active]       BIT DEFAULT ((1)) NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_student_assign_test_display_view] FOREIGN KEY ([display_view_id]) REFERENCES [dbo].[display_view] ([id]),
    CONSTRAINT [FK_student_assign_test_users] FOREIGN KEY ([student_user_id]) REFERENCES [dbo].[users] ([id])
);

