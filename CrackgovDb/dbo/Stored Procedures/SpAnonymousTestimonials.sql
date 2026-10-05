CREATE PROCEDURE [dbo].[SpAnonymousTestimonials]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -------------------------------------------------
        -- MODE 1: GET ALL ACTIVE TESTIMONIALS FOR CLIENT
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT t.Id AS id,
                           t.StudentName AS studentName,
                           t.ExamName AS examName,
                           t.RankOrScore AS rankOrScore,
                           t.AvatarUrl AS avatarUrl,
                           t.Content AS content,
                           t.Rating AS rating,
                           t.DisplayOrder AS displayOrder
                    FROM [dbo].[Testimonials] t
                    WHERE t.IsActive = 1
                    ORDER BY t.DisplayOrder ASC, t.CreatedOn DESC
                    FOR JSON PATH
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported operation.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to load testimonials.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
