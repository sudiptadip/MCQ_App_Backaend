CREATE PROCEDURE [dbo].[SpEmailTemplates]
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
        DECLARE @Id INT,
                @TemplateKey NVARCHAR(100),
                @Name NVARCHAR(200),
                @Subject NVARCHAR(500),
                @BodyHtml NVARCHAR(MAX),
                @BodyText NVARCHAR(MAX),
                @DynamicVariables NVARCHAR(MAX),
                @TargetFranchiseId INT,
                @IsActive BIT,
                @Page INT,
                @PageSize INT,
                @Search NVARCHAR(200),
                @TotalCount INT;

        -------------------------------------------------
        -- MODE 1: GET ALL EMAIL TEMPLATES (Paginated & Filtered)
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SELECT @Page = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.page')),
                   @PageSize = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.pageSize')),
                   @Search = NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json, '$.search'))), N''),
                   @TargetFranchiseId = TRY_CONVERT(INT, JSON_VALUE(@Json, '$.franchiseId'));

            SET @Page = CASE WHEN @Page IS NULL OR @Page < 1 THEN 1 ELSE @Page END;
            SET @PageSize = CASE WHEN @PageSize IS NULL OR @PageSize < 1 THEN 10 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;

            -- If caller is Franchise Admin (@FranchiseId IS NOT NULL), enforce filtering for their franchise + global templates
            IF @FranchiseId IS NOT NULL
            BEGIN
                SET @TargetFranchiseId = @FranchiseId;
            END;

            SELECT @TotalCount = COUNT(1) 
            FROM [dbo].[EmailTemplates] et
            LEFT JOIN [dbo].[franchises] f ON et.FranchiseId = f.id
            WHERE (@Search IS NULL OR et.Name LIKE N'%' + @Search + N'%' OR et.TemplateKey LIKE N'%' + @Search + N'%' OR et.Subject LIKE N'%' + @Search + N'%')
              AND (
                  @TargetFranchiseId IS NULL 
                  OR et.FranchiseId = @TargetFranchiseId 
                  OR (@FranchiseId IS NOT NULL AND et.FranchiseId IS NULL) -- Allow franchise admin to view global templates as fallback
              );

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT @TotalCount AS totalCount, @Page AS page, @PageSize AS pageSize,
                    JSON_QUERY((
                        SELECT et.Id AS id,
                               et.TemplateKey AS templateKey,
                               et.Name AS name,
                               et.Subject AS subject,
                               et.BodyHtml AS bodyHtml,
                               et.BodyText AS bodyText,
                               et.DynamicVariables AS dynamicVariables,
                               et.FranchiseId AS franchiseId,
                               f.name AS franchiseName,
                               f.code AS franchiseCode,
                               et.IsActive AS isActive,
                               et.CreatedOn AS createdOn,
                               et.ModifiedOn AS modifiedOn
                        FROM [dbo].[EmailTemplates] et
                        LEFT JOIN [dbo].[franchises] f ON et.FranchiseId = f.id
                        WHERE (@Search IS NULL OR et.Name LIKE N'%' + @Search + N'%' OR et.TemplateKey LIKE N'%' + @Search + N'%' OR et.Subject LIKE N'%' + @Search + N'%')
                          AND (
                              @TargetFranchiseId IS NULL 
                              OR et.FranchiseId = @TargetFranchiseId 
                              OR (@FranchiseId IS NOT NULL AND et.FranchiseId IS NULL)
                          )
                        ORDER BY ISNULL(et.FranchiseId, 0) DESC, et.Name ASC
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
        -- MODE 2: UPSERT EMAIL TEMPLATE (Insert / Update)
        -------------------------------------------------
        IF @Mode = 2
        BEGIN
            SELECT @Id = id,
                   @TemplateKey = NULLIF(LTRIM(RTRIM(templateKey)), N''),
                   @Name = NULLIF(LTRIM(RTRIM(name)), N''),
                   @Subject = NULLIF(LTRIM(RTRIM(subject)), N''),
                   @BodyHtml = NULLIF(LTRIM(RTRIM(bodyHtml)), N''),
                   @BodyText = NULLIF(LTRIM(RTRIM(bodyText)), N''),
                   @DynamicVariables = NULLIF(LTRIM(RTRIM(dynamicVariables)), N''),
                   @TargetFranchiseId = franchiseId,
                   @IsActive = isActive
            FROM OPENJSON(@Json) WITH (
                id INT '$.id',
                templateKey NVARCHAR(100) '$.templateKey',
                name NVARCHAR(200) '$.name',
                subject NVARCHAR(500) '$.subject',
                bodyHtml NVARCHAR(MAX) '$.bodyHtml',
                bodyText NVARCHAR(MAX) '$.bodyText',
                dynamicVariables NVARCHAR(MAX) '$.dynamicVariables',
                franchiseId INT '$.franchiseId',
                isActive BIT '$.isActive'
            );

            -- Enforce FranchiseId if caller is Franchise Admin
            IF @FranchiseId IS NOT NULL
            BEGIN
                SET @TargetFranchiseId = @FranchiseId;
            END;

            IF @TemplateKey IS NULL OR @Name IS NULL OR @Subject IS NULL OR @BodyHtml IS NULL
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Template Key, Name, Subject, and Body HTML are required.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @IsActive = ISNULL(@IsActive, 1);

            -- Check duplicate templateKey for same FranchiseId scope
            IF EXISTS (
                SELECT 1 FROM [dbo].[EmailTemplates] 
                WHERE TemplateKey = @TemplateKey 
                  AND ISNULL(FranchiseId, 0) = ISNULL(@TargetFranchiseId, 0)
                  AND (@Id IS NULL OR Id <> @Id)
            )
            BEGIN
                SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'An email template with this Template Key already exists for the selected franchise scope.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            IF ISNULL(@Id, 0) > 0
            BEGIN
                -- Allow finding existing template if it belongs to this franchise OR is a global template (FranchiseId IS NULL)
                IF NOT EXISTS (
                    SELECT 1 FROM [dbo].[EmailTemplates] 
                    WHERE Id = @Id 
                      AND (@FranchiseId IS NULL OR FranchiseId = @FranchiseId OR FranchiseId IS NULL)
                )
                BEGIN
                    SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Email template not found or permission denied.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                    RETURN;
                END;

                UPDATE [dbo].[EmailTemplates]
                SET TemplateKey = @TemplateKey,
                    Name = @Name,
                    Subject = @Subject,
                    BodyHtml = @BodyHtml,
                    BodyText = @BodyText,
                    DynamicVariables = @DynamicVariables,
                    FranchiseId = CASE WHEN @FranchiseId IS NOT NULL THEN @FranchiseId ELSE @TargetFranchiseId END,
                    IsActive = @IsActive,
                    ModifiedBy = @UserId,
                    ModifiedOn = SYSUTCDATETIME()
                WHERE Id = @Id;
            END
            ELSE
            BEGIN
                INSERT INTO [dbo].[EmailTemplates]
                    (TemplateKey, Name, Subject, BodyHtml, BodyText, DynamicVariables, FranchiseId, IsActive, CreatedBy)
                VALUES
                    (@TemplateKey, @Name, @Subject, @BodyHtml, @BodyText, @DynamicVariables, @TargetFranchiseId, @IsActive, @UserId);

                SET @Id = CONVERT(INT, SCOPE_IDENTITY());
            END;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Email template saved successfully.' AS [Message],
                JSON_QUERY((SELECT @Id AS id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 3: DELETE EMAIL TEMPLATE
        -------------------------------------------------
        IF @Mode = 3
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            DELETE FROM [dbo].[EmailTemplates] 
            WHERE Id = @Id 
              AND (@FranchiseId IS NULL OR FranchiseId = @FranchiseId OR FranchiseId IS NULL);

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Email template not found or permission denied.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Email template deleted successfully.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 4: GET EMAIL TEMPLATE BY ID
        -------------------------------------------------
        IF @Mode = 4
        BEGIN
            SELECT @Id = id FROM OPENJSON(@Json) WITH (id INT '$.id');

            IF NOT EXISTS (
                SELECT 1 FROM [dbo].[EmailTemplates] 
                WHERE Id = @Id 
                  AND (@FranchiseId IS NULL OR FranchiseId = @FranchiseId OR FranchiseId IS NULL)
            )
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Email template not found.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT et.Id AS id,
                           et.TemplateKey AS templateKey,
                           et.Name AS name,
                           et.Subject AS subject,
                           et.BodyHtml AS bodyHtml,
                           et.BodyText AS bodyText,
                           et.DynamicVariables AS dynamicVariables,
                           et.FranchiseId AS franchiseId,
                           f.name AS franchiseName,
                           f.code AS franchiseCode,
                           et.IsActive AS isActive,
                           et.CreatedOn AS createdOn,
                           et.ModifiedOn AS modifiedOn
                    FROM [dbo].[EmailTemplates] et
                    LEFT JOIN [dbo].[franchises] f ON et.FranchiseId = f.id
                    WHERE et.Id = @Id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 5: TOGGLE EMAIL TEMPLATE STATUS
        -------------------------------------------------
        IF @Mode = 5
        BEGIN
            SELECT @Id = id, @IsActive = isActive FROM OPENJSON(@Json) WITH (id INT '$.id', isActive BIT '$.isActive');

            UPDATE [dbo].[EmailTemplates]
            SET IsActive = ISNULL(@IsActive, 1),
                ModifiedBy = @UserId,
                ModifiedOn = SYSUTCDATETIME()
            WHERE Id = @Id 
              AND (@FranchiseId IS NULL OR FranchiseId = @FranchiseId OR FranchiseId IS NULL);

            IF @@ROWCOUNT = 0
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Email template not found or permission denied.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            SET @Output = (SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Email template status updated successfully.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 6: GET TEMPLATE BY KEY & FRANCHISE ID
        -------------------------------------------------
        IF @Mode = 6
        BEGIN
            SELECT @TemplateKey = NULLIF(LTRIM(RTRIM(templateKey)), N''),
                   @TargetFranchiseId = franchiseId
            FROM OPENJSON(@Json) WITH (
                templateKey NVARCHAR(100) '$.templateKey',
                franchiseId INT '$.franchiseId'
            );

            IF @FranchiseId IS NOT NULL
            BEGIN
                SET @TargetFranchiseId = @FranchiseId;
            END;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT TOP 1 
                           et.Id AS id,
                           et.TemplateKey AS templateKey,
                           et.Name AS name,
                           et.Subject AS subject,
                           et.BodyHtml AS bodyHtml,
                           et.BodyText AS bodyText,
                           et.DynamicVariables AS dynamicVariables,
                           et.FranchiseId AS franchiseId,
                           et.IsActive AS isActive
                    FROM [dbo].[EmailTemplates] et
                    WHERE et.TemplateKey = @TemplateKey
                      AND et.IsActive = 1
                      AND (@TargetFranchiseId IS NULL OR et.FranchiseId = @TargetFranchiseId OR et.FranchiseId IS NULL)
                    ORDER BY CASE WHEN et.FranchiseId = @TargetFranchiseId THEN 0 ELSE 1 END
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 7: RENDER DYNAMIC TEMPLATE WITH SQL
        -------------------------------------------------
        IF @Mode = 7
        BEGIN
            SELECT @TemplateKey = NULLIF(LTRIM(RTRIM(templateKey)), N''),
                   @TargetFranchiseId = franchiseId
            FROM OPENJSON(@Json) WITH (
                templateKey NVARCHAR(100) '$.templateKey',
                franchiseId INT '$.franchiseId'
            );

            IF @FranchiseId IS NOT NULL
            BEGIN
                SET @TargetFranchiseId = @FranchiseId;
            END;

            -- Find best matching active email template (franchise-specific first, fallback to global)
            SELECT TOP 1 
                   @Subject = et.Subject,
                   @BodyHtml = et.BodyHtml,
                   @BodyText = et.BodyText
            FROM [dbo].[EmailTemplates] et
            WHERE et.TemplateKey = @TemplateKey
              AND et.IsActive = 1
              AND (@TargetFranchiseId IS NULL OR et.FranchiseId = @TargetFranchiseId OR et.FranchiseId IS NULL)
            ORDER BY CASE WHEN et.FranchiseId = @TargetFranchiseId THEN 0 ELSE 1 END;

            IF @Subject IS NULL OR @BodyHtml IS NULL
            BEGIN
                SET @Output = (SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Email template not found or inactive.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
                RETURN;
            END;

            -- Perform SQL Dynamic String Substitutions from replaceValues object
            DECLARE @ReplaceValuesJson NVARCHAR(MAX) = JSON_QUERY(@Json, '$.replaceValues');
            IF @ReplaceValuesJson IS NOT NULL
            BEGIN
                DECLARE @ParamKey NVARCHAR(200), @ParamValue NVARCHAR(MAX);
                DECLARE replace_cursor CURSOR LOCAL FOR 
                SELECT [key], [value] 
                FROM OPENJSON(@ReplaceValuesJson);

                OPEN replace_cursor;
                FETCH NEXT FROM replace_cursor INTO @ParamKey, @ParamValue;

                WHILE @@FETCH_STATUS = 0
                BEGIN
                    IF @ParamKey IS NOT NULL
                    BEGIN
                        SET @Subject = REPLACE(@Subject, @ParamKey, ISNULL(@ParamValue, ''));
                        SET @BodyHtml = REPLACE(@BodyHtml, @ParamKey, ISNULL(@ParamValue, ''));
                        IF @BodyText IS NOT NULL
                        BEGIN
                            SET @BodyText = REPLACE(@BodyText, @ParamKey, ISNULL(@ParamValue, ''));
                        END;
                    END;
                    FETCH NEXT FROM replace_cursor INTO @ParamKey, @ParamValue;
                END;

                CLOSE replace_cursor;
                DEALLOCATE replace_cursor;
            END;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Email template rendered successfully' AS [Message],
                JSON_QUERY((
                    SELECT @TemplateKey AS templateKey,
                           @Subject AS renderedSubject,
                           @BodyHtml AS renderedBodyHtml,
                           @BodyText AS renderedBodyText
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Invalid Mode specified.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        RETURN;

    END TRY
    BEGIN CATCH
        SET @Output = (
            SELECT 500 AS StatusCode, 
                   0 AS IsSuccess, 
                   ERROR_MESSAGE() AS [Message] 
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );
    END CATCH;
END;