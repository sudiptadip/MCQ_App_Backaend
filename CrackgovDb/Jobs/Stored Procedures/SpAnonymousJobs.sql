CREATE PROCEDURE [Jobs].[SpAnonymousJobs]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        DECLARE @Page INT, @PageSize INT, @CategoryId INT, @Search NVARCHAR(200),
            @Id INT, @Slug NVARCHAR(220);

        IF @Mode = 1
        BEGIN
            SELECT @Page = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.page')),
                   @PageSize = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.pageSize')),
                   @CategoryId = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.categoryId')),
                   @Search = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.search'))), '');

            SET @Page = CASE WHEN @Page IS NULL OR @Page < 1 THEN 1 ELSE @Page END;
            SET @PageSize = CASE WHEN @PageSize IS NULL OR @PageSize < 1 THEN 12
                                 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;

            DECLARE @TotalCount INT;
            SELECT @TotalCount = COUNT(1)
            FROM [Jobs].[JobPosts] AS p
            INNER JOIN [Jobs].[JobCategories] AS c ON c.Id = p.CategoryId
            WHERE p.Status = 'Published'
              AND (p.ApplicationDeadline IS NULL OR p.ApplicationDeadline >= CAST(GETDATE() AS DATE))
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@Search IS NULL OR p.Title LIKE '%' + @Search + '%'
                   OR p.Department LIKE '%' + @Search + '%'
                   OR c.Name LIKE '%' + @Search + '%'
                   OR p.Location LIKE '%' + @Search + '%'
                   OR p.Slug LIKE '%' + @Search + '%');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                    JSON_QUERY((
                        SELECT @TotalCount AS totalCount, @Page AS page, @PageSize AS pageSize,
                            JSON_QUERY((
                                SELECT Id AS id, Name AS name
                                FROM [Jobs].[JobCategories]
                                WHERE IsActive = 1
                                ORDER BY Name
                                FOR JSON PATH
                            )) AS categories,
                            JSON_QUERY((
                                SELECT p.Id AS id, p.Title AS title, p.Department AS department,
                                    p.CategoryId AS categoryId, c.Name AS categoryName,
                                    p.EmploymentType AS employmentType, p.Location AS location,
                                    p.Vacancies AS vacancies, p.SalaryText AS salaryText,
                                    p.Qualification AS qualification, p.AgeLimit AS ageLimit,
                                    p.ApplicationStartDate AS applicationStartDate,
                                    p.ApplicationDeadline AS applicationDeadline,
                                    p.[Description] AS [description], p.Responsibilities AS responsibilities,
                                    p.Eligibility AS eligibility, p.ApplicationUrl AS applicationUrl,
                                    p.NotificationUrl AS notificationUrl, p.ReferenceNumber AS referenceNumber,
                                    p.[Status] AS [status], p.IsFeatured AS isFeatured, p.Slug AS slug,
                                    p.PageTitle AS pageTitle, p.MetaTitle AS metaTitle,
                                    p.MetaDescription AS metaDescription, p.MetaKeywords AS metaKeywords,
                                    p.CreatedOn AS createdOn
                                FROM [Jobs].[JobPosts] AS p
                                INNER JOIN [Jobs].[JobCategories] AS c ON c.Id = p.CategoryId
                                WHERE p.Status = 'Published'
                                  AND (p.ApplicationDeadline IS NULL OR p.ApplicationDeadline >= CAST(GETDATE() AS DATE))
                                  AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
                                  AND (@Search IS NULL OR p.Title LIKE '%' + @Search + '%'
                                       OR p.Department LIKE '%' + @Search + '%'
                                       OR c.Name LIKE '%' + @Search + '%'
                                       OR p.Location LIKE '%' + @Search + '%'
                                       OR p.Slug LIKE '%' + @Search + '%')
                                ORDER BY p.IsFeatured DESC,
                                    COALESCE(p.ApplicationDeadline, CONVERT(DATE, '99991231')) ASC,
                                    p.CreatedOn DESC
                                OFFSET (@Page - 1) * @PageSize ROWS
                                FETCH NEXT @PageSize ROWS ONLY
                                FOR JSON PATH
                            )) AS items
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        IF @Mode = 4
        BEGIN
            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                    JSON_QUERY((
                        SELECT Id AS id, Name AS name
                        FROM [Jobs].[JobCategories]
                        WHERE IsActive = 1
                        ORDER BY Name
                        FOR JSON PATH
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        IF @Mode = 6
        BEGIN
            SELECT @Id = id, @Slug = slug
            FROM OPENJSON(@Json)
            WITH (id INT '$.id', slug NVARCHAR(220) '$.slug');

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                    JSON_QUERY((
                        SELECT p.Id AS id, p.Title AS title, p.Department AS department,
                            p.CategoryId AS categoryId, c.Name AS categoryName,
                            p.EmploymentType AS employmentType, p.Location AS location,
                            p.Vacancies AS vacancies, p.SalaryText AS salaryText,
                            p.Qualification AS qualification, p.AgeLimit AS ageLimit,
                            p.ApplicationStartDate AS applicationStartDate,
                            p.ApplicationDeadline AS applicationDeadline,
                            p.[Description] AS [description], p.Responsibilities AS responsibilities,
                            p.Eligibility AS eligibility, p.ApplicationUrl AS applicationUrl,
                            p.NotificationUrl AS notificationUrl, p.ReferenceNumber AS referenceNumber,
                            p.[Status] AS [status], p.IsFeatured AS isFeatured, p.Slug AS slug,
                            p.PageTitle AS pageTitle, p.MetaTitle AS metaTitle,
                            p.MetaDescription AS metaDescription, p.MetaKeywords AS metaKeywords,
                            p.CreatedOn AS createdOn
                        FROM [Jobs].[JobPosts] AS p
                        INNER JOIN [Jobs].[JobCategories] AS c ON c.Id = p.CategoryId
                        WHERE ((@Slug IS NOT NULL AND p.Slug = @Slug)
                               OR (@Slug IS NULL AND p.Id = @Id))
                          AND p.Status = 'Published'
                          AND (p.ApplicationDeadline IS NULL OR p.ApplicationDeadline >= CAST(GETDATE() AS DATE))
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (
            SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported public job operation.' AS [Message]
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(MAX) = ERROR_MESSAGE(),
            @ErrorNumber INT = ERROR_NUMBER(),
            @ErrorLine INT = ERROR_LINE(),
            @ErrorState INT = ERROR_STATE(),
            @ErrorSeverity INT = ERROR_SEVERITY();

        INSERT INTO [dbo].[ErrorLogs]
            (ProcedureName, ErrorMessage, ErrorNumber, ErrorLine, ErrorState, ErrorSeverity)
        VALUES
            ('Jobs.SpAnonymousJobs', @ErrorMessage, @ErrorNumber, @ErrorLine, @ErrorState, @ErrorSeverity);

        SET @Output = (
            SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to process public job request.' AS [Message]
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );
    END CATCH;
END;
