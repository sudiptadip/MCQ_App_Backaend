CREATE PROCEDURE [dbo].[SpExamCategories]
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
                @Title NVARCHAR(200), @Description NVARCHAR(500), @Href NVARCHAR(200),
                @ImageUrl NVARCHAR(1000), @IconName NVARCHAR(100), @AccentColor NVARCHAR(200),
                @DisplayOrder INT, @IsActive BIT;

        -------------------------------------------------
        -- MODE 1: GET ALL EXAM CATEGORIES (ADMIN - LIST / PAGINATED)
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SELECT @Page = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.page')),
                   @PageSize = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.pageSize')),
                   @Search = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.search'))), N'');

            SET @Page = CASE WHEN @Page IS NULL OR @Page < 1 THEN 1 ELSE @Page END;
            SET @PageSize = CASE WHEN @PageSize IS NULL OR @PageSize < 1 THEN 20 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;

            DECLARE @TotalCount INT;
            SELECT @TotalCount = COUNT(1) FROM [dbo].[ExamCategories] c
            WHERE (@Search IS NULL OR c.Title LIKE N'%' + @Search + N'%' OR c.Description LIKE N'%' + @Search + N'%');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT @TotalCount AS totalCount, @Page AS page, @PageSize AS pageSize,
                    JSON_QUERY((
                        SELECT c.Id AS id,
                               c.Title AS title,
                               c.Description AS description,
                               c.Href AS href,
                               c.ImageUrl AS imageUrl,
                               c.IconName AS iconName,
                               c.AccentColor AS accentColor,
                               c.DisplayOrder AS displayOrder,
                               c.IsActive AS isActive,
                               c.CreatedOn AS createdOn,
                               c.ModifiedOn AS modifiedOn
                        FROM [dbo].[ExamCategories] c
                        WHERE (@Search IS NULL OR c.Title LIKE N'%' + @Search + N'%' OR c.Description LIKE N'%' + @Search + N'%')
                        ORDER BY c.DisplayOrder ASC, c.CreatedOn DESC
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
        -- MODE 2: UPSERT EXAM CATEGORY (INSERT / UPDATE)
        -------------------------------------------------
        IF @Mode = 2
        BEGIN
            SELECT @Id = id,
                   @Title = title,
                   @Description = description,
                   @Href = href,
                   @ImageUrl = imageUrl,
                   @IconName = iconName,
                   @AccentColor = accentColor,
                   @DisplayOrder = displayOrder,
                   @IsActive = isActive
            FROM OPENJSON(@Json) WITH (
                id INT '$.id',
                title NVARCHAR(200) '$.title',
                description NVARCHAR(500) '$.description',
                href NVARCHAR(200) '$.href',
                imageUrl NVARCHAR(1000) '$.imageUrl',
                iconName NVARCHAR(100) '$.iconName',
                accentColor NVARCHAR(200) '$.accentColor',
                displayOrder INT '$.displayOrder',
                isActive BIT '$.isActive'
            );

            IF NULLIF(LTRIM(RTRIM(@Title)), N'') IS NULL
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Category title is required.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Href = COALESCE(NULLIF(LTRIM(RTRIM(@Href)), N''), '/practice');
            SET @IconName = COALESCE(NULLIF(LTRIM(RTRIM(@IconName)), N''), 'Landmark');
            SET @DisplayOrder = ISNULL(@DisplayOrder, 0);
            SET @IsActive = ISNULL(@IsActive, 1);

            IF ISNULL(@Id, 0) > 0
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM [dbo].[ExamCategories] WHERE Id = @Id)
                BEGIN
                    SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Exam Category not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                    RETURN;
                END;

                UPDATE [dbo].[ExamCategories]
                SET Title = @Title,
                    Description = @Description,
                    Href = @Href,
                    ImageUrl = @ImageUrl,
                    IconName = @IconName,
                    AccentColor = @AccentColor,
                    DisplayOrder = @DisplayOrder,
                    IsActive = @IsActive,
                    ModifiedBy = @UserId,
                    ModifiedOn = SYSUTCDATETIME()
                WHERE Id = @Id;
            END
            ELSE
            BEGIN
                INSERT INTO [dbo].[ExamCategories] (Title, Description, Href, ImageUrl, IconName, AccentColor, DisplayOrder, IsActive, CreatedBy)
                VALUES (@Title, @Description, @Href, @ImageUrl, @IconName, @AccentColor, @DisplayOrder, @IsActive, @UserId);

                SET @Id = CONVERT(INT, SCOPE_IDENTITY());
            END;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Exam Category saved successfully.' AS [Message],
                JSON_QUERY((SELECT @Id AS id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 3: DELETE EXAM CATEGORY
        -------------------------------------------------
        IF @Mode = 3
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            DELETE FROM [dbo].[ExamCategories] WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Exam Category not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Exam Category deleted successfully.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 4: GET EXAM CATEGORY BY ID
        -------------------------------------------------
        IF @Mode = 4
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

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
                           c.DisplayOrder AS displayOrder,
                           c.IsActive AS isActive,
                           c.CreatedOn AS createdOn,
                           c.ModifiedOn AS modifiedOn
                    FROM [dbo].[ExamCategories] c
                    WHERE c.Id = @Id
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

            UPDATE [dbo].[ExamCategories]
            SET IsActive = ISNULL(@IsActive, CASE WHEN IsActive = 1 THEN 0 ELSE 1 END),
                ModifiedBy = @UserId,
                ModifiedOn = SYSUTCDATETIME()
            WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Exam Category not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Exam Category status updated.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported ExamCategories operation mode.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to process ExamCategories request.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
GO
