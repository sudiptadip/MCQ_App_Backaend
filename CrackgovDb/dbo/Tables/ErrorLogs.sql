CREATE TABLE [dbo].[ErrorLogs] (
    [Id]            INT            IDENTITY (1, 1) NOT NULL,
    [ProcedureName] NVARCHAR (200) NULL,
    [ErrorMessage]  NVARCHAR (MAX) NULL,
    [ErrorNumber]   INT            NULL,
    [ErrorLine]     INT            NULL,
    [ErrorState]    INT            NULL,
    [ErrorSeverity] INT            NULL,
    [UserId]        INT            NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC)
);

