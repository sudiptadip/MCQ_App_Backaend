CREATE TABLE [dbo].[fee_structures] (
    [id]           INT             IDENTITY (1, 1) NOT NULL,
    [name]         NVARCHAR (255)  NOT NULL,
    [amount]       DECIMAL (18, 2) NOT NULL,
    [frequency]    NVARCHAR (50)   DEFAULT ('Monthly') NULL,
    [description]  NVARCHAR (MAX)  NULL,
    [franchise_id] INT             NOT NULL,
    [status]       BIT             DEFAULT ((1)) NOT NULL,
    [created_at]   DATETIME2 (7)   DEFAULT (getdate()) NULL,
    CONSTRAINT [PK_fee_structures] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_fee_structures_franchises] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id])
);

