CREATE PROCEDURE [Blogs].[SpBlogs]
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
        DECLARE @Id INT, @Page INT, @PageSize INT, @Search NVARCHAR(200), @Category NVARCHAR(100),
            @Title NVARCHAR(200), @Slug NVARCHAR(220), @Excerpt NVARCHAR(500), @ImageUrl NVARCHAR(1000),
            @HtmlContent NVARCHAR(MAX), @TemplateKey NVARCHAR(40), @AuthorName NVARCHAR(120), @Status NVARCHAR(20),
            @IsFeatured BIT, @PageTitle NVARCHAR(200), @MetaTitle NVARCHAR(200), @MetaDescription NVARCHAR(320),
            @MetaKeywords NVARCHAR(500), @CanonicalUrl NVARCHAR(1000), @SlugBase NVARCHAR(220), @SlugSuffix INT;

        IF @Mode = 1
        BEGIN
            SELECT @Page=TRY_CONVERT(INT,JSON_VALUE(@Json,'$.page')),
                   @PageSize=TRY_CONVERT(INT,JSON_VALUE(@Json,'$.pageSize')),
                   @Search=NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json,'$.search'))),N''),
                   @Category=NULLIF(LTRIM(RTRIM(JSON_VALUE(@Json,'$.category'))),N'');
            SET @Page=CASE WHEN @Page IS NULL OR @Page<1 THEN 1 ELSE @Page END;
            SET @PageSize=CASE WHEN @PageSize IS NULL OR @PageSize<1 THEN 10 WHEN @PageSize>100 THEN 100 ELSE @PageSize END;
            DECLARE @TotalCount INT;
            SELECT @TotalCount=COUNT(1) FROM [Blogs].[BlogPosts] p
            WHERE (@UserId IS NOT NULL OR p.Status='Published')
              AND (@Category IS NULL OR p.Category=@Category)
              AND (@Search IS NULL OR p.Title LIKE N'%'+@Search+N'%' OR p.Excerpt LIKE N'%'+@Search+N'%' OR p.Category LIKE N'%'+@Search+N'%');
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Success' AS [Message],
                JSON_QUERY((SELECT @TotalCount AS totalCount,@Page AS page,@PageSize AS pageSize,
                    JSON_QUERY((SELECT p.Id AS id,p.Title AS title,p.Slug AS slug,p.Category AS category,p.Excerpt AS excerpt,
                        p.ImageUrl AS imageUrl,p.TemplateKey AS templateKey,p.AuthorName AS authorName,p.Status AS [status],
                        p.IsFeatured AS isFeatured,p.PageTitle AS pageTitle,p.MetaTitle AS metaTitle,
                        p.MetaDescription AS metaDescription,p.MetaKeywords AS metaKeywords,p.CanonicalUrl AS canonicalUrl,
                        p.PublishedOn AS publishedOn,p.CreatedOn AS createdOn
                    FROM [Blogs].[BlogPosts] p
                    WHERE (@UserId IS NOT NULL OR p.Status='Published')
                      AND (@Category IS NULL OR p.Category=@Category)
                      AND (@Search IS NULL OR p.Title LIKE N'%'+@Search+N'%' OR p.Excerpt LIKE N'%'+@Search+N'%' OR p.Category LIKE N'%'+@Search+N'%')
                    ORDER BY p.IsFeatured DESC,COALESCE(p.PublishedOn,p.CreatedOn) DESC
                    OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY FOR JSON PATH)) AS items
                    FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 2
        BEGIN
            SELECT @Id=id,@Title=title,@Slug=slug,@Category=category,@Excerpt=excerpt,@ImageUrl=imageUrl,
                @HtmlContent=htmlContent,@TemplateKey=templateKey,@AuthorName=authorName,@Status=[status],
                @IsFeatured=isFeatured,@PageTitle=pageTitle,@MetaTitle=metaTitle,@MetaDescription=metaDescription,
                @MetaKeywords=metaKeywords,@CanonicalUrl=canonicalUrl
            FROM OPENJSON(@Json) WITH (
                id INT '$.id',title NVARCHAR(200) '$.title',slug NVARCHAR(220) '$.slug',category NVARCHAR(100) '$.category',
                excerpt NVARCHAR(500) '$.excerpt',imageUrl NVARCHAR(1000) '$.imageUrl',htmlContent NVARCHAR(MAX) '$.htmlContent',
                templateKey NVARCHAR(40) '$.templateKey',authorName NVARCHAR(120) '$.authorName',[status] NVARCHAR(20) '$.status',
                isFeatured BIT '$.isFeatured',pageTitle NVARCHAR(200) '$.pageTitle',metaTitle NVARCHAR(200) '$.metaTitle',
                metaDescription NVARCHAR(320) '$.metaDescription',metaKeywords NVARCHAR(500) '$.metaKeywords',canonicalUrl NVARCHAR(1000) '$.canonicalUrl');
            IF NULLIF(LTRIM(RTRIM(@Title)),N'') IS NULL OR NULLIF(LTRIM(RTRIM(@HtmlContent)),N'') IS NULL
            BEGIN SET @Output=(SELECT 400 AS StatusCode,0 AS IsSuccess,'Title and HTML content are required.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN; END;
            SET @Status=CASE WHEN @Status IN ('Published','Archived') THEN @Status ELSE 'Draft' END;
            SET @TemplateKey=CASE WHEN @TemplateKey IN ('editorial','guide','announcement') THEN @TemplateKey ELSE 'editorial' END;
            SET @Slug=LOWER(LTRIM(RTRIM(ISNULL(@Slug,N''))));
            SET @Slug=REPLACE(REPLACE(REPLACE(@Slug,N' ',N'-'),N'--',N'-'),N'/',N'-');
            IF @Slug=N'' SET @Slug=LOWER(REPLACE(LTRIM(RTRIM(@Title)),N' ',N'-'));
            SET @PageTitle=COALESCE(NULLIF(LTRIM(RTRIM(@PageTitle)),N''),@Title);
            SET @MetaTitle=COALESCE(NULLIF(LTRIM(RTRIM(@MetaTitle)),N''),@PageTitle);
            SET @MetaDescription=COALESCE(NULLIF(LTRIM(RTRIM(@MetaDescription)),N''),LEFT(COALESCE(@Excerpt,@Title),320));
            SET @SlugBase=@Slug;
            SET @SlugSuffix=1;
            WHILE EXISTS(SELECT 1 FROM [Blogs].[BlogPosts] WHERE Slug=@Slug AND Id<>ISNULL(@Id,0))
            BEGIN
                SET @Slug=LEFT(@SlugBase,205)+N'-'+CONVERT(NVARCHAR(12),@SlugSuffix);
                SET @SlugSuffix+=1;
            END;
            IF ISNULL(@Id,0)>0
            BEGIN
                IF NOT EXISTS(SELECT 1 FROM [Blogs].[BlogPosts] WHERE Id=@Id)
                BEGIN SET @Output=(SELECT 404 AS StatusCode,0 AS IsSuccess,'Blog post not found.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN; END;
                UPDATE [Blogs].[BlogPosts] SET Title=@Title,Slug=@Slug,Category=@Category,Excerpt=@Excerpt,ImageUrl=@ImageUrl,
                    HtmlContent=@HtmlContent,TemplateKey=@TemplateKey,AuthorName=@AuthorName,Status=@Status,IsFeatured=ISNULL(@IsFeatured,0),
                    PageTitle=@PageTitle,MetaTitle=@MetaTitle,MetaDescription=@MetaDescription,MetaKeywords=@MetaKeywords,
                    CanonicalUrl=@CanonicalUrl,PublishedOn=CASE WHEN @Status='Published' THEN COALESCE(PublishedOn,SYSUTCDATETIME()) ELSE PublishedOn END,
                    ModifiedBy=@UserId,ModifiedOn=SYSUTCDATETIME() WHERE Id=@Id;
            END
            ELSE
            BEGIN
                INSERT INTO [Blogs].[BlogPosts](Title,Slug,Category,Excerpt,ImageUrl,HtmlContent,TemplateKey,AuthorName,Status,IsFeatured,
                    PageTitle,MetaTitle,MetaDescription,MetaKeywords,CanonicalUrl,PublishedOn,CreatedBy)
                VALUES(@Title,@Slug,@Category,@Excerpt,@ImageUrl,@HtmlContent,@TemplateKey,@AuthorName,@Status,ISNULL(@IsFeatured,0),
                    @PageTitle,@MetaTitle,@MetaDescription,@MetaKeywords,@CanonicalUrl,CASE WHEN @Status='Published' THEN SYSUTCDATETIME() END,@UserId);
                SET @Id=CONVERT(INT,SCOPE_IDENTITY());
            END;
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Blog post saved.' AS [Message],
                JSON_QUERY((SELECT @Id AS id,@Slug AS slug FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
            RETURN;
        END;

        IF @Mode = 3
        BEGIN
            SELECT @Id=id,@Status=[status] FROM OPENJSON(@Json) WITH(id INT '$.id',[status] NVARCHAR(20) '$.status');
            IF @Status NOT IN ('Draft','Published','Archived') SET @Status='Draft';
            UPDATE [Blogs].[BlogPosts] SET Status=@Status,PublishedOn=CASE WHEN @Status='Published' THEN COALESCE(PublishedOn,SYSUTCDATETIME()) ELSE PublishedOn END,
                ModifiedBy=@UserId,ModifiedOn=SYSUTCDATETIME() WHERE Id=@Id;
            IF @@ROWCOUNT=0 BEGIN SET @Output=(SELECT 404 AS StatusCode,0 AS IsSuccess,'Blog post not found.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN; END;
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Blog post status updated.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;

        IF @Mode = 4
        BEGIN
            SELECT @Id=id FROM OPENJSON(@Json) WITH(id INT '$.id');
            SET @Output=(SELECT 200 AS StatusCode,1 AS IsSuccess,'Success' AS [Message],
                JSON_QUERY((SELECT p.Id AS id,p.Title AS title,p.Slug AS slug,p.Category AS category,p.Excerpt AS excerpt,
                    p.ImageUrl AS imageUrl,p.HtmlContent AS htmlContent,p.TemplateKey AS templateKey,p.AuthorName AS authorName,
                    p.Status AS [status],p.IsFeatured AS isFeatured,p.PageTitle AS pageTitle,p.MetaTitle AS metaTitle,
                    p.MetaDescription AS metaDescription,p.MetaKeywords AS metaKeywords,p.CanonicalUrl AS canonicalUrl,
                    p.PublishedOn AS publishedOn,p.CreatedOn AS createdOn FROM [Blogs].[BlogPosts] p WHERE p.Id=@Id
                    FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Response FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); RETURN;
        END;
        SET @Output=(SELECT 400 AS StatusCode,0 AS IsSuccess,'Unsupported blog operation.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        INSERT INTO [dbo].[ErrorLogs](ProcedureName,ErrorMessage,ErrorNumber,ErrorLine,ErrorState,ErrorSeverity,UserId)
        VALUES('Blogs.SpBlogs',ERROR_MESSAGE(),ERROR_NUMBER(),ERROR_LINE(),ERROR_STATE(),ERROR_SEVERITY(),@UserId);
        SET @Output=(SELECT 500 AS StatusCode,0 AS IsSuccess,'Unable to process blog request.' AS [Message] FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
    END CATCH;
END;
