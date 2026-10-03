CREATE TABLE [dbo].[answers] (
    [id]                 INT IDENTITY (1, 1) NOT NULL,
    [attempt_id]         INT NOT NULL,
    [question_id]        INT NOT NULL,
    [selected_option_id] INT NOT NULL,
    [is_correct]         BIT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_answers_attempt] FOREIGN KEY ([attempt_id]) REFERENCES [dbo].[attempts] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_answers_option] FOREIGN KEY ([selected_option_id]) REFERENCES [dbo].[options] ([id]),
    CONSTRAINT [FK_answers_question] FOREIGN KEY ([question_id]) REFERENCES [dbo].[questions] ([id])
);

