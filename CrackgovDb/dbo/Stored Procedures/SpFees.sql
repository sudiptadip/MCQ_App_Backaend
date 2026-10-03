CREATE PROCEDURE [dbo].[SpFees]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    DECLARE 
                @student_fee_id INT,
                @amount_paid DECIMAL(18,2),
                @payment_mode NVARCHAR(50),
                @transaction_ref NVARCHAR(100),
                @remarks NVARCHAR(MAX),
                @student_id INT,
                @curr_due DECIMAL(18,2),
                @curr_net DECIMAL(18,2),
                @curr_paid DECIMAL(18,2),
                @new_paid DECIMAL(18,2),
                @new_due DECIMAL(18,2),
                @new_status NVARCHAR(50),
                @payment_id INT,
                @generated_receipt NVARCHAR(100);
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        -- ============================================================
        -- MODE 1: FEES DASHBOARD ANALYTICS & RECENT TRANSACTIONS
        -- ============================================================
        IF (@Mode = 1)
        BEGIN
            WITH FeeMetrics AS (
                SELECT 
                    ISNULL(SUM(paid_amount), 0) AS total_collected,
                    ISNULL(SUM(due_amount), 0) AS total_due,
                    ISNULL(SUM(net_amount), 0) AS total_net,
                    COUNT(CASE WHEN due_amount > 0 AND due_date < CAST(GETDATE() AS DATE) THEN 1 END) AS overdue_count,
                    COUNT(CASE WHEN due_amount > 0 THEN 1 END) AS pending_count
                FROM [dbo].[student_fees] WITH (NOLOCK)
                WHERE (@FranchiseId IS NULL OR franchise_id = @FranchiseId)
            )
            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT
                            (SELECT total_collected FROM FeeMetrics) AS total_collected,
                            (SELECT total_due FROM FeeMetrics) AS total_due,
                            (SELECT total_net FROM FeeMetrics) AS total_net,
                            (SELECT overdue_count FROM FeeMetrics) AS overdue_count,
                            (SELECT pending_count FROM FeeMetrics) AS pending_count,
                            (SELECT CASE WHEN total_net > 0 THEN ROUND((total_collected / total_net) * 100, 1) ELSE 0 END FROM FeeMetrics) AS collection_rate,
                            (
                                SELECT TOP (10)
                                    fp.id AS payment_id,
                                    fp.receipt_no,
                                    fp.amount_paid,
                                    fp.payment_mode,
                                    fp.transaction_ref,
                                    fp.payment_date,
                                    u.name AS student_name,
                                    u.email AS student_email,
                                    fs.name AS fee_structure_name
                                FROM [dbo].[fee_payments] fp WITH (NOLOCK)
                                JOIN [dbo].[users] u WITH (NOLOCK) ON fp.student_id = u.id
                                JOIN [dbo].[student_fees] sf WITH (NOLOCK) ON fp.student_fee_id = sf.id
                                JOIN [dbo].[fee_structures] fs WITH (NOLOCK) ON sf.fee_structure_id = fs.id
                                WHERE (@FranchiseId IS NULL OR fp.franchise_id = @FranchiseId)
                                ORDER BY fp.payment_date DESC
                                FOR JSON PATH
                            ) AS recent_payments
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 2: GET STUDENT FEE STATEMENTS & LIST
        -- ============================================================
        IF (@Mode = 2)
        BEGIN
            DECLARE @SearchText NVARCHAR(255) = NULL, @StatusFilter NVARCHAR(50) = NULL, @TargetStudentId INT = NULL;
            SELECT 
                @SearchText = JSON_VALUE(@Json, '$.search'),
                @StatusFilter = JSON_VALUE(@Json, '$.status'),
                @TargetStudentId = JSON_VALUE(@Json, '$.student_id');
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    (
                        SELECT 
                            sf.id AS student_fee_id,
                            sf.student_id,
                            u.name AS student_name,
                            u.email AS student_email,
                            fs.id AS fee_structure_id,
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
                            END AS status,
                            sf.created_at
                        FROM [dbo].[student_fees] sf WITH (NOLOCK)
                        JOIN [dbo].[users] u WITH (NOLOCK) ON sf.student_id = u.id
                        JOIN [dbo].[fee_structures] fs WITH (NOLOCK) ON sf.fee_structure_id = fs.id
                        WHERE (@FranchiseId IS NULL OR sf.franchise_id = @FranchiseId)
                          AND (@TargetStudentId IS NULL OR sf.student_id = @TargetStudentId)
                          AND (@StatusFilter IS NULL OR @StatusFilter = '' OR @StatusFilter = 'ALL' 
                               OR (@StatusFilter = 'OVERDUE' AND sf.due_amount > 0 AND sf.due_date < CAST(GETDATE() AS DATE))
                               OR (sf.status = @StatusFilter))
                          AND (@SearchText IS NULL OR @SearchText = '' OR u.name LIKE '%' + @SearchText + '%' OR u.email LIKE '%' + @SearchText + '%')
                        ORDER BY sf.due_date ASC
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 3: RECORD PAYMENT / COLLECT DUES
        -- ============================================================
        IF (@Mode = 3)
        BEGIN
            
            SELECT 
                @student_fee_id = JSON_VALUE(@Json, '$.student_fee_id'),
                @amount_paid = CAST(JSON_VALUE(@Json, '$.amount_paid') AS DECIMAL(18,2)),
                @payment_mode = ISNULL(JSON_VALUE(@Json, '$.payment_mode'), 'CASH'),
                @transaction_ref = JSON_VALUE(@Json, '$.transaction_ref'),
                @remarks = JSON_VALUE(@Json, '$.remarks');
            IF @student_fee_id IS NULL OR @amount_paid IS NULL OR @amount_paid <= 0
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Invalid payment details or amount.' AS [Message], NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END
            SELECT 
                @student_id = student_id,
                @curr_net = net_amount,
                @curr_paid = paid_amount,
                @curr_due = due_amount,
                @FranchiseId = ISNULL(@FranchiseId, franchise_id)
            FROM [dbo].[student_fees]
            WHERE id = @student_fee_id;
            IF @student_id IS NULL
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 404 AS StatusCode, 0 AS IsSuccess, 'Student fee record not found.' AS [Message], NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END
            BEGIN TRANSACTION;
            SET @new_paid = @curr_paid + @amount_paid;
            SET @new_due = @curr_net - @new_paid;
            IF @new_due < 0 SET @new_due = 0;
            IF @new_due <= 0 
                SET @new_status = 'PAID';
            ELSE IF @new_paid > 0 
                SET @new_status = 'PARTIAL';
            ELSE 
                SET @new_status = 'PENDING';
            UPDATE [dbo].[student_fees]
            SET 
                paid_amount = @new_paid,
                due_amount = @new_due,
                status = @new_status
            WHERE id = @student_fee_id;
            -- Generate Receipt Number: e.g. REC-20260902-10045
            SET @generated_receipt = 'REC-' + CONVERT(NVARCHAR(8), GETDATE(), 112) + '-' + CAST(CAST(RAND() * 89999 + 10000 AS INT) AS NVARCHAR(10));
            INSERT INTO [dbo].[fee_payments]
            (
                student_fee_id,
                student_id,
                receipt_no,
                amount_paid,
                payment_mode,
                transaction_ref,
                payment_date,
                collected_by,
                remarks,
                franchise_id
            )
            VALUES
            (
                @student_fee_id,
                @student_id,
                @generated_receipt,
                @amount_paid,
                @payment_mode,
                @transaction_ref,
                GETDATE(),
                @UserId,
                @remarks,
                @FranchiseId
            );
            SET @payment_id = SCOPE_IDENTITY();
            COMMIT TRANSACTION;
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Payment recorded successfully' AS [Message],
                    JSON_QUERY((
                        SELECT 
                            @payment_id AS payment_id,
                            @generated_receipt AS receipt_no,
                            @amount_paid AS amount_paid,
                            @new_due AS remaining_due,
                            @new_status AS status
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 4: GET FEE STRUCTURES LIST
        -- ============================================================
        IF (@Mode = 4)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    (
                        SELECT 
                            id,
                            name,
                            amount,
                            frequency,
                            description,
                            status,
                            created_at
                        FROM [dbo].[fee_structures] WITH (NOLOCK)
                        WHERE (@FranchiseId IS NULL OR franchise_id = @FranchiseId)
                        ORDER BY created_at DESC
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 5: UPSERT FEE STRUCTURE
        -- ============================================================
        IF (@Mode = 5)
        BEGIN
            DECLARE 
                @fs_id INT,
                @fs_name NVARCHAR(255),
                @fs_amount DECIMAL(18,2),
                @fs_frequency NVARCHAR(50),
                @fs_description NVARCHAR(MAX);
            SELECT 
                @fs_id = JSON_VALUE(@Json, '$.id'),
                @fs_name = JSON_VALUE(@Json, '$.name'),
                @fs_amount = CAST(JSON_VALUE(@Json, '$.amount') AS DECIMAL(18,2)),
                @fs_frequency = ISNULL(JSON_VALUE(@Json, '$.frequency'), 'Monthly'),
                @fs_description = JSON_VALUE(@Json, '$.description');
            IF @fs_id IS NULL OR @fs_id = 0
            BEGIN
                INSERT INTO [dbo].[fee_structures] (name, amount, frequency, description, franchise_id, status)
                VALUES (@fs_name, @fs_amount, @fs_frequency, @fs_description, ISNULL(@FranchiseId, 1), 1);
            END
            ELSE
            BEGIN
                UPDATE [dbo].[fee_structures]
                SET 
                    name = @fs_name,
                    amount = @fs_amount,
                    frequency = @fs_frequency,
                    description = @fs_description
                WHERE id = @fs_id;
            END
            SET @Output = JSON_QUERY((
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Fee plan saved successfully' AS [Message], NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 6: CREATE MANUAL STUDENT FEE ENTRY (WITH RECURRING MONTHS & DISCOUNT)
        -- ============================================================
        IF (@Mode = 6)
        BEGIN
            DECLARE 
                @assign_student_id INT,
                @assign_fee_structure_id INT = NULL,
                @fee_title NVARCHAR(255),
                @total_fee DECIMAL(18,2),
                @assign_discount DECIMAL(18,2),
                @initial_paid DECIMAL(18,2),
                @assign_payment_mode NVARCHAR(50),
                @assign_due_date DATE,
                @assign_remarks NVARCHAR(MAX),
                @number_of_months INT = 1,
                @calc_net DECIMAL(18,2),
                @calc_due DECIMAL(18,2),
                @calc_status NVARCHAR(50),
                @inserted_student_fee_id INT,
                @first_student_fee_id INT = NULL,
                @init_payment_id INT = NULL,
                @init_receipt_no NVARCHAR(100) = NULL,
                @month_idx INT = 0,
                @curr_due_date DATE,
                @month_title NVARCHAR(255);
            SELECT 
                @assign_student_id = JSON_VALUE(@Json, '$.student_id'),
                @assign_fee_structure_id = JSON_VALUE(@Json, '$.fee_structure_id'),
                @fee_title = JSON_VALUE(@Json, '$.fee_title'),
                @total_fee = CAST(JSON_VALUE(@Json, '$.total_amount') AS DECIMAL(18,2)),
                @assign_discount = ISNULL(CAST(JSON_VALUE(@Json, '$.discount_amount') AS DECIMAL(18,2)), 0),
                @initial_paid = ISNULL(CAST(JSON_VALUE(@Json, '$.initial_paid_amount') AS DECIMAL(18,2)), 0),
                @assign_payment_mode = ISNULL(JSON_VALUE(@Json, '$.payment_mode'), 'CASH'),
                @assign_due_date = CAST(ISNULL(JSON_VALUE(@Json, '$.due_date'), DATEADD(day, 15, GETDATE())) AS DATE),
                @assign_remarks = JSON_VALUE(@Json, '$.remarks'),
                @number_of_months = ISNULL(CAST(JSON_VALUE(@Json, '$.number_of_months') AS INT), 1);
            IF @number_of_months < 1 SET @number_of_months = 1;
            IF @number_of_months > 24 SET @number_of_months = 24;
            -- Validation: No free courses (total_fee must be > 0)
            IF @total_fee IS NULL OR @total_fee <= 0
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Total fee amount must be greater than 0.' AS [Message], NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END
            SET @calc_net = @total_fee - @assign_discount;
            IF @calc_net < 0 SET @calc_net = 0;
            BEGIN TRANSACTION;
            WHILE (@month_idx < @number_of_months)
            BEGIN
                SET @curr_due_date = DATEADD(month, @month_idx, @assign_due_date);
                
                IF @number_of_months > 1
                    SET @month_title = ISNULL(@fee_title, 'Monthly Fee') + ' (Installment ' + CAST(@month_idx + 1 AS NVARCHAR) + '/' + CAST(@number_of_months AS NVARCHAR) + ')';
                ELSE
                    SET @month_title = ISNULL(@fee_title, 'Course Fee');
                -- Handle fee_structure_id
                DECLARE @curr_struct_id INT = @assign_fee_structure_id;
                IF @curr_struct_id IS NULL
                BEGIN
                    SELECT TOP 1 @curr_struct_id = id FROM [dbo].[fee_structures] WHERE name = @month_title AND (@FranchiseId IS NULL OR franchise_id = @FranchiseId);
                    IF @curr_struct_id IS NULL
                    BEGIN
                        INSERT INTO [dbo].[fee_structures] (name, amount, frequency, description, franchise_id, status)
                        VALUES (@month_title, @total_fee, 'Monthly', 'Auto generated installment', ISNULL(@FranchiseId, 1), 1);
                        SET @curr_struct_id = SCOPE_IDENTITY();
                    END
                END
                -- For the 1st installment, apply initial_paid. For subsequent months, initial_paid = 0
                IF @month_idx = 0 SET @curr_paid = @initial_paid;
                SET @calc_due = @calc_net - @curr_paid;
                IF @calc_due < 0 SET @calc_due = 0;
                IF @calc_due <= 0 
                    SET @calc_status = 'PAID';
                ELSE IF @curr_paid > 0 
                    SET @calc_status = 'PARTIAL';
                ELSE 
                    SET @calc_status = 'PENDING';
                INSERT INTO [dbo].[student_fees]
                (
                    student_id,
                    fee_structure_id,
                    total_amount,
                    discount_amount,
                    net_amount,
                    paid_amount,
                    due_amount,
                    due_date,
                    status,
                    franchise_id
                )
                VALUES
                (
                    @assign_student_id,
                    @curr_struct_id,
                    @total_fee,
                    @assign_discount,
                    @calc_net,
                    @curr_paid,
                    @calc_due,
                    @curr_due_date,
                    @calc_status,
                    ISNULL(@FranchiseId, 1)
                );
                SET @inserted_student_fee_id = SCOPE_IDENTITY();
                IF @month_idx = 0 SET @first_student_fee_id = @inserted_student_fee_id;
                -- Record initial payment for 1st installment if paid
                IF @month_idx = 0 AND @initial_paid > 0
                BEGIN
                    SET @init_receipt_no = 'REC-' + CONVERT(NVARCHAR(8), GETDATE(), 112) + '-' + CAST(CAST(RAND() * 89999 + 10000 AS INT) AS NVARCHAR(10));
                    INSERT INTO [dbo].[fee_payments]
                    (
                        student_fee_id,
                        student_id,
                        receipt_no,
                        amount_paid,
                        payment_mode,
                        payment_date,
                        collected_by,
                        remarks,
                        franchise_id
                    )
                    VALUES
                    (
                        @inserted_student_fee_id,
                        @assign_student_id,
                        @init_receipt_no,
                        @initial_paid,
                        @assign_payment_mode,
                        GETDATE(),
                        @UserId,
                        @assign_remarks,
                        ISNULL(@FranchiseId, 1)
                    );
                    SET @init_payment_id = SCOPE_IDENTITY();
                END
                SET @month_idx = @month_idx + 1;
            END
            COMMIT TRANSACTION;
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode, 
                    1 AS IsSuccess, 
                    CAST(@number_of_months AS NVARCHAR) + ' monthly fee installment(s) created successfully' AS [Message], 
                    JSON_QUERY((
                        SELECT 
                            @first_student_fee_id AS student_fee_id,
                            @init_payment_id AS payment_id,
                            @init_receipt_no AS receipt_no
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 7: GET PAYMENT RECEIPT DETAILS
        -- ============================================================
        IF (@Mode = 7)
        BEGIN
            DECLARE @rec_payment_id INT = NULL, @rec_no NVARCHAR(100) = NULL;
            SELECT 
                @rec_payment_id = JSON_VALUE(@Json, '$.payment_id'),
                @rec_no = JSON_VALUE(@Json, '$.receipt_no');
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT TOP (1)
                            fp.id AS payment_id,
                            fp.receipt_no,
                            fp.amount_paid,
                            fp.payment_mode,
                            fp.transaction_ref,
                            fp.payment_date,
                            fp.remarks,
                            u.name AS student_name,
                            u.email AS student_email,
                            fs.name AS fee_structure_name,
                            sf.total_amount,
                            sf.discount_amount,
                            sf.net_amount,
                            sf.paid_amount,
                            sf.due_amount,
                            sf.status AS fee_status,
                            f.name AS franchise_name,
                            f.contact_phone AS franchise_phone,
                            f.contact_email AS franchise_email
                        FROM [dbo].[fee_payments] fp WITH (NOLOCK)
                        JOIN [dbo].[users] u WITH (NOLOCK) ON fp.student_id = u.id
                        JOIN [dbo].[student_fees] sf WITH (NOLOCK) ON fp.student_fee_id = sf.id
                        JOIN [dbo].[fee_structures] fs WITH (NOLOCK) ON sf.fee_structure_id = fs.id
                        LEFT JOIN [dbo].[franchises] f WITH (NOLOCK) ON fp.franchise_id = f.id
                        WHERE (@rec_payment_id IS NOT NULL AND fp.id = @rec_payment_id)
                           OR (@rec_no IS NOT NULL AND fp.receipt_no = @rec_no)
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 8: GET STUDENT DUES & PAYMENT RECEIPTS FOR STUDENT PORTAL
        -- ============================================================
        IF (@Mode = 8)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT
                            (
                                SELECT 
                                    sf.id AS student_fee_id,
                                    fs.name AS fee_title,
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
                                WHERE sf.student_id = @UserId
                                ORDER BY sf.due_date ASC
                                FOR JSON PATH
                            ) AS fee_schedule,
                            (
                                SELECT 
                                    fp.id AS payment_id,
                                    fp.receipt_no,
                                    fp.amount_paid,
                                    fp.payment_mode,
                                    fp.payment_date,
                                    fs.name AS fee_title
                                FROM [dbo].[fee_payments] fp WITH (NOLOCK)
                                JOIN [dbo].[student_fees] sf WITH (NOLOCK) ON fp.student_fee_id = sf.id
                                JOIN [dbo].[fee_structures] fs WITH (NOLOCK) ON sf.fee_structure_id = fs.id
                                WHERE fp.student_id = @UserId
                                ORDER BY fp.payment_date DESC
                                FOR JSON PATH
                            ) AS payment_history
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
        -- ============================================================
        -- MODE 9: PAYMENT REPORTS WITH DATE RANGE, MODE & STUDENT FILTERS
        -- ============================================================
        IF (@Mode = 9)
        BEGIN
            DECLARE 
                @FromDate DATE = NULL,
                @ToDate DATE = NULL,
                @ReportMode NVARCHAR(50) = NULL,
                @ReportStudentId INT = NULL,
                @ReportSearch NVARCHAR(255) = NULL;
            SELECT 
                @FromDate = CAST(JSON_VALUE(@Json, '$.from_date') AS DATE),
                @ToDate = CAST(JSON_VALUE(@Json, '$.to_date') AS DATE),
                @ReportMode = JSON_VALUE(@Json, '$.payment_mode'),
                @ReportStudentId = JSON_VALUE(@Json, '$.student_id'),
                @ReportSearch = JSON_VALUE(@Json, '$.search');
            WITH FilteredPayments AS (
                SELECT 
                    fp.id AS payment_id,
                    fp.receipt_no,
                    fp.amount_paid,
                    fp.payment_mode,
                    fp.transaction_ref,
                    fp.payment_date,
                    fp.remarks,
                    u.name AS student_name,
                    u.email AS student_email,
                    fs.name AS fee_title,
                    ISNULL(collector.name, 'Admin/Staff') AS collected_by_name
                FROM [dbo].[fee_payments] fp WITH (NOLOCK)
                JOIN [dbo].[users] u WITH (NOLOCK) ON fp.student_id = u.id
                JOIN [dbo].[student_fees] sf WITH (NOLOCK) ON fp.student_fee_id = sf.id
                JOIN [dbo].[fee_structures] fs WITH (NOLOCK) ON sf.fee_structure_id = fs.id
                LEFT JOIN [dbo].[users] collector WITH (NOLOCK) ON fp.collected_by = collector.id
                WHERE (@FranchiseId IS NULL OR fp.franchise_id = @FranchiseId)
                  AND (@FromDate IS NULL OR CAST(fp.payment_date AS DATE) >= @FromDate)
                  AND (@ToDate IS NULL OR CAST(fp.payment_date AS DATE) <= @ToDate)
                  AND (@ReportMode IS NULL OR @ReportMode = '' OR @ReportMode = 'ALL' OR fp.payment_mode = @ReportMode)
                  AND (@ReportStudentId IS NULL OR fp.student_id = @ReportStudentId)
                  AND (@ReportSearch IS NULL OR @ReportSearch = '' 
                       OR fp.receipt_no LIKE '%' + @ReportSearch + '%' 
                       OR u.name LIKE '%' + @ReportSearch + '%' 
                       OR fp.transaction_ref LIKE '%' + @ReportSearch + '%')
            )
            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
                    JSON_QUERY((
                        SELECT
                            ISNULL((SELECT SUM(amount_paid) FROM FilteredPayments), 0) AS total_amount,
                            ISNULL((SELECT COUNT(*) FROM FilteredPayments), 0) AS total_count,
                            ISNULL((SELECT SUM(amount_paid) FROM FilteredPayments WHERE payment_mode = 'CASH'), 0) AS cash_amount,
                            ISNULL((SELECT SUM(amount_paid) FROM FilteredPayments WHERE payment_mode <> 'CASH'), 0) AS digital_amount,
                            (
                                SELECT 
                                    payment_id,
                                    receipt_no,
                                    amount_paid,
                                    payment_mode,
                                    transaction_ref,
                                    payment_date,
                                    remarks,
                                    student_name,
                                    student_email,
                                    fee_title,
                                    collected_by_name
                                FROM FilteredPayments
                                ORDER BY payment_date DESC
                                FOR JSON PATH
                            ) AS payments
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