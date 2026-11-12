CREATE PROCEDURE [dbo].[SpHeroSection]
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
        -------------------------------------------------
        -- MODE 1: GET HERO SECTION DETAILS (ADMIN)
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
                        h.Badge2Text AS badge2Text,
                        h.IsActive AS isActive,
                        h.CreatedOn AS createdOn,
                        h.ModifiedOn AS modifiedOn
                    FROM [dbo].[HeroSection] h
                    ORDER BY h.Id ASC
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS Response
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        -------------------------------------------------
        -- MODE 2: UPDATE HERO SECTION DETAILS (ADMIN)
        -------------------------------------------------
        IF @Mode = 2
        BEGIN
            DECLARE @BadgeText NVARCHAR(200), @Title NVARCHAR(500), @HighlightTitle NVARCHAR(200),
                    @Description NVARCHAR(MAX), @PrimaryBtnText NVARCHAR(100), @PrimaryBtnUrl NVARCHAR(200),
                    @SecondaryBtnText NVARCHAR(100), @SecondaryBtnUrl NVARCHAR(200),
                    @Stat1Value NVARCHAR(50), @Stat1Label NVARCHAR(100),
                    @Stat2Value NVARCHAR(50), @Stat2Label NVARCHAR(100),
                    @Stat3Value NVARCHAR(50), @Stat3Label NVARCHAR(100),
                    @Stat4Value NVARCHAR(50), @Stat4Label NVARCHAR(100),
                    @ImageUrl NVARCHAR(1000), @ImageTitle NVARCHAR(200),
                    @Badge1Text NVARCHAR(100), @Badge2Text NVARCHAR(100), @IsActive BIT;

            SELECT 
                @BadgeText = badgeText,
                @Title = title,
                @HighlightTitle = highlightTitle,
                @Description = description,
                @PrimaryBtnText = primaryBtnText,
                @PrimaryBtnUrl = primaryBtnUrl,
                @SecondaryBtnText = secondaryBtnText,
                @SecondaryBtnUrl = secondaryBtnUrl,
                @Stat1Value = stat1Value,
                @Stat1Label = stat1Label,
                @Stat2Value = stat2Value,
                @Stat2Label = stat2Label,
                @Stat3Value = stat3Value,
                @Stat3Label = stat3Label,
                @Stat4Value = stat4Value,
                @Stat4Label = stat4Label,
                @ImageUrl = imageUrl,
                @ImageTitle = imageTitle,
                @Badge1Text = badge1Text,
                @Badge2Text = badge2Text,
                @IsActive = isActive
            FROM OPENJSON(@Json) WITH (
                badgeText NVARCHAR(200) '$.badgeText',
                title NVARCHAR(500) '$.title',
                highlightTitle NVARCHAR(200) '$.highlightTitle',
                description NVARCHAR(MAX) '$.description',
                primaryBtnText NVARCHAR(100) '$.primaryBtnText',
                primaryBtnUrl NVARCHAR(200) '$.primaryBtnUrl',
                secondaryBtnText NVARCHAR(100) '$.secondaryBtnText',
                secondaryBtnUrl NVARCHAR(200) '$.secondaryBtnUrl',
                stat1Value NVARCHAR(50) '$.stat1Value',
                stat1Label NVARCHAR(100) '$.stat1Label',
                stat2Value NVARCHAR(50) '$.stat2Value',
                stat2Label NVARCHAR(100) '$.stat2Label',
                stat3Value NVARCHAR(50) '$.stat3Value',
                stat3Label NVARCHAR(100) '$.stat3Label',
                stat4Value NVARCHAR(50) '$.stat4Value',
                stat4Label NVARCHAR(100) '$.stat4Label',
                imageUrl NVARCHAR(1000) '$.imageUrl',
                imageTitle NVARCHAR(200) '$.imageTitle',
                badge1Text NVARCHAR(100) '$.badge1Text',
                badge2Text NVARCHAR(100) '$.badge2Text',
                isActive BIT '$.isActive'
            );

            IF NOT EXISTS (SELECT 1 FROM [dbo].[HeroSection] WHERE Id = 1)
            BEGIN
                INSERT INTO [dbo].[HeroSection] (Id) VALUES (1);
            END;

            UPDATE [dbo].[HeroSection]
            SET 
                BadgeText = ISNULL(NULLIF(LTRIM(RTRIM(@BadgeText)), N''), BadgeText),
                Title = ISNULL(NULLIF(LTRIM(RTRIM(@Title)), N''), Title),
                HighlightTitle = ISNULL(@HighlightTitle, HighlightTitle),
                Description = ISNULL(NULLIF(LTRIM(RTRIM(@Description)), N''), Description),
                PrimaryBtnText = ISNULL(NULLIF(LTRIM(RTRIM(@PrimaryBtnText)), N''), PrimaryBtnText),
                PrimaryBtnUrl = ISNULL(NULLIF(LTRIM(RTRIM(@PrimaryBtnUrl)), N''), PrimaryBtnUrl),
                SecondaryBtnText = ISNULL(NULLIF(LTRIM(RTRIM(@SecondaryBtnText)), N''), SecondaryBtnText),
                SecondaryBtnUrl = ISNULL(NULLIF(LTRIM(RTRIM(@SecondaryBtnUrl)), N''), SecondaryBtnUrl),
                Stat1Value = ISNULL(NULLIF(LTRIM(RTRIM(@Stat1Value)), N''), Stat1Value),
                Stat1Label = ISNULL(NULLIF(LTRIM(RTRIM(@Stat1Label)), N''), Stat1Label),
                Stat2Value = ISNULL(NULLIF(LTRIM(RTRIM(@Stat2Value)), N''), Stat2Value),
                Stat2Label = ISNULL(NULLIF(LTRIM(RTRIM(@Stat2Label)), N''), Stat2Label),
                Stat3Value = ISNULL(NULLIF(LTRIM(RTRIM(@Stat3Value)), N''), Stat3Value),
                Stat3Label = ISNULL(NULLIF(LTRIM(RTRIM(@Stat3Label)), N''), Stat3Label),
                Stat4Value = ISNULL(NULLIF(LTRIM(RTRIM(@Stat4Value)), N''), Stat4Value),
                Stat4Label = ISNULL(NULLIF(LTRIM(RTRIM(@Stat4Label)), N''), Stat4Label),
                ImageUrl = ISNULL(NULLIF(LTRIM(RTRIM(@ImageUrl)), N''), ImageUrl),
                ImageTitle = ISNULL(NULLIF(LTRIM(RTRIM(@ImageTitle)), N''), ImageTitle),
                Badge1Text = ISNULL(NULLIF(LTRIM(RTRIM(@Badge1Text)), N''), Badge1Text),
                Badge2Text = ISNULL(NULLIF(LTRIM(RTRIM(@Badge2Text)), N''), Badge2Text),
                IsActive = ISNULL(@IsActive, IsActive),
                ModifiedOn = SYSUTCDATETIME()
            WHERE Id = 1;

            SET @Output = (
                SELECT 200 AS StatusCode, 1 AS IsSuccess, 'Hero section updated successfully.' AS [Message]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            RETURN;
        END;

        SET @Output = (SELECT 400 AS StatusCode, 0 AS IsSuccess, 'Unsupported HeroSection operation mode.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        SET @Output = (SELECT 500 AS StatusCode, 0 AS IsSuccess, 'Unable to process HeroSection request.' AS [Message] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
GO
