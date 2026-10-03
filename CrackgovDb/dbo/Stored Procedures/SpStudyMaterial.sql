
CREATE PROCEDURE [dbo].[SpStudyMaterial] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    Declare 
            @StudyMaterialId int,
            @Id INT,
            @Name NVARCHAR(200),
            @Description NVARCHAR(MAX),
            @Type NVARCHAR(200),
            @Url NVARCHAR(1000),
            @Category_Id INT;
    BEGIN TRY

    IF (@Mode = 1)
    BEGIN
    
    
        SELECT
            @Id = id,
            @Name = [name],
            @Description = [description],
            @Type = [type],
            @Url = [url],
            @Category_Id = category_id
        FROM OPENJSON(@Json)
        WITH
        (
            id            INT            '$.id',
            [name]        NVARCHAR(200)  '$.name',
            [description] NVARCHAR(MAX)  '$.description',
            [type]        NVARCHAR(200)  '$.type',
            [url]         NVARCHAR(1000) '$.url',
            category_id   INT			'$.category_id'
        );
    
    
        ------------------------------------------------------------
        -- VALIDATION
        ------------------------------------------------------------
    
        IF (@Name IS NULL OR LTRIM(RTRIM(@Name)) = '')
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Study material name is required' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
            RETURN;
        END;
    
    
        ------------------------------------------------------------
        -- UPDATE
        ------------------------------------------------------------
    
        IF (@Id IS NOT NULL AND @Id > 0)
        BEGIN
    
            -- Check whether record exists
            IF NOT EXISTS
            (
                SELECT 1
                FROM dbo.study_material
                WHERE id = @Id
                  AND franchise_id = @FranchiseId
            )
            BEGIN
    
                SET @Output = JSON_QUERY((
                    SELECT
                        404 AS StatusCode,
                        0 AS IsSuccess,
                        'Study material not found' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
    
                RETURN;
    
            END;
    
    
            -- Check duplicate name for same franchise
            IF EXISTS
            (
                SELECT 1
                FROM dbo.study_material
                WHERE franchise_id = @FranchiseId
                  AND LOWER(LTRIM(RTRIM(name))) = LOWER(LTRIM(RTRIM(@Name)))
                  AND id <> @Id
            )
            BEGIN
    
                SET @Output = JSON_QUERY((
                    SELECT
                        400 AS StatusCode,
                        0 AS IsSuccess,
                        'Study material with the same name already exists' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
    
                RETURN;
    
            END;
    
    
            -- Update
            UPDATE dbo.study_material
            SET
                name = @Name,
                description = @Description,
                type = @Type,
                url = @Url,
                category_id = @Category_Id,
                modifiedBy = @UserId,
                modifiedOn = GETDATE()
            WHERE id = @Id
              AND franchise_id = @FranchiseId;
    
    
            SET @StudyMaterialId = @Id;
    
    
            SET @Output = JSON_QUERY((
                SELECT
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Successfully updated' AS [Message],
                    JSON_QUERY((
                        SELECT
                            @StudyMaterialId AS id
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
            RETURN;
    
        END;
    
    
        ------------------------------------------------------------
        -- INSERT
        ------------------------------------------------------------
    
        -- Check duplicate name for same franchise
        IF EXISTS
        (
            SELECT 1
            FROM dbo.study_material
            WHERE franchise_id = @FranchiseId
              AND LOWER(LTRIM(RTRIM(name))) = LOWER(LTRIM(RTRIM(@Name)))
        )
        BEGIN
    
            SET @Output = JSON_QUERY((
                SELECT
                    400 AS StatusCode,
                    0 AS IsSuccess,
                    'Study material with the same name already exists' AS [Message],
                    NULL AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
            RETURN;
    
        END;
    
    
        -- Insert
        INSERT INTO dbo.study_material
        (
            name,
            description,
            type,
            url,
            createdBy,
            createdOn,
            franchise_id,
            category_id
        )
        VALUES
        (
            @Name,
            @Description,
            @Type,
            @Url,
            @UserId,
            GETDATE(),
            @FranchiseId,
            @Category_Id
        );
    
    
        SET @StudyMaterialId = CONVERT(INT, SCOPE_IDENTITY());
    
    
        IF (@StudyMaterialId IS NOT NULL)
        BEGIN
    
            SET @Output = JSON_QUERY((
                SELECT
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Successfully inserted' AS [Message],
                    JSON_QUERY((
                        SELECT
                            @StudyMaterialId AS id
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
    
            RETURN;
    
        END;
    
    
        ------------------------------------------------------------
        -- INSERT FAILED
        ------------------------------------------------------------
    
        SET @Output = JSON_QUERY((
            SELECT
                400 AS StatusCode,
                0 AS IsSuccess,
                'Insert failed' AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
    
        RETURN;
    
    END

   IF (@Mode = 2)
   BEGIN
   
       ------------------------------------------------------------
       -- GET ID FROM JSON
       ------------------------------------------------------------
   
       SELECT
           @Id = id
       FROM OPENJSON(@Json)
       WITH
       (
           id INT '$.id'
       );
   
   
       ------------------------------------------------------------
       -- VALIDATION
       ------------------------------------------------------------
   
       IF (@Id IS NULL OR @Id <= 0)
       BEGIN
   
           SET @Output = JSON_QUERY((
               SELECT
                   400 AS StatusCode,
                   0 AS IsSuccess,
                   'Study material id is required' AS [Message],
                   NULL AS Response
               FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
           ));
   
           RETURN;
   
       END;
   
   
       ------------------------------------------------------------
       -- CHECK RECORD EXISTS
       ------------------------------------------------------------
   
       IF NOT EXISTS
       (
           SELECT 1
           FROM dbo.study_material
           WHERE id = @Id
             AND franchise_id = @FranchiseId
       )
       BEGIN
   
           SET @Output = JSON_QUERY((
               SELECT
                   404 AS StatusCode,
                   0 AS IsSuccess,
                   'Study material not found' AS [Message],
                   NULL AS Response
               FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
           ));
   
           RETURN;
   
       END;
   
   
       ------------------------------------------------------------
       -- HARD DELETE
       ------------------------------------------------------------
   
       DELETE FROM dbo.study_material
       WHERE id = @Id
         AND franchise_id = @FranchiseId;
   
   
       ------------------------------------------------------------
       -- RESPONSE
       ------------------------------------------------------------
   
       IF (@@ROWCOUNT > 0)
       BEGIN
   
           SET @Output = JSON_QUERY((
               SELECT
                   200 AS StatusCode,
                   1 AS IsSuccess,
                   'Successfully deleted' AS [Message],
                   JSON_QUERY((
                       SELECT
                           @Id AS id
                       FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                   )) AS Response
               FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
           ));
   
           RETURN;
   
       END;
   
   
       ------------------------------------------------------------
       -- DELETE FAILED
       ------------------------------------------------------------
   
       SET @Output = JSON_QUERY((
           SELECT
               400 AS StatusCode,
               0 AS IsSuccess,
               'Delete failed' AS [Message],
               NULL AS Response
           FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
       ));
   
       RETURN;
   
   END

    IF(@Mode = 3)
    BEGIN

   -- Select * from categories
    
        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                JSON_Query((
                    Select s.*, c.name as category_name from study_material s left join 
                    categories c on s.category_id = c.id
                    where s.franchise_id = @FranchiseId
                    FOR JSON PATH
                )) AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
    
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
            'SpStudyMaterial',
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
