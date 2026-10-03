CREATE TABLE [dbo].[questions] (
    [id]                   INT            IDENTITY (1, 1) NOT NULL,
    [question_text]        NVARCHAR (MAX) NOT NULL,
    [category_id]          INT            NOT NULL,
    [difficulty_level]     NVARCHAR (20)  NULL,
    [created_by]           INT            NULL,
    [created_at]           DATETIME2 (7)  CONSTRAINT [DF__questions__creat__71D1E811] DEFAULT (getdate()) NULL,
    [franchise_id]         INT            NOT NULL,
    [question_explanation] NVARCHAR (MAX) NULL,
    [tag]                  NVARCHAR (500) NULL,
    [image_document_id]    INT            NULL,
    [upload_lot_number]    INT            NULL,
    CONSTRAINT [PK__question__3213E83F88673D17] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [CK__questions__diffi__70DDC3D8] CHECK ([difficulty_level]='hard' OR [difficulty_level]='medium' OR [difficulty_level]='easy'),
    CONSTRAINT [FK_questions_category] FOREIGN KEY ([category_id]) REFERENCES [dbo].[categories] ([id]),
    CONSTRAINT [FK_questions_franchises] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]),
    CONSTRAINT [FK_questions_user] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([id])
);


GO
CREATE NONCLUSTERED INDEX [IX_questions_franchise_category]
    ON [dbo].[questions]([franchise_id] ASC, [category_id] ASC);

