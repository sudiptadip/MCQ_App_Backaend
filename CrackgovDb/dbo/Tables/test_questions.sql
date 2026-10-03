CREATE TABLE [dbo].[test_questions] (
    [id]          INT IDENTITY (1, 1) NOT NULL,
    [test_id]     INT NOT NULL,
    [question_id] INT NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_test_questions_question] FOREIGN KEY ([question_id]) REFERENCES [dbo].[questions] ([id]),
    CONSTRAINT [FK_test_questions_test] FOREIGN KEY ([test_id]) REFERENCES [dbo].[tests] ([id]) ON DELETE CASCADE
);

