using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("categories")]
public partial class Category
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    [Column("parent_id")]
    public int? ParentId { get; set; }

    [Column("type")]
    [StringLength(50)]
    public string Type { get; set; } = null!;

    [InverseProperty("Parent")]
    public virtual ICollection<Category> InverseParent { get; set; } = new List<Category>();

    [ForeignKey("ParentId")]
    [InverseProperty("InverseParent")]
    public virtual Category? Parent { get; set; }

    [InverseProperty("Category")]
    public virtual ICollection<Question> QuestionCategories { get; set; } = new List<Question>();

    [InverseProperty("Subject")]
    public virtual ICollection<Question> QuestionSubjects { get; set; } = new List<Question>();

    [InverseProperty("Category")]
    public virtual ICollection<Test> TestCategories { get; set; } = new List<Test>();

    [InverseProperty("Subject")]
    public virtual ICollection<Test> TestSubjects { get; set; } = new List<Test>();
}
