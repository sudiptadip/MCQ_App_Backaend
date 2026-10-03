 CREATE FUNCTION [dbo].[IsCorrectAnswer]
                (
                    @QuestionId INT,
                    @SelectedOptionId INT
                )
                RETURNS BIT
                AS
                BEGIN
                
                    DECLARE @IsCorrect BIT;
                
                    SELECT @IsCorrect = is_correct
                    FROM [dbo].[options]
                    WHERE question_id = @QuestionId
                      AND id = @SelectedOptionId;
                
                    RETURN ISNULL(@IsCorrect, 0);
                
                END
