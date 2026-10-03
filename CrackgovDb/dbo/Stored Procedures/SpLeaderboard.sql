
CREATE PROCEDURE [dbo].[SpLeaderboard] 
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

        ---------------------------------------------------
        -- MODE 1 : GET WEEKLY/MONTHLY/TODAY LEADERBOARD
        ---------------------------------------------------
        IF (@Mode = 1)
        BEGIN

            DECLARE @TimeRange NVARCHAR(50),
                    @FranchiseIdFilter INT,
                    @SortBy NVARCHAR(50);

            -- Parse JSON Filters passed from the frontend React app
            IF (@Json IS NOT NULL AND ISJSON(@Json) > 0)
            BEGIN
                SELECT
                    @TimeRange = time_range,
                    @FranchiseIdFilter = franchise_id,
                    @SortBy = sort_by
                FROM OPENJSON(@Json)
                WITH
                (
                    time_range NVARCHAR(50) '$.time_range',
                    franchise_id INT '$.franchise_id',
                    sort_by NVARCHAR(50) '$.sort_by'
                );
            END

            -- Fallbacks for filters
            SET @TimeRange = ISNULL(@TimeRange, 'week');
            SET @SortBy = ISNULL(@SortBy, 'marks');

            -- Rank and compute statistics based on student practice attempts and correct answers
            ;WITH LeaderboardCTE AS
            (
                SELECT 
                    u.id AS student_user_id,
                    u.name AS student_name,
                    u.email AS email,
                    f.name AS franchise_name,
                    COUNT(DISTINCT a.id) AS total_attempts,
                    COUNT(ans.id) AS total_questions_solved,
                    SUM(CASE WHEN ans.is_correct = 1 THEN 1 ELSE 0 END) AS total_correct,
                    SUM(ISNULL(a.score, 0)) AS total_marks,
                    CAST(
                        CASE WHEN COUNT(ans.id) > 0 
                             THEN (SUM(CASE WHEN ans.is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100.0) / COUNT(ans.id)
                             ELSE 0.0 
                        END AS DECIMAL(5,1)
                    ) AS average_accuracy,
                    SUM(CASE WHEN a.completed_at IS NOT NULL AND a.started_at IS NOT NULL 
                             THEN DATEDIFF(SECOND, a.started_at, a.completed_at) 
                             ELSE 0 
                        END) AS total_time_spent_seconds
                FROM dbo.users u
                INNER JOIN dbo.students s ON u.id = s.user_id
                LEFT JOIN dbo.franchises f ON s.franchise_id = f.id
                LEFT JOIN dbo.attempts a ON (a.student_id = u.id OR a.student_id = s.id)
                LEFT JOIN dbo.answers ans ON ans.attempt_id = a.id
                WHERE u.role = 'STUDENT'
                  AND (@FranchiseIdFilter IS NULL OR s.franchise_id = @FranchiseIdFilter)
                  AND (
                      @TimeRange = 'all' OR 
                      (@TimeRange = 'today' AND a.started_at >= CAST(GETDATE() AS DATE)) OR
                      (@TimeRange = 'week' AND a.started_at >= DATEADD(DAY, -7, GETDATE())) OR
                      (@TimeRange = 'month' AND a.started_at >= DATEADD(MONTH, -1, GETDATE()))
                  ) AND u.franchise_id = @FranchiseId
                GROUP BY u.id, u.name, u.email, f.name
                HAVING COUNT(DISTINCT a.id) > 0
            ),
            RankedLeaderboard AS
            (
                SELECT 
                    ROW_NUMBER() OVER (
                        ORDER BY 
                            CASE WHEN @SortBy = 'marks' THEN total_marks END DESC,
                            CASE WHEN @SortBy = 'marks' THEN average_accuracy END DESC,
                            CASE WHEN @SortBy = 'practice' THEN total_questions_solved END DESC,
                            CASE WHEN @SortBy = 'practice' THEN total_attempts END DESC,
                            total_marks DESC
                    ) AS rank,
                    *
                FROM LeaderboardCTE
            )

            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    (
                        SELECT * 
                        FROM RankedLeaderboard
                        ORDER BY rank ASC
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

    END TRY

    BEGIN CATCH

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
        -- ERROR LOGGING
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
            'SpLeaderboard',
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
