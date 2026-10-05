CREATE PROCEDURE [dbo].[SpAnonymousFaqs]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -------------------------------------------------
        -- MODE 1: GET ALL ACTIVE FAQs FOR CLIENT
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            DECLARE @Category NVARCHAR(100);
            SELECT @Category = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.category'))), N'');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT f.Id AS id,
                           f.Question AS question,
                           f.Answer AS answer,
                           f.Category AS category,
                           f.DisplayOrder AS displayOrder
                    FROM [dbo].[Faqs] f
                    WHERE f.IsActive = 1
                      AND (@Category IS NULL OR f.Category = @Category)
                    ORDER BY f.DisplayOrder ASC, f.CreatedOn DESC
                    FOR JSON PATH
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported operation.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to load FAQs.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
