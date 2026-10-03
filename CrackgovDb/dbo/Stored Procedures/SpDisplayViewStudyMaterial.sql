CREATE  PROCEDURE [dbo].[SpDisplayViewStudyMaterial] 
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
        -- Mode 1: UPSERT (Assign Study Material to Display View)
        IF (@Mode = 1)
        BEGIN
            DECLARE @display_view_id INT, @studyMaterial_id INT;
            SELECT 
                @display_view_id = display_view_id,
                @studyMaterial_id = studyMaterial_id
            FROM OPENJSON(@Json)
            WITH (
                display_view_id INT '$.display_view_id',
                studyMaterial_id INT '$.studyMaterial_id'
            );
            -- Validate
            IF (@display_view_id IS NULL OR @studyMaterial_id IS NULL)
            BEGIN
                SET @Output = JSON_QUERY((SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Invalid Data' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER));
                RETURN;
            END
            -- Check if already exists
            IF NOT EXISTS (SELECT 1 FROM dbo.display_view_studyMaterial WHERE display_view_id = @display_view_id AND studyMaterial_id = @studyMaterial_id)
            BEGIN
                INSERT INTO dbo.display_view_studyMaterial (display_view_id, studyMaterial_id)
                VALUES (@display_view_id, @studyMaterial_id);
            END
            SET @Output = JSON_QUERY((SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Assigned successfully' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER));
            RETURN;
        END
        -- Mode 2: DELETE (Unassign Study Material)
        IF (@Mode = 2)
        BEGIN
            DECLARE @Id INT;
            SELECT @Id = id
            FROM OPENJSON(@Json)
            WITH (id INT '$.id');
            DELETE FROM dbo.display_view_studyMaterial WHERE id = @Id;
            SET @Output = JSON_QUERY((SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Unassigned successfully' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER));
            RETURN;
        END
        -- Mode 3: GET assigned study materials for a specific display view
        IF (@Mode = 3)
        BEGIN
            DECLARE @dv_id INT;
            SELECT @dv_id = display_view_id
            FROM OPENJSON(@Json)
            WITH (display_view_id INT '$.display_view_id');
            SET @Output = JSON_QUERY((
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT 
                        dvsm.id,
                        dvsm.display_view_id,
                        dvsm.studyMaterial_id,
                        sm.name AS studyMaterial_name,
                        sm.type AS type
                    FROM dbo.display_view_studyMaterial dvsm
                    INNER JOIN dbo.study_material sm ON dvsm.studyMaterial_id = sm.id
                    WHERE dvsm.display_view_id = @dv_id
                    FOR JSON PATH
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END
    END TRY
    BEGIN CATCH
        SET @Output = JSON_QUERY((
            SELECT 500 AS StatusCode, 0 AS IsSuccess, ERROR_MESSAGE() AS [Message] 
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ));
    END CATCH
END
