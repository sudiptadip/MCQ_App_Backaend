CREATE PROCEDURE [dbo].[SpAnonymousContactUs]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -------------------------------------------------
        -- MODE 1: SUBMIT CONTACT FORM (Anonymous User)
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            DECLARE @Name NVARCHAR(150), @ContactInfo NVARCHAR(200), @Title NVARCHAR(250), @Description NVARCHAR(MAX), @Id INT;

            SELECT @Name = name,
                   @ContactInfo = contactInfo,
                   @Title = title,
                   @Description = description
            FROM OPENJSON(@Json) WITH (
                name NVARCHAR(150) '$.name',
                contactInfo NVARCHAR(200) '$.contactInfo',
                title NVARCHAR(250) '$.title',
                description NVARCHAR(MAX) '$.description'
            );

            IF NULLIF(LTRIM(RTRIM(@Name)), N'') IS NULL 
               OR NULLIF(LTRIM(RTRIM(@ContactInfo)), N'') IS NULL
               OR NULLIF(LTRIM(RTRIM(@Title)), N'') IS NULL
               OR NULLIF(LTRIM(RTRIM(@Description)), N'') IS NULL
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Name, Phone/Email, Title, and Description are required.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            INSERT INTO [dbo].[ContactSubmissions] (Name, ContactInfo, Title, Description, IsRead, CreatedOn)
            VALUES (@Name, @ContactInfo, @Title, @Description, 0, SYSUTCDATETIME());

            SET @Id = CONVERT(INT, SCOPE_IDENTITY());

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Thank you! Your message has been submitted successfully. Our team will get back to you soon.' AS [Message],
                JSON_QUERY((SELECT @Id AS id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported operation.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to submit your message. Please try again.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
