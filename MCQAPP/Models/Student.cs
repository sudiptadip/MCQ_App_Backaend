using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("students")]
[Index("UserId", Name = "UQ__students__B9BE370EA65BFFF0", IsUnique = true)]
public partial class Student
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("franchise_id")]
    public int FranchiseId { get; set; }

    [Column("enrollment_no")]
    [StringLength(100)]
    public string? EnrollmentNo { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [InverseProperty("Student")]
    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();

    [ForeignKey("FranchiseId")]
    [InverseProperty("Students")]
    public virtual Franchise Franchise { get; set; } = null!;

    [ForeignKey("UserId")]
    [InverseProperty("Student")]
    public virtual User User { get; set; } = null!;
}
