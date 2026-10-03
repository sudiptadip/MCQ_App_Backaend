CREATE TABLE [dbo].[franchise_assigned_categories] (
    [id]           INT           IDENTITY (1, 1) NOT NULL,
    [franchise_id] INT           NOT NULL,
    [category_id]  INT           NOT NULL,
    [assigned_at]  DATETIME2 (7) CONSTRAINT [DF_franchise_assigned_categories_assigned_at] DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_franchise_assigned_categories_category] FOREIGN KEY ([category_id]) REFERENCES [dbo].[categories] ([id]),
    CONSTRAINT [FK_franchise_assigned_categories_franchise] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id])
);


GO
CREATE NONCLUSTERED INDEX [IX_franchise_assigned_categories_franchise]
    ON [dbo].[franchise_assigned_categories]([franchise_id] ASC, [category_id] ASC);

