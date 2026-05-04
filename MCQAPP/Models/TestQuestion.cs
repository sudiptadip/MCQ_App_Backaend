using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("test_questions")]
public partial class TestQuestion
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("test_id")]
    public int TestId { get; set; }

    [Column("question_id")]
    public int QuestionId { get; set; }

    [ForeignKey("QuestionId")]
    [InverseProperty("TestQuestions")]
    public virtual Question Question { get; set; } = null!;

    [ForeignKey("TestId")]
    [InverseProperty("TestQuestions")]
    public virtual Test Test { get; set; } = null!;
}
