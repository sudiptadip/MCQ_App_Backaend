CREATE PROCEDURE [dbo].[SpFaqs]
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
        DECLARE @Id INT, @Page INT, @PageSize INT, @Search NVARCHAR(200), @Category NVARCHAR(100),
                @Question NVARCHAR(500), @Answer NVARCHAR(MAX), @DisplayOrder INT, @IsActive BIT;

        -------------------------------------------------
        -- MODE 1: GET ALL FAQs (With Pagination & Search)
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SELECT @Page = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.page')),
                   @PageSize = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.pageSize')),
                   @Search = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.search'))), N''),
                   @Category = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.category'))), N'');

            SET @Page = CASE WHEN @Page IS NULL OR @Page < 1 THEN 1 ELSE @Page END;
            SET @PageSize = CASE WHEN @PageSize IS NULL OR @PageSize < 1 THEN 10 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;

            DECLARE @TotalCount INT;
            SELECT @TotalCount = COUNT(1) FROM [dbo].[Faqs] f
            WHERE (@Search IS NULL OR f.Question LIKE N'%' + @Search + N'%' OR f.Answer LIKE N'%' + @Search + N'%' OR f.Category LIKE N'%' + @Search + N'%')
              AND (@Category IS NULL OR f.Category = @Category);

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT @TotalCount AS totalCount, @Page AS page, @PageSize AS pageSize,
                    JSON_QUERY((
                        SELECT f.Id AS id, f.Question AS question, f.Answer AS answer,
                               f.Category AS category, f.DisplayOrder AS displayOrder,
                               f.IsActive AS isActive, f.CreatedOn AS createdOn, f.ModifiedOn AS modifiedOn
                        FROM [dbo].[Faqs] f
                        WHERE (@Search IS NULL OR f.Question LIKE N'%' + @Search + N'%' OR f.Answer LIKE N'%' + @Search + N'%' OR f.Category LIKE N'%' + @Search + N'%')
                          AND (@Category IS NULL OR f.Category = @Category)
                        ORDER BY f.DisplayOrder ASC, f.CreatedOn DESC
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
        -- MODE 2: UPSERT FAQ (Insert / Update)
        -------------------------------------------------
        IF @Mode = 2
        BEGIN
            SELECT @Id = id,
                   @Question = question,
                   @Answer = answer,
                   @Category = category,
                   @DisplayOrder = displayOrder,
                   @IsActive = isActive
            FROM OPENJSON(@Json) WITH (
                id INT '$.id',
                question NVARCHAR(500) '$.question',
                answer NVARCHAR(MAX) '$.answer',
                category NVARCHAR(100) '$.category',
                displayOrder INT '$.displayOrder',
                isActive BIT '$.isActive'
            );

            IF NULLIF(LTRIM(RTRIM(@Question)), N'') IS NULL OR NULLIF(LTRIM(RTRIM(@Answer)), N'') IS NULL
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Question and Answer are required.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Category = COALESCE(NULLIF(LTRIM(RTRIM(@Category)), N''), 'General');
            SET @DisplayOrder = ISNULL(@DisplayOrder, 0);
            SET @IsActive = ISNULL(@IsActive, 1);

            IF ISNULL(@Id, 0) > 0
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM [dbo].[Faqs] WHERE Id = @Id)
                BEGIN
                    SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'FAQ item not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                    RETURN;
                END;

                UPDATE [dbo].[Faqs]
                SET Question = @Question,
                    Answer = @Answer,
                    Category = @Category,
                    DisplayOrder = @DisplayOrder,
                    IsActive = @IsActive,
                    ModifiedBy = @UserId,
                    ModifiedOn = SYSUTCDATETIME()
                WHERE Id = @Id;
            END
            ELSE
            BEGIN
                INSERT INTO [dbo].[Faqs] (Question, Answer, Category, DisplayOrder, IsActive, CreatedBy)
                VALUES (@Question, @Answer, @Category, @DisplayOrder, @IsActive, @UserId);

                SET @Id = CONVERT(INT, SCOPE_IDENTITY());
            END;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'FAQ saved successfully.' AS [Message],
                JSON_QUERY((SELECT @Id AS id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 3: DELETE FAQ
        -------------------------------------------------
        IF @Mode = 3
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            DELETE FROM [dbo].[Faqs] WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'FAQ item not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'FAQ deleted successfully.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 4: GET FAQ BY ID
        -------------------------------------------------
        IF @Mode = 4
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT f.Id AS id, f.Question AS question, f.Answer AS answer,
                           f.Category AS category, f.DisplayOrder AS displayOrder,
                           f.IsActive AS isActive, f.CreatedOn AS createdOn, f.ModifiedOn AS modifiedOn
                    FROM [dbo].[Faqs] f
                    WHERE f.Id = @Id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 5: TOGGLE ACTIVE STATUS
        -------------------------------------------------
        IF @Mode = 5
        BEGIN
            SELECT @Id = id, @IsActive = isActive FROM OPENJSON(@Json) WITH (id INT '$.id', isActive BIT '$.isActive');

            UPDATE [dbo].[Faqs]
            SET IsActive = ISNULL(@IsActive, CASE WHEN IsActive = 1 THEN 0 ELSE 1 END),
                ModifiedBy = @UserId,
                ModifiedOn = SYSUTCDATETIME()
            WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'FAQ item not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'FAQ status updated.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported FAQ operation mode.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        INSERT INTO [dbo].[ErrorLogs] (ProcedureName, ErrorMessage, ErrorNumber, ErrorLine, ErrorState, ErrorSeverity, UserId)
        VALUES ('dbo.SpFaqs', ERROR_MESSAGE(), ERROR_NUMBER(), ERROR_LINE(), ERROR_STATE(), ERROR_SEVERITY(), @UserId);

        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to process FAQ request.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
