using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("attempts")]
public partial class Attempt
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("student_id")]
    public int StudentId { get; set; }

    [Column("test_id")]
    public int TestId { get; set; }

    [Column("score")]
    public int? Score { get; set; }

    [Column("started_at")]
    public DateTime? StartedAt { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [InverseProperty("Attempt")]
    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    [ForeignKey("StudentId")]
    [InverseProperty("Attempts")]
    public virtual Student Student { get; set; } = null!;

    [ForeignKey("TestId")]
    [InverseProperty("Attempts")]
    public virtual Test Test { get; set; } = null!;
}
