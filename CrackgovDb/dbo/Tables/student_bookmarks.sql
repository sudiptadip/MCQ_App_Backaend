CREATE TABLE [dbo].[student_bookmarks] (
    [id]          INT      IDENTITY (1, 1) NOT NULL,
    [user_id]     INT      NOT NULL,
    [question_id] INT      NOT NULL,
    [created_at]  DATETIME CONSTRAINT [DF_student_bookmarks_created_at] DEFAULT (getdate()) NOT NULL,
    CONSTRAINT [PK_student_bookmarks] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_student_bookmarks_questions] FOREIGN KEY ([question_id]) REFERENCES [dbo].[questions] ([id]),
    CONSTRAINT [FK_student_bookmarks_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([id])
);

