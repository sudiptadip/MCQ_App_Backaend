
CREATE PROCEDURE [dbo].[SpUsers] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN

    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY

     IF(@Mode = 1)
	BEGIN
		SET @Output =  JSON_QUERY((
			Select 200 as StatusCode, 1 as IsSuccess, 'Success' as [Message], 
				(
                    SELECT * FROM [dbo].[franchises]
                    FOR JSON PATH
                ) As Response
			For json path, without_array_wrapper
		));
	END


    IF(@Mode = 2)
    BEGIN
    
        SET @Output = JSON_QUERY((
            SELECT 
                200 AS StatusCode,
                1 AS IsSuccess,
                'Success' AS [Message],
                JSON_Query((
                    SELECT 
                        d.url AS logo_url,
                        f.name AS franchise_name
                    FROM dbo.franchises f
                    LEFT JOIN dbo.documents d 
                        ON d.id = f.logo_document_id
                    WHERE f.id = @FranchiseId
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
    
    END



     IF(@Mode = 3)
	BEGIN
        
        Declare @user_id int;

        SELECT @user_id = [user_id]
            FROM OPENJSON(@Json)
            WITH
            (
                [user_id] INT '$.user_id'
            );

            if(@user_id is not null)
            Begin
                update [dbo].[users] set [device_fingerprint] = null where id = @user_id and [franchise_id] = @FranchiseId
            End

		SET @Output =  JSON_QUERY((
			Select 200 as StatusCode, 1 as IsSuccess, 'Successfully reset device' as [Message], 
				null As Response
			For json path, without_array_wrapper
		));

        return;

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
