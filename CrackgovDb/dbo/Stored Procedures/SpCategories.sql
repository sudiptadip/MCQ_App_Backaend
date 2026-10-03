CREATE   PROCEDURE [dbo].[SpCategories]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
        @id INT,
        @name NVARCHAR(255),
        @parent_id INT,
        @category_type NVARCHAR(50)

    BEGIN TRY

    -------------------------------------------------
    -- MODE 1: GET ALL CATEGORIES
    -------------------------------------------------
    IF (@Mode = 1)
    BEGIN
        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                (
            Select [id]
                  ,[name] + ' - ' + cast(id as nvarchar(100)) as [name]
                  ,[parent_id]
                  ,[franchise_id]
                  ,[category_type] 
            from categories where franchise_id = @FranchiseId
                    FOR JSON PATH
                ) AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
        RETURN;
    END


    -------------------------------------------------
    -- MODE 2: INSERT / UPDATE
    -------------------------------------------------
    IF (@Mode = 2)
    BEGIN
        -- Parse JSON
        SELECT  
            @id = id,
            @name = name,
            @parent_id = parent_id,
            @category_type = category_type
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id',
            name NVARCHAR(255) '$.name',
            parent_id INT '$.parent_id',
            category_type NVARCHAR(50) '$.category_type'
        );

        --------------------------------------------
        -- VALIDATION
        --------------------------------------------
        IF (@name IS NULL OR @category_type IS NULL)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Name and Type are required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END

        IF(@parent_id is not null)
        Begin
            if exists (select 1 from categories where id = @parent_id and franchise_id <> @FranchiseId)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        400 AS StatusCode,
                        0 AS IsSuccess,
                        'Not access to update' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END
        END

        IF(@id is not null)
        BEGIN
            if exists (select 1 from categories where id = @id and franchise_id <> @FranchiseId)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        400 AS StatusCode,
                        0 AS IsSuccess,
                        'Not access to update' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END
        END

        --------------------------------------------
        -- UPDATE FLOW
        --------------------------------------------
        IF (@id IS NOT NULL)
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM [dbo].[categories] WHERE id = @id
            )
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'Category not found' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            UPDATE [dbo].[categories]
            SET 
                name = @name,
                parent_id = @parent_id,
                category_type = @category_type,
                franchise_id = @FranchiseId
            WHERE id = @id and franchise_id = @FranchiseId;

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Category updated successfully' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END


        --------------------------------------------
        -- INSERT FLOW
        --------------------------------------------
        INSERT INTO [dbo].[categories]
        (
            name,
            parent_id,
            category_type,
            franchise_id
        )
        VALUES
        (
            @name,
            @parent_id,
            @category_type,
            @FranchiseId
        );

        SET @id = SCOPE_IDENTITY();

        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Category created successfully' AS [Message],
                JSON_QUERY((
                    SELECT * 
                    FROM [dbo].[categories] 
                    WHERE id = @id 
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

        RETURN;
    END


    IF (@Mode = 3)
    BEGIN
        -- Parse JSON
        SELECT  
            @id = id
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id'
        );

        if not exists (select * from categories where id = @id)
        Begin
            SET @Output = JSON_QUERY((
                SELECT 
                    404 AS StatusCode,
                    0 AS IsSuccess,
                    'Category not found' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        End

        Delete from categories
        where id = @id

        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Category deleted successfully' AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));


    END


   IF (@Mode = 4)
   BEGIN
   
       SELECT @id = id
       FROM OPENJSON(@Json)
       WITH (
           id INT '$.id'
       );

       Declare @Role NVARCHAR(50) = Null;

       Select @Role = [role] from users where id = @UserId
   
       ;WITH recursivecte AS
       (
           -- Anchor
           SELECT
               c.[id],
               c.[name],
               c.[parent_id],
               c.[franchise_id],
               c.[category_type]
           FROM categories c
           WHERE c.id = @id
             AND (c.franchise_id = @FranchiseId OR c.franchise_id = 1)
   
           UNION ALL
   
           -- Children
           SELECT
               c.[id],
               c.[name],
               c.[parent_id],
               c.[franchise_id],
               c.[category_type]
           FROM categories c
           INNER JOIN recursivecte r
               ON c.parent_id = r.id
       )
   
       SELECT @Output = JSON_QUERY((
           SELECT
               200 AS StatusCode,
               1 AS IsSuccess,
               'Success' AS [Message],
   
               ISNULL((
                   SELECT
                       r.id,
   
                       r.[name]
                       + ' - '
                       + CAST(r.id AS NVARCHAR(100))
                       + iif(@Role = 'SUPER_ADMIN', ' ('
                       +  CAST(COUNT(q.id) AS NVARCHAR(20))
                       + ')', '') AS [name],
   
                       r.parent_id,
                       r.franchise_id,
                       r.category_type
   
                   FROM recursivecte r
   
                   LEFT JOIN questions q
                       ON q.category_id = r.id
   
                   GROUP BY
                       r.id,
                       r.[name],
                       r.parent_id,
                       r.franchise_id,
                       r.category_type
   
                   FOR JSON PATH
               ), '[]') AS Response
   
           FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
       ));
   
   END


    IF (@Mode = 5)
    BEGIN

        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                isnull((select [id]
                  ,[name] + ' - ' + cast(id as nvarchar(100)) as [name]
                  ,[parent_id]
                  ,[franchise_id]
                  ,[category_type] 
            from categories where 
                franchise_id = @FranchiseId and parent_id is null for json path), '[]') 
                AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));


    END


    IF(@Mode = 6)
    BEGIN
        
        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                isnull((
                Select c.id, [name] + ' - ' + cast(c.id as nvarchar(100)) as [name]
                from [dbo].[franchise_assigned_categories] fc join 
                categories c on fc.category_id = c.id
                where fc.franchise_id = @FranchiseId
                for json path), '[]')
                AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

    END


    IF (@Mode = 7)
    BEGIN

        SELECT  
            @id = id
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id'
        );

        ;With recursivecte as (
            select [id]
                  ,[name]
                  ,[parent_id]
                  ,[franchise_id]
                  ,[category_type] 
            from categories where id in (Select category_id from [dbo].[franchise_assigned_categories] where franchise_id = @franchiseId)

            union all

            select c.[id]
                  ,c.[name]
                  ,c.[parent_id]
                  ,c.[franchise_id]
                  ,c.[category_type]
            from categories c
            inner join recursivecte on c.parent_id = recursivecte.id
        )

        SELECT @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                isnull((select * from recursivecte for json path), '[]') 
                AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));


    END


    -------------------------------------------------
    -- MODE 8: GET CATEGORIES WITH QUESTION COUNTS
    -------------------------------------------------
    IF (@Mode = 8)
    BEGIN
        DECLARE @UserRole NVARCHAR(50);
        SELECT @UserRole = role FROM dbo.users WHERE id = @UserId;

        -- Combined list of categories for this franchise
        ;WITH AssignedCategories AS (
            SELECT [id]
                  ,[name]
                  ,[parent_id]
                  ,[franchise_id]
                  ,[category_type] 
            FROM [dbo].[categories] 
            WHERE id IN (SELECT category_id FROM [dbo].[franchise_assigned_categories] WHERE franchise_id = @FranchiseId)

            UNION ALL

            SELECT c.[id]
                  ,c.[name]
                  ,c.[parent_id]
                  ,c.[franchise_id]
                  ,c.[category_type]
            FROM [dbo].[categories] c
            INNER JOIN AssignedCategories ac ON c.parent_id = ac.id
        ),
        CombinedCategories AS (
            SELECT 
                c.id,
                c.name,
                c.parent_id,
                c.category_type
            FROM [dbo].[categories] c
            WHERE c.franchise_id = @FranchiseId

            UNION

            SELECT 
                ac.id,
                ac.name,
                ac.parent_id,
                ac.category_type
            FROM AssignedCategories ac
        ),
        -- Filter based on student assignment if user is a student
        StudentAssignedRecursive AS (
            SELECT c.id, c.name, c.parent_id, c.category_type
            FROM CombinedCategories c
            WHERE c.id IN (
                SELECT sac.category_id
                FROM [dbo].[student_assigned_categories] sac
                WHERE sac.student_user_id = @UserId
            )
            
            UNION ALL
            
            SELECT c.id, c.name, c.parent_id, c.category_type
            FROM CombinedCategories c
            INNER JOIN StudentAssignedRecursive sar ON c.parent_id = sar.id
        ),
        FilteredCategories AS (
            SELECT DISTINCT id, name, parent_id, category_type
            FROM StudentAssignedRecursive
            WHERE @UserRole = 'STUDENT'
            
            UNION ALL
            
            SELECT id, name, parent_id, category_type
            FROM CombinedCategories
            WHERE @UserRole <> 'STUDENT'
        ),
        -- Get direct question counts for this franchise
        DirectCounts AS (
            SELECT 
                q.category_id,
                COUNT(q.id) AS direct_count
            FROM dbo.questions q 
            join FilteredCategories fc 
            ON q.category_id = fc.id
           -- WHERE q.franchise_id = @FranchiseId
            GROUP BY q.category_id
        ),
        -- Recursively get descendants for each filtered category
        CategoryDescendants AS (
            SELECT 
                fc.id AS root_category_id,
                fc.id AS descendant_id
            FROM FilteredCategories fc
            
            UNION ALL
            
            SELECT 
                cd.root_category_id,
                c.id AS descendant_id
            FROM dbo.categories c
            INNER JOIN CategoryDescendants cd ON c.parent_id = cd.descendant_id
        ),
        -- Sum questions recursively
        RecursiveCounts AS (
            SELECT 
                cd.root_category_id AS category_id,
                SUM(ISNULL(dc.direct_count, 0)) AS total_count
            FROM CategoryDescendants cd
            LEFT JOIN DirectCounts dc ON cd.descendant_id = dc.category_id
            GROUP BY cd.root_category_id
        )
        SELECT @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                (
                    SELECT 
                        fc.id,
                        fc.name,
                        fc.parent_id,
                        fc.category_type,
                        ISNULL(dc.direct_count, 0) AS direct_question_count,
                        iif(@UserRole = 'SUPER_ADMIN' , rc.total_count, NULL) AS total_question_count
                       -- ISNULL(rc.total_count, 0) AS total_question_count
                    FROM FilteredCategories fc
                    LEFT JOIN DirectCounts dc ON fc.id = dc.category_id
                    LEFT JOIN RecursiveCounts rc ON fc.id = rc.category_id
                    WHERE ISNULL(rc.total_count, 0) > 0
                    ORDER BY fc.name
                    FOR JSON PATH
                ) AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
        RETURN;
    END

    END TRY

    -------------------------------------------------
    -- ERROR HANDLING
    -------------------------------------------------
    BEGIN CATCH

        DECLARE 
            @ErrorMessage NVARCHAR(MAX),
            @ErrorNumber INT,
            @ErrorLine INT,
            @ErrorState INT,
            @ErrorSeverity INT;

        SELECT 
            @ErrorMessage = ERROR_MESSAGE(),
            @ErrorNumber = ERROR_NUMBER(),
            @ErrorLine = ERROR_LINE(),
            @ErrorState = ERROR_STATE(),
            @ErrorSeverity = ERROR_SEVERITY();

        INSERT INTO ErrorLogs
        (
            ProcedureName,
            ErrorMessage,
            ErrorNumber,
            ErrorLine,
            ErrorState,
            ErrorSeverity,
            UserId
        )
        VALUES
        (
            'SpCategories',
            @ErrorMessage,
            @ErrorNumber,
            @ErrorLine,
            @ErrorState,
            @ErrorSeverity,
            @UserId
        );

        SET @Output = JSON_QUERY((
            SELECT 
                500 AS StatusCode,
                0 AS IsSuccess,
                @ErrorMessage AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

    END CATCH

END