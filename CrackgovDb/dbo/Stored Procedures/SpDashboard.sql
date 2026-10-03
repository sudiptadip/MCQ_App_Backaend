CREATE PROCEDURE [dbo].[SpDashboard]
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
        -- ============================================================
        -- MODE 1: ADMIN & FRANCHISE DASHBOARD STATS & SYSTEM ACTIVITIES
        -- ============================================================
        IF (@Mode = 1)
        BEGIN
            -- Compute high-level aggregated metrics efficiently using single CTE pass
            WITH StudentStats AS (
                SELECT COUNT(*) AS total_students
                FROM [dbo].[users] WITH (NOLOCK)
                WHERE [role] = 'STUDENT'
                  AND (@FranchiseId IS NULL OR franchise_id = @FranchiseId)
            ),
            QuestionStats AS (
                SELECT COUNT(*) AS total_questions
                FROM [dbo].[questions] WITH (NOLOCK)
                WHERE (@FranchiseId IS NULL OR franchise_id = @FranchiseId)
            ),
            TestStats AS (
                SELECT COUNT(*) AS active_tests
                FROM [dbo].[tests] WITH (NOLOCK)
                WHERE (@FranchiseId IS NULL OR franchise_id = @FranchiseId)
            ),
            AttemptStats AS (
                SELECT 
                    COUNT(*) AS total_attempts,
                    ISNULL(AVG(CAST(score AS FLOAT)), 0) AS avg_score
                FROM [dbo].[attempts] WITH (NOLOCK)
                WHERE (@FranchiseId IS NULL OR franchise_id = @FranchiseId)
            ),
            MaterialStats AS (
                SELECT COUNT(*) AS total_study_materials
                FROM [dbo].[study_material] WITH (NOLOCK)
                WHERE (@FranchiseId IS NULL OR franchise_id = @FranchiseId)
            )
            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT
                            (SELECT total_students FROM StudentStats) AS total_students,
                            (SELECT total_questions FROM QuestionStats) AS total_questions,
                            (SELECT active_tests FROM TestStats) AS active_tests,
                            (SELECT total_attempts FROM AttemptStats) AS total_attempts,
                            (SELECT ROUND(avg_score, 1) FROM AttemptStats) AS avg_completion_rate,
                            (SELECT total_study_materials FROM MaterialStats) AS total_study_materials,
                            (
                                SELECT TOP (10) *
                                FROM (
                                    SELECT 
                                        'student_registered' AS [type],
                                        u.name + ' registered as a student' AS title,
                                        u.email AS description,
                                        u.created_at AS [timestamp]
                                    FROM [dbo].[users] u WITH (NOLOCK)
                                    WHERE u.role = 'STUDENT'
                                      AND (@FranchiseId IS NULL OR u.franchise_id = @FranchiseId)
                                    UNION ALL
                                    SELECT 
                                        'test_created' AS [type],
                                        'New test created: ' + t.name AS title,
                                        ISNULL(t.description, 'Test published') AS description,
                                        t.created_at AS [timestamp]
                                    FROM [dbo].[tests] t WITH (NOLOCK)
                                    WHERE (@FranchiseId IS NULL OR t.franchise_id = @FranchiseId)
                                    UNION ALL
                                    SELECT 
                                        'test_attempted' AS [type],
                                        'Test completed by student' AS title,
                                        'Score: ' + CAST(ISNULL(a.score, 0) AS NVARCHAR(20)) AS description,
                                        ISNULL(a.completed_at, a.started_at) AS [timestamp]
                                    FROM [dbo].[attempts] a WITH (NOLOCK)
                                    WHERE (@FranchiseId IS NULL OR a.franchise_id = @FranchiseId)
                                ) AS RecentActivity
                                WHERE [timestamp] IS NOT NULL
                                ORDER BY [timestamp] DESC
                                FOR JSON PATH
                            ) AS recent_activities
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 2: STUDENT DASHBOARD STATS & PERFORMANCE
        -- ============================================================
        IF (@Mode = 2)
        BEGIN
            WITH StudentAttemptStats AS (
                SELECT 
                    COUNT(*) AS total_attempts,
                    ISNULL(AVG(CAST(score AS FLOAT)), 0) AS avg_score,
                    SUM(CASE WHEN score >= 50 THEN 1 ELSE 0 END) AS passed_attempts,
                    ISNULL(SUM(DATEDIFF(minute, started_at, ISNULL(completed_at, GETDATE()))), 0) AS total_practice_time_minutes
                FROM [dbo].[attempts] WITH (NOLOCK)
                WHERE student_id = @UserId
            )
            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT
                            (SELECT total_attempts FROM StudentAttemptStats) AS total_attempts,
                            (SELECT CASE WHEN total_attempts > 0 THEN ROUND((CAST(passed_attempts AS FLOAT) / total_attempts) * 100, 1) ELSE 0 END FROM StudentAttemptStats) AS success_rate,
                            (SELECT ROUND(avg_score, 1) FROM StudentAttemptStats) AS accuracy_percentage,
                            (SELECT total_practice_time_minutes FROM StudentAttemptStats) AS practice_time_minutes,
                            (
                                SELECT TOP (5) 
                                    a.id AS attempt_id,
                                    t.name AS test_name,
                                    a.score,
                                    t.total_questions,
                                    a.started_at,
                                    a.completed_at
                                FROM [dbo].[attempts] a WITH (NOLOCK)
                                JOIN [dbo].[tests] t WITH (NOLOCK) ON a.test_id = t.id
                                WHERE a.student_id = @UserId
                                ORDER BY a.started_at DESC
                                FOR JSON PATH
                            ) AS recent_attempts
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
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