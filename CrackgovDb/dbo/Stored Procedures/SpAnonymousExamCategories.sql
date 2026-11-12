CREATE PROCEDURE [dbo].[SpAnonymousExamCategories]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -------------------------------------------------
        -- MODE 1: GET ACTIVE EXAM CATEGORIES FOR CLIENT
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT c.Id AS id,
                           c.Title AS title,
                           c.Description AS description,
                           c.Href AS href,
                           c.ImageUrl AS imageUrl,
                           c.IconName AS iconName,
                           c.AccentColor AS accentColor,
                           c.DisplayOrder AS displayOrder
                    FROM [dbo].[ExamCategories] c
                    WHERE c.IsActive = 1
                    ORDER BY c.DisplayOrder ASC, c.CreatedOn DESC
                    FOR JSON PATH
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported operation.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to load Exam Categories.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
GO
