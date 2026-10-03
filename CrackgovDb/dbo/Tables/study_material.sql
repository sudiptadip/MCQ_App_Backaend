CREATE TABLE [dbo].[study_material] (
    [id]           INT             IDENTITY (1, 1) NOT NULL,
    [name]         NVARCHAR (250)  NOT NULL,
    [description]  NVARCHAR (MAX)  NULL,
    [type]         VARCHAR (50)    NOT NULL,
    [url]          NVARCHAR (1000) NULL,
    [isActive]     BIT             DEFAULT ((1)) NOT NULL,
    [createdBy]    INT             NULL,
    [modifiedBy]   INT             NULL,
    [createdOn]    DATETIME        DEFAULT (getdate()) NOT NULL,
    [modifiedOn]   DATETIME        NULL,
    [franchise_id] INT             NOT NULL,
    [category_id]  INT             NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_study_material_categories] FOREIGN KEY ([category_id]) REFERENCES [dbo].[categories] ([id])
);

