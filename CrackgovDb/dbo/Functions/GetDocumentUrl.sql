CREATE FUNCTION dbo.GetDocumentUrl
(
    @DocumentId INT
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @Url NVARCHAR(MAX);

    SELECT TOP 1 
        @Url = Url
    FROM dbo.Documents
    WHERE Id = @DocumentId;

    RETURN @Url;
END
