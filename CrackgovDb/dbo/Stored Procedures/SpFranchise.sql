CREATE PROCEDURE [dbo].[SpFranchise] 
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    DECLARE
        @franchise_id       INT,
        @name               NVARCHAR(255),
        @code               NVARCHAR(50),
        @owner_name         NVARCHAR(255),
        @contact_email      NVARCHAR(255),
        @contact_phone      NVARCHAR(20),
        @alternate_phone    NVARCHAR(20),
        @website_url        NVARCHAR(500),
        @address_line1      NVARCHAR(255),
        @address_line2      NVARCHAR(255),
        @city               NVARCHAR(100),
        @state              NVARCHAR(100),
        @country            NVARCHAR(100),
        @postal_code        NVARCHAR(20),
        @logo_document_Id           int,
        @smtp_host          NVARCHAR(255),
        @smtp_port          INT,
        @smtp_email         NVARCHAR(255),
        @smtp_password      NVARCHAR(500),
        @smtp_enable_ssl    BIT,
        @smtp_sender_name   NVARCHAR(255),
        @pan_number         NVARCHAR(100),
        @gst_number         NVARCHAR(20),
        @status             BIT;

    SET NOCOUNT ON;

    BEGIN TRY

        -- ============================================================
        -- MODE 1: GET ALL FRANCHISES
        -- ============================================================
        IF (@Mode = 1)
        BEGIN
            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1   AS IsSuccess,
                    'Success' AS [Message],
                    (
                        SELECT 
                             [id]
                            ,[name]
                            ,[code]
                            ,[owner_name]
                            ,[contact_email]
                            ,[status]
                            ,[created_at]
                            ,[contact_phone]
                            ,[alternate_phone]
                            ,[website_url]
                            ,[address_line1]
                            ,[address_line2]
                            ,[city]
                            ,[state]
                            ,[country]
                            ,[postal_code]
                           -- ,[logo_url]
                            ,[smtp_host]
                            ,[smtp_port]
                            ,[smtp_email]
                            ,[smtp_password]
                            ,[smtp_enable_ssl]
                            ,[smtp_sender_name]
                            ,[pan_number]
                            ,[gst_number]
                            ,[logo_document_Id]
                            ,dbo.GetDocumentUrl(logo_document_Id) AS logo_url
                        FROM [dbo].[franchises]
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END

        -- ============================================================
        -- MODE 2: UPSERT (INSERT or UPDATE)
        -- ============================================================
        IF (@Mode = 2)
        BEGIN
            -- Parse all fields from JSON
            SELECT  
                @franchise_id    = id,
                @name            = name,
                @code            = code,
                @owner_name      = owner_name,
                @contact_email   = contact_email,
                @contact_phone   = contact_phone,
                @alternate_phone = alternate_phone,
                @website_url     = website_url,
                @address_line1   = address_line1,
                @address_line2   = address_line2,
                @city            = city,
                @state           = state,
                @country         = country,
                @postal_code     = postal_code,
                @logo_document_Id        = logo_document_Id,
                @smtp_host       = smtp_host,
                @smtp_port       = smtp_port,
                @smtp_email      = smtp_email,
                @smtp_password   = smtp_password,
                @smtp_enable_ssl = smtp_enable_ssl,
                @smtp_sender_name= smtp_sender_name,
                @pan_number      = pan_number,
                @gst_number      = gst_number,
                @status          = status
            FROM OPENJSON(@Json) 
            WITH (
                id               INT            '$.id',
                name             NVARCHAR(255)  '$.name',
                code             NVARCHAR(50)   '$.code',
                owner_name       NVARCHAR(255)  '$.owner_name',
                contact_email    NVARCHAR(255)  '$.contact_email',
                contact_phone    NVARCHAR(20)   '$.contact_phone',
                alternate_phone  NVARCHAR(20)   '$.alternate_phone',
                website_url      NVARCHAR(500)  '$.website_url',
                address_line1    NVARCHAR(255)  '$.address_line1',
                address_line2    NVARCHAR(255)  '$.address_line2',
                city             NVARCHAR(100)  '$.city',
                state            NVARCHAR(100)  '$.state',
                country          NVARCHAR(100)  '$.country',
                postal_code      NVARCHAR(20)   '$.postal_code',
                logo_document_Id    int  '$.logo_document_Id',
                smtp_host        NVARCHAR(255)  '$.smtp_host',
                smtp_port        INT            '$.smtp_port',
                smtp_email       NVARCHAR(255)  '$.smtp_email',
                smtp_password    NVARCHAR(500)  '$.smtp_password',
                smtp_enable_ssl  BIT            '$.smtp_enable_ssl',
                smtp_sender_name NVARCHAR(255)  '$.smtp_sender_name',
                pan_number       NVARCHAR(100)  '$.pan_number',
                gst_number       NVARCHAR(20)   '$.gst_number',
                status           BIT            '$.status'
            );

            -- Validation
            IF (@name IS NULL OR @contact_email IS NULL)
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        400 AS StatusCode,
                        0   AS IsSuccess,
                        'Name and Email are required' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- --------------------------------------------------------
            -- UPDATE FLOW
            -- --------------------------------------------------------
            IF (@franchise_id IS NOT NULL)
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM [dbo].[franchises] WHERE id = @franchise_id)
                BEGIN
                    SET @Output = JSON_QUERY((
                        SELECT 
                            404 AS StatusCode,
                            0   AS IsSuccess,
                            'Franchise not found' AS [Message],
                            NULL AS Response
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ));
                    RETURN;
                END

                IF EXISTS (
                    SELECT 1 FROM [dbo].[franchises]
                    WHERE contact_email = @contact_email AND id != @franchise_id
                )
                BEGIN
                    SET @Output = JSON_QUERY((
                        SELECT 
                            400 AS StatusCode,
                            0   AS IsSuccess,
                            'Email already exists' AS [Message],
                            NULL AS Response
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ));
                    RETURN;
                END

                UPDATE [dbo].[franchises]
                SET
                    name             = @name,
                    owner_name       = @owner_name,
                    contact_email    = @contact_email,
                    contact_phone    = @contact_phone,
                    alternate_phone  = @alternate_phone,
                    website_url      = @website_url,
                    address_line1    = @address_line1,
                    address_line2    = @address_line2,
                    city             = @city,
                    state            = @state,
                    country          = @country,
                    postal_code      = @postal_code,
                    logo_document_Id         = @logo_document_Id,
                    smtp_host        = @smtp_host,
                    smtp_port        = @smtp_port,
                    smtp_email       = @smtp_email,
                    smtp_password    = @smtp_password,
                    smtp_enable_ssl  = ISNULL(@smtp_enable_ssl, 0),
                    smtp_sender_name = @smtp_sender_name,
                    pan_number       = @pan_number,
                    gst_number       = @gst_number,
                    status           = ISNULL(@status, status)
                WHERE id = @franchise_id;

                SET @Output = JSON_QUERY((
                    SELECT 
                        200 AS StatusCode,
                        1   AS IsSuccess,
                        'Franchise updated successfully' AS [Message],
                        JSON_QUERY((
                            SELECT * FROM [dbo].[franchises]
                            WHERE id = @franchise_id
                            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                        )) AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- --------------------------------------------------------
            -- INSERT FLOW
            -- --------------------------------------------------------
            IF EXISTS (
                SELECT 1 FROM [dbo].[franchises] WHERE contact_email = @contact_email
                UNION
                SELECT 1 FROM [dbo].[users]      WHERE email = @contact_email
            )
            BEGIN
                SET @Output = JSON_QUERY((
                    SELECT 
                        400 AS StatusCode,
                        0   AS IsSuccess,
                        'Email already exists' AS [Message],
                        NULL AS Response
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ));
                RETURN;
            END

            -- Generate unique code only if not supplied
            IF (@code IS NULL OR @code = '')
                SET @code = 'FR-' + FORMAT(GETDATE(), 'yyyyMMddHHmmss') + RIGHT(REPLACE(NEWID(), '-', ''), 4);

            INSERT INTO [dbo].[franchises]
            (
                name, code, owner_name, contact_email, contact_phone,
                alternate_phone, website_url, address_line1, address_line2,
                city, state, country, postal_code, logo_document_Id,
                smtp_host, smtp_port, smtp_email, smtp_password,
                smtp_enable_ssl, smtp_sender_name, pan_number, gst_number,
                status, created_at
            )
            VALUES
            (
                @name, @code, @owner_name, @contact_email, @contact_phone,
                @alternate_phone, @website_url, @address_line1, @address_line2,
                @city, @state, @country, @postal_code, @logo_document_Id,
                @smtp_host, @smtp_port, @smtp_email, @smtp_password,
                ISNULL(@smtp_enable_ssl, 0), @smtp_sender_name, @pan_number, @gst_number,
                ISNULL(@status, 1), GETDATE()
            );

            SET @franchise_id = SCOPE_IDENTITY();

            SET @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode,
                    1   AS IsSuccess,
                    'Franchise created successfully' AS [Message],
                    JSON_QUERY((
                        SELECT * FROM [dbo].[franchises]
                        WHERE id = @franchise_id
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END

    END TRY

    BEGIN CATCH

        DECLARE @ErrorMessage  NVARCHAR(MAX) = ERROR_MESSAGE(),
                @ErrorNumber   INT           = ERROR_NUMBER(),
                @ErrorLine     INT           = ERROR_LINE(),
                @ErrorState    INT           = ERROR_STATE(),
                @ErrorSeverity INT           = ERROR_SEVERITY();

        INSERT INTO ErrorLogs (ProcedureName, ErrorMessage, ErrorNumber, ErrorLine, ErrorState, ErrorSeverity, UserId)
        VALUES ('SpFranchise', @ErrorMessage, @ErrorNumber, @ErrorLine, @ErrorState, @ErrorSeverity, @UserId);

        SET @Output = JSON_QUERY((
            SELECT 
                500 AS StatusCode,
                0   AS IsSuccess,
                @ErrorMessage AS [Message],
                NULL AS Response
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));

    END CATCH
END