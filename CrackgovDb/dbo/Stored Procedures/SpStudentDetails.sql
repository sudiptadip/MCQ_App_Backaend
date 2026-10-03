CREATE PROCEDURE [dbo].[SpStudentDetails]
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
        -- MODE 1: GET COMPLETE STUDENT DETAILS (PROFILE, ASSIGNED CATEGORIES, DISPLAY VIEWS, PRACTICE TESTS, FEES)
        -- ============================================================
        IF (@Mode = 1)
        BEGIN
            DECLARE @TargetUserId INT;
            SELECT @TargetUserId = COALESCE(
             --   @UserId,
                CAST(JSON_VALUE(@Json, '$.student_user_id') AS INT),
                CAST(JSON_VALUE(@Json, '$.user_id') AS INT),
                CAST(JSON_VALUE(@Json, '$.id') AS INT)
            );
            IF @TargetUserId IS NULL
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Student user_id is required.' AS [Message], NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END
            -- Common Fee Aggregates for Student
           ; WITH StudentFeeMetrics AS (
                SELECT 
                    ISNULL(SUM(net_amount), 0) AS total_assigned_net,
                    ISNULL(SUM(paid_amount), 0) AS total_paid,
                    ISNULL(SUM(due_amount), 0) AS total_due,
                    COUNT(CASE WHEN due_amount > 0 AND due_date < CAST(GETDATE() AS DATE) THEN 1 END) AS overdue_count
                FROM [dbo].[student_fees] WITH (NOLOCK)
                WHERE student_id = @TargetUserId
            )
            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT
                            -- 1. Student Basic Profile
                            (
                                SELECT TOP (1)
                                    u.id,
                                    u.name,
                                    u.email,
                                    u.created_at,
                                    u.franchise_id,
                                    f.name AS franchise_name,
                                  --  s.father_name,
                                    s.mobile_no AS phone,
                                    s.address_line1,
                                    CASE WHEN u.device_fingerprint IS NOT NULL AND LEN(u.device_fingerprint) > 0 THEN 1 ELSE 0 END AS is_device_locked
                                FROM [dbo].[users] u WITH (NOLOCK)
                                LEFT JOIN [dbo].[students] s WITH (NOLOCK) ON u.id = s.user_id
                                LEFT JOIN [dbo].[franchises] f WITH (NOLOCK) ON u.franchise_id = f.id
                                WHERE u.id = @TargetUserId
                                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                            ) AS student_profile,
                            -- 2. ONLY Assigned Categories
                            (
                                SELECT 
                                    c.id,
                                    c.name,
                                    c.category_type,
                                    sac.assigned_at
                                FROM [dbo].[student_assigned_categories] sac WITH (NOLOCK)
                                JOIN [dbo].[categories] c WITH (NOLOCK) ON sac.category_id = c.id
                                WHERE sac.student_user_id = @TargetUserId
                                ORDER BY c.name ASC
                                FOR JSON PATH
                            ) AS assigned_categories,
                            -- 3. Assigned Display Views (Linked to Assigned Categories or Franchise)
                            (
                                SELECT DISTINCT
                                    dv.id,
                                    dv.display_name,
                                    dv.parent_id,
                                    dv.franchise_id
                                FROM [dbo].[display_view] dv WITH (NOLOCK)
                                JOIN [dbo].[users] u WITH (NOLOCK) ON u.id = @TargetUserId
                                WHERE dv.franchise_id = u.franchise_id
                                ORDER BY dv.display_name ASC
                                FOR JSON PATH
                            ) AS assigned_display_views,
                            -- 4. Student Practice MCQ Tests Attempts
                            (
                                SELECT 
                                    a.id AS attempt_id,
                                    a.test_id,
                                    t.name AS test_name,
                                    t.total_questions,
                                    a.score,
                                    a.started_at,
                                    a.completed_at,
                                    CASE WHEN t.total_questions > 0 THEN ROUND((CAST(ISNULL(a.score, 0) AS FLOAT) / t.total_questions) * 100, 1) ELSE 0 END AS accuracy
                                FROM [dbo].[attempts] a WITH (NOLOCK)
                                JOIN [dbo].[tests] t WITH (NOLOCK) ON a.test_id = t.id
                                WHERE a.student_id = @TargetUserId
                                ORDER BY a.started_at DESC
                                FOR JSON PATH
                            ) AS practice_tests,
                            -- 5. Student Fee Summary
                            JSON_QUERY((
                                SELECT 
                                    total_assigned_net,
                                    total_paid,
                                    total_due,
                                    CASE 
                                        WHEN total_assigned_net > 0 AND total_due = 0 THEN 'PAID'
                                        WHEN overdue_count > 0 THEN 'OVERDUE'
                                        WHEN total_paid > 0 THEN 'PARTIAL'
                                        ELSE 'PENDING'
                                    END AS account_status
                                FROM StudentFeeMetrics
                                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                            )) AS fee_summary,
                            -- 6. Fee Installments Schedule
                            (
                                SELECT 
                                    sf.id AS student_fee_id,
                                    fs.name AS fee_structure_name,
                                    sf.total_amount,
                                    sf.discount_amount,
                                    sf.net_amount,
                                    sf.paid_amount,
                                    sf.due_amount,
                                    sf.due_date,
                                    CASE 
                                        WHEN sf.due_amount > 0 AND sf.due_date < CAST(GETDATE() AS DATE) THEN 'OVERDUE'
                                        ELSE sf.status 
                                    END AS status
                                FROM [dbo].[student_fees] sf WITH (NOLOCK)
                                JOIN [dbo].[fee_structures] fs WITH (NOLOCK) ON sf.fee_structure_id = fs.id
                                WHERE sf.student_id = @TargetUserId
                                ORDER BY sf.due_date ASC
                                FOR JSON PATH
                            ) AS fee_schedule,
                            -- 7. Fee Payments History
                            (
                                SELECT 
                                    fp.id AS payment_id,
                                    fp.receipt_no,
                                    fp.amount_paid,
                                    fp.payment_mode,
                                    fp.transaction_ref,
                                    fp.payment_date,
                                    fs.name AS fee_title,
                                    ISNULL(collector.name, 'Admin/Staff') AS collected_by_name
                                FROM [dbo].[fee_payments] fp WITH (NOLOCK)
                                JOIN [dbo].[student_fees] sf WITH (NOLOCK) ON fp.student_fee_id = sf.id
                                JOIN [dbo].[fee_structures] fs WITH (NOLOCK) ON sf.fee_structure_id = fs.id
                                LEFT JOIN [dbo].[users] collector WITH (NOLOCK) ON fp.collected_by = collector.id
                                WHERE fp.student_id = @TargetUserId
                                ORDER BY fp.payment_date DESC
                                FOR JSON PATH
                            ) AS payment_history
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
    END TRY
    BEGIN CATCH
        DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
        SET @Output = JSON_QUERY((
            SELECT 500 AS StatusCode, 0 AS IsSuccess, @Err AS [Message], NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
    END CATCH
END