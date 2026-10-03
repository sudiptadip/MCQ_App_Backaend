CREATE FUNCTION [Jobs].[CreateSlug] (@Value NVARCHAR(1000))
RETURNS NVARCHAR(220)
AS
BEGIN
    DECLARE @Slug NVARCHAR(1000) = LOWER(LTRIM(RTRIM(ISNULL(@Value, N''))));
    DECLARE @InvalidPosition INT;

    SET @Slug = REPLACE(@Slug, N' ', N'-');
    SET @Slug = REPLACE(@Slug, N'_', N'-');

    SET @InvalidPosition = PATINDEX(N'%[^a-z0-9-]%', @Slug COLLATE Latin1_General_100_BIN2);
    WHILE @InvalidPosition > 0
    BEGIN
        SET @Slug = STUFF(@Slug, @InvalidPosition, 1, N'-');
        SET @InvalidPosition = PATINDEX(N'%[^a-z0-9-]%', @Slug COLLATE Latin1_General_100_BIN2);
    END;

    WHILE CHARINDEX(N'--', @Slug) > 0
        SET @Slug = REPLACE(@Slug, N'--', N'-');

    WHILE LEFT(@Slug, 1) = N'-'
        SET @Slug = STUFF(@Slug, 1, 1, N'');

    WHILE RIGHT(@Slug, 1) = N'-'
        SET @Slug = LEFT(@Slug, LEN(@Slug) - 1);

    RETURN LEFT(@Slug, 220);
END;
