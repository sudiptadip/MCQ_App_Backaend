CREATE TABLE [dbo].[user_passwords] (
    [id]         INT            IDENTITY (1, 1) NOT NULL,
    [user_id]    INT            NOT NULL,
    [password]   NVARCHAR (255) NOT NULL,
    [created_at] DATETIME2 (7)  DEFAULT (getdate()) NULL,
    [updated_at] DATETIME2 (7)  NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_user_passwords_user] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE,
    CONSTRAINT [UQ_user_passwords_user_id] UNIQUE NONCLUSTERED ([user_id] ASC)
);
