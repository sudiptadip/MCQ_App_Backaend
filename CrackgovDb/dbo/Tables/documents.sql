CREATE TABLE [dbo].[documents] (
    [id]           INT            IDENTITY (1, 1) NOT NULL,
    [franchise_id] INT            NULL,
    [file_name]    NVARCHAR (255) NOT NULL,
    [file_path]    NVARCHAR (500) NOT NULL,
    [url]          NVARCHAR (500) NOT NULL,
    [content_type] NVARCHAR (100) NULL,
    [file_size]    BIGINT         NOT NULL,
    [uploaded_at]  DATETIME       DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_documents_franchise] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]) ON DELETE SET NULL
);

