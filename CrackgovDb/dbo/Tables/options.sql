CREATE TABLE [dbo].[options] (
    [id]          INT            IDENTITY (1, 1) NOT NULL,
    [question_id] INT            NOT NULL,
    [option_text] NVARCHAR (MAX) NOT NULL,
    [is_correct]  BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_options_question] FOREIGN KEY ([question_id]) REFERENCES [dbo].[questions] ([id]) ON DELETE CASCADE
);

