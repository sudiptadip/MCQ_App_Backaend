
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

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
         @pageNumber INT = NULL,
         @pageSize INT = 10,
         @cursor INT = NULL,
         @direction NVARCHAR(10) = 'next',
         @includeTotalCount BIT = 1,
         @filterLotNumber INT = NULL,
         @TotalCount INT = 0,
         @hasNextPage BIT = 0,
         @hasPrevPage BIT = 0,
         @startCursor INT = NULL,
         @endCursor INT = NULL,
         @itemsCount INT = 0;

     DECLARE @TempRaw TABLE 
     (
         id INT, 
         seq INT IDENTITY(1,1)
     );

     DECLARE @SelectedIds TABLE 
     (
         id INT
     );

     -----------------------------------------
     -- READ JSON
     -----------------------------------------
     SELECT
         @searchKeyword = searchKeyword,
         @pageNumber = pageNumber,
         @pageSize = ISNULL(pageSize, 10),
         @cursor = [cursor],
         @direction = LOWER(ISNULL(direction, 'next')),
         @includeTotalCount = ISNULL(includeTotalCount, CASE WHEN [cursor] IS NULL OR [cursor] <= 0 THEN 1 ELSE 0 END),
         @filterLotNumber = lot_number
     FROM OPENJSON(@Json)
     WITH
     (
         searchKeyword NVARCHAR(500) '$.searchKeyword',
         pageNumber INT '$.pageNumber',
         pageSize INT '$.pageSize',
         [cursor] INT '$.cursor',
         direction NVARCHAR(10) '$.direction',
         includeTotalCount BIT '$.includeTotalCount',
         lot_number INT '$.lot_number'
     );

     IF (@pageSize <= 0)
         SET @pageSize = 10;

     -----------------------------------------
     -- TOTAL COUNT (executed on first load, search, or when requested)
     -----------------------------------------
     IF (@includeTotalCount = 1)
     BEGIN
         IF (@searchKeyword IS NULL OR @searchKeyword = '')
         BEGIN
             SELECT @TotalCount = COUNT(*)
             FROM questions q
             WHERE q.franchise_id = @FranchiseId
             AND (@filterLotNumber IS NULL OR q.upload_lot_number = @filterLotNumber);
         END
         ELSE
         BEGIN
             SELECT @TotalCount = COUNT(*)
             FROM questions q
             INNER JOIN categories c 
                 ON q.category_id = c.id
             WHERE q.franchise_id = @FranchiseId
             AND (@filterLotNumber IS NULL OR q.upload_lot_number = @filterLotNumber)
             AND
             (
                 q.question_text LIKE '%' + @searchKeyword + '%'
                 OR q.tag LIKE '%' + @searchKeyword + '%'
                 OR c.name LIKE '%' + @searchKeyword + '%'
                 OR q.sheet_name LIKE '%' + @searchKeyword + '%'
                 OR (ISNUMERIC(@searchKeyword) = 1 AND q.upload_lot_number = TRY_CAST(@searchKeyword AS INT))
             );
         END
     END;

     -----------------------------------------
     -- FETCH CANDIDATE IDS
     -----------------------------------------
     -- 1. Offset pagination fallback (if pageNumber is provided and cursor is NOT provided)
     IF (@pageNumber IS NOT NULL AND @pageNumber > 0 AND @cursor IS NULL)
     BEGIN
         INSERT INTO @TempRaw (id)
         SELECT q.id
         FROM questions q
         INNER JOIN categories c 
             ON q.category_id = c.id
         WHERE q.franchise_id = @FranchiseId
         AND (@filterLotNumber IS NULL OR q.upload_lot_number = @filterLotNumber)
         AND
         (
             @searchKeyword IS NULL
             OR @searchKeyword = ''
             OR q.question_text LIKE '%' + @searchKeyword + '%'
             OR q.tag LIKE '%' + @searchKeyword + '%'
             OR c.name LIKE '%' + @searchKeyword + '%'
             OR q.sheet_name LIKE '%' + @searchKeyword + '%'
             OR (ISNUMERIC(@searchKeyword) = 1 AND q.upload_lot_number = TRY_CAST(@searchKeyword AS INT))
         )
         ORDER BY q.id DESC
         OFFSET (@pageNumber - 1) * @pageSize ROWS
         FETCH NEXT (@pageSize + 1) ROWS ONLY;

         SELECT @itemsCount = COUNT(*) FROM @TempRaw;

         IF (@itemsCount > @pageSize)
             SET @hasNextPage = 1;
         ELSE
             SET @hasNextPage = 0;

         IF (@pageNumber > 1)
             SET @hasPrevPage = 1;
         ELSE
             SET @hasPrevPage = 0;

         INSERT INTO @SelectedIds (id)
         SELECT TOP (@pageSize) id
         FROM @TempRaw
         ORDER BY seq ASC;
     END
     -- 2. Cursor pagination: PREVIOUS page
     ELSE IF (@direction = 'prev' AND @cursor IS NOT NULL AND @cursor > 0)
     BEGIN
         INSERT INTO @TempRaw (id)
         SELECT TOP (@pageSize + 1) q.id
         FROM questions q
         INNER JOIN categories c 
             ON q.category_id = c.id
         WHERE q.franchise_id = @FranchiseId
           AND q.id > @cursor
           AND (@filterLotNumber IS NULL OR q.upload_lot_number = @filterLotNumber)
           AND
           (
               @searchKeyword IS NULL
               OR @searchKeyword = ''
               OR q.question_text LIKE '%' + @searchKeyword + '%'
               OR q.tag LIKE '%' + @searchKeyword + '%'
               OR c.name LIKE '%' + @searchKeyword + '%'
               OR q.sheet_name LIKE '%' + @searchKeyword + '%'
               OR (ISNUMERIC(@searchKeyword) = 1 AND q.upload_lot_number = TRY_CAST(@searchKeyword AS INT))
           )
         ORDER BY q.id ASC;

         SELECT @itemsCount = COUNT(*) FROM @TempRaw;

         IF (@itemsCount > @pageSize)
             SET @hasPrevPage = 1;
         ELSE
             SET @hasPrevPage = 0;

         SET @hasNextPage = 1;

         INSERT INTO @SelectedIds (id)
         SELECT TOP (@pageSize) id
         FROM @TempRaw
         ORDER BY seq ASC;
     END
     -- 3. Cursor pagination: NEXT page or FIRST page
     ELSE
     BEGIN
         INSERT INTO @TempRaw (id)
         SELECT TOP (@pageSize + 1) q.id
         FROM questions q
         INNER JOIN categories c 
             ON q.category_id = c.id
         WHERE q.franchise_id = @FranchiseId
           AND (@cursor IS NULL OR @cursor <= 0 OR q.id < @cursor)
           AND (@filterLotNumber IS NULL OR q.upload_lot_number = @filterLotNumber)
           AND
           (
               @searchKeyword IS NULL
               OR @searchKeyword = ''
               OR q.question_text LIKE '%' + @searchKeyword + '%'
               OR q.tag LIKE '%' + @searchKeyword + '%'
               OR c.name LIKE '%' + @searchKeyword + '%'
               OR q.sheet_name LIKE '%' + @searchKeyword + '%'
               OR (ISNUMERIC(@searchKeyword) = 1 AND q.upload_lot_number = TRY_CAST(@searchKeyword AS INT))
           )
         ORDER BY q.id DESC;

         SELECT @itemsCount = COUNT(*) FROM @TempRaw;

         IF (@itemsCount > @pageSize)
             SET @hasNextPage = 1;
         ELSE
             SET @hasNextPage = 0;

         IF (@cursor IS NOT NULL AND @cursor > 0)
             SET @hasPrevPage = 1;
         ELSE
             SET @hasPrevPage = 0;

         INSERT INTO @SelectedIds (id)
         SELECT TOP (@pageSize) id
         FROM @TempRaw
         ORDER BY seq ASC;
     END

     -- Determine startCursor and endCursor from SelectedIds
     SELECT 
         @startCursor = MAX(id),
         @endCursor = MIN(id)
     FROM @SelectedIds;

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
                     @TotalCount AS totalCount,
                     @hasNextPage AS hasNextPage,
                     @hasPrevPage AS hasPrevPage,
                     @startCursor AS startCursor,
                     @endCursor AS endCursor,

                     JSON_QUERY(ISNULL(
                     (
                         SELECT 
                             q.id,
                             q.question_text,
                             q.category_id,
                             q.question_explanation,
                             q.tag,
                             c.name AS category_name,
                             q.difficulty_level,
                             q.upload_lot_number,
                             q.sheet_name,
                             @TotalCount AS total_count,

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
                         INNER JOIN @SelectedIds s
                             ON q.id = s.id
                         ORDER BY q.id DESC
                         FOR JSON PATH
                     ), '[]')) AS items

                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
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
                            q.upload_lot_number,
                            q.sheet_name,
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

            DECLARE @MaxLotNo INT = NULL;
            DECLARE @LotNo INT = NULL;
            DECLARE @SheetName NVARCHAR(255) = NULL;

            -- Read batch-level lot_number or sheet_name if provided
            SELECT
                @LotNo = lot_number,
                @SheetName = sheet_name
            FROM OPENJSON(@Json)
            WITH
            (
                lot_number INT '$.lot_number',
                sheet_name NVARCHAR(255) '$.sheet_name'
            );

            IF (@LotNo IS NULL OR @LotNo <= 0)
            BEGIN
                SELECT @MaxLotNo = MAX(q.upload_lot_number) FROM questions q;
                SET @LotNo = ISNULL(@MaxLotNo, 0) + 1;
            END

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
                tag NVARCHAR(500),
                lot_number INT,
                sheet_name NVARCHAR(255)
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
                tag,
                lot_number,
                sheet_name
            )
            SELECT
                CAST(q.[key] AS INT),
                j.question_text,
                j.category_id,
                j.difficulty_level,
                j.is_active,
                j.question_explanation,
                j.tag,
                ISNULL(j.lot_number, @LotNo),
                ISNULL(j.sheet_name, @SheetName)
            FROM OPENJSON(@Json, '$.questions') q
            CROSS APPLY OPENJSON(q.value, '$.question')
            WITH
            (
                question_text NVARCHAR(MAX) '$.question_text',
                category_id INT '$.category_id',
                difficulty_level NVARCHAR(20) '$.difficulty_level',
                is_active BIT '$.is_active',
                question_explanation NVARCHAR(MAX) '$.question_explanation',
                tag NVARCHAR(500) '$.tag',
                lot_number INT '$.lot_number',
                sheet_name NVARCHAR(255) '$.sheet_name'
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
                upload_lot_number,
                sheet_name
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
                src.lot_number,
                src.sheet_name
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
                    JSON_QUERY((
                        SELECT 
                            (SELECT COUNT(*) FROM @InsertedQuestions) AS insertedCount,
                            @LotNo AS lot_number,
                            @SheetName AS sheet_name
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        
            RETURN;
        
        END

        -------------------------------------------------------------
        -- MODE 7: GET LOTS SUMMARY (SUPER ADMIN)
        -------------------------------------------------------------
        IF (@Mode = 7)
        BEGIN
            DECLARE @lotSearchKW NVARCHAR(255) = NULL;

            SELECT @lotSearchKW = searchKeyword
            FROM OPENJSON(@Json)
            WITH (
                searchKeyword NVARCHAR(255) '$.searchKeyword'
            );

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Lots summary fetched successfully' AS [Message],
                    JSON_QUERY(ISNULL((
                        SELECT 
                            q.upload_lot_number AS lot_number,
                            MAX(q.sheet_name) AS sheet_name,
                            COUNT(q.id) AS total_questions,
                            MIN(q.created_at) AS first_uploaded_at,
                            MAX(q.created_at) AS last_uploaded_at,
                            COUNT(DISTINCT tq.test_id) AS linked_tests_count,
                            COUNT(DISTINCT a.id) AS linked_attempts_count,
                            COUNT(DISTINCT bmk.id) AS linked_bookmarks_count
                        FROM questions q WITH (NOLOCK)
                        LEFT JOIN test_questions tq WITH (NOLOCK) ON tq.question_id = q.id
                        LEFT JOIN answers a WITH (NOLOCK) ON a.question_id = q.id
                        LEFT JOIN student_bookmarks bmk WITH (NOLOCK) ON bmk.question_id = q.id
                        WHERE q.upload_lot_number IS NOT NULL
                          AND q.franchise_id = @FranchiseId
                          AND (
                              @lotSearchKW IS NULL
                              OR @lotSearchKW = ''
                              OR q.sheet_name LIKE '%' + @lotSearchKW + '%'
                              OR (ISNUMERIC(@lotSearchKW) = 1 AND q.upload_lot_number = TRY_CAST(@lotSearchKW AS INT))
                          )
                        GROUP BY q.upload_lot_number
                        ORDER BY q.upload_lot_number DESC
                        FOR JSON PATH
                    ), '[]')) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        -------------------------------------------------------------
        -- MODE 8: DELETE QUESTIONS BY LOT NUMBER (SUPER ADMIN)
        -------------------------------------------------------------
        IF (@Mode = 8)
        BEGIN
            DECLARE @targetLotNo INT = NULL;
            DECLARE @forceDeleteLot BIT = 0;
            DECLARE @checkOnlyLot BIT = 0;
            DECLARE @lotQuestionCount INT = 0;
            DECLARE @lotTestCount INT = 0;
            DECLARE @lotAttemptCount INT = 0;
            DECLARE @lotBookmarkCount INT = 0;

            SELECT 
                @targetLotNo = lot_number,
                @forceDeleteLot = ISNULL(force_delete, 0),
                @checkOnlyLot = ISNULL(check_only, 0)
            FROM OPENJSON(@Json)
            WITH (
                lot_number INT '$.lot_number',
                force_delete BIT '$.force_delete',
                check_only BIT '$.check_only'
            );

            IF (@targetLotNo IS NULL OR @targetLotNo <= 0)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        400 AS StatusCode,
                        0 AS IsSuccess,
                        'Valid lot number is required' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- Check question count in this lot
            SELECT @lotQuestionCount = COUNT(*)
            FROM questions WITH (NOLOCK)
            WHERE upload_lot_number = @targetLotNo AND franchise_id = @FranchiseId;

            IF (@lotQuestionCount = 0)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'No questions found for this lot number' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- Check associations
            SELECT 
                @lotTestCount = COUNT(DISTINCT tq.test_id),
                @lotAttemptCount = COUNT(DISTINCT a.id),
                @lotBookmarkCount = COUNT(DISTINCT bmk.id)
            FROM questions q WITH (NOLOCK)
            LEFT JOIN test_questions tq WITH (NOLOCK) ON tq.question_id = q.id
            LEFT JOIN answers a WITH (NOLOCK) ON a.question_id = q.id
            LEFT JOIN student_bookmarks bmk WITH (NOLOCK) ON bmk.question_id = q.id
            WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId;

            -- Check-only inspection mode
            IF (@checkOnlyLot = 1)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        200 AS StatusCode,
                        1 AS IsSuccess,
                        'Lot associations checked successfully' AS [Message],
                        JSON_QUERY((
                            SELECT 
                                @targetLotNo AS lot_number,
                                @lotQuestionCount AS question_count,
                                @lotTestCount AS test_count,
                                @lotAttemptCount AS attempt_count,
                                @lotBookmarkCount AS bookmark_count,
                                CASE WHEN (@lotTestCount > 0 OR @lotAttemptCount > 0) THEN 1 ELSE 0 END AS requires_force,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        t.id AS test_id,
                                        t.name AS test_name,
                                        ISNULL(f.name, 'All Franchises') AS franchise_name,
                                        COUNT(DISTINCT q.id) AS question_count
                                    FROM questions q WITH (NOLOCK)
                                    INNER JOIN test_questions tq WITH (NOLOCK) ON tq.question_id = q.id
                                    INNER JOIN tests t WITH (NOLOCK) ON tq.test_id = t.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON t.franchise_id = f.id
                                    WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId
                                    GROUP BY t.id, t.name, f.name
                                    ORDER BY question_count DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_tests,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        u.id AS user_id,
                                        ISNULL(u.name, 'Unknown Student') AS student_name,
                                        s.enrollment_no,
                                        ISNULL(f.name, 'Direct / Online') AS franchise_name,
                                        t.name AS test_name,
                                        COUNT(DISTINCT a.id) AS attempt_count,
                                        MAX(att.started_at) AS last_attempted_at
                                    FROM questions q WITH (NOLOCK)
                                    INNER JOIN answers a WITH (NOLOCK) ON a.question_id = q.id
                                    INNER JOIN attempts att WITH (NOLOCK) ON a.attempt_id = att.id
                                    LEFT JOIN students s WITH (NOLOCK) ON att.student_id = s.id
                                    LEFT JOIN users u WITH (NOLOCK) ON s.user_id = u.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON COALESCE(att.franchise_id, s.franchise_id, u.franchise_id) = f.id
                                    LEFT JOIN tests t WITH (NOLOCK) ON att.test_id = t.id
                                    WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId
                                    GROUP BY u.id, u.name, s.enrollment_no, f.name, t.name
                                    ORDER BY MAX(att.started_at) DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_students
                            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                        )) AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- If force_delete is 0 and associations exist, return 409 Conflict with full details
            IF (@forceDeleteLot = 0 AND (@lotTestCount > 0 OR @lotAttemptCount > 0))
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        409 AS StatusCode,
                        0 AS IsSuccess,
                        'Cannot delete lot: questions are associated with active tests or student attempts. Check Force Delete to proceed.' AS [Message],
                        JSON_QUERY((
                            SELECT 
                                @targetLotNo AS lot_number,
                                @lotQuestionCount AS question_count,
                                @lotTestCount AS test_count,
                                @lotAttemptCount AS attempt_count,
                                @lotBookmarkCount AS bookmark_count,
                                1 AS requires_force,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        t.id AS test_id,
                                        t.name AS test_name,
                                        ISNULL(f.name, 'All Franchises') AS franchise_name,
                                        COUNT(DISTINCT q.id) AS question_count
                                    FROM questions q WITH (NOLOCK)
                                    INNER JOIN test_questions tq WITH (NOLOCK) ON tq.question_id = q.id
                                    INNER JOIN tests t WITH (NOLOCK) ON tq.test_id = t.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON t.franchise_id = f.id
                                    WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId
                                    GROUP BY t.id, t.name, f.name
                                    ORDER BY question_count DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_tests,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        u.id AS user_id,
                                        ISNULL(u.name, 'Unknown Student') AS student_name,
                                        s.enrollment_no,
                                        ISNULL(f.name, 'Direct / Online') AS franchise_name,
                                        t.name AS test_name,
                                        COUNT(DISTINCT a.id) AS attempt_count,
                                        MAX(att.started_at) AS last_attempted_at
                                    FROM questions q WITH (NOLOCK)
                                    INNER JOIN answers a WITH (NOLOCK) ON a.question_id = q.id
                                    INNER JOIN attempts att WITH (NOLOCK) ON a.attempt_id = att.id
                                    LEFT JOIN students s WITH (NOLOCK) ON att.student_id = s.id
                                    LEFT JOIN users u WITH (NOLOCK) ON s.user_id = u.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON COALESCE(att.franchise_id, s.franchise_id, u.franchise_id) = f.id
                                    LEFT JOIN tests t WITH (NOLOCK) ON att.test_id = t.id
                                    WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId
                                    GROUP BY u.id, u.name, s.enrollment_no, f.name, t.name
                                    ORDER BY MAX(att.started_at) DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_students
                            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                        )) AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- Proceed with cascading deletion
            BEGIN TRANSACTION;

            -- 1. Bookmarks
            DELETE bmk
            FROM student_bookmarks bmk
            INNER JOIN questions q ON bmk.question_id = q.id
            WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId;

            -- 2. Student Answers (by question_id and by selected_option_id)
            DELETE a
            FROM answers a
            INNER JOIN questions q ON a.question_id = q.id
            WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId;

            DELETE a
            FROM answers a
            INNER JOIN options o ON a.selected_option_id = o.id
            INNER JOIN questions q ON o.question_id = q.id
            WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId;

            -- 3. Test questions
            DELETE tq
            FROM test_questions tq
            INNER JOIN questions q ON tq.question_id = q.id
            WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId;

            -- 4. Options
            DELETE o
            FROM options o
            INNER JOIN questions q ON o.question_id = q.id
            WHERE q.upload_lot_number = @targetLotNo AND q.franchise_id = @FranchiseId;

            -- 5. Questions
            DELETE FROM questions
            WHERE upload_lot_number = @targetLotNo AND franchise_id = @FranchiseId;

            COMMIT TRANSACTION;

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Lot ' + CAST(@targetLotNo AS NVARCHAR(20)) + ' and all associated questions deleted successfully' AS [Message],
                    JSON_QUERY((
                        SELECT 
                            @targetLotNo AS lot_number,
                            @lotQuestionCount AS deleted_questions,
                            @lotTestCount AS deleted_test_associations,
                            @lotAttemptCount AS deleted_attempt_associations
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        -------------------------------------------------------------
        -- MODE 9: GET DUPLICATE QUESTIONS (SUPER ADMIN)
        -------------------------------------------------------------
        IF (@Mode = 9)
        BEGIN
            DECLARE 
                @dupCatId INT = NULL,
                @dupLotNo INT = NULL,
                @dupSearchKW NVARCHAR(500) = NULL,
                @dupPgNumber INT = 1,
                @dupPgSize INT = 20,
                @dupTotalGroups INT = 0;

            SELECT
                @dupCatId = category_id,
                @dupLotNo = lot_number,
                @dupSearchKW = searchKeyword,
                @dupPgNumber = ISNULL(pageNumber, 1),
                @dupPgSize = ISNULL(pageSize, 20)
            FROM OPENJSON(@Json)
            WITH
            (
                category_id INT '$.category_id',
                lot_number INT '$.lot_number',
                searchKeyword NVARCHAR(500) '$.searchKeyword',
                pageNumber INT '$.pageNumber',
                pageSize INT '$.pageSize'
            );

            IF (@dupPgSize <= 0) SET @dupPgSize = 20;
            IF (@dupPgNumber <= 0) SET @dupPgNumber = 1;

            DECLARE @CandidateGroups TABLE (
                seq INT IDENTITY(1,1),
                question_hash VARBINARY(20),
                dup_count INT
            );

            INSERT INTO @CandidateGroups (question_hash, dup_count)
            SELECT TOP 100
                q.question_hash,
                COUNT(*) AS dup_count
            FROM questions q WITH (NOLOCK)
            WHERE q.franchise_id = @FranchiseId
              AND (@dupCatId IS NULL OR q.category_id = @dupCatId)
              AND (@dupLotNo IS NULL OR q.upload_lot_number = @dupLotNo)
              AND (@dupSearchKW IS NULL OR q.question_text LIKE '%' + @dupSearchKW + '%')
            GROUP BY q.question_hash
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC;

            SELECT @dupTotalGroups = COUNT(*) FROM @CandidateGroups;

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Duplicate questions fetched successfully' AS [Message],
                    JSON_QUERY((
                        SELECT 
                            @dupTotalGroups AS total_groups,
                            @dupPgNumber AS page,
                            @dupPgSize AS page_size,
                            JSON_QUERY(ISNULL((
                                SELECT 
                                    (
                                        SELECT TOP 1 qtext.question_text 
                                        FROM questions qtext WITH (NOLOCK) 
                                        WHERE qtext.franchise_id = @FranchiseId 
                                          AND qtext.question_hash = cg.question_hash
                                    ) AS question_text_sample,
                                    cg.dup_count,
                                    JSON_QUERY(ISNULL((
                                        SELECT 
                                            q.id,
                                            q.question_text,
                                            q.category_id,
                                            c.name AS category_name,
                                            q.difficulty_level,
                                            q.upload_lot_number,
                                            q.sheet_name,
                                            q.created_at,
                                            ISNULL(tq.test_count, 0) AS linked_tests_count,
                                            ISNULL(ans.attempt_count, 0) AS linked_attempts_count,
                                            ISNULL(bmk.bookmark_count, 0) AS linked_bookmarks_count,
                                            JSON_QUERY(ISNULL((
                                                SELECT o.id, o.option_text, o.is_correct
                                                FROM options o WITH (NOLOCK)
                                                WHERE o.question_id = q.id
                                                ORDER BY o.id ASC
                                                FOR JSON PATH
                                            ), '[]')) AS options
                                        FROM questions q WITH (NOLOCK)
                                        LEFT JOIN categories c WITH (NOLOCK) ON q.category_id = c.id
                                        OUTER APPLY (
                                            SELECT COUNT(DISTINCT test_id) AS test_count
                                            FROM test_questions WITH (NOLOCK)
                                            WHERE question_id = q.id
                                        ) tq
                                        OUTER APPLY (
                                            SELECT COUNT(DISTINCT attempt_id) AS attempt_count
                                            FROM answers WITH (NOLOCK)
                                            WHERE question_id = q.id
                                        ) ans
                                        OUTER APPLY (
                                            SELECT COUNT(*) AS bookmark_count
                                            FROM student_bookmarks WITH (NOLOCK)
                                            WHERE question_id = q.id
                                        ) bmk
                                        WHERE q.franchise_id = @FranchiseId
                                          AND (@dupCatId IS NULL OR q.category_id = @dupCatId)
                                          AND (@dupLotNo IS NULL OR q.upload_lot_number = @dupLotNo)
                                          AND q.question_hash = cg.question_hash
                                        ORDER BY 
                                            (ISNULL(tq.test_count, 0) + ISNULL(ans.attempt_count, 0)) DESC,
                                            q.id ASC
                                        FOR JSON PATH
                                    ), '[]')) AS questions
                                FROM @CandidateGroups cg
                                WHERE cg.seq BETWEEN ((@dupPgNumber - 1) * @dupPgSize + 1) AND (@dupPgNumber * @dupPgSize)
                                ORDER BY cg.seq ASC
                                FOR JSON PATH
                            ), '[]')) AS groups
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));

            RETURN;
        END

        -------------------------------------------------------------
        -- MODE 10: DELETE QUESTIONS BY ID LIST (SUPER ADMIN)
        -------------------------------------------------------------
        IF (@Mode = 10)
        BEGIN
            DECLARE @forceDeleteQuestions BIT = 0;
            DECLARE @checkOnlyQuestions BIT = 0;
            DECLARE @selectedQuestionsCount INT = 0;
            DECLARE @qTestCount INT = 0;
            DECLARE @qAttemptCount INT = 0;
            DECLARE @qBookmarkCount INT = 0;

            DECLARE @TargetQuestionIds TABLE (
                id INT PRIMARY KEY
            );

            SELECT 
                @forceDeleteQuestions = ISNULL(force_delete, 0),
                @checkOnlyQuestions = ISNULL(check_only, 0)
            FROM OPENJSON(@Json)
            WITH (
                force_delete BIT '$.force_delete',
                check_only BIT '$.check_only'
            );

            INSERT INTO @TargetQuestionIds (id)
            SELECT CAST(value AS INT)
            FROM OPENJSON(@Json, '$.question_ids');

            SELECT @selectedQuestionsCount = COUNT(*) FROM @TargetQuestionIds;

            IF (@selectedQuestionsCount = 0)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        400 AS StatusCode,
                        0 AS IsSuccess,
                        'No question IDs provided' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- Check associations
            SELECT 
                @qTestCount = COUNT(DISTINCT tq.test_id),
                @qAttemptCount = COUNT(DISTINCT a.id),
                @qBookmarkCount = COUNT(DISTINCT bmk.id)
            FROM @TargetQuestionIds t
            INNER JOIN questions q WITH (NOLOCK) ON t.id = q.id AND q.franchise_id = @FranchiseId
            LEFT JOIN test_questions tq WITH (NOLOCK) ON tq.question_id = q.id
            LEFT JOIN answers a WITH (NOLOCK) ON a.question_id = q.id
            LEFT JOIN student_bookmarks bmk WITH (NOLOCK) ON bmk.question_id = q.id;

            -- Check-only inspection mode
            IF (@checkOnlyQuestions = 1)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        200 AS StatusCode,
                        1 AS IsSuccess,
                        'Question associations checked successfully' AS [Message],
                        JSON_QUERY((
                            SELECT 
                                @selectedQuestionsCount AS question_count,
                                @qTestCount AS test_count,
                                @qAttemptCount AS attempt_count,
                                @qBookmarkCount AS bookmark_count,
                                CASE WHEN (@qTestCount > 0 OR @qAttemptCount > 0) THEN 1 ELSE 0 END AS requires_force,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        t.id AS test_id,
                                        t.name AS test_name,
                                        ISNULL(f.name, 'All Franchises') AS franchise_name,
                                        COUNT(DISTINCT q.id) AS question_count
                                    FROM @TargetQuestionIds tids
                                    INNER JOIN questions q WITH (NOLOCK) ON tids.id = q.id AND q.franchise_id = @FranchiseId
                                    INNER JOIN test_questions tq WITH (NOLOCK) ON tq.question_id = q.id
                                    INNER JOIN tests t WITH (NOLOCK) ON tq.test_id = t.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON t.franchise_id = f.id
                                    GROUP BY t.id, t.name, f.name
                                    ORDER BY question_count DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_tests,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        u.id AS user_id,
                                        ISNULL(u.name, 'Unknown Student') AS student_name,
                                        s.enrollment_no,
                                        ISNULL(f.name, 'Direct / Online') AS franchise_name,
                                        t.name AS test_name,
                                        COUNT(DISTINCT a.id) AS attempt_count,
                                        MAX(att.started_at) AS last_attempted_at
                                    FROM @TargetQuestionIds tids
                                    INNER JOIN questions q WITH (NOLOCK) ON tids.id = q.id AND q.franchise_id = @FranchiseId
                                    INNER JOIN answers a WITH (NOLOCK) ON a.question_id = q.id
                                    INNER JOIN attempts att WITH (NOLOCK) ON a.attempt_id = att.id
                                    LEFT JOIN students s WITH (NOLOCK) ON att.student_id = s.id
                                    LEFT JOIN users u WITH (NOLOCK) ON s.user_id = u.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON COALESCE(att.franchise_id, s.franchise_id, u.franchise_id) = f.id
                                    LEFT JOIN tests t WITH (NOLOCK) ON att.test_id = t.id
                                    GROUP BY u.id, u.name, s.enrollment_no, f.name, t.name
                                    ORDER BY MAX(att.started_at) DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_students
                            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                        )) AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- If force_delete is 0 and associations exist, return 409 Conflict with full details
            IF (@forceDeleteQuestions = 0 AND (@qTestCount > 0 OR @qAttemptCount > 0))
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        409 AS StatusCode,
                        0 AS IsSuccess,
                        'Cannot delete: selected questions are associated with active tests or student attempts. Check Force Delete to proceed.' AS [Message],
                        JSON_QUERY((
                            SELECT 
                                @selectedQuestionsCount AS question_count,
                                @qTestCount AS test_count,
                                @qAttemptCount AS attempt_count,
                                @qBookmarkCount AS bookmark_count,
                                1 AS requires_force,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        t.id AS test_id,
                                        t.name AS test_name,
                                        ISNULL(f.name, 'All Franchises') AS franchise_name,
                                        COUNT(DISTINCT q.id) AS question_count
                                    FROM @TargetQuestionIds tids
                                    INNER JOIN questions q WITH (NOLOCK) ON tids.id = q.id AND q.franchise_id = @FranchiseId
                                    INNER JOIN test_questions tq WITH (NOLOCK) ON tq.question_id = q.id
                                    INNER JOIN tests t WITH (NOLOCK) ON tq.test_id = t.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON t.franchise_id = f.id
                                    GROUP BY t.id, t.name, f.name
                                    ORDER BY question_count DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_tests,
                                JSON_QUERY(ISNULL((
                                    SELECT TOP 50
                                        u.id AS user_id,
                                        ISNULL(u.name, 'Unknown Student') AS student_name,
                                        s.enrollment_no,
                                        ISNULL(f.name, 'Direct / Online') AS franchise_name,
                                        t.name AS test_name,
                                        COUNT(DISTINCT a.id) AS attempt_count,
                                        MAX(att.started_at) AS last_attempted_at
                                    FROM @TargetQuestionIds tids
                                    INNER JOIN questions q WITH (NOLOCK) ON tids.id = q.id AND q.franchise_id = @FranchiseId
                                    INNER JOIN answers a WITH (NOLOCK) ON a.question_id = q.id
                                    INNER JOIN attempts att WITH (NOLOCK) ON a.attempt_id = att.id
                                    LEFT JOIN students s WITH (NOLOCK) ON att.student_id = s.id
                                    LEFT JOIN users u WITH (NOLOCK) ON s.user_id = u.id
                                    LEFT JOIN franchises f WITH (NOLOCK) ON COALESCE(att.franchise_id, s.franchise_id, u.franchise_id) = f.id
                                    LEFT JOIN tests t WITH (NOLOCK) ON att.test_id = t.id
                                    GROUP BY u.id, u.name, s.enrollment_no, f.name, t.name
                                    ORDER BY MAX(att.started_at) DESC
                                    FOR JSON PATH
                                ), '[]')) AS associated_students
                            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                        )) AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- Cascade deletion within transaction
            BEGIN TRANSACTION;

            -- 1. Bookmarks
            DELETE bmk
            FROM student_bookmarks bmk
            INNER JOIN @TargetQuestionIds t ON bmk.question_id = t.id;

            -- 2. Answers
            DELETE a
            FROM answers a
            INNER JOIN @TargetQuestionIds t ON a.question_id = t.id;

            DELETE a
            FROM answers a
            INNER JOIN options o ON a.selected_option_id = o.id
            INNER JOIN @TargetQuestionIds t ON o.question_id = t.id;

            -- 3. Test questions
            DELETE tq
            FROM test_questions tq
            INNER JOIN @TargetQuestionIds t ON tq.question_id = t.id;

            -- 4. Options
            DELETE o
            FROM options o
            INNER JOIN @TargetQuestionIds t ON o.question_id = t.id;

            -- 5. Questions
            DELETE q
            FROM questions q
            INNER JOIN @TargetQuestionIds t ON q.id = t.id
            WHERE q.franchise_id = @FranchiseId;

            COMMIT TRANSACTION;

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    CAST(@selectedQuestionsCount AS NVARCHAR(20)) + ' questions deleted successfully' AS [Message],
                    JSON_QUERY((
                        SELECT 
                            @selectedQuestionsCount AS deleted_questions,
                            @qTestCount AS deleted_test_associations,
                            @qAttemptCount AS deleted_attempt_associations
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
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