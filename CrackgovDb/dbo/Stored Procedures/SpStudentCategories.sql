CREATE PROCEDURE [dbo].[SpStudentCategories]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE 
        @student_user_id INT,
        @category_id INT
    BEGIN TRY
    -------------------------------------------------
    -- MODE 1: GET CATEGORIES AND MAPPING FOR A STUDENT
    -------------------------------------------------
        -------------------------------------------------
    -- MODE 1: GET CATEGORIES AND MAPPING FOR A STUDENT
    -------------------------------------------------
    IF (@Mode = 1)
    BEGIN
        -- Parse student_user_id from Json input
        SELECT 
            @student_user_id = student_user_id
        FROM OPENJSON(@Json)
        WITH (
            student_user_id INT '$.student_user_id'
        );

        IF (@student_user_id IS NULL)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'student_user_id is required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END

        -- Recursive CTE to fetch all categories assigned to the franchise and their children
        ;WITH recursivecte AS (
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
            INNER JOIN recursivecte ON c.parent_id = recursivecte.id
        ),
        combined_categories AS (
            -- 1. Own categories (created by/for this franchise)
            SELECT 
                c.id,
                c.name,
                c.parent_id,
                c.category_type,
                CAST(CASE WHEN sac.student_user_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS is_assigned,
                CAST(0 AS BIT) AS is_franchise_assigned
            FROM [dbo].[categories] c
            LEFT JOIN [dbo].[student_assigned_categories] sac 
                ON c.id = sac.category_id AND sac.student_user_id = @student_user_id
            WHERE c.franchise_id = @FranchiseId

            UNION ALL

            -- 2. System categories assigned to this franchise
            SELECT 
                r.id,
                r.name,
                r.parent_id,
                'assigned category' as category_type,
                CAST(CASE WHEN sac.student_user_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS is_assigned,
                CAST(1 AS BIT) AS is_franchise_assigned
            FROM recursivecte r
            LEFT JOIN [dbo].[student_assigned_categories] sac 
                ON r.id = sac.category_id AND sac.student_user_id = @student_user_id
            -- Avoid any potential duplicates if franchise_id overlap exists
            WHERE r.id NOT IN (SELECT id FROM [dbo].[categories] WHERE franchise_id = @FranchiseId)
        )
        SELECT @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                ISNULL(JSON_QUERY((
                    SELECT 
                        id,
                        name,
                        parent_id,
                        category_type,
                        is_assigned,
                        is_franchise_assigned
                    FROM combined_categories order by name
                    FOR JSON PATH
                )), '[]') AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
        RETURN;
    END
    -------------------------------------------------
    -- MODE 2: TOGGLE CATEGORY ASSIGNMENT FOR A STUDENT
    -------------------------------------------------
    IF (@Mode = 2)
    BEGIN
        -- Parse parameters
        SELECT 
            @student_user_id = student_user_id,
            @category_id = category_id
        FROM OPENJSON(@Json)
        WITH (
            student_user_id INT '$.student_user_id',
            category_id INT '$.category_id'
        );
        IF (@student_user_id IS NULL OR @category_id IS NULL)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'student_user_id and category_id are required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- Check if student belongs to the same franchise
        -- (This is an extra security check since FranchiseId is retrieved from JWT)
        IF NOT EXISTS (
            SELECT 1 FROM [dbo].[users] 
            WHERE id = @student_user_id AND franchise_id = @FranchiseId
        )
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    403 AS StatusCode,
                    0 AS IsSuccess,
                    'Unauthorized operation on student of another franchise' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- Toggle logic
        IF EXISTS (
            SELECT 1 
            FROM [dbo].[student_assigned_categories] 
            WHERE student_user_id = @student_user_id AND category_id = @category_id
        )
        BEGIN
            -- Delete the assignment
            DELETE FROM [dbo].[student_assigned_categories] 
            WHERE student_user_id = @student_user_id AND category_id = @category_id;
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Category unassigned successfully' AS [Message],
                    JSON_QUERY((
                        SELECT @student_user_id AS student_user_id, @category_id AS category_id, CAST(0 AS BIT) AS is_assigned
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        END
        ELSE
        BEGIN
            -- Insert the assignment
            INSERT INTO [dbo].[student_assigned_categories] (student_user_id, category_id)
            VALUES (@student_user_id, @category_id);
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Category assigned successfully' AS [Message],
                    JSON_QUERY((
                        SELECT @student_user_id AS student_user_id, @category_id AS category_id, CAST(1 AS BIT) AS is_assigned
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        END
        RETURN;
    END
    END TRY
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
        INSERT INTO ErrorLogs (
            ProcedureName,
            ErrorMessage,
            ErrorNumber,
            ErrorLine,
            ErrorState,
            ErrorSeverity,
            UserId
        )
        VALUES (
            'SpStudentCategories',
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
                'Internal Server Error in SpStudentCategories: ' + @ErrorMessage AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
    END CATCH
END
