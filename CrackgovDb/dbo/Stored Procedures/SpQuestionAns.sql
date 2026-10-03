
CREATE PROCEDURE [dbo].[SpQuestionAns] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN

    SET NOCOUNT ON;

    DECLARE 
        @question_text NVARCHAR(MAX),
        @category_id INT,
        @difficulty_level NVARCHAR(20),
        @SuccessMessage NVARCHAR(100),
        @sqlQuery NVARCHAR(MAX),
        @search NVARCHAR(255),
        @root_category_id INT,
        @order_by NVARCHAR(200),
        @page INT,
        @page_size INT,
        @offset INT,
        @question_id INT,
        @question_explanation NVARCHAR(MAX),
        @image_document_id int,
        @tag NVARCHAR(500);

    BEGIN TRY


      IF(@Mode = 1)
      BEGIN
      
          BEGIN TRANSACTION;
      
          -----------------------------------------
          -- Get Question Data
          -----------------------------------------
          SELECT
              @question_id = id,
              @question_text = question_text,
              @category_id = category_id,
              @difficulty_level = difficulty_level,
              @question_explanation = question_explanation,
              @tag = tag,
              @image_document_id = image_document_id
          FROM OPENJSON(@Json, '$.question')
          WITH
          (
              id INT '$.id',
              question_text NVARCHAR(MAX) '$.question_text',
              category_id INT '$.category_id',
              difficulty_level NVARCHAR(20) '$.difficulty_level',
              question_explanation NVARCHAR(MAX) '$.question_explanation',
              tag NVARCHAR(500) '$.tag',
              image_document_id int '$.image_document_id'
          );
      
          -----------------------------------------
          -- UPDATE QUESTION
          -----------------------------------------
          IF(@question_id IS NOT NULL AND @question_id > 0)
          BEGIN
      
              UPDATE questions
              SET
                  question_text = @question_text,
                  category_id = @category_id,
                  difficulty_level = @difficulty_level,
                  question_explanation = @question_explanation,
                  tag = @tag,
                  image_document_id = @image_document_id
              WHERE id = @question_id
              AND franchise_id = @FranchiseId;
      
              -----------------------------------------
              -- UPDATE EXISTING OPTIONS
              -----------------------------------------
              UPDATE o
              SET
                  o.option_text = opt.option_text,
                  o.is_correct = opt.is_correct
              FROM options o
              INNER JOIN OPENJSON(@Json, '$.options')
              WITH
              (
                  optionId INT '$.id',
                  option_text NVARCHAR(MAX) '$.option_text',
                  is_correct BIT '$.is_correct'
              ) opt
                  ON o.id = opt.optionId
              WHERE o.question_id = @question_id;
      
              -----------------------------------------
              -- INSERT NEW OPTIONS
              -----------------------------------------
              INSERT INTO options
              (
                  question_id,
                  option_text,
                  is_correct
              )
              SELECT
                  @question_id,
                  opt.option_text,
                  opt.is_correct
              FROM OPENJSON(@Json, '$.options')
              WITH
              (
                  optionId INT '$.id',
                  option_text NVARCHAR(MAX) '$.option_text',
                  is_correct BIT '$.is_correct'
              ) opt
              WHERE ISNULL(opt.optionId, 0) = 0;
      
              -----------------------------------------
              -- DELETE REMOVED OPTIONS
              -----------------------------------------
              DELETE FROM options
              WHERE question_id = @question_id
              AND id NOT IN
              (
                  SELECT ISNULL(optionId, 0)
                  FROM OPENJSON(@Json, '$.options')
                  WITH
                  (
                      optionId INT '$.id'
                  )
                  WHERE ISNULL(optionId, 0) > 0
              );
      
              SET @SuccessMessage = 'Question updated successfully';
      
          END
          ELSE
          BEGIN
      
              -----------------------------------------
              -- INSERT QUESTION
              -----------------------------------------
              INSERT INTO questions
              (
                  question_text,
                  category_id,
                  difficulty_level,
                  created_by,
                  created_at,
                  franchise_id,
                  question_explanation,
                  tag,
                  image_document_id
              )
              VALUES
              (
                  @question_text,
                  @category_id,
                  @difficulty_level,
                  @UserId,
                  GETDATE(),
                  @FranchiseId,
                  @question_explanation,
                  @tag,
                  @image_document_id
              );
      
              SET @question_id = SCOPE_IDENTITY();
      
              -----------------------------------------
              -- INSERT OPTIONS
              -----------------------------------------
              INSERT INTO options
              (
                  question_id,
                  option_text,
                  is_correct
              )
              SELECT
                  @question_id,
                  option_text,
                  is_correct
              FROM OPENJSON(@Json, '$.options')
              WITH
              (
                  option_text NVARCHAR(MAX) '$.option_text',
                  is_correct BIT '$.is_correct'
              );
      
              SET @SuccessMessage = 'Question inserted successfully';
      
          END
      
          COMMIT TRANSACTION;
      
          -----------------------------------------
          -- SUCCESS RESPONSE
          -----------------------------------------
          SET @Output = JSON_QUERY((
              SELECT 
                  200 AS StatusCode,
                  1 AS IsSuccess,
                  @SuccessMessage AS [Message],
                  @question_id AS Response
              FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
          ));
      
          RETURN;
      
      END


        --IF(@Mode = 2)
        --BEGIN

        --    SET @Output = JSON_QUERY((
        --        SELECT 
        --            200 AS StatusCode,
        --            1 AS IsSuccess,
        --            (Select q.id, q.question_text, q.category_id, q.question_explanation, q.tag, c.name as category_name, difficulty_level,
        --              (
        --                select o.is_correct, o.option_text from options o where o.question_id = q.id for json path
        --              ) as options
        --              from questions q join categories c 
        --              on q.category_id = c.id where 
        --            q.franchise_id = @FranchiseId for json path
        --            ) AS [Response],
        --            'success' AS [Message]
        --        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        --    ));

        --    RETURN;
        --END

        -- Ensure these parameters are defined at the top of your Stored Procedure:
-- @pageNumber INT = 1,
-- @pageSize INT = 10,
-- @searchKeyword NVARCHAR(500) = NULL

       IF(@Mode = 2)
 BEGIN
 
     DECLARE 
         @searchKeyword NVARCHAR(500) = NULL,
         @pageNumber INT = 1,
         @pageSize INT = 10,
         @TotalCount INT = 0;
 
     -----------------------------------------
     -- READ JSON
     -----------------------------------------
     SELECT
         @searchKeyword = searchKeyword,
         @pageNumber = ISNULL(pageNumber, 1),
         @pageSize = ISNULL(pageSize, 10)
     FROM OPENJSON(@Json)
     WITH
     (
         searchKeyword NVARCHAR(500) '$.searchKeyword',
         pageNumber INT '$.pageNumber',
         pageSize INT '$.pageSize'
     );
 
     -----------------------------------------
     -- TOTAL COUNT
     -----------------------------------------
     SELECT 
         @TotalCount = COUNT(*)
     FROM questions q
     INNER JOIN categories c 
         ON q.category_id = c.id
     WHERE q.franchise_id = @FranchiseId
     AND
     (
         @searchKeyword IS NULL
         OR @searchKeyword = ''
         OR q.question_text LIKE '%' + @searchKeyword + '%'
         OR q.tag LIKE '%' + @searchKeyword + '%'
         OR c.name LIKE '%' + @searchKeyword + '%'
     );
 
     -----------------------------------------
     -- RESPONSE
     -----------------------------------------
     SET @Output = JSON_QUERY((
         SELECT 
             200 AS StatusCode,
             1 AS IsSuccess,
             JSON_QUERY(
             (
                 SELECT 
                     q.id,
                     q.question_text,
                     q.category_id,
                     q.question_explanation,
                     q.tag,
                     c.name AS category_name,
                     q.difficulty_level,
                     @TotalCount AS total_count, -- 👈 ADDED HERE INSIDE THE QUESTION OBJECT

                     JSON_QUERY(
                     (
                         SELECT 
                             o.id,
                             o.option_text,
                             o.is_correct
                         FROM options o
                         WHERE o.question_id = q.id
                         FOR JSON PATH
                     )) AS options
 
                 FROM questions q
                 INNER JOIN categories c 
                     ON q.category_id = c.id
 
                 WHERE q.franchise_id = @FranchiseId
                 AND
                 (
                     @searchKeyword IS NULL
                     OR @searchKeyword = ''
                     OR q.question_text LIKE '%' + @searchKeyword + '%'
                     OR q.tag LIKE '%' + @searchKeyword + '%'
                     OR c.name LIKE '%' + @searchKeyword + '%'
                 )
 
                 ORDER BY q.id DESC
 
                 OFFSET (@pageNumber - 1) * @pageSize ROWS
                 FETCH NEXT @pageSize ROWS ONLY
 
                 FOR JSON PATH
             )) AS [Response],
 
             'Questions fetched successfully' AS [Message]
 
         FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
     ));
 
     RETURN;
 
 END


        IF(@Mode = 3)
        BEGIN

            BEGIN TRANSACTION;

            -----------------------------------------
            -- Get Question Id
            -----------------------------------------
            SELECT  
                @question_id = id
            FROM OPENJSON(@Json)
            WITH
            (
                id INT '$.id'
            );

            -----------------------------------------
            -- DELETE OPTIONS
            -----------------------------------------
            DELETE FROM options
            WHERE question_id = @question_id;

            -----------------------------------------
            -- DELETE QUESTION
            -----------------------------------------
            DELETE FROM questions
            WHERE id = @question_id
            AND franchise_id = @FranchiseId;

            COMMIT TRANSACTION;

            -----------------------------------------
            -- Success Response
            -----------------------------------------
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Question deleted successfully' AS [Message],
                    @question_id AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;

END

        IF(@Mode = 4)
        Begin
            
        SELECT  
            @question_id = id
        FROM OPENJSON(@Json) 
        WITH (
            id INT '$.id'
        );

        
        Select @category_id = category_id from [dbo].[questions] where id = @question_id
        declare @parent_category_id int

        ;With cte as (
            Select * from categories where id = @category_id and franchise_id = @FranchiseId
            union all
            Select c.* from categories c join cte on c.id = cte.parent_id
        )

        SELECT @parent_category_id = id from cte where parent_id is null


        SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    JSON_QUERY((Select q.id, 
                            q.question_text, 
                            q.category_id, 
                            q.image_document_id,
                            dbo.GetDocumentUrl(q.image_document_id) as image_url,
                            @parent_category_id as root_category_id,
                            c.name as category_name,
                            q.question_explanation,
                            q.tag,
                      (
                        select o.is_correct, o.option_text, o.id from options o where o.question_id = q.id for json path
                      ) as options
                      from questions q join categories c 
                      on q.category_id = c.id where 
                    q.franchise_id = @FranchiseId and q.id = @question_id for json path, WITHOUT_ARRAY_WRAPPER
                    )) AS [Response],
                    'success' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

        End

       --IF(@Mode = 5)
       -- BEGIN
        
       --     DECLARE @Result TABLE
       --     (
       --         id INT,
       --         question_text NVARCHAR(MAX),
       --         category_id INT,
       --         difficulty_level NVARCHAR(20),
       --         franchise_id INT,
       --         created_at DATETIME,
       --         category_name NVARCHAR(255)
       --     );
        
       --     -- Default Pagination
       --     SET @page = ISNULL(@page, 1);
       --     SET @page_size = ISNULL(@page_size, 10);
        
       --     -- Read JSON
       --     SELECT
       --         @category_id = category_id,
       --         @difficulty_level = difficulty_level,
       --         @search = search,
       --         @root_category_id = root_category_id,
       --         @order_by = order_by,
       --         @page = ISNULL(page, 1),
       --         @page_size = ISNULL(page_size, 10)
       --     FROM OPENJSON(@Json)
       --     WITH
       --     (
       --         category_id INT '$.category_id',
       --         difficulty_level NVARCHAR(20) '$.difficulty_level',
       --         search NVARCHAR(255) '$.search',
       --         root_category_id INT '$.root_category_id',
       --         order_by NVARCHAR(200) '$.order_by',
       --         page INT '$.page',
       --         page_size INT '$.page_size'
       --     );

       --    -- set @order_by = 'latest'
        
       --     SET @offset = (@page - 1) * @page_size;
        
       --     -- Base Query
       --     SET @sqlQuery = '
       --         SELECT 
       --             q.id,
       --             q.question_text,
       --             q.category_id,
       --             q.difficulty_level,
       --             q.franchise_id,
       --             q.created_at,
       --             c.name
       --         FROM dbo.questions q
       --         JOIN dbo.categories c ON q.category_id = c.id
       --         WHERE q.franchise_id = @FranchiseId
       --         AND (@category_id IS NULL OR q.category_id = @category_id)
       --         AND (@difficulty_level IS NULL OR q.difficulty_level = @difficulty_level)
       --         AND (
       --                 @search IS NULL 
       --                 OR q.question_text LIKE ''%'' + @search + ''%''
       --             )
       --     ';
        
       --     -- Order By
       --     IF(@order_by IS NOT NULL)
       --     BEGIN
       --         IF(@order_by = 'latest')
       --         BEGIN
       --             SET @sqlQuery = @sqlQuery + ' ORDER BY q.created_at DESC ';
       --         END
       --         ELSE IF(@order_by = 'oldest')
       --         BEGIN
       --             SET @sqlQuery = @sqlQuery + ' ORDER BY q.created_at ASC ';
       --         END
       --         ELSE IF(@order_by = 'difficulty_asc')
       --         BEGIN
       --             SET @sqlQuery = @sqlQuery + ' ORDER BY q.difficulty_level ASC ';
       --         END
       --         ELSE IF(@order_by = 'difficulty_desc')
       --         BEGIN
       --             SET @sqlQuery = @sqlQuery + ' ORDER BY q.difficulty_level DESC ';
       --         END
       --         ELSE
       --         BEGIN
       --             SET @sqlQuery = @sqlQuery + ' ORDER BY q.id DESC ';
       --         END
       --     END
       --     ELSE
       --     BEGIN
       --         SET @sqlQuery = @sqlQuery + ' ORDER BY q.id DESC ';
       --     END
        
       --     -- Pagination
       --     SET @sqlQuery = @sqlQuery + '
       --         OFFSET @offset ROWS
       --         FETCH NEXT @page_size ROWS ONLY
       --     ';

        
       --     -- Execute Dynamic Query
       --     INSERT INTO @Result
       --     EXEC sp_executesql 
       --         @sqlQuery,
       --         N'
       --             @FranchiseId INT,
       --             @category_id INT,
       --             @difficulty_level NVARCHAR(20),
       --             @search NVARCHAR(255),
       --             @offset INT,
       --             @page_size INT
       --         ',
       --         @FranchiseId = @FranchiseId,
       --         @category_id = @category_id,
       --         @difficulty_level = @difficulty_level,
       --         @search = @search,
       --         @offset = @offset,
       --         @page_size = @page_size;
        
       --     -- Final JSON Response
       --     SET @Output = (
       --         SELECT 
       --             200 AS StatusCode,
       --             1 AS IsSuccess,
       --             (
       --                 SELECT *
       --                 FROM @Result
       --                 FOR JSON PATH
       --             ) AS [Response],
       --             'Questions fetched successfully' AS [Message]
       --         FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
       --     );
        
       -- END

              IF(@Mode = 5)
        BEGIN
        
            DECLARE @Result TABLE
            (
                id INT,
                question_text NVARCHAR(MAX),
                category_id INT,
                difficulty_level NVARCHAR(20),
                franchise_id INT,
                created_at DATETIME,
                category_name NVARCHAR(255),
                total_count INT -- Added column
            );
        
            -- Default Pagination
            SET @page = ISNULL(@page, 1);
            SET @page_size = ISNULL(@page_size, 10);
        
            -- Read JSON
            SELECT
                @category_id = category_id,
                @difficulty_level = difficulty_level,
                @search = search,
                @root_category_id = root_category_id,
                @order_by = order_by,
                @page = ISNULL(page, 1),
                @page_size = ISNULL(page_size, 10)
            FROM OPENJSON(@Json)
            WITH
            (
                category_id INT '$.category_id',
                difficulty_level NVARCHAR(20) '$.difficulty_level',
                search NVARCHAR(255) '$.search',
                root_category_id INT '$.root_category_id',
                order_by NVARCHAR(200) '$.order_by',
                page INT '$.page',
                page_size INT '$.page_size'
            );
            SET @offset = (@page - 1) * @page_size;
        
            -- Base Query
            SET @sqlQuery = '
                SELECT 
                    q.id,
                    q.question_text,
                    q.category_id,
                    q.difficulty_level,
                    q.franchise_id,
                    q.created_at,
                    c.name,
                    COUNT(*) OVER() AS total_count -- Added count window function
                FROM dbo.questions q
                JOIN dbo.categories c ON q.category_id = c.id
                WHERE q.franchise_id = @FranchiseId
                AND (@category_id IS NULL OR q.category_id = @category_id)
                AND (@difficulty_level IS NULL OR q.difficulty_level = @difficulty_level)
                AND (
                        @search IS NULL 
                        OR q.question_text LIKE ''%'' + @search + ''%''
                    )
            ';
        
            -- Order By
            IF(@order_by IS NOT NULL)
            BEGIN
                IF(@order_by = 'latest')
                BEGIN
                    SET @sqlQuery = @sqlQuery + ' ORDER BY q.created_at DESC ';
                END
                ELSE IF(@order_by = 'oldest')
                BEGIN
                    SET @sqlQuery = @sqlQuery + ' ORDER BY q.created_at ASC ';
                END
                ELSE IF(@order_by = 'difficulty_asc')
                BEGIN
                    SET @sqlQuery = @sqlQuery + ' ORDER BY q.difficulty_level ASC ';
                END
                ELSE IF(@order_by = 'difficulty_desc')
                BEGIN
                    SET @sqlQuery = @sqlQuery + ' ORDER BY q.difficulty_level DESC ';
                END
                ELSE
                BEGIN
                    SET @sqlQuery = @sqlQuery + ' ORDER BY q.id DESC ';
                END
            END
            ELSE
            BEGIN
                SET @sqlQuery = @sqlQuery + ' ORDER BY q.id DESC ';
            END
        
            -- Pagination
            SET @sqlQuery = @sqlQuery + '
                OFFSET @offset ROWS
                FETCH NEXT @page_size ROWS ONLY
            ';
            -- Execute Dynamic Query
            INSERT INTO @Result
            EXEC sp_executesql 
                @sqlQuery,
                N'
                    @FranchiseId INT,
                    @category_id INT,
                    @difficulty_level NVARCHAR(20),
                    @search NVARCHAR(255),
                    @offset INT,
                    @page_size INT
                ',
                @FranchiseId = @FranchiseId,
                @category_id = @category_id,
                @difficulty_level = @difficulty_level,
                @search = @search,
                @offset = @offset,
                @page_size = @page_size;
        
            -- Final JSON Response
            SET @Output = (
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    (
                        SELECT *
                        FROM @Result
                        FOR JSON PATH
                    ) AS [Response],
                    'Questions fetched successfully' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
        
        END
       

       IF(@Mode = 6)
        BEGIN
        
            BEGIN TRANSACTION;

            Declare @MaxLotNo int = null;

            Select @MaxLotNo = MAX(q.upload_lot_number) from questions q
        
            -----------------------------------------
            -- TEMP TABLE
            -----------------------------------------
            DECLARE @Questions TABLE
            (
                QuestionIndex INT,
                question_text NVARCHAR(MAX),
                category_id INT,
                difficulty_level NVARCHAR(20),
                is_active BIT,
                question_explanation NVARCHAR(MAX),
                tag NVARCHAR(500)
            );
        
            DECLARE @InsertedQuestions TABLE
            (
                QuestionIndex INT,
                QuestionId INT
            );
        
            -----------------------------------------
            -- STORE QUESTIONS
            -----------------------------------------
            INSERT INTO @Questions
            (
                QuestionIndex,
                question_text,
                category_id,
                difficulty_level,
                is_active,
                question_explanation,
                tag
            )
            SELECT
                CAST(q.[key] AS INT),
                j.question_text,
                j.category_id,
                j.difficulty_level,
                j.is_active,
                j.question_explanation,
                j.tag
            FROM OPENJSON(@Json, '$.questions') q
            CROSS APPLY OPENJSON(q.value, '$.question')
            WITH
            (
                question_text NVARCHAR(MAX) '$.question_text',
                category_id INT '$.category_id',
                difficulty_level NVARCHAR(20) '$.difficulty_level',
                is_active BIT '$.is_active',
                question_explanation NVARCHAR(MAX) '$.question_explanation',
                tag NVARCHAR(500) '$.tag'
            ) j;
        
            -----------------------------------------
            -- INSERT QUESTIONS
            -----------------------------------------
            MERGE questions AS target
            USING @Questions AS src
            ON 1 = 0
        
            WHEN NOT MATCHED THEN
            INSERT
            (
                question_text,
                category_id,
                difficulty_level,
                created_by,
                created_at,
                franchise_id,
                question_explanation,
                tag,
                upload_lot_number
            )
            VALUES
            (
                src.question_text,
                src.category_id,
                src.difficulty_level,
                @UserId,
                GETDATE(),
                @FranchiseId,
                src.question_explanation,
                src.tag,
                isnull(@MaxLotNo, 0) + 1
            )
        
            OUTPUT
                src.QuestionIndex,
                INSERTED.id
            INTO @InsertedQuestions
            (
                QuestionIndex,
                QuestionId
            );
        
            -----------------------------------------
            -- INSERT OPTIONS
            -----------------------------------------
            INSERT INTO options
            (
                question_id,
                option_text,
                is_correct
            )
            SELECT
                iq.QuestionId,
                opt.option_text,
                opt.is_correct
            FROM OPENJSON(@Json, '$.questions') q
        
            CROSS APPLY OPENJSON(q.value, '$.options')
            WITH
            (
                option_text NVARCHAR(MAX) '$.option_text',
                is_correct BIT '$.is_correct'
            ) opt
        
            INNER JOIN @InsertedQuestions iq
                ON iq.QuestionIndex = CAST(q.[key] AS INT);
        
            COMMIT TRANSACTION;
        
            -----------------------------------------
            -- SUCCESS RESPONSE
            -----------------------------------------
            SET @Output = JSON_QUERY((
                SELECT
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Multiple questions inserted successfully' AS [Message],
                    (
                        SELECT COUNT(*)
                        FROM @InsertedQuestions
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        
            RETURN;
        
        END

    END TRY

    BEGIN CATCH

        -----------------------------------------
        -- Rollback Transaction
        -----------------------------------------
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

        -----------------------------------------
        -- Insert Error Log
        -----------------------------------------
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
            'SpQuestionAns',
            @ErrorMessage,
            @ErrorNumber,
            @ErrorLine,
            @ErrorState,
            @ErrorSeverity,
            @UserId
        );

        -----------------------------------------
        -- Error Response
        -----------------------------------------
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
