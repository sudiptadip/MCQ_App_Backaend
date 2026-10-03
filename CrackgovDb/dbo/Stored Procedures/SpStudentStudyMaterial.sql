-- This script adds MODE 3 to SpStudentStudyMaterial to fetch a flat list of all
-- assigned notes/videos, so students can see everything at once in a list view.

CREATE PROCEDURE [dbo].[SpStudentStudyMaterial]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @FranchiseId INT = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
        @MaterialGroup NVARCHAR(50), 
        @DisplayViewId INT;

    BEGIN TRY
        IF @Json IS NOT NULL
        BEGIN
            SELECT 
                @MaterialGroup = JSON_VALUE(@Json, '$.material_group'),
                @DisplayViewId = JSON_VALUE(@Json, '$.display_view_id')
            FROM OPENJSON(@Json);
        END

        -------------------------------------------------
        -- MODE 1: GET ROOT FOLDERS
        -------------------------------------------------
        IF (@Mode = 1)
        BEGIN
            ;WITH ContentCTE AS (
                SELECT DISTINCT dv.id, dv.parent_id
                FROM dbo.display_view dv
                INNER JOIN dbo.display_view_studyMaterial dvsm ON dvsm.display_view_id = dv.id
                INNER JOIN dbo.study_material sm ON dvsm.studyMaterial_id = sm.id
                WHERE 
                    (
                        (@MaterialGroup = 'notes' AND sm.type IN ('pdf', 'document'))
                        OR
                        (@MaterialGroup = 'videos' AND sm.type = 'youtube')
                    )
                    AND dv.franchise_id = @FranchiseId
                    
                UNION ALL
                
                SELECT dv.id, dv.parent_id
                FROM dbo.display_view dv
                INNER JOIN ContentCTE c ON dv.id = c.parent_id
            ),
            ValidNodes AS (
                SELECT DISTINCT id FROM ContentCTE
            )
            
            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                    (
                        SELECT dv.id, dv.display_name
                        FROM dbo.display_view dv
                        WHERE dv.parent_id IS NULL 
                          AND dv.franchise_id = @FranchiseId
                          AND dv.id IN (SELECT id FROM ValidNodes)
                        FOR JSON PATH
                    ) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END

        -------------------------------------------------
        -- MODE 2: GET TREE FOR A SPECIFIC FOLDER
        -------------------------------------------------
        IF (@Mode = 2)
        BEGIN
            ;WITH ContentCTE AS (
                SELECT DISTINCT dv.id, dv.parent_id
                FROM dbo.display_view dv
                INNER JOIN dbo.display_view_studyMaterial dvsm ON dvsm.display_view_id = dv.id
                INNER JOIN dbo.study_material sm ON dvsm.studyMaterial_id = sm.id
                WHERE 
                    (
                        (@MaterialGroup = 'notes' AND sm.type IN ('pdf', 'document'))
                        OR
                        (@MaterialGroup = 'videos' AND sm.type = 'youtube')
                    )
                    AND dv.franchise_id = @FranchiseId
                    
                UNION ALL
                
                SELECT dv.id, dv.parent_id
                FROM dbo.display_view dv
                INNER JOIN ContentCTE c ON dv.id = c.parent_id
            ),
            ValidNodes AS (
                SELECT DISTINCT id FROM ContentCTE
            ),
            recursivecte AS (
                SELECT * FROM dbo.display_view 
                WHERE id = @DisplayViewId AND franchise_id = @FranchiseId
                
                UNION ALL
                
                SELECT c.* FROM dbo.display_view c
                INNER JOIN recursivecte r ON c.parent_id = r.id
            )
            
            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                    ISNULL((
                        SELECT r.id, r.display_name, r.parent_id, r.franchise_id,
                            (
                                SELECT dvsm.id, sm.id AS studyMaterial_id, sm.name, sm.type, sm.url, sm.description
                                FROM dbo.display_view_studyMaterial dvsm
                                INNER JOIN dbo.study_material sm ON dvsm.studyMaterial_id = sm.id
                                WHERE dvsm.display_view_id = r.id
                                  AND (
                                      (@MaterialGroup = 'notes' AND sm.type IN ('pdf', 'document')) OR
                                      (@MaterialGroup = 'videos' AND sm.type = 'youtube')
                                  )
                                FOR JSON PATH
                            ) AS assigned_study_materials
                        FROM recursivecte r
                        WHERE r.id IN (SELECT id FROM ValidNodes)
                        FOR JSON PATH
                    ), '[]') AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ));
            RETURN;
        END

        -------------------------------------------------
        -- MODE 3: GET ALL CONTENT (FLAT LIST)
        -------------------------------------------------
        IF (@Mode = 3)
        BEGIN
            ;WITH ContentCTE AS (
                SELECT DISTINCT dv.id, dv.parent_id
                FROM dbo.display_view dv
                INNER JOIN dbo.display_view_studyMaterial dvsm ON dvsm.display_view_id = dv.id
                INNER JOIN dbo.study_material sm ON dvsm.studyMaterial_id = sm.id
                WHERE 
                    (
                        (@MaterialGroup = 'notes' AND sm.type IN ('pdf', 'document'))
                        OR
                        (@MaterialGroup = 'videos' AND sm.type = 'youtube')
                    )
                    AND dv.franchise_id = @FranchiseId
                    
                UNION ALL
                
                SELECT dv.id, dv.parent_id
                FROM dbo.display_view dv
                INNER JOIN ContentCTE c ON dv.id = c.parent_id
            ),
            ValidNodes AS (
                SELECT DISTINCT id FROM ContentCTE
            )

            SELECT @Output = JSON_QUERY((
                SELECT 
                    200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                    ISNULL((
                        SELECT DISTINCT sm.id AS studyMaterial_id, sm.name, sm.type, sm.url, sm.description,
                            (
                                SELECT TOP 1 dv_inner.display_name 
                                FROM dbo.display_view dv_inner 
                                INNER JOIN dbo.display_view_studyMaterial dvsm_inner ON dvsm_inner.display_view_id = dv_inner.id 
                                WHERE dvsm_inner.studyMaterial_id = sm.id
                            ) AS folder_name
                        FROM dbo.display_view_studyMaterial dvsm
                        INNER JOIN dbo.display_view dv ON dvsm.display_view_id = dv.id
                        INNER JOIN dbo.study_material sm ON dvsm.studyMaterial_id = sm.id
                        WHERE dv.franchise_id = @FranchiseId
                          AND (
                              (@MaterialGroup = 'notes' AND sm.type IN ('pdf', 'document')) OR
                              (@MaterialGroup = 'videos' AND sm.type = 'youtube')
                          )
                          AND dv.id IN (SELECT id FROM ValidNodes)
                        FOR JSON PATH
                    ), '[]') AS Response
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