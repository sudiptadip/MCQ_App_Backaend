
CREATE PROCEDURE [dbo].[SpDisplayView]
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
        @display_name NVARCHAR(255),
        @parent_id INT,
        @display_view_id INT
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
                    SELECT id, display_name, isnull(parent_id, null) as parent_id, franchise_id
                    FROM [dbo].[display_view]
                    WHERE franchise_id = @FranchiseId and parent_id is null
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
            @display_name = display_name,
            @parent_id = parent_id
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id',
            display_name NVARCHAR(255) '$.display_name',
            parent_id INT '$.parent_id'
        );

        --------------------------------------------
        -- VALIDATION
        --------------------------------------------
        IF (@display_name IS NULL)
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


        --------------------------------------------
        -- UPDATE FLOW
        --------------------------------------------
        IF (@id IS NOT NULL)
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM [dbo].[display_view] WHERE id = @id
            )
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'Display view not found' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            UPDATE [dbo].[display_view]
            SET 
                display_name = @display_name,
                parent_id = @parent_id
            WHERE id = @id and franchise_id = @FranchiseId;

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Display view updated successfully' AS [Message],
                    JSON_QUERY((
                    SELECT * 
                    FROM [dbo].[display_view] 
                    WHERE id = @id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END


        --------------------------------------------
        -- INSERT FLOW
        --------------------------------------------
        INSERT INTO [dbo].[display_view]
        (
            display_name,
            parent_id,
            franchise_id
        )
        VALUES
        (
            @display_name,
            @parent_id,
            @FranchiseId
        );

        SET @id = SCOPE_IDENTITY();

        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Display view created successfully' AS [Message],
                JSON_QUERY((
                    SELECT * 
                    FROM [dbo].[display_view] 
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

        if not exists (select * from display_view where id = @id)
        Begin
            SET @Output = JSON_QUERY((
                SELECT 
                    404 AS StatusCode,
                    0 AS IsSuccess,
                    'Display view not found' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        End

        Delete from display_view
        where id = @id

        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Display view deleted successfully' AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));


    END


    --IF (@Mode = 4)
    --BEGIN

    --    SELECT  
    --        @id = id
    --    FROM OPENJSON(@Json) 
    --    WITH (
    --        id INT '$.id'
    --    );

    --    ;With recursivecte as (
    --        select * from display_view where id = @id and franchise_id = @FranchiseId
    --        union all
    --        select c.* from display_view c
    --        inner join recursivecte on c.parent_id = recursivecte.id
    --    )

    --    SELECT @Output = JSON_QUERY((
    --        SELECT 
    --            200 AS StatusCode,
    --            1 AS IsSuccess,
    --            'Success' AS [Message],
    --            isnull((select *, 
    --            (select dt.id, test_id, t.[name] as test_name, duration_minutes, 
    --            (SELECT COUNT(*) FROM test_questions TQ WHERE TQ.test_id = DT.test_id) AS total_questions
    --            from 
    --            display_view_test dt join tests t on dt.test_id = t.id where dt.display_view_id = r.id for json path) as assigned_tests 
    --             from recursivecte r for json path), '[]') 
    --            AS Response
    --        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    --    ));


    --END

    IF (@Mode = 4)
    BEGIN

        SELECT  
            @id = id
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id'
        );

        ;With recursivecte as (
            select * from display_view where id = @id and franchise_id = @FranchiseId
            union all
            select c.* from display_view c
            inner join recursivecte on c.parent_id = recursivecte.id
        )

        SELECT @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                isnull((
                    select *, 
                    
                    -- Assigned Tests
                    (
                        select dt.id, test_id, t.[name] as test_name, duration_minutes, 
                        (SELECT COUNT(*) FROM test_questions TQ WHERE TQ.test_id = DT.test_id) AS total_questions
                        from display_view_test dt 
                        join tests t on dt.test_id = t.id 
                        where dt.display_view_id = r.id 
                        for json path
                    ) as assigned_tests,
                    
                    -- Assigned Study Materials
                    (
                        select dvsm.id, studyMaterial_id, sm.[name] as studyMaterial_name, sm.[type] as type
                        from display_view_studyMaterial dvsm 
                        join study_material sm on dvsm.studyMaterial_id = sm.id 
                        where dvsm.display_view_id = r.id 
                        for json path
                    ) as assigned_study_materials 
                    
                    from recursivecte r for json path
                ), '[]') 
                AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

    END


    IF(@Mode = 5)
    Begin

    SELECT  
            @display_view_id = display_view_id
        FROM OPENJSON(@Json) 
        WITH (
            display_view_id INT '$.display_view_id'
        );
        
      ;With cte as (
        SELECT
            u.id AS student_user_id,
            u.name,
            u.email,
            CAST(
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM student_assign_test sat
                        WHERE sat.student_user_id = u.id
                          AND sat.display_view_id = @display_view_id
                    )
                    THEN 1
                    ELSE 0
                END
            AS bit) AS is_student
        FROM users u
        WHERE u.role = 'student' and u.franchise_id = @FranchiseId
      )


           SELECT @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                (Select * from cte For json path) AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

        Return;

    END



    -------------------------------------------------
    -- MODE 6: ASSIGN / UNASSIGN STUDENT
    -------------------------------------------------
    IF (@Mode = 6)
    BEGIN
        DECLARE @student_user_id INT;
        -- Parse JSON
        SELECT  
            @student_user_id = student_user_id,
            @display_view_id = display_view_id
        FROM OPENJSON(@Json) 
        WITH (
            student_user_id INT '$.student_user_id',
            display_view_id INT '$.display_view_id'
        );
        --------------------------------------------
        -- VALIDATION
        --------------------------------------------
        IF (@student_user_id IS NULL OR @display_view_id IS NULL)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'student_user_id and display_view_id are required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        --------------------------------------------
        -- TOGGLE FLOW (ASSIGN / UNASSIGN)
        --------------------------------------------
        IF EXISTS (
            SELECT 1 
            FROM [dbo].[student_assign_test] 
            WHERE student_user_id = @student_user_id 
              AND display_view_id = @display_view_id
        )
        BEGIN
            -- Record exists, so delete it (Unassign)
            DELETE FROM [dbo].[student_assign_test]
            WHERE student_user_id = @student_user_id 
              AND display_view_id = @display_view_id;
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Student unassigned successfully' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        END
        ELSE
        BEGIN
            -- Record does not exist, so insert it (Assign)
            INSERT INTO [dbo].[student_assign_test]
            (
                student_user_id,
                display_view_id
            )
            VALUES
            (
                @student_user_id,
                @display_view_id
            );
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Student assigned successfully' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        END
        RETURN;
    END




    IF (@Mode = 7)
    BEGIN
        
        IF EXISTS(SELECT * from [dbo].[users] where id = @UserId and role = 'STUDENT')
        BEGIN
              SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    (
                        SELECT id, display_name, isnull(parent_id, null) as parent_id, franchise_id
                        FROM [dbo].[display_view]
                        WHERE franchise_id = @FranchiseId and parent_id is null
                        AND id IN (SELECT display_view_id from student_assign_test where student_user_id = @UserId)
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
           ));

            RETURN;
        END
        ELSE
        BEGIN
              SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    (
                        SELECT id, display_name, isnull(parent_id, null) as parent_id, franchise_id
                        FROM [dbo].[display_view]
                        WHERE franchise_id = @FranchiseId and parent_id is null
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
      
            RETURN;
        END

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