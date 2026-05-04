using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("users")]
[Index("Email", Name = "UQ__users__AB6E616448F23807", IsUnique = true)]
public partial class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    [Column("email")]
    [StringLength(255)]
    public string Email { get; set; } = null!;

    [Column("password_hash")]
    [StringLength(255)]
    public string PasswordHash { get; set; } = null!;

    [Column("role")]
    [StringLength(50)]
    public string Role { get; set; } = null!;

    [Column("franchise_id")]
    public int? FranchiseId { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [ForeignKey("FranchiseId")]
    [InverseProperty("Users")]
    public virtual Franchise? Franchise { get; set; }

    [InverseProperty("CreatedByNavigation")]
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();

    [InverseProperty("User")]
    public virtual Student? Student { get; set; }

    [InverseProperty("CreatedByNavigation")]
    public virtual ICollection<Test> Tests { get; set; } = new List<Test>();
}
