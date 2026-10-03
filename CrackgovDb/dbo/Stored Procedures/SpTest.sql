
CREATE PROCEDURE [dbo].[SpTest] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN

    DECLARE
        @id INT,
        @name NVARCHAR(255),
        @total_questions INT,
        @duration_minutes INT,
        @description NVARCHAR(MAX),
        @min_no_of_question_attempt INT,
        @TestId INT,
        @question_id int;

    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY

        ---------------------------------------------------
        -- MODE 1 : GET ALL TESTS
        ---------------------------------------------------
        IF (@Mode = 1)
        BEGIN

        ;WITH testListCte AS
        (
            SELECT t.*, cast(0 as bit) as is_assigned_by_franchise
            FROM dbo.Tests t
            WHERE t.franchise_id = @FranchiseId
              AND t.is_custom = 0
        
            UNION ALL
        
            SELECT t2.*, cast(1 as bit) as is_assigned_by_franchise
            FROM dbo.Tests t2
            WHERE EXISTS
            (
                SELECT 1
                FROM franchise_tests ft
                WHERE ft.test_id = t2.id
                AND ft.franchise_id = @FranchiseId
            )
              AND t2.is_custom = 0
        )

            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    (
                       Select * from testListCte
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END


        ---------------------------------------------------
        -- MODE 2 : CREATE TEST
        ---------------------------------------------------
        ---------------------------------------------------
    -- MODE 2 : INSERT / UPDATE TEST
    ---------------------------------------------------
    IF(@Mode = 2)
    BEGIN
    
        BEGIN TRANSACTION;
    
        -- Read Main JSON
        SELECT
            @TestId = id,
            @name = name,
            @total_questions = total_questions,
            @duration_minutes = duration_minutes,
            @description = description,
            @min_no_of_question_attempt = min_no_of_question_attempt
        FROM OPENJSON(@Json)
        WITH
        (
            id INT '$.id',
            name NVARCHAR(255) '$.name',
            total_questions INT '$.total_questions',
            duration_minutes INT '$.duration_minutes',
            description NVARCHAR(MAX) '$.description',
            min_no_of_question_attempt INT '$.min_no_of_question_attempt'
        );
    
    
        ---------------------------------------------------
        -- QUESTION IDS TABLE
        ---------------------------------------------------
        DECLARE @QuestionIds TABLE
        (
            question_id INT
        );
    
    
        -- Read Question Array
        INSERT INTO @QuestionIds(question_id)
        SELECT value
        FROM OPENJSON(@Json, '$.question_ids');
    
    
        ---------------------------------------------------
        -- VALIDATION
        ---------------------------------------------------
        IF NOT EXISTS (SELECT 1 FROM @QuestionIds)
        BEGIN
    
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Please select at least one question' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
            ROLLBACK TRANSACTION;
            RETURN;
        END
    
    
        IF(@total_questions <> (SELECT COUNT(*) FROM @QuestionIds))
        BEGIN
    
            SET @Output = JSON_QUERY((
                SELECT 
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Total questions count mismatch' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
            ROLLBACK TRANSACTION;
            RETURN;
        END
    
    
        ---------------------------------------------------
        -- INSERT
        ---------------------------------------------------
        IF(ISNULL(@TestId, 0) = 0)
        BEGIN
    
            INSERT INTO dbo.Tests
            (
                name,
                total_questions,
                duration_minutes,
                description,
                min_no_of_question_attempt,
                created_by,
                created_at,
                franchise_id
            )
            VALUES
            (
                @name,
                @total_questions,
                @duration_minutes,
                @description,
                @min_no_of_question_attempt,
                @UserId,
                GETDATE(),
                @FranchiseId
            );
    
            SET @TestId = SCOPE_IDENTITY();
    
    
            INSERT INTO dbo.test_questions
            (
                test_id,
                question_id
            )
            SELECT 
                @TestId,
                question_id
            FROM @QuestionIds;
    
    
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Test created successfully' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
        END
        ELSE
        BEGIN
    
            ---------------------------------------------------
            -- UPDATE TEST
            ---------------------------------------------------
            UPDATE dbo.Tests
            SET
                name = @name,
                total_questions = @total_questions,
                duration_minutes = @duration_minutes,
                description = @description,
                min_no_of_question_attempt = @min_no_of_question_attempt
            WHERE id = @TestId;
    
    
            ---------------------------------------------------
            -- INSERT NEW QUESTIONS
            ---------------------------------------------------
            INSERT INTO dbo.test_questions
            (
                test_id,
                question_id
            )
            SELECT
                @TestId,
                q.question_id
            FROM @QuestionIds q
            WHERE NOT EXISTS
            (
                SELECT 1
                FROM dbo.test_questions tq
                WHERE tq.test_id = @TestId
                AND tq.question_id = q.question_id
            );
    
    
            ---------------------------------------------------
            -- DELETE REMOVED QUESTIONS
            ---------------------------------------------------
            DELETE tq
            FROM dbo.test_questions tq
            WHERE tq.test_id = @TestId
            AND NOT EXISTS
            (
                SELECT 1
                FROM @QuestionIds q
                WHERE q.question_id = tq.question_id
            );
    
    
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Test updated successfully' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
        END
    
    
        COMMIT TRANSACTION;
    
        RETURN;
    
    END


    ---------------------------------------------------
    -- MODE 3 : DELETE TEST
    ---------------------------------------------------
        IF(@Mode = 3)
        BEGIN
        
            BEGIN TRANSACTION;
        
            -- Read JSON
            SELECT @id = id
            FROM OPENJSON(@Json)
            WITH
            (
                id INT '$.id'
            );
        
        
            ---------------------------------------------------
            -- VALIDATION
            ---------------------------------------------------
            IF NOT EXISTS
            (
                SELECT 1
                FROM dbo.Tests
                WHERE id = @id
                AND franchise_id = @FranchiseId
            )
            BEGIN
        
                SET @Output = JSON_QUERY((
                    SELECT 
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'Test not found' AS [Message]
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
        
                ROLLBACK TRANSACTION;
                RETURN;
        
            END
        
        
            ---------------------------------------------------
            -- DELETE TEST QUESTIONS
            ---------------------------------------------------
            DELETE FROM dbo.test_questions
            WHERE test_id = @id;
        
        
            ---------------------------------------------------
            -- DELETE TEST
            ---------------------------------------------------
            DELETE FROM dbo.Tests
            WHERE id = @id
            AND franchise_id = @FranchiseId;
        
        
            COMMIT TRANSACTION;
        
        
            ---------------------------------------------------
            -- SUCCESS RESPONSE
            ---------------------------------------------------
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Test deleted successfully' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        
            RETURN;
        
        END


      ---------------------------------------------------
-- MODE 4 : GET TEST DETAILS
---------------------------------------------------
IF(@Mode = 4)
BEGIN

    -- Read JSON
    SELECT @id = id
    FROM OPENJSON(@Json)
    WITH
    (
        id INT '$.id'
    );


    SET @Output = JSON_QUERY((
        SELECT 
            200 AS StatusCode,
            1 AS IsSuccess,
            'Success' AS [Message],

            JSON_QUERY(
            (
                SELECT 

                    ---------------------------------------------------
                    -- TEST
                    ---------------------------------------------------
                    JSON_QUERY(
                    (
                        SELECT 
                            t.id,
                            t.name,
                            t.total_questions,
                            t.duration_minutes,
                            t.description,
                            t.min_no_of_question_attempt
                        FROM dbo.Tests t
                        WHERE t.id = @id
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS test,


                    ---------------------------------------------------
                    -- QUESTION IDS
                    ---------------------------------------------------
                    JSON_QUERY(
                        '[' + ISNULL(
                            (
                                SELECT STRING_AGG(
                                    CAST(tq.question_id AS VARCHAR(MAX)),
                                    ','
                                )
                                FROM dbo.test_questions tq
                                WHERE tq.test_id = @id
                            ),
                            ''
                        ) + ']'
                    ) AS question_ids,


                    ---------------------------------------------------
                    -- QUESTIONS
                    ---------------------------------------------------
                    JSON_QUERY(
                    (
                        SELECT 
                            q.id,
                            q.question_text,
                            q.difficulty_level,
                            c.name AS category_name

                            ---------------------------------------------------
                            -- OPTIONS
                            ---------------------------------------------------
                            --JSON_QUERY(
                            --(
                            --    SELECT 
                            --        qo.id,
                            --        qo.option_text,
                            --        qo.is_correct
                            --    FROM dbo.question_options qo
                            --    WHERE qo.question_id = q.id
                            --    FOR JSON PATH
                            --)) AS options

                        FROM dbo.test_questions tq
                        INNER JOIN dbo.questions q
                            ON tq.question_id = q.id
                        INNER JOIN dbo.categories c
                            ON q.category_id = c.id
                        WHERE tq.test_id = @id
                        FOR JSON PATH
                    )) AS questions

                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )) AS Response

        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ));

    RETURN;

END



     ---------------------------------------------------
    -- MODE 5 : START PRACTICE TEST
    ---------------------------------------------------
--    IF(@Mode = 5)
--    BEGIN
    
--        -- Read JSON
--        SELECT @id = id
--        FROM OPENJSON(@Json)
--        WITH
--        (
--            id INT '$.id'
--        );
    
    
--        ---------------------------------------------------
--        -- VALIDATION
--        ---------------------------------------------------
--        IF NOT EXISTS
--        (
--            SELECT 1
--            FROM dbo.Tests
--            WHERE id = @id
--            AND franchise_id = @FranchiseId
--        )
--        BEGIN
    
--            SET @Output = JSON_QUERY((
--                SELECT
--                    404 AS StatusCode,
--                    0 AS IsSuccess,
--                    'Test not found' AS [Message],
--                    NULL AS Response
--                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
--            ));
    
--            RETURN;
--        END


--    ---------------------------------------------------
--    -- RESPONSE
--    ---------------------------------------------------
--    SET @Output = JSON_QUERY((
--        SELECT
--            200 AS StatusCode,
--            1 AS IsSuccess,
--            'Success' AS [Message],

--            JSON_QUERY(
--            (
--                SELECT

--                    ---------------------------------------------------
--                    -- TEST DETAILS
--                    ---------------------------------------------------
--                    JSON_QUERY(
--                    (
--                        SELECT
--                            t.id,
--                            t.name,
--                            t.duration_minutes,
--                            t.total_questions,
--                            t.min_no_of_question_attempt
--                        FROM dbo.Tests t
--                        WHERE t.id = @id
--                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
--                    )) AS test,


--                    ---------------------------------------------------
--                    -- QUESTIONS
--                    ---------------------------------------------------
--                    JSON_QUERY(
--                    (
--                        SELECT
--                            q.id,
--                            q.question_text,
--                            q.difficulty_level,
--                            c.name AS category_name,

--                            ---------------------------------------------------
--                            -- OPTIONS
--                            ---------------------------------------------------
--                            JSON_QUERY(
--                            (
--                                SELECT
--                                    o.id,
--                                    o.option_text,
--                                    o.is_correct
--                                FROM dbo.options o
--                                WHERE o.question_id = q.id
--                                FOR JSON PATH
--                            )) AS options

--                        FROM dbo.test_questions tq
--                        INNER JOIN dbo.questions q
--                            ON tq.question_id = q.id

--                        LEFT JOIN dbo.categories c
--                            ON q.category_id = c.id

--                        WHERE tq.test_id = @id

--                        FOR JSON PATH
--                    )) AS questions

--                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
--            )) AS Response

--        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
--    ));

--    RETURN;

--END


        ---------------------------------------------------
    -- MODE 5 : START PRACTICE TEST
    ---------------------------------------------------
    IF(@Mode = 5)
    BEGIN
    
        -- Read JSON
        SELECT @id = id
        FROM OPENJSON(@Json)
        WITH
        (
            id INT '$.id'
        );
    
        ---------------------------------------------------
        -- VALIDATION
        ---------------------------------------------------
        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.Tests
            WHERE id = @id
            AND ((franchise_id = @FranchiseId) or 
            (id IN (SELECT test_id FROM franchise_tests WHERE franchise_id = @FranchiseId)))
        )
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT
                    404 AS StatusCode,
                    0 AS IsSuccess,
                    'Test not found' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END

        ---------------------------------------------------
        -- RESPONSE (Includes is_bookmarked field)
        ---------------------------------------------------
        SET @Output = JSON_QUERY((
            SELECT
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],

                JSON_QUERY(
                (
                    SELECT
                        ---------------------------------------------------
                        -- TEST DETAILS
                        ---------------------------------------------------
                        JSON_QUERY(
                        (
                            SELECT
                                t.id,
                                t.name,
                                t.duration_minutes,
                                t.total_questions,
                                t.min_no_of_question_attempt
                            FROM dbo.Tests t
                            WHERE t.id = @id
                            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                        )) AS test,

                        ---------------------------------------------------
                        -- QUESTIONS
                        ---------------------------------------------------
                        JSON_QUERY(
                        (
                            SELECT
                                q.id,
                                q.question_text,
                                q.difficulty_level,
                                c.name AS category_name,
                                [dbo].GetDocumentUrl(q.image_document_id) as image_url,
                                
                                -- Add this check to return bookmarked status as a boolean bit
                                CAST(
                                    CASE WHEN EXISTS (
                                        SELECT 1 
                                        FROM dbo.student_bookmarks sb 
                                        WHERE sb.user_id = @UserId 
                                        AND sb.question_id = q.id
                                    ) THEN 1 ELSE 0 END 
                                AS BIT) AS is_bookmarked,

                                ---------------------------------------------------
                                -- OPTIONS
                                ---------------------------------------------------
                                JSON_QUERY(
                                (
                                    SELECT
                                        o.id,
                                        o.option_text,
                                        o.is_correct
                                    FROM dbo.options o
                                    WHERE o.question_id = q.id
                                    FOR JSON PATH
                                )) AS options

                            FROM dbo.test_questions tq
                            INNER JOIN dbo.questions q
                                ON tq.question_id = q.id

                            LEFT JOIN dbo.categories c
                                ON q.category_id = c.id

                            WHERE tq.test_id = @id

                            FOR JSON PATH
                        )) AS questions

                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response

            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

        RETURN;
    END


    -- Bookmark Question
    IF(@Mode = 6)
BEGIN
    
    SELECT 
        @question_id = question_id
    FROM OPENJSON(@Json)
    WITH
    (
        question_id INT '$.question_id'
    );

    IF EXISTS(SELECT * from [dbo].[student_bookmarks] b where [user_id] = @UserId and [question_id] = @question_id)
    Begin
        
        DELETE FROM [dbo].[student_bookmarks] 
        WHERE [user_id] = @UserId and [question_id] = @question_id;

        SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'successfully remove from bookmark' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            return;

    END
    Begin
        Insert INTO [dbo].[student_bookmarks] ([user_id], [question_id], [created_at])
        values (@UserId, @question_id, GETDATE());


        SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'successfully added from bookmark' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            return;

    END

END

   
    IF(@Mode = 7)
BEGIN

    BEGIN TRANSACTION;

    DECLARE @FranchiseIds NVARCHAR(MAX);

    -----------------------------------------
    -- READ JSON
    -----------------------------------------
    SELECT
        @id = id,
        @TestId = test_id,
        @FranchiseIds = franchise_ids
    FROM OPENJSON(@Json)
    WITH
    (
        id INT '$.id',
        test_id INT '$.test_id',
        franchise_ids NVARCHAR(MAX) '$.franchise_ids' AS JSON
    );

    -----------------------------------------
    -- DELETE OLD RECORDS
    -----------------------------------------
    DELETE FROM franchise_tests
    WHERE test_id = @TestId;

    -----------------------------------------
    -- INSERT NEW RECORDS
    -----------------------------------------
    INSERT INTO franchise_tests
    (
        franchise_id,
        test_id
    )
    SELECT
        CAST(value AS INT),
        @TestId
    FROM OPENJSON(@FranchiseIds);

    COMMIT TRANSACTION;

    -----------------------------------------
    -- SUCCESS RESPONSE
    -----------------------------------------
    SET @Output = JSON_QUERY((
        SELECT
            200 AS StatusCode,
            1 AS IsSuccess,
            'Franchise test mapping updated successfully' AS [Message],
            @TestId AS Response
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ));

    RETURN;

END  


        ---------------------------------------------------
        -- MODE 8 : CREATE CUSTOM PRACTICE TEST
        ---------------------------------------------------
        IF (@Mode = 8)
        BEGIN
            BEGIN TRANSACTION;

            DECLARE 
                @custom_name NVARCHAR(255),
                @custom_duration INT,
                @custom_q_count INT,
                @custom_difficulty NVARCHAR(20),
                @custom_filter_mode NVARCHAR(50),
                @actual_q_count INT,
                @new_test_id INT;

            DECLARE @SelectedCategories TABLE (category_id INT);
            DECLARE @FinalQuestions TABLE (question_id INT);

            -- Parse JSON configuration
            SELECT
                @custom_name = name,
                @custom_duration = duration_minutes,
                @custom_q_count = question_count,
                @custom_difficulty = difficulty_level,
                @custom_filter_mode = filter_mode
            FROM OPENJSON(@Json)
            WITH
            (
                name NVARCHAR(255) '$.name',
                duration_minutes INT '$.duration_minutes',
                question_count INT '$.question_count',
                difficulty_level NVARCHAR(20) '$.difficulty_level',
                filter_mode NVARCHAR(50) '$.filter_mode'
            );

            -- Ensure we have a default name if not provided
            IF (@custom_name IS NULL OR @custom_name = '')
            BEGIN
                SET @custom_name = 'Custom Practice - ' + CONVERT(VARCHAR, GETDATE(), 120);
            END

            -- Parse Category IDs from JSON
            INSERT INTO @SelectedCategories (category_id)
            SELECT value
            FROM OPENJSON(@Json, '$.category_ids');

            -- Recursive CTE to find all descendant sub-categories of the selected categories
            ;WITH SubCategories AS (
                SELECT category_id FROM @SelectedCategories
                
                UNION ALL
                
                SELECT c.id FROM dbo.categories c
                INNER JOIN SubCategories sc ON c.parent_id = sc.category_id
            ),
            -- Filter questions in those sub-categories
            MatchingQuestions AS (
                SELECT DISTINCT q.id, q.difficulty_level
                FROM dbo.questions q
                INNER JOIN SubCategories sc ON q.category_id = sc.category_id
                WHERE q.franchise_id = @FranchiseId Or franchise_id = 1
                  AND (@custom_difficulty IS NULL OR @custom_difficulty = 'all' OR q.difficulty_level = @custom_difficulty)
                  -- Filter Mode: Unpracticed questions
                  AND (
                      @custom_filter_mode <> 'unpracticed' 
                      OR q.id NOT IN (
                          SELECT ans.question_id 
                          FROM dbo.answers ans 
                          INNER JOIN dbo.attempts att ON ans.attempt_id = att.id 
                          WHERE att.student_id = @UserId
                      )
                  )
                  -- Filter Mode: Bookmarked questions
                  AND (
                      @custom_filter_mode <> 'bookmarked'
                      OR q.id IN (
                          SELECT sb.question_id
                          FROM dbo.student_bookmarks sb
                          WHERE sb.user_id = @UserId
                      )
                  )
            ),
            -- Select random questions
            SelectedQuestions AS (
                SELECT TOP (ISNULL(@custom_q_count, 10)) id
                FROM MatchingQuestions
                ORDER BY NEWID()
            )
            -- Insert into a temporary table to check count
            INSERT INTO @FinalQuestions (question_id)
            SELECT id FROM SelectedQuestions;

            SELECT @actual_q_count = COUNT(*) FROM @FinalQuestions;

            -- Validation: check if we found any questions
            IF (@actual_q_count = 0)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        400 AS StatusCode,
                        0 AS IsSuccess,
                        'No questions found matching your selections. Try adding more categories or changing filters.' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                ROLLBACK TRANSACTION;
                RETURN;
            END

            -- Insert the custom test record
            INSERT INTO dbo.Tests
            (
                name,
                total_questions,
                duration_minutes,
                description,
                min_no_of_question_attempt,
                created_by,
                created_at,
                franchise_id,
                is_custom,
                student_id
            )
            VALUES
            (
                @custom_name,
                @actual_q_count,
                @custom_duration,
                'Custom Student Practice Session',
                0, -- no minimum attempt required for custom practices
                @UserId,
                GETDATE(),
                @FranchiseId,
                1, -- is_custom = 1
                @UserId
            );

            SET @new_test_id = SCOPE_IDENTITY();

            -- Link selected questions to the test
            INSERT INTO dbo.test_questions (test_id, question_id)
            SELECT @new_test_id, question_id
            FROM @FinalQuestions;

            COMMIT TRANSACTION;

            -- Return the newly created test ID to frontend
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Custom practice session generated successfully.' AS [Message],
                    JSON_QUERY((
                        SELECT @new_test_id AS test_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END



    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;


        DECLARE @ErrorMessage NVARCHAR(MAX);
        DECLARE @ErrorNumber INT;
        DECLARE @ErrorLine INT;
        DECLARE @ErrorState INT;
        DECLARE @ErrorSeverity INT;

        SELECT 
            @ErrorMessage = ERROR_MESSAGE(),
            @ErrorNumber = ERROR_NUMBER(),
            @ErrorLine = ERROR_LINE(),
            @ErrorState = ERROR_STATE(),
            @ErrorSeverity = ERROR_SEVERITY();


        ---------------------------------------------------
        -- ERROR LOG
        ---------------------------------------------------
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
            'SpTest',
            @ErrorMessage,
            @ErrorNumber,
            @ErrorLine,
            @ErrorState,
            @ErrorSeverity,
            @UserId
        );


        ---------------------------------------------------
        -- ERROR RESPONSE
        ---------------------------------------------------
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
