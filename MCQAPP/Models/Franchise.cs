using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("franchises")]
[Index("Code", Name = "UQ__franchis__357D4CF9B2F7165D", IsUnique = true)]
public partial class Franchise
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    [Column("code")]
    [StringLength(50)]
    public string Code { get; set; } = null!;

    [Column("owner_name")]
    [StringLength(255)]
    public string? OwnerName { get; set; }

    [Column("contact_email")]
    [StringLength(255)]
    public string? ContactEmail { get; set; }

    [Column("status")]
    public bool? Status { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [InverseProperty("Franchise")]
    public virtual ICollection<FranchiseTest> FranchiseTests { get; set; } = new List<FranchiseTest>();

    [InverseProperty("Franchise")]
    public virtual ICollection<Student> Students { get; set; } = new List<Student>();

    [InverseProperty("Franchise")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
