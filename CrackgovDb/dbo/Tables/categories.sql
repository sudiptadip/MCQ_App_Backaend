CREATE TABLE [dbo].[categories] (
    [id]            INT            IDENTITY (1, 1) NOT NULL,
    [name]          NVARCHAR (255) NOT NULL,
    [parent_id]     INT            NULL,
    [franchise_id]  INT            NOT NULL,
    [category_type] NVARCHAR (500) NULL,
    CONSTRAINT [PK__categori__3213E83FFEF89732] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_categories_categories] FOREIGN KEY ([id]) REFERENCES [dbo].[categories] ([id]),
    CONSTRAINT [FK_categories_parent] FOREIGN KEY ([parent_id]) REFERENCES [dbo].[categories] ([id])
);


GO
CREATE NONCLUSTERED INDEX [IX_categories_parent_id]
    ON [dbo].[categories]([parent_id] ASC)
    INCLUDE([id], [name], [category_type], [franchise_id]);


GO
CREATE NONCLUSTERED INDEX [IX_categories_franchise_id]
    ON [dbo].[categories]([franchise_id] ASC)
    INCLUDE([id], [name], [parent_id], [category_type]);

