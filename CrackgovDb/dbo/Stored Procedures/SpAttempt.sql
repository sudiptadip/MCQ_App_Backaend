
CREATE PROCEDURE [dbo].[SpAttempt] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN

    DECLARE
        @rightAns INT,
        @wrongAns INT,
        @attempt_id INT,
        @TestId INT;

    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY

        ---------------------------------------------------
        -- MODE 1 : SAve
        ---------------------------------------------------
        IF (@Mode = 1)
        BEGIN

            SELECT @TestId = test_id from OPENJSON(@json) with (test_id int '$.test_id')

            insert into [dbo].[attempts]
            (
                student_id,
                test_id,
                started_at,
                franchise_id
            )values
            (
                @UserId,
                @TestId,
                getdate(),
                @FranchiseId
            )

         --   Select * from tests where id = 5
            
            SET @attempt_id = SCOPE_IDENTITY();
            
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT *
                        FROM [dbo].[attempts]
                        WHERE attempts.id = @attempt_id
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END


      ---------------------------------------------------
      -- MODE 2 : SAVE ANSWERS
      ---------------------------------------------------
        IF(@Mode = 2)
        BEGIN
        
            BEGIN TRANSACTION;
        
            -- Read Attempt Id
            SELECT @attempt_id = attempt_id
            FROM OPENJSON(@json)
            WITH
            (
                attempt_id INT '$.attempt_id'
            );
        
        
            ---------------------------------------------------
            -- VALIDATION
            ---------------------------------------------------
            IF NOT EXISTS
            (
                SELECT 1
                FROM dbo.attempts
                WHERE id = @attempt_id
            )
            BEGIN
        
                SET @Output = JSON_QUERY((
                    SELECT 
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'Attempt not found' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
        
                ROLLBACK TRANSACTION;
                RETURN;
        
            END
        
        
            ---------------------------------------------------
            -- INSERT ANSWERS
            ---------------------------------------------------
            INSERT INTO dbo.answers
            (
                attempt_id,
                question_id,
                selected_option_id,
                is_correct
            )
            SELECT
                @attempt_id,
                a.question_id,
                a.selected_option_id,
                dbo.IsCorrectAnswer(a.question_id, a.selected_option_id)
            FROM OPENJSON(@json, '$.answers')
            WITH
            (
                question_id INT '$.question_id',
                selected_option_id INT '$.selected_option_id'
            ) a
            WHERE NOT EXISTS
            (
                SELECT 1
                FROM dbo.answers ans
                WHERE ans.attempt_id = @attempt_id
                AND ans.question_id = a.question_id
            );
        

        
            ---------------------------------------------------
            -- UPDATE COMPLETED TIME
            ---------------------------------------------------
            SELECT @rightAns = count(*) from dbo.answers where attempt_id = @attempt_id and is_correct = 1;
            SELECT @wrongAns = count(*) from dbo.answers where attempt_id = @attempt_id and is_correct = 0;
            
            
            UPDATE dbo.attempts 
            SET 
                completed_at = GETDATE(), 
                score = @rightAns
            WHERE id = @attempt_id;
       
        
            COMMIT TRANSACTION;
        

            ---------------------------------------------------
            -- SUCCESS RESPONSE
            ---------------------------------------------------
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Answers saved successfully' AS [Message],
                    JSON_QUERY((
                        SELECT @attempt_id AS attempt_id,
                               @rightAns AS score,
                               (@rightAns + @wrongAns) AS total_questions,
                               @rightAns AS correct_answers FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        
            RETURN;
        
        END




        ---------------------------------------------------
        -- MODE 3 : GET RESULT DETAILS
        ---------------------------------------------------
        IF(@Mode = 3)
        BEGIN
        
            -- Read JSON
            SELECT @attempt_id = attempt_id
            FROM OPENJSON(@Json)
            WITH
            (
                attempt_id INT '$.attempt_id'
            );
        
        
            ---------------------------------------------------
            -- VALIDATION
            ---------------------------------------------------
            IF NOT EXISTS
            (
                SELECT 1
                FROM dbo.attempts
                WHERE id = @attempt_id
            )
            BEGIN
        
                SET @Output = JSON_QUERY((
                    SELECT
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'Attempt not found' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
        
                RETURN;
        
            END
        
        
            ---------------------------------------------------
            -- RESPONSE
            ---------------------------------------------------
            SET @Output = JSON_QUERY((
                SELECT
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
        
                    JSON_QUERY(
                    (
                        SELECT
        
                            a.id AS attemptId,
                            t.name AS testName,
                            t.total_questions AS totalQuestions,
        
                            (
                                SELECT COUNT(*)
                                FROM dbo.answers ans
                                WHERE ans.attempt_id = a.id
                                AND ans.is_correct = 1
                            ) AS correctAnswers,
        
                            ISNULL(a.score, 0) AS score,
        
        
                            ---------------------------------------------------
                            -- QUESTIONS
                            ---------------------------------------------------
                            JSON_QUERY(
                            (
                                SELECT
        
                                    q.id,
                                    q.question_text AS questionText,
                                    q.difficulty_level AS difficultyLevel,
                                    q.question_explanation AS questionExplanation,
                                    q.tag AS tag,
                                    ans.selected_option_id AS userSelectedOptionId,
        
        
                                    ---------------------------------------------------
                                    -- OPTIONS
                                    ---------------------------------------------------
                                    JSON_QUERY(
                                    (
                                        SELECT
                                            o.id,
                                            o.option_text AS optionText,
                                            o.is_correct AS isCorrect
                                        FROM dbo.options o
                                        WHERE o.question_id = q.id
                                        FOR JSON PATH
                                    )) AS options
        
                                FROM dbo.test_questions tq
        
                                INNER JOIN dbo.questions q
                                    ON tq.question_id = q.id
        
                                LEFT JOIN dbo.answers ans
                                    ON ans.question_id = q.id
                                    AND ans.attempt_id = a.id
        
                                WHERE tq.test_id = t.id
        
                                FOR JSON PATH
                            )) AS questions
        
                        FROM dbo.attempts a
        
                        INNER JOIN dbo.tests t
                            ON a.test_id = t.id
        
                        WHERE a.id = @attempt_id
        
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
        
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        
            RETURN;
        
        END



        ---------------------------------------------------
        -- MODE 4 : GET MY ATTEMPTS
        ---------------------------------------------------
        IF(@Mode = 4)
        BEGIN
        
            SET @Output = JSON_QUERY((
                SELECT
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
        
                    JSON_QUERY(
                    (
                        SELECT
        
                            a.id AS attemptId,
                            t.id AS testId,
                            t.name AS testName,
        
                            c.name AS categoryName,
        
                            a.started_at AS attemptDate,
        
                            ISNULL(a.score, 0) AS score,
        
                            t.total_questions AS totalQuestions,
        
                            (
                                SELECT COUNT(*)
                                FROM dbo.answers ans
                                WHERE ans.attempt_id = a.id
                                AND ans.is_correct = 1
                            ) AS correctAnswers,
        
                            CAST(
                                (
                                    ISNULL(a.score, 0) * 100.0
                                ) / NULLIF(t.total_questions, 0)
                                AS DECIMAL(10,2)
                            ) AS percentage,
        
                            CASE
                                WHEN a.completed_at IS NULL
                                    THEN 'Pending'
                                ELSE 'Completed'
                            END AS status
        
                        FROM dbo.attempts a
        
                        INNER JOIN dbo.tests t
                            ON a.test_id = t.id
        
                        ---------------------------------------------------
                        -- CATEGORY NAME
                        -- Taking first category from test questions
                        ---------------------------------------------------
                        OUTER APPLY
                        (
                            SELECT TOP 1 c.name
                            FROM dbo.test_questions tq
                            INNER JOIN dbo.questions q
                                ON tq.question_id = q.id
                            INNER JOIN dbo.categories c
                                ON q.category_id = c.id
                            WHERE tq.test_id = t.id
                        ) c
        
                        WHERE a.student_id = @UserId
                        AND a.franchise_id = @FranchiseId
        
                        ORDER BY a.id DESC
        
                        FOR JSON PATH
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
