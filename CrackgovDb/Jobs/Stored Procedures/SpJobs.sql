CREATE PROCEDURE [Jobs].[SpJobs]
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
        DECLARE @Id INT, @CategoryId INT, @Page INT, @PageSize INT, @Search NVARCHAR(200),
            @Name NVARCHAR(100), @Title NVARCHAR(200), @Department NVARCHAR(200),
            @EmploymentType NVARCHAR(40), @Location NVARCHAR(200), @Vacancies INT,
            @SalaryText NVARCHAR(200), @Qualification NVARCHAR(1000), @AgeLimit NVARCHAR(200),
            @ApplicationStartDate DATE, @ApplicationDeadline DATE, @Description NVARCHAR(MAX),
            @Responsibilities NVARCHAR(MAX), @Eligibility NVARCHAR(MAX), @ApplicationUrl NVARCHAR(1000),
            @NotificationUrl NVARCHAR(1000), @ReferenceNumber NVARCHAR(100), @Status NVARCHAR(20),
            @IsFeatured BIT, @Slug NVARCHAR(220), @PageTitle NVARCHAR(200),
            @MetaTitle NVARCHAR(200), @MetaDescription NVARCHAR(320), @MetaKeywords NVARCHAR(500);

        IF @Mode = 1
        BEGIN
            SELECT @Page = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.page')),
                   @PageSize = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.pageSize')),
                   @CategoryId = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.categoryId')),
                   @Search = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.search'))), '');
            SET @Page = CASE WHEN @Page IS NULL OR @Page < 1 THEN 1 ELSE @Page END;
            SET @PageSize = CASE WHEN @PageSize IS NULL OR @PageSize < 1 THEN 12 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;

            DECLARE @TotalCount INT;
            SELECT @TotalCount = COUNT(1)
            FROM [Jobs].[JobPosts] p INNER JOIN [Jobs].[JobCategories] c ON c.Id = p.CategoryId
            WHERE (@UserId IS NOT NULL OR (p.Status = 'Published' AND (p.ApplicationDeadline IS NULL OR p.ApplicationDeadline >= CAST(GETDATE() AS DATE))))
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@Search IS NULL OR p.Title LIKE '%' + @Search + '%' OR p.Department LIKE '%' + @Search + '%' OR c.Name LIKE '%' + @Search + '%' OR p.Location LIKE '%' + @Search + '%');

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((SELECT @TotalCount AS totalCount, @Page AS page, @PageSize AS pageSize,
                    JSON_QUERY((SELECT Id AS id, Name AS name FROM [Jobs].[JobCategories] WHERE IsActive=1 ORDER BY Name FOR JSON PATH)) AS categories,
                    JSON_QUERY((SELECT p.Id AS id, p.Title AS title, p.Department AS department,
                        p.CategoryId AS categoryId, c.Name AS categoryName, p.EmploymentType AS employmentType,
                        p.Location AS location, p.Vacancies AS vacancies, p.SalaryText AS salaryText,
                        p.Qualification AS qualification, p.AgeLimit AS ageLimit,
                        p.ApplicationStartDate AS applicationStartDate, p.ApplicationDeadline AS applicationDeadline,
                        p.Description AS [description], p.Responsibilities AS responsibilities, p.Eligibility AS eligibility,
                        p.ApplicationUrl AS applicationUrl, p.NotificationUrl AS notificationUrl,
                        p.ReferenceNumber AS referenceNumber, p.Status AS [status], p.IsFeatured AS isFeatured,
                        p.Slug AS slug, p.PageTitle AS pageTitle, p.MetaTitle AS metaTitle,
                        p.MetaDescription AS metaDescription, p.MetaKeywords AS metaKeywords,
                        p.CreatedOn AS createdOn
                     FROM [Jobs].[JobPosts] p INNER JOIN [Jobs].[JobCategories] c ON c.Id = p.CategoryId
                     WHERE (@UserId IS NOT NULL OR (p.Status = 'Published' AND (p.ApplicationDeadline IS NULL OR p.ApplicationDeadline >= CAST(GETDATE() AS DATE))))
                       AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
                       AND (@Search IS NULL OR p.Title LIKE '%' + @Search + '%' OR p.Department LIKE '%' + @Search + '%' OR c.Name LIKE '%' + @Search + '%' OR p.Location LIKE '%' + @Search + '%')
                     ORDER BY p.IsFeatured DESC, COALESCE(p.ApplicationDeadline, CONVERT(DATE,'99991231')) ASC, p.CreatedOn DESC
                     OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY FOR JSON PATH)) AS items
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 2
        BEGIN
            SELECT @Id = id, @Title = title, @Department = department, @CategoryId = categoryId,
                @EmploymentType = employmentType, @Location = location, @Vacancies = vacancies,
                @SalaryText = salaryText, @Qualification = qualification, @AgeLimit = ageLimit,
                @ApplicationStartDate = applicationStartDate, @ApplicationDeadline = applicationDeadline,
                @Description = [description], @Responsibilities = responsibilities, @Eligibility = eligibility,
                @ApplicationUrl = applicationUrl, @NotificationUrl = notificationUrl,
                @ReferenceNumber = referenceNumber, @Status = [status], @IsFeatured = isFeatured,
                @Slug = slug, @PageTitle = pageTitle, @MetaTitle = metaTitle,
                @MetaDescription = metaDescription, @MetaKeywords = metaKeywords
            FROM OPENJSON(@Json) WITH (
                id INT '$.id', title NVARCHAR(200) '$.title', department NVARCHAR(200) '$.department',
                categoryId INT '$.categoryId', employmentType NVARCHAR(40) '$.employmentType',
                location NVARCHAR(200) '$.location', vacancies INT '$.vacancies', salaryText NVARCHAR(200) '$.salaryText',
                qualification NVARCHAR(1000) '$.qualification', ageLimit NVARCHAR(200) '$.ageLimit',
                applicationStartDate DATE '$.applicationStartDate', applicationDeadline DATE '$.applicationDeadline',
                [description] NVARCHAR(MAX) '$.description', responsibilities NVARCHAR(MAX) '$.responsibilities',
                eligibility NVARCHAR(MAX) '$.eligibility', applicationUrl NVARCHAR(1000) '$.applicationUrl',
                notificationUrl NVARCHAR(1000) '$.notificationUrl', referenceNumber NVARCHAR(100) '$.referenceNumber',
                [status] NVARCHAR(20) '$.status', isFeatured BIT '$.isFeatured',
                slug NVARCHAR(220) '$.slug', pageTitle NVARCHAR(200) '$.pageTitle',
                metaTitle NVARCHAR(200) '$.metaTitle', metaDescription NVARCHAR(320) '$.metaDescription',
                metaKeywords NVARCHAR(500) '$.metaKeywords');

            IF NULLIF(LTRIM(RTRIM(@Title)), '') IS NULL OR NULLIF(LTRIM(RTRIM(@Department)), '') IS NULL
               OR @CategoryId IS NULL OR NULLIF(LTRIM(RTRIM(@EmploymentType)), '') IS NULL
               OR NULLIF(LTRIM(RTRIM(@Location)), '') IS NULL OR ISNULL(@Vacancies, 0) < 1
               OR NULLIF(LTRIM(RTRIM(@Qualification)), '') IS NULL OR NULLIF(LTRIM(RTRIM(@Description)), '') IS NULL
               OR ISNULL(@Status, '') NOT IN ('Draft','Published','Closed')
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Complete all required job fields and choose a valid status.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;
            IF NOT EXISTS (SELECT 1 FROM [Jobs].[JobCategories] WHERE Id = @CategoryId AND IsActive = 1)
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Select an active job category.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;
            IF @ApplicationStartDate IS NOT NULL AND @ApplicationDeadline IS NOT NULL AND @ApplicationStartDate > @ApplicationDeadline
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Application start date must be before the deadline.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Slug = [Jobs].[CreateSlug](COALESCE(NULLIF(LTRIM(RTRIM(@Slug)), ''), @Title));
            IF @Slug = N'' SET @Slug = N'job';
            SET @PageTitle = COALESCE(NULLIF(LTRIM(RTRIM(@PageTitle)), ''), @Title);
            SET @MetaTitle = COALESCE(NULLIF(LTRIM(RTRIM(@MetaTitle)), ''), @PageTitle);
            SET @MetaDescription = COALESCE(NULLIF(LTRIM(RTRIM(@MetaDescription)), ''), LEFT(@Description, 320));
            SET @MetaKeywords = NULLIF(LTRIM(RTRIM(@MetaKeywords)), '');

            IF ISNULL(@Id, 0) > 0
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM [Jobs].[JobPosts] WHERE Id = @Id)
                BEGIN
                    SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Job post not found.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                    RETURN;
                END;

                IF EXISTS (SELECT 1 FROM [Jobs].[JobPosts] WHERE Slug = @Slug AND Id <> @Id)
                    SET @Slug = LEFT(@Slug, 208) + N'-' + CONVERT(NVARCHAR(10), @Id);

                UPDATE [Jobs].[JobPosts] SET Title=@Title, Department=@Department, CategoryId=@CategoryId,
                    EmploymentType=@EmploymentType, Location=@Location, Vacancies=@Vacancies, SalaryText=@SalaryText,
                    Qualification=@Qualification, AgeLimit=@AgeLimit, ApplicationStartDate=@ApplicationStartDate,
                    ApplicationDeadline=@ApplicationDeadline, [Description]=@Description, Responsibilities=@Responsibilities,
                    Eligibility=@Eligibility, ApplicationUrl=@ApplicationUrl, NotificationUrl=@NotificationUrl,
                    ReferenceNumber=@ReferenceNumber, [Status]=@Status, IsFeatured=ISNULL(@IsFeatured,0),
                    Slug=@Slug, PageTitle=@PageTitle, MetaTitle=@MetaTitle,
                    MetaDescription=@MetaDescription, MetaKeywords=@MetaKeywords,
                    ModifiedBy=@UserId, ModifiedOn=SYSUTCDATETIME()
                WHERE Id=@Id;
            END
            ELSE
            BEGIN
                BEGIN TRANSACTION;
                INSERT INTO [Jobs].[JobPosts] (Title,Department,CategoryId,EmploymentType,Location,Vacancies,SalaryText,
                    Qualification,AgeLimit,ApplicationStartDate,ApplicationDeadline,[Description],Responsibilities,Eligibility,
                    ApplicationUrl,NotificationUrl,ReferenceNumber,[Status],IsFeatured,Slug,PageTitle,MetaTitle,
                    MetaDescription,MetaKeywords,CreatedBy)
                VALUES (@Title,@Department,@CategoryId,@EmploymentType,@Location,@Vacancies,@SalaryText,
                    @Qualification,@AgeLimit,@ApplicationStartDate,@ApplicationDeadline,@Description,@Responsibilities,@Eligibility,
                    @ApplicationUrl,@NotificationUrl,@ReferenceNumber,@Status,ISNULL(@IsFeatured,0),
                    N'pending-' + REPLACE(CONVERT(NVARCHAR(36), NEWID()), N'-', N''), @PageTitle, @MetaTitle,
                    @MetaDescription, @MetaKeywords, @UserId);
                SET @Id = CONVERT(INT, SCOPE_IDENTITY());
                IF EXISTS (SELECT 1 FROM [Jobs].[JobPosts] WHERE Slug = @Slug AND Id <> @Id)
                    SET @Slug = LEFT(@Slug, 208) + N'-' + CONVERT(NVARCHAR(10), @Id);
                UPDATE [Jobs].[JobPosts] SET Slug=@Slug WHERE Id=@Id;
                COMMIT TRANSACTION;
            END;
            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Job post saved.' AS [Message],
                JSON_QUERY((SELECT @Id AS id, @Slug AS slug FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 3
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');
            IF NOT EXISTS (SELECT 1 FROM [Jobs].[JobPosts] WHERE Id=@Id)
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Job post not found.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;
            UPDATE [Jobs].[JobPosts] SET [Status]='Closed', IsFeatured=0, ModifiedBy=@UserId, ModifiedOn=SYSUTCDATETIME() WHERE Id=@Id;
            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Job post closed.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 4
        BEGIN
            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((SELECT Id AS id, Name AS name FROM [Jobs].[JobCategories] WHERE IsActive=1 ORDER BY Name FOR JSON PATH)) AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 6
        BEGIN
            SELECT @Id = id, @Slug = slug FROM OPENJSON(@Json) WITH (id INT '$.id', slug NVARCHAR(220) '$.slug');
            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((SELECT p.Id AS id, p.Title AS title, p.Department AS department, p.CategoryId AS categoryId,
                    c.Name AS categoryName, p.EmploymentType AS employmentType, p.Location AS location, p.Vacancies AS vacancies,
                    p.SalaryText AS salaryText, p.Qualification AS qualification, p.AgeLimit AS ageLimit,
                    p.ApplicationStartDate AS applicationStartDate, p.ApplicationDeadline AS applicationDeadline,
                    p.[Description] AS [description], p.Responsibilities AS responsibilities, p.Eligibility AS eligibility,
                    p.ApplicationUrl AS applicationUrl, p.NotificationUrl AS notificationUrl, p.ReferenceNumber AS referenceNumber,
                    p.[Status] AS [status], p.IsFeatured AS isFeatured, p.Slug AS slug, p.PageTitle AS pageTitle,
                    p.MetaTitle AS metaTitle, p.MetaDescription AS metaDescription, p.MetaKeywords AS metaKeywords,
                    p.CreatedOn AS createdOn
                    FROM [Jobs].[JobPosts] p INNER JOIN [Jobs].[JobCategories] c ON c.Id=p.CategoryId
                    WHERE ((@Slug IS NOT NULL AND p.Slug=@Slug) OR (@Slug IS NULL AND p.Id=@Id))
                      AND p.[Status]='Published' AND (p.ApplicationDeadline IS NULL OR p.ApplicationDeadline >= CAST(GETDATE() AS DATE))
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 7
        BEGIN
            SELECT @Name = NULLIF(LTRIM(RTRIM(name)), '') FROM OPENJSON(@Json) WITH (name NVARCHAR(100) '$.name');
            IF @Name IS NULL
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Category name is required.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;
            IF EXISTS (SELECT 1 FROM [Jobs].[JobCategories] WHERE LOWER(Name)=LOWER(@Name))
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'This job category already exists.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;
            INSERT INTO [Jobs].[JobCategories] (Name,CreatedBy) VALUES (@Name,@UserId);
            SET @Id = CONVERT(INT,SCOPE_IDENTITY());
            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Job category added.' AS [Message], JSON_QUERY((SELECT @Id AS id, @Name AS name FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 8
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');
            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((SELECT p.Id AS id, p.Title AS title, p.Department AS department,
                    p.CategoryId AS categoryId, c.Name AS categoryName, p.EmploymentType AS employmentType,
                    p.Location AS location, p.Vacancies AS vacancies, p.SalaryText AS salaryText,
                    p.Qualification AS qualification, p.AgeLimit AS ageLimit,
                    p.ApplicationStartDate AS applicationStartDate, p.ApplicationDeadline AS applicationDeadline,
                    p.[Description] AS [description], p.Responsibilities AS responsibilities, p.Eligibility AS eligibility,
                    p.ApplicationUrl AS applicationUrl, p.NotificationUrl AS notificationUrl,
                    p.ReferenceNumber AS referenceNumber, p.[Status] AS [status], p.IsFeatured AS isFeatured,
                    p.Slug AS slug, p.PageTitle AS pageTitle, p.MetaTitle AS metaTitle,
                    p.MetaDescription AS metaDescription, p.MetaKeywords AS metaKeywords,
                    p.CreatedOn AS createdOn
                    FROM [Jobs].[JobPosts] p INNER JOIN [Jobs].[JobCategories] c ON c.Id=p.CategoryId
                    WHERE p.Id=@Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported job operation.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        INSERT INTO [dbo].[ErrorLogs] (ProcedureName, ErrorMessage, ErrorNumber, ErrorLine, ErrorState, ErrorSeverity, UserId)
        VALUES ('Jobs.SpJobs', ERROR_MESSAGE(), ERROR_NUMBER(), ERROR_LINE(), ERROR_STATE(), ERROR_SEVERITY(), @UserId);
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to process job request.' AS [Message], NULL AS Response FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
