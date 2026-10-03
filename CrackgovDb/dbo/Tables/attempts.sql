CREATE TABLE [dbo].[attempts] (
    [id]           INT           IDENTITY (1, 1) NOT NULL,
    [student_id]   INT           NOT NULL,
    [test_id]      INT           NOT NULL,
    [score]        INT           NULL,
    [started_at]   DATETIME2 (7) NULL,
    [completed_at] DATETIME2 (7) NULL,
    [franchise_id] INT           NOT NULL,
    CONSTRAINT [PK__attempts__3213E83FDF50BD79] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_attempts_franchises] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]),
    CONSTRAINT [FK_attempts_test] FOREIGN KEY ([test_id]) REFERENCES [dbo].[tests] ([id])
);

