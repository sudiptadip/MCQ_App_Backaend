CREATE TABLE [dbo].[student_fees] (
    [id]               INT             IDENTITY (1, 1) NOT NULL,
    [student_id]       INT             NOT NULL,
    [fee_structure_id] INT             NOT NULL,
    [total_amount]     DECIMAL (18, 2) NOT NULL,
    [discount_amount]  DECIMAL (18, 2) DEFAULT ((0)) NOT NULL,
    [net_amount]       DECIMAL (18, 2) NOT NULL,
    [paid_amount]      DECIMAL (18, 2) DEFAULT ((0)) NOT NULL,
    [due_amount]       DECIMAL (18, 2) NOT NULL,
    [due_date]         DATE            NOT NULL,
    [status]           NVARCHAR (50)   DEFAULT ('PENDING') NOT NULL,
    [franchise_id]     INT             NOT NULL,
    [created_at]       DATETIME2 (7)   DEFAULT (getdate()) NULL,
    CONSTRAINT [PK_student_fees] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_student_fees_franchises] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]),
    CONSTRAINT [FK_student_fees_structures] FOREIGN KEY ([fee_structure_id]) REFERENCES [dbo].[fee_structures] ([id]),
    CONSTRAINT [FK_student_fees_users] FOREIGN KEY ([student_id]) REFERENCES [dbo].[users] ([id])
);

