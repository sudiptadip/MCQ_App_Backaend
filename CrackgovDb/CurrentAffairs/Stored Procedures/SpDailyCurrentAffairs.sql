CREATE PROCEDURE [CurrentAffairs].[SpDailyCurrentAffairs]
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
        DECLARE @Id INT,@Page INT,@PageSize INT,@Search NVARCHAR(200),@Category NVARCHAR(100),
            @FromDate DATE,@ToDate DATE,@AffairDate DATE,@Title NVARCHAR(200),@Slug NVARCHAR(220),
            @ExamRelevance NVARCHAR(20),@Excerpt NVARCHAR(500),@ImageUrl NVARCHAR(1000),@HtmlContent NVARCHAR(MAX),
            @SourceName NVARCHAR(200),@SourceUrl NVARCHAR(1000),@TemplateKey NVARCHAR(40),@Status NVARCHAR(20),@IsFeatured BIT,
            @PageTitle NVARCHAR(200),@MetaTitle NVARCHAR(200),@MetaDescription NVARCHAR(320),
            @MetaKeywords NVARCHAR(500),@CanonicalUrl NVARCHAR(1000),@SlugBase NVARCHAR(220),@SlugSuffix INT;

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
            SELECT @TotalCount=COUNT(1) FROM [CurrentAffairs].[DailyCurrentAffairs] p
            WHERE (@UserId IS NOT NULL OR p.Status='Published')
              AND (@Category IS NULL OR p.Category=@Category)
              AND (@FromDate IS NULL OR p.AffairDate>=@FromDate)
              AND (@ToDate IS NULL OR p.AffairDate<=@ToDate)
              AND (@Search IS NULL OR p.Title LIKE N'%'+@Search+N'%' OR p.Excerpt LIKE N'%'+@Search+N'%' OR p.Category LIKE N'%'+@Search+N'%');
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Success' AS [Message],
                JSON_QUERY((SELECT @TotalCount AS totalCount,@Page AS page,@PageSize AS pageSize,
                    JSON_QUERY((SELECT DISTINCT Category AS name FROM [CurrentAffairs].[DailyCurrentAffairs] WHERE Status='Published' AND Category IS NOT NULL ORDER BY name FOR JSON PATH)) AS categories,
                    JSON_QUERY((SELECT p.Id AS id,p.AffairDate AS affairDate,p.Title AS title,p.Slug AS slug,p.Category AS category,
                        p.ExamRelevance AS examRelevance,p.Excerpt AS excerpt,p.ImageUrl AS imageUrl,p.TemplateKey AS templateKey,p.SourceName AS sourceName,
                        p.SourceUrl AS sourceUrl,p.Status AS [status],p.IsFeatured AS isFeatured,p.PageTitle AS pageTitle,
                        p.MetaTitle AS metaTitle,p.MetaDescription AS metaDescription,p.MetaKeywords AS metaKeywords,
                        p.CanonicalUrl AS canonicalUrl,p.PublishedOn AS publishedOn,p.CreatedOn AS createdOn
                    FROM [CurrentAffairs].[DailyCurrentAffairs] p
                    WHERE (@UserId IS NOT NULL OR p.Status='Published')
                      AND (@Category IS NULL OR p.Category=@Category)
                      AND (@FromDate IS NULL OR p.AffairDate>=@FromDate)
                      AND (@ToDate IS NULL OR p.AffairDate<=@ToDate)
                      AND (@Search IS NULL OR p.Title LIKE N'%'+@Search+N'%' OR p.Excerpt LIKE N'%'+@Search+N'%' OR p.Category LIKE N'%'+@Search+N'%')
                    ORDER BY p.AffairDate DESC,p.IsFeatured DESC,p.CreatedOn DESC
                    OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY FOR JSON PATH)) AS items
                    FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;

        IF @Mode=2
        BEGIN
            SELECT @Id=id,@AffairDate=affairDate,@Title=title,@Slug=slug,@Category=category,@ExamRelevance=examRelevance,
                @Excerpt=excerpt,@ImageUrl=imageUrl,@HtmlContent=htmlContent,@TemplateKey=templateKey,@SourceName=sourceName,@SourceUrl=sourceUrl,
                @Status=[status],@IsFeatured=isFeatured,@PageTitle=pageTitle,@MetaTitle=metaTitle,
                @MetaDescription=metaDescription,@MetaKeywords=metaKeywords,@CanonicalUrl=canonicalUrl
            FROM OPENJSON(@Json) WITH (
                id INT '$.id',affairDate DATE '$.affairDate',title NVARCHAR(200) '$.title',slug NVARCHAR(220) '$.slug',
                category NVARCHAR(100) '$.category',examRelevance NVARCHAR(20) '$.examRelevance',excerpt NVARCHAR(500) '$.excerpt',
                imageUrl NVARCHAR(1000) '$.imageUrl',htmlContent NVARCHAR(MAX) '$.htmlContent',templateKey NVARCHAR(40) '$.templateKey',sourceName NVARCHAR(200) '$.sourceName',
                sourceUrl NVARCHAR(1000) '$.sourceUrl',[status] NVARCHAR(20) '$.status',isFeatured BIT '$.isFeatured',
                pageTitle NVARCHAR(200) '$.pageTitle',metaTitle NVARCHAR(200) '$.metaTitle',metaDescription NVARCHAR(320) '$.metaDescription',
                metaKeywords NVARCHAR(500) '$.metaKeywords',canonicalUrl NVARCHAR(1000) '$.canonicalUrl');
            IF @AffairDate IS NULL OR NULLIF(LTRIM(RTRIM(@Title)),N'') IS NULL OR NULLIF(LTRIM(RTRIM(@HtmlContent)),N'') IS NULL
            BEGIN SET @Output=(SELECT 400 AS StatusCode,0 AS IsSuccess,'Date, title and HTML content are required.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN; END;
            SET @Status=CASE WHEN @Status IN ('Published','Archived') THEN @Status ELSE 'Draft' END;
            SET @ExamRelevance=CASE WHEN @ExamRelevance IN ('High','Low') THEN @ExamRelevance ELSE 'Medium' END;
            SET @TemplateKey=CASE WHEN @TemplateKey IN ('topic-explainer','quick-revision') THEN @TemplateKey ELSE 'daily-brief' END;
            SET @Slug=LOWER(LTRIM(RTRIM(ISNULL(@Slug,N''))));
            SET @Slug=REPLACE(REPLACE(REPLACE(@Slug,N' ',N'-'),N'--',N'-'),N'/',N'-');
            IF @Slug=N'' SET @Slug=LOWER(REPLACE(LTRIM(RTRIM(@Title)),N' ',N'-'));
            SET @PageTitle=COALESCE(NULLIF(LTRIM(RTRIM(@PageTitle)),N''),@Title);
            SET @MetaTitle=COALESCE(NULLIF(LTRIM(RTRIM(@MetaTitle)),N''),@PageTitle);
            SET @MetaDescription=COALESCE(NULLIF(LTRIM(RTRIM(@MetaDescription)),N''),LEFT(COALESCE(@Excerpt,@Title),320));
            SET @SlugBase=@Slug; SET @SlugSuffix=1;
            WHILE EXISTS(SELECT 1 FROM [CurrentAffairs].[DailyCurrentAffairs] WHERE Slug=@Slug AND Id<>ISNULL(@Id,0))
            BEGIN SET @Slug=LEFT(@SlugBase,205)+N'-'+CONVERT(NVARCHAR(12),@SlugSuffix); SET @SlugSuffix+=1; END;

            IF ISNULL(@Id,0)>0
            BEGIN
                IF NOT EXISTS(SELECT 1 FROM [CurrentAffairs].[DailyCurrentAffairs] WHERE Id=@Id)
                BEGIN SET @Output=(SELECT 404 AS StatusCode,0 AS IsSuccess,'Current affairs item not found.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN; END;
                UPDATE [CurrentAffairs].[DailyCurrentAffairs] SET AffairDate=@AffairDate,Title=@Title,Slug=@Slug,Category=@Category,
                    ExamRelevance=@ExamRelevance,Excerpt=@Excerpt,ImageUrl=@ImageUrl,HtmlContent=@HtmlContent,TemplateKey=@TemplateKey,SourceName=@SourceName,
                    SourceUrl=@SourceUrl,Status=@Status,IsFeatured=ISNULL(@IsFeatured,0),PageTitle=@PageTitle,MetaTitle=@MetaTitle,
                    MetaDescription=@MetaDescription,MetaKeywords=@MetaKeywords,CanonicalUrl=@CanonicalUrl,
                    PublishedOn=CASE WHEN @Status='Published' THEN COALESCE(PublishedOn,SYSUTCDATETIME()) ELSE PublishedOn END,
                    ModifiedBy=@UserId,ModifiedOn=SYSUTCDATETIME() WHERE Id=@Id;
            END
            ELSE
            BEGIN
                INSERT INTO [CurrentAffairs].[DailyCurrentAffairs](AffairDate,Title,Slug,Category,ExamRelevance,Excerpt,ImageUrl,
                    HtmlContent,TemplateKey,SourceName,SourceUrl,Status,IsFeatured,PageTitle,MetaTitle,MetaDescription,MetaKeywords,CanonicalUrl,PublishedOn,CreatedBy)
                VALUES(@AffairDate,@Title,@Slug,@Category,@ExamRelevance,@Excerpt,@ImageUrl,@HtmlContent,@TemplateKey,@SourceName,@SourceUrl,
                    @Status,ISNULL(@IsFeatured,0),@PageTitle,@MetaTitle,@MetaDescription,@MetaKeywords,@CanonicalUrl,
                    CASE WHEN @Status='Published' THEN SYSUTCDATETIME() END,@UserId);
                SET @Id=CONVERT(INT,SCOPE_IDENTITY());
            END;
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Current affairs item saved.' AS [Message],
                JSON_QUERY((SELECT @Id AS id,@Slug AS slug FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;

        IF @Mode=3
        BEGIN
            SELECT @Id=id,@Status=[status] FROM OPENJSON(@Json) WITH(id INT '$.id',[status] NVARCHAR(20) '$.status');
            IF @Status NOT IN ('Draft','Published','Archived') SET @Status='Draft';
            UPDATE [CurrentAffairs].[DailyCurrentAffairs] SET Status=@Status,
                PublishedOn=CASE WHEN @Status='Published' THEN COALESCE(PublishedOn,SYSUTCDATETIME()) ELSE PublishedOn END,
                ModifiedBy=@UserId,ModifiedOn=SYSUTCDATETIME() WHERE Id=@Id;
            IF @@ROWCOUNT=0 BEGIN SET @Output=(SELECT 404 AS StatusCode,0 AS IsSuccess,'Current affairs item not found.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN; END;
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Current affairs status updated.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;

        IF @Mode=4
        BEGIN
            SELECT @Id=id FROM OPENJSON(@Json) WITH(id INT '$.id');
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Success' AS [Message],
                JSON_QUERY((SELECT p.Id AS id,p.AffairDate AS affairDate,p.Title AS title,p.Slug AS slug,p.Category AS category,
                    p.ExamRelevance AS examRelevance,p.Excerpt AS excerpt,p.ImageUrl AS imageUrl,p.HtmlContent AS htmlContent,p.TemplateKey AS templateKey,
                    p.SourceName AS sourceName,p.SourceUrl AS sourceUrl,p.Status AS [status],p.IsFeatured AS isFeatured,
                    p.PageTitle AS pageTitle,p.MetaTitle AS metaTitle,p.MetaDescription AS metaDescription,p.MetaKeywords AS metaKeywords,
                    p.CanonicalUrl AS canonicalUrl,p.PublishedOn AS publishedOn,p.CreatedOn AS createdOn
                    FROM [CurrentAffairs].[DailyCurrentAffairs] p WHERE p.Id=@Id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response
                FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;
        SET @Output=(SELECT 400 AS StatusCode,0 AS IsSuccess,'Unsupported current affairs operation.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        INSERT INTO [dbo].[ErrorLogs](ProcedureName,ErrorMessage,ErrorNumber,ErrorLine,ErrorState,ErrorSeverity,UserId)
        VALUES('CurrentAffairs.SpDailyCurrentAffairs',ERROR_MESSAGE(),ERROR_NUMBER(),ERROR_LINE(),ERROR_STATE(),ERROR_SEVERITY(),@UserId);
        SET @Output=(SELECT 500 AS StatusCode,0 AS IsSuccess,'Unable to process current affairs request.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
