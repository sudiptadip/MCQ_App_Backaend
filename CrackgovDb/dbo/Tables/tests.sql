CREATE TABLE [dbo].[tests] (
    [id]                         INT            IDENTITY (1, 1) NOT NULL,
    [name]                       NVARCHAR (255) NOT NULL,
    [total_questions]            INT            NULL,
    [duration_minutes]           INT            NULL,
    [created_by]                 INT            NULL,
    [created_at]                 DATETIME2 (7)  CONSTRAINT [DF__tests__created_a__7B5B524B] DEFAULT (getdate()) NULL,
    [franchise_id]               INT            NOT NULL,
    [description]                NVARCHAR (MAX) NULL,
    [min_no_of_question_attempt] INT            NULL,
    [is_custom]                  BIT            CONSTRAINT [DF_tests_is_custom] DEFAULT ((0)) NOT NULL,
    [student_id]                 INT            NULL,
    CONSTRAINT [PK__tests__3213E83F9CDB9766] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_tests_franchises] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]),
    CONSTRAINT [FK_tests_student] FOREIGN KEY ([student_id]) REFERENCES [dbo].[users] ([id]),
    CONSTRAINT [FK_tests_user] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([id])
);

