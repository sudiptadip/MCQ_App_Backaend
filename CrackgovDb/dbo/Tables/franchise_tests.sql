CREATE TABLE [dbo].[franchise_tests] (
    [id]           INT IDENTITY (1, 1) NOT NULL,
    [franchise_id] INT NOT NULL,
    [test_id]      INT NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_franchise_tests_franchise] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_franchise_tests_test] FOREIGN KEY ([test_id]) REFERENCES [dbo].[tests] ([id]) ON DELETE CASCADE
);

