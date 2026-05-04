using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("questions")]
public partial class Question
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("question_text")]
    public string QuestionText { get; set; } = null!;

    [Column("category_id")]
    public int CategoryId { get; set; }

    [Column("subject_id")]
    public int SubjectId { get; set; }

    [Column("difficulty_level")]
    [StringLength(20)]
    public string? DifficultyLevel { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [InverseProperty("Question")]
    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    [ForeignKey("CategoryId")]
    [InverseProperty("QuestionCategories")]
    public virtual Category Category { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    [InverseProperty("Questions")]
    public virtual User? CreatedByNavigation { get; set; }

    [InverseProperty("Question")]
    public virtual ICollection<Option> Options { get; set; } = new List<Option>();

    [ForeignKey("SubjectId")]
    [InverseProperty("QuestionSubjects")]
    public virtual Category Subject { get; set; } = null!;

    [InverseProperty("Question")]
    public virtual ICollection<TestQuestion> TestQuestions { get; set; } = new List<TestQuestion>();
}
