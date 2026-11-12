CREATE PROCEDURE [dbo].[SpAnonymousHeroSection]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -------------------------------------------------
        -- MODE 1: GET ACTIVE HERO SECTION FOR PUBLIC CLIENT
        -------------------------------------------------
        IF @Mode = 1
        BEGIN
            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Success' AS [Message],
                JSON_QUERY((
                    SELECT TOP 1
                        h.Id AS id,
                        h.BadgeText AS badgeText,
                        h.Title AS title,
                        h.HighlightTitle AS highlightTitle,
                        h.Description AS description,
                        h.PrimaryBtnText AS primaryBtnText,
                        h.PrimaryBtnUrl AS primaryBtnUrl,
                        h.SecondaryBtnText AS secondaryBtnText,
                        h.SecondaryBtnUrl AS secondaryBtnUrl,
                        h.Stat1Value AS stat1Value,
                        h.Stat1Label AS stat1Label,
                        h.Stat2Value AS stat2Value,
                        h.Stat2Label AS stat2Label,
                        h.Stat3Value AS stat3Value,
                        h.Stat3Label AS stat3Label,
                        h.Stat4Value AS stat4Value,
                        h.Stat4Label AS stat4Label,
                        h.ImageUrl AS imageUrl,
                        h.ImageTitle AS imageTitle,
                        h.Badge1Text AS badge1Text,
                        h.Badge2Text AS badge2Text
                    FROM [dbo].[HeroSection] h
                    WHERE h.IsActive = 1
                    ORDER BY h.Id ASC
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported operation.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to load Hero Section.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
GO
