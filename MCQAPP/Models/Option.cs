using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("options")]
public partial class Option
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("question_id")]
    public int QuestionId { get; set; }

    [Column("option_text")]
    public string OptionText { get; set; } = null!;

    [Column("is_correct")]
    public bool? IsCorrect { get; set; }

    [InverseProperty("SelectedOption")]
    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    [ForeignKey("QuestionId")]
    [InverseProperty("Options")]
    public virtual Question Question { get; set; } = null!;
}
