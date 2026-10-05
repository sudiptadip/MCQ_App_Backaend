CREATE PROCEDURE [dbo].[SpTestimonials]
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
                @StudentName NVARCHAR(150), @ExamName NVARCHAR(150), @RankOrScore NVARCHAR(100),
                @AvatarUrl NVARCHAR(1000), @Content NVARCHAR(MAX), @Rating INT,
                @DisplayOrder INT, @IsActive BIT;

        -------------------------------------------------
        -- MODE 1: GET ALL TESTIMONIALS (Admin List)
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SELECT @Page = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.page')),
                   @PageSize = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.pageSize')),
                   @Search = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.search'))), N'');

            SET @Page = CASE WHEN @Page IS NULL OR @Page < 1 THEN 1 ELSE @Page END;
            SET @PageSize = CASE WHEN @PageSize IS NULL OR @PageSize < 1 THEN 10 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;

            DECLARE @TotalCount INT;
            SELECT @TotalCount = COUNT(1) FROM [dbo].[Testimonials] t
            WHERE (@Search IS NULL OR t.StudentName LIKE N'%' + @Search + N'%' OR t.ExamName LIKE N'%' + @Search + N'%' OR t.Content LIKE N'%' + @Search + N'%');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT @TotalCount AS totalCount, @Page AS page, @PageSize AS pageSize,
                    JSON_QUERY((
                        SELECT t.Id AS id, t.StudentName AS studentName, t.ExamName AS examName,
                               t.RankOrScore AS rankOrScore, t.AvatarUrl AS avatarUrl, t.Content AS content,
                               t.Rating AS rating, t.DisplayOrder AS displayOrder, t.IsActive AS isActive,
                               t.CreatedOn AS createdOn, t.ModifiedOn AS modifiedOn
                        FROM [dbo].[Testimonials] t
                        WHERE (@Search IS NULL OR t.StudentName LIKE N'%' + @Search + N'%' OR t.ExamName LIKE N'%' + @Search + N'%' OR t.Content LIKE N'%' + @Search + N'%')
                        ORDER BY t.DisplayOrder ASC, t.CreatedOn DESC
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
        -- MODE 2: UPSERT TESTIMONIAL (Insert / Update)
        -------------------------------------------------
        IF @Mode = 2
        BEGIN
            SELECT @Id = id,
                   @StudentName = studentName,
                   @ExamName = examName,
                   @RankOrScore = rankOrScore,
                   @AvatarUrl = avatarUrl,
                   @Content = content,
                   @Rating = rating,
                   @DisplayOrder = displayOrder,
                   @IsActive = isActive
            FROM OPENJSON(@Json) WITH (
                id INT '$.id',
                studentName NVARCHAR(150) '$.studentName',
                examName NVARCHAR(150) '$.examName',
                rankOrScore NVARCHAR(100) '$.rankOrScore',
                avatarUrl NVARCHAR(1000) '$.avatarUrl',
                content NVARCHAR(MAX) '$.content',
                rating INT '$.rating',
                displayOrder INT '$.displayOrder',
                isActive BIT '$.isActive'
            );

            IF NULLIF(LTRIM(RTRIM(@StudentName)), N'') IS NULL OR NULLIF(LTRIM(RTRIM(@Content)), N'') IS NULL
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Student name and Testimonial content are required.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Rating = CASE WHEN @Rating IS NULL OR @Rating < 1 THEN 5 WHEN @Rating > 5 THEN 5 ELSE @Rating END;
            SET @DisplayOrder = ISNULL(@DisplayOrder, 0);
            SET @IsActive = ISNULL(@IsActive, 1);

            IF ISNULL(@Id, 0) > 0
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM [dbo].[Testimonials] WHERE Id = @Id)
                BEGIN
                    SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Testimonial not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                    RETURN;
                END;

                UPDATE [dbo].[Testimonials]
                SET StudentName = @StudentName,
                    ExamName = @ExamName,
                    RankOrScore = @RankOrScore,
                    AvatarUrl = @AvatarUrl,
                    Content = @Content,
                    Rating = @Rating,
                    DisplayOrder = @DisplayOrder,
                    IsActive = @IsActive,
                    ModifiedBy = @UserId,
                    ModifiedOn = SYSUTCDATETIME()
                WHERE Id = @Id;
            END
            ELSE
            BEGIN
                INSERT INTO [dbo].[Testimonials] (StudentName, ExamName, RankOrScore, AvatarUrl, Content, Rating, DisplayOrder, IsActive, CreatedBy)
                VALUES (@StudentName, @ExamName, @RankOrScore, @AvatarUrl, @Content, @Rating, @DisplayOrder, @IsActive, @UserId);

                SET @Id = CONVERT(INT, SCOPE_IDENTITY());
            END;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Testimonial saved successfully.' AS [Message],
                JSON_QUERY((SELECT @Id AS id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 3: DELETE TESTIMONIAL
        -------------------------------------------------
        IF @Mode = 3
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            DELETE FROM [dbo].[Testimonials] WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Testimonial not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Testimonial deleted successfully.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 4: GET TESTIMONIAL BY ID
        -------------------------------------------------
        IF @Mode = 4
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT t.Id AS id, t.StudentName AS studentName, t.ExamName AS examName,
                           t.RankOrScore AS rankOrScore, t.AvatarUrl AS avatarUrl, t.Content AS content,
                           t.Rating AS rating, t.DisplayOrder AS displayOrder, t.IsActive AS isActive,
                           t.CreatedOn AS createdOn, t.ModifiedOn AS modifiedOn
                    FROM [dbo].[Testimonials] t
                    WHERE t.Id = @Id
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

            UPDATE [dbo].[Testimonials]
            SET IsActive = ISNULL(@IsActive, CASE WHEN IsActive = 1 THEN 0 ELSE 1 END),
                ModifiedBy = @UserId,
                ModifiedOn = SYSUTCDATETIME()
            WHERE Id = @Id;

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Testimonial not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Testimonial status updated.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported Testimonial operation mode.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        INSERT INTO [dbo].[ErrorLogs] (ProcedureName, ErrorMessage, ErrorNumber, ErrorLine, ErrorState, ErrorSeverity, UserId)
        VALUES ('dbo.SpTestimonials', ERROR_MESSAGE(), ERROR_NUMBER(), ERROR_LINE(), ERROR_STATE(), ERROR_SEVERITY(), @UserId);

        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to process Testimonial request.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
