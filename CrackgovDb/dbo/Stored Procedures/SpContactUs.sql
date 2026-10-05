CREATE PROCEDURE [dbo].[SpContactUs]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        DECLARE @Id INT, @Page INT, @PageSize INT, @Search NVARCHAR(200),
                @Name NVARCHAR(150), @ContactInfo NVARCHAR(200), @Title NVARCHAR(250),
                @Description NVARCHAR(MAX), @IsRead BIT;

        -------------------------------------------------
        -- MODE 1: GET ALL CONTACT SUBMISSIONS (Admin List)
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SELECT @Page = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.page')),
                   @PageSize = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.pageSize')),
                   @Search = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.search'))), N'');

            SET @Page = CASE WHEN @Page IS NULL OR @Page < 1 THEN 1 ELSE @Page END;
            SET @PageSize = CASE WHEN @PageSize IS NULL OR @PageSize < 1 THEN 10 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;

            DECLARE @TotalCount INT;
            SELECT @TotalCount = COUNT(1) FROM [dbo].[ContactSubmissions] c
            WHERE (@Search IS NULL OR c.Name LIKE N'%' + @Search + N'%' OR c.ContactInfo LIKE N'%' + @Search + N'%' OR c.Title LIKE N'%' + @Search + N'%' OR c.Description LIKE N'%' + @Search + N'%');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT @TotalCount AS totalCount, @Page AS page, @PageSize AS pageSize,
                    JSON_QUERY((
                        SELECT c.Id AS id, c.Name AS name, c.ContactInfo AS contactInfo,
                               c.Title AS title, c.Description AS description,
                               c.IsRead AS isRead, c.CreatedOn AS createdOn
                        FROM [dbo].[ContactSubmissions] c
                        WHERE (@Search IS NULL OR c.Name LIKE N'%' + @Search + N'%' OR c.ContactInfo LIKE N'%' + @Search + N'%' OR c.Title LIKE N'%' + @Search + N'%' OR c.Description LIKE N'%' + @Search + N'%')
                        ORDER BY c.IsRead ASC, c.CreatedOn DESC
                        OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
                        FOR JSON PATH
                    )) AS items
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 2: INSERT CONTACT SUBMISSION
        -------------------------------------------------
        IF @Mode = 2
        BEGIN
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

            INSERT INTO [dbo].[ContactSubmissions] (Name, ContactInfo, Title, Description, IsRead)
            VALUES (@Name, @ContactInfo, @Title, @Description, 0);

            SET @Id = CONVERT(INT, SCOPE_IDENTITY());

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Your message has been submitted successfully.' AS [Message],
                JSON_QUERY((SELECT @Id AS id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 3: DELETE CONTACT SUBMISSION
        -------------------------------------------------
        IF @Mode = 3
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            DELETE FROM [dbo].[ContactSubmissions] WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Contact inquiry not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Contact inquiry deleted successfully.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 4: GET CONTACT SUBMISSION BY ID
        -------------------------------------------------
        IF @Mode = 4
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT c.Id AS id, c.Name AS name, c.ContactInfo AS contactInfo,
                           c.Title AS title, c.Description AS description,
                           c.IsRead AS isRead, c.CreatedOn AS createdOn
                    FROM [dbo].[ContactSubmissions] c
                    WHERE c.Id = @Id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 5: TOGGLE IS_READ STATUS
        -------------------------------------------------
        IF @Mode = 5
        BEGIN
            SELECT @Id = id, @IsRead = isRead FROM OPENJSON(@Json) WITH (id INT '$.id', isRead BIT '$.isRead');

            UPDATE [dbo].[ContactSubmissions]
            SET IsRead = ISNULL(@IsRead, CASE WHEN IsRead = 1 THEN 0 ELSE 1 END),
                ModifiedOn = SYSUTCDATETIME()
            WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Contact inquiry not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Read status updated.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported operation mode.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        INSERT INTO [dbo].[ErrorLogs] (ProcedureName, ErrorMessage, ErrorNumber, ErrorLine, ErrorState, ErrorSeverity, UserId)
        VALUES ('dbo.SpContactUs', ERROR_MESSAGE(), ERROR_NUMBER(), ERROR_LINE(), ERROR_STATE(), ERROR_SEVERITY(), @UserId);

        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to process contact submission request.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
