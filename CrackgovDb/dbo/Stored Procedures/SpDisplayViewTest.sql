
CREATE PROCEDURE [dbo].[SpDisplayViewTest]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
        @id INT,
        @display_view_id INT,
        @test_id INT;

    BEGIN TRY

    -------------------------------------------------
    -- MODE 1 : INSERT / UPDATE
    -------------------------------------------------
    IF (@Mode = 1)
    BEGIN
        
        SELECT  
            @id = id,
            @display_view_id = display_view_id,
            @test_id = test_id
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id',
            display_view_id INT '$.display_view_id',
            test_id INT '$.test_id'
        );

        -------------------------------------------------
        -- VALIDATION
        -------------------------------------------------

        IF (@display_view_id IS NULL)
        BEGIN

            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Display View Id is required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        IF (@test_id IS NULL)
        BEGIN

            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Test Id is required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        -------------------------------------------------
        -- DUPLICATE VALIDATION
        -------------------------------------------------

        IF EXISTS
        (
            SELECT 1
            FROM dbo.display_view_test
            WHERE display_view_id = @display_view_id
            AND test_id = @test_id
            AND (@id IS NULL OR id <> @id)
        )
        BEGIN

            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Same Test already exists for this Display View' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        -------------------------------------------------
        -- UPDATE
        -------------------------------------------------

        IF (@id IS NOT NULL)
        BEGIN

            IF NOT EXISTS
            (
                SELECT 1 
                FROM dbo.display_view_test
                WHERE id = @id
            )
            BEGIN

                SET @Output = JSON_QUERY((
                    SELECT 
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'Record not found' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));

                RETURN;
            END

            UPDATE dbo.display_view_test
            SET 
                display_view_id = @display_view_id,
                test_id = @test_id
            WHERE id = @id;

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Display View Test Updated Successfully' AS [Message],
                    @id AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;

        END
        ELSE
        BEGIN

            INSERT INTO dbo.display_view_test
            (
                display_view_id,
                test_id
            )
            VALUES
            (
                @display_view_id,
                @test_id
            );

            SET @id = SCOPE_IDENTITY();

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Display View Test Created Successfully' AS [Message],
                    @id AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;

        END
    END

    -------------------------------------------------
    -- MODE 2 : DELETE
    -------------------------------------------------
    IF (@Mode = 2)
    BEGIN

        SELECT  
            @id = id
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id'
        );

        IF (@id IS NULL)
        BEGIN

            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Id is required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.display_view_test
            WHERE id = @id
        )
        BEGIN

            SET @Output = JSON_QUERY((
                SELECT 
                    404 AS StatusCode,
                    0 AS IsSuccess,
                    'Record not found' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        DELETE FROM dbo.display_view_test
        WHERE id = @id;

        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Display View Test Deleted Successfully' AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

        RETURN;
    END

    -------------------------------------------------
    -- MODE 3 : GET ALL
    -------------------------------------------------
    --IF (@Mode = 3)
    --BEGIN

    --    SET @Output = JSON_QUERY((
    --        SELECT 
    --            200 AS StatusCode,
    --            1 AS IsSuccess,
    --            'Success' AS [Message],

    --            JSON_QUERY((
    --                SELECT 
    --                    dvt.id,
    --                    dvt.display_view_id,
    --                    dvt.test_id
    --                FROM dbo.display_view_test dvt
    --                ORDER BY dvt.id DESC
    --                FOR JSON PATH
    --            )) AS Response

    --        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    --    ));

    --    RETURN;
    --END
    -------------------------------------------------
    -- MODE 3 : GET ALL FOR A SPECIFIC DISPLAY VIEW
    -------------------------------------------------
    IF (@Mode = 3)
    BEGIN
    
        -- We must parse display_view_id so we only return tests assigned to THAT node!
        SELECT  
            @display_view_id = display_view_id
        FROM OPENJSON(@Json) 
        WITH (
            display_view_id INT '$.display_view_id'
        );
        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                JSON_QUERY((
                    SELECT 
                        dvt.id,
                        dvt.display_view_id,
                        dvt.test_id
                    FROM dbo.display_view_test dvt
                    WHERE dvt.display_view_id = @display_view_id   -- <-- FIX IS HERE
                    ORDER BY dvt.id DESC
                    FOR JSON PATH
                )) AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
        RETURN;
    END

    -------------------------------------------------
    -- INVALID MODE
    -------------------------------------------------
    SET @Output = JSON_QUERY((
        SELECT 
            400 AS StatusCode,
            0 AS IsSuccess,
            'Invalid Mode' AS [Message],
            NULL AS Response
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ));

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

        INSERT INTO dbo.ErrorLogs
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
            'SpDisplayViewTest',
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