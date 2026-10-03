CREATE TABLE [dbo].[display_view] (
    [id]           INT            IDENTITY (1, 1) NOT NULL,
    [display_name] NVARCHAR (200) NOT NULL,
    [parent_id]    INT            NULL,
    [franchise_id] INT            NOT NULL,
    CONSTRAINT [PK_display_view] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_display_view_franchises] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id])
);

