using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("answers")]
public partial class Answer
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("attempt_id")]
    public int AttemptId { get; set; }

    [Column("question_id")]
    public int QuestionId { get; set; }

    [Column("selected_option_id")]
    public int SelectedOptionId { get; set; }

    [Column("is_correct")]
    public bool? IsCorrect { get; set; }

    [ForeignKey("AttemptId")]
    [InverseProperty("Answers")]
    public virtual Attempt Attempt { get; set; } = null!;

    [ForeignKey("QuestionId")]
    [InverseProperty("Answers")]
    public virtual Question Question { get; set; } = null!;

    [ForeignKey("SelectedOptionId")]
    [InverseProperty("Answers")]
    public virtual Option SelectedOption { get; set; } = null!;
}
