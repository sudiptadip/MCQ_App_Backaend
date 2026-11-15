CREATE   PROCEDURE [dbo].[SpStudent] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    Declare
    @franchise_id INT,
    @name NVARCHAR(255),
    @code NVARCHAR(50),
    @owner_name NVARCHAR(255),
    @contact_email NVARCHAR(255),
    @user_id INT,
    @status BIGINT,

    -- Student Variables
    @gender NVARCHAR(20),
    @date_of_birth DATE,
    @mobile_no NVARCHAR(20),
    @alternate_mobile_no NVARCHAR(20),
    @parent_name NVARCHAR(255),
    @address_line1 NVARCHAR(255),
    @address_line2 NVARCHAR(255),
    @city NVARCHAR(100),
    @state NVARCHAR(100),
    @country NVARCHAR(100),
    @postal_code NVARCHAR(20),
    @ValidityDate DATETIME,
    @profile_image_url NVARCHAR(500);

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
                        SELECT
                            u.*,
                            s.mobile_no,
                            s.parent_name,
                            up.[password]
                        FROM [dbo].[users] u WITH (NOLOCK)
                        LEFT JOIN [dbo].[students] s WITH (NOLOCK) ON u.id = s.user_id
                        LEFT JOIN [dbo].[user_passwords] up WITH (NOLOCK) ON u.id = up.user_id
                        WHERE u.franchise_id = @FranchiseId AND u.role = 'student'
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            Return;
        END


        IF(@Mode = 2)
        BEGIN
        
            SELECT
                @ValidityDate = ValidityDate,
                @user_id = user_id,
                @gender = gender,
                @mobile_no = mobile_no,
                @alternate_mobile_no = alternate_mobile_no,
                @parent_name = parent_name,
                @contact_email = email,
                @address_line1 = address_line1,
                @address_line2 = address_line2,
                @city = city,
                @state = state,
                @country = country,
                @postal_code = postal_code,
                @profile_image_url = profile_image_url,
                @status = status,
                @date_of_birth = date_of_birth
            FROM OPENJSON(@Json)
            WITH
            (
                ValidityDate Datetime '$.ValidityDate',
                user_id INT '$.user_id',
                gender NVARCHAR(20) '$.gender',
                date_of_birth DATE '$.date_of_birth',
                mobile_no NVARCHAR(20) '$.mobile_no',
                alternate_mobile_no NVARCHAR(20) '$.alternate_mobile_no',
                parent_name NVARCHAR(255) '$.parent_name',
                email NVARCHAR(255) '$.email',
                address_line1 NVARCHAR(255) '$.address_line1',
                address_line2 NVARCHAR(255) '$.address_line2',
                city NVARCHAR(100) '$.city',
                state NVARCHAR(100) '$.state',
                country NVARCHAR(100) '$.country',
                postal_code NVARCHAR(20) '$.postal_code',
                profile_image_url NVARCHAR(500) '$.profile_image_url',
                status BIT '$.status'
            );
        
            UPDATE dbo.students
            SET
                ValidityDate = @ValidityDate,
                gender = @gender,
                date_of_birth = @date_of_birth,
                mobile_no = @mobile_no,
                alternate_mobile_no = @alternate_mobile_no,
                parent_name = @parent_name,
                email = @contact_email,
                address_line1 = @address_line1,
                address_line2 = @address_line2,
                city = @city,
                state = @state,
                country = @country,
                postal_code = @postal_code,
                profile_image_url = @profile_image_url,
                status = @status
            WHERE franchise_id = @FranchiseId
            AND user_id = @user_id;
        
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Student updated successfully' AS [Message],
                    (
                        SELECT *
                        FROM dbo.students
                        WHERE franchise_id = @FranchiseId
                        AND user_id = @user_id
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
        
            RETURN;
        
        END
        
        

        IF(@Mode = 3)
        BEGIN

            Select @user_id = [user_id] from OPENJSON(@Json) With (
                [user_id] int '$.user_id'
            )
            
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1 AS IsSuccess,
                    'Success 1' AS [Message],
                    (
                        SELECT
                            s.*,
                            CASE WHEN u.role IN ('STUDENT', 'WEB_STUDENT') THEN up.[password] ELSE NULL END AS [password]
                        FROM [dbo].[students] s WITH (NOLOCK)
                        LEFT JOIN [dbo].[users] u WITH (NOLOCK) ON s.user_id = u.id
                        LEFT JOIN [dbo].[user_passwords] up WITH (NOLOCK) ON u.id = up.user_id
                        WHERE s.franchise_id = @FranchiseId
                        AND s.[user_id] = @user_id
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            Return;
            
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