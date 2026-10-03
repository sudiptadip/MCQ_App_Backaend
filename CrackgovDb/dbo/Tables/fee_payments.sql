CREATE TABLE [dbo].[fee_payments] (
    [id]              INT             IDENTITY (1, 1) NOT NULL,
    [student_fee_id]  INT             NOT NULL,
    [student_id]      INT             NOT NULL,
    [receipt_no]      NVARCHAR (100)  NOT NULL,
    [amount_paid]     DECIMAL (18, 2) NOT NULL,
    [payment_mode]    NVARCHAR (50)   NOT NULL,
    [transaction_ref] NVARCHAR (100)  NULL,
    [payment_date]    DATETIME2 (7)   DEFAULT (getdate()) NULL,
    [collected_by]    INT             NULL,
    [remarks]         NVARCHAR (MAX)  NULL,
    [franchise_id]    INT             NOT NULL,
    CONSTRAINT [PK_fee_payments] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_fee_payments_franchises] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]),
    CONSTRAINT [FK_fee_payments_student_fees] FOREIGN KEY ([student_fee_id]) REFERENCES [dbo].[student_fees] ([id]),
    CONSTRAINT [FK_fee_payments_users] FOREIGN KEY ([student_id]) REFERENCES [dbo].[users] ([id]),
    CONSTRAINT [UQ_receipt_no] UNIQUE NONCLUSTERED ([receipt_no] ASC)
);

