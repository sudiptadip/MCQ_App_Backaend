CREATE TABLE [dbo].[display_view_test] (
    [id]              INT IDENTITY (1, 1) NOT NULL,
    [display_view_id] INT NOT NULL,
    [test_id]         INT NOT NULL,
    CONSTRAINT [PK_display_view_test] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_display_view_test_display_view] FOREIGN KEY ([display_view_id]) REFERENCES [dbo].[display_view] ([id]),
    CONSTRAINT [FK_display_view_test_tests] FOREIGN KEY ([test_id]) REFERENCES [dbo].[tests] ([id])
);

