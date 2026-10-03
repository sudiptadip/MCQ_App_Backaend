CREATE PROCEDURE [CurrentAffairs].[SpAnonymousDailyCurrentAffairs]
    @Mode INT,
    @Json NVARCHAR(MAX) = NULL,
    @Output NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Page INT,@PageSize INT,@Search NVARCHAR(200),@Category NVARCHAR(100),
            @FromDate DATE,@ToDate DATE,@Slug NVARCHAR(220);
        IF @Mode=1
        BEGIN
            SELECT @Page=TRY_CONVERT(INT,JSON_VALUE(@Json,'$.page')),
                @PageSize=TRY_CONVERT(INT,JSON_VALUE(@Json,'$.pageSize')),
                @Search=NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json,'$.search'))),N''),
                @Category=NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json,'$.category'))),N''),
                @FromDate=TRY_CONVERT(DATE,JSON_VALUE(@Json,'$.fromDate')),
                @ToDate=TRY_CONVERT(DATE,JSON_VALUE(@Json,'$.toDate'));
            SET @Page=CASE WHEN @Page IS NULL OR @Page<1 THEN 1 ELSE @Page END;
            SET @PageSize=CASE WHEN @PageSize IS NULL OR @PageSize<1 THEN 10 WHEN @PageSize>100 THEN 100 ELSE @PageSize END;
            DECLARE @TotalCount INT;
            SELECT @TotalCount=COUNT(1) FROM [CurrentAffairs].[DailyCurrentAffairs] p WHERE p.Status='Published'
              AND (@Category IS NULL OR p.Category=@Category)
              AND (@FromDate IS NULL OR p.AffairDate>=@FromDate)
              AND (@ToDate IS NULL OR p.AffairDate<=@ToDate)
              AND (@Search IS NULL OR p.Title LIKE N'%'+@Search+N'%' OR p.Excerpt LIKE N'%'+@Search+N'%' OR p.Category LIKE N'%'+@Search+N'%');
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Success' AS [Message],
                JSON_QUERY((SELECT @TotalCount AS totalCount,@Page AS page,@PageSize AS pageSize,
                    JSON_QUERY((SELECT DISTINCT Category AS name FROM [CurrentAffairs].[DailyCurrentAffairs] WHERE Status='Published' AND Category IS NOT NULL ORDER BY name FOR JSON PATH)) AS categories,
                    JSON_QUERY((SELECT p.Id AS id,p.AffairDate AS affairDate,p.Title AS title,p.Slug AS slug,p.Category AS category,
                        p.ExamRelevance AS examRelevance,p.Excerpt AS excerpt,p.ImageUrl AS imageUrl,p.TemplateKey AS templateKey,p.SourceName AS sourceName,
                        p.SourceUrl AS sourceUrl,p.IsFeatured AS isFeatured,p.PageTitle AS pageTitle,p.MetaTitle AS metaTitle,
                        p.MetaDescription AS metaDescription,p.MetaKeywords AS metaKeywords,p.CanonicalUrl AS canonicalUrl,
                        p.PublishedOn AS publishedOn,p.CreatedOn AS createdOn
                    FROM [CurrentAffairs].[DailyCurrentAffairs] p WHERE p.Status='Published'
                      AND (@Category IS NULL OR p.Category=@Category)
                      AND (@FromDate IS NULL OR p.AffairDate>=@FromDate)
                      AND (@ToDate IS NULL OR p.AffairDate<=@ToDate)
                      AND (@Search IS NULL OR p.Title LIKE N'%'+@Search+N'%' OR p.Excerpt LIKE N'%'+@Search+N'%' OR p.Category LIKE N'%'+@Search+N'%')
                    ORDER BY p.AffairDate DESC,p.IsFeatured DESC,p.PublishedOn DESC
                    OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY FOR JSON PATH)) AS items
                    FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;
        IF @Mode=2
        BEGIN
            SELECT @Slug=slug FROM OPENJSON(@Json) WITH(slug NVARCHAR(220) '$.slug');
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Success' AS [Message],
                JSON_QUERY((SELECT p.Id AS id,p.AffairDate AS affairDate,p.Title AS title,p.Slug AS slug,p.Category AS category,
                    p.ExamRelevance AS examRelevance,p.Excerpt AS excerpt,p.ImageUrl AS imageUrl,p.HtmlContent AS htmlContent,p.TemplateKey AS templateKey,
                    p.SourceName AS sourceName,p.SourceUrl AS sourceUrl,p.IsFeatured AS isFeatured,p.PageTitle AS pageTitle,
                    p.MetaTitle AS metaTitle,p.MetaDescription AS metaDescription,p.MetaKeywords AS metaKeywords,
                    p.CanonicalUrl AS canonicalUrl,p.PublishedOn AS publishedOn,p.CreatedOn AS createdOn
                    FROM [CurrentAffairs].[DailyCurrentAffairs] p WHERE p.Slug=@Slug AND p.Status='Published'
                    FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;
        SET @Output=(SELECT 400 AS StatusCode,0 AS IsSuccess,'Unsupported public current affairs operation.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        INSERT INTO [dbo].[ErrorLogs](ProcedureName,ErrorMessage,ErrorNumber,ErrorLine,ErrorState)
        VALUES('CurrentAffairs.SpAnonymousDailyCurrentAffairs',ERROR_MESSAGE(),ERROR_NUMBER(),ERROR_LINE(),ERROR_STATE());
        SET @Output=(SELECT 500 AS StatusCode,0 AS IsSuccess,'Unable to process public current affairs request.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
