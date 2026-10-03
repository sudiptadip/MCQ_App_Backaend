CREATE TABLE [dbo].[users] (
    [id]                 INT            IDENTITY (1, 1) NOT NULL,
    [name]               NVARCHAR (255) NOT NULL,
    [email]              NVARCHAR (255) NOT NULL,
    [password_hash]      NVARCHAR (255) NOT NULL,
    [role]               NVARCHAR (50)  NOT NULL,
    [franchise_id]       INT            NULL,
    [created_at]         DATETIME2 (7)  DEFAULT (getdate()) NULL,
    [updated_at]         DATETIME2 (7)  NULL,
    [device_fingerprint] NVARCHAR (200) NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CHECK ([role]='STUDENT' OR [role]='FRANCHISE_ADMIN' OR [role]='SUPER_ADMIN'),
    CONSTRAINT [FK_users_franchise] FOREIGN KEY ([franchise_id]) REFERENCES [dbo].[franchises] ([id]),
    UNIQUE NONCLUSTERED ([email] ASC)
);

