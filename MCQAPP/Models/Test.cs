using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("tests")]
public partial class Test
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    [Column("category_id")]
    public int CategoryId { get; set; }

    [Column("subject_id")]
    public int? SubjectId { get; set; }

    [Column("total_questions")]
    public int? TotalQuestions { get; set; }

    [Column("duration_minutes")]
    public int? DurationMinutes { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [InverseProperty("Test")]
    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();

    [ForeignKey("CategoryId")]
    [InverseProperty("TestCategories")]
    public virtual Category Category { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    [InverseProperty("Tests")]
    public virtual User? CreatedByNavigation { get; set; }

    [InverseProperty("Test")]
    public virtual ICollection<FranchiseTest> FranchiseTests { get; set; } = new List<FranchiseTest>();

    [ForeignKey("SubjectId")]
    [InverseProperty("TestSubjects")]
    public virtual Category? Subject { get; set; }

    [InverseProperty("Test")]
    public virtual ICollection<TestQuestion> TestQuestions { get; set; } = new List<TestQuestion>();
}
