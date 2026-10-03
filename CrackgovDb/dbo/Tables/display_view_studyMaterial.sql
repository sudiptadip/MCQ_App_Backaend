CREATE TABLE [dbo].[display_view_studyMaterial] (
    [id]               INT IDENTITY (1, 1) NOT NULL,
    [display_view_id]  INT NOT NULL,
    [studyMaterial_id] INT NOT NULL,
    CONSTRAINT [PK_display_view_studyMaterial] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_display_view_studyMaterial_display_view] FOREIGN KEY ([display_view_id]) REFERENCES [dbo].[display_view] ([id]),
    CONSTRAINT [FK_display_view_studyMaterial_tests] FOREIGN KEY ([studyMaterial_id]) REFERENCES [dbo].[study_material] ([id])
);

