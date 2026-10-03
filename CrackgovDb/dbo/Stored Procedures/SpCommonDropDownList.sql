CREATE PROCEDURE [dbo].[SpCommonDropDownList] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        IF (@Mode = 1)
        BEGIN

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success 1' AS [Message],
                    (
                        Select [name] as [label], id as [value] from [dbo].[franchises]
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            Return;
        END  

        IF (@Mode = 2)
        BEGIN
        
            DECLARE @test_id INT = JSON_VALUE(@Json, '$.test_id');
        
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success' AS [Message],
        
                    JSON_QUERY(
                    (
                        SELECT 
                            f.[name] AS [label],
                            f.id AS [value],
        
                            CASE 
                                WHEN ft.franchise_id IS NOT NULL THEN 1
                                ELSE 0
                            END AS [is_selected]
        
                        FROM dbo.franchises f
        
                        LEFT JOIN franchise_tests ft
                            ON ft.franchise_id = f.id
                            AND ft.test_id = @test_id
        
                        FOR JSON PATH
                    )) AS Response
        
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

        -- ✅ Insert into ErrorLogs table
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
            'SpFranchise',
            @ErrorMessage,
            @ErrorNumber,
            @ErrorLine,
            @ErrorState,
            @ErrorSeverity,
            @UserId
        );

        -- ✅ Return structured JSON
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
