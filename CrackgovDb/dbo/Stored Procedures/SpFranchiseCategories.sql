CREATE PROCEDURE [dbo].[SpFranchiseCategories]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE 
        @target_franchise_id INT,
        @category_id INT
    BEGIN TRY
    -------------------------------------------------
    -- MODE 1: GET CATEGORIES AND MAPPING FOR A FRANCHISE
    -------------------------------------------------
    IF (@Mode = 1)
    BEGIN
        -- Parse target_franchise_id from Json input
        SELECT 
            @target_franchise_id = franchise_id
        FROM OPENJSON(@Json)
        WITH (
            franchise_id INT '$.franchise_id'
        );
        IF (@target_franchise_id IS NULL)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'franchise_id is required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                ISNULL(JSON_QUERY((
                    SELECT 
                        c.id,
                        c.name,
                        c.parent_id,
                        c.category_type,
                        CAST(CASE WHEN fac.franchise_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS is_assigned
                    FROM [dbo].[categories] c
                    LEFT JOIN [dbo].[franchise_assigned_categories] fac 
                        ON c.id = fac.category_id  AND fac.franchise_id = @target_franchise_id
                    Where c.parent_id is Null
                    FOR JSON PATH
                )), '[]') AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
        RETURN;
    END
    -------------------------------------------------
    -- MODE 2: TOGGLE CATEGORY ASSIGNMENT FOR A FRANCHISE
    -------------------------------------------------
    IF (@Mode = 2)
    BEGIN
        -- Parse parameters
        SELECT 
            @target_franchise_id = franchise_id,
            @category_id = category_id
        FROM OPENJSON(@Json)
        WITH (
            franchise_id INT '$.franchise_id',
            category_id INT '$.category_id'
        );
        IF (@target_franchise_id IS NULL OR @category_id IS NULL)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'franchise_id and category_id are required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        
        -- Toggle logic
        IF EXISTS (
            SELECT 1 
            FROM [dbo].[franchise_assigned_categories] 
            WHERE franchise_id = @target_franchise_id AND category_id = @category_id
        )
        BEGIN
            -- Delete the assignment
            DELETE FROM [dbo].[franchise_assigned_categories] 
            WHERE franchise_id = @target_franchise_id AND category_id = @category_id;
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Category unassigned successfully' AS [Message],
                    JSON_QUERY((
                        SELECT @target_franchise_id AS franchise_id, @category_id AS category_id, CAST(0 AS BIT) AS is_assigned
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        END
        ELSE
        BEGIN
            -- Insert the assignment
            INSERT INTO [dbo].[franchise_assigned_categories] (franchise_id, category_id)
            VALUES (@target_franchise_id, @category_id);
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Category assigned successfully' AS [Message],
                    JSON_QUERY((
                        SELECT @target_franchise_id AS franchise_id, @category_id AS category_id, CAST(1 AS BIT) AS is_assigned
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
            'SpFranchiseCategories',
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
                'Internal Server Error in SpFranchiseCategories: ' + @ErrorMessage AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
    END CATCH
END
