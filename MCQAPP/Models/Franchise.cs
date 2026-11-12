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

    [Column("smtp_host")]
    [StringLength(255)]
    public string? SmtpHost { get; set; }

    [Column("smtp_port")]
    public int? SmtpPort { get; set; }

    [Column("smtp_email")]
    [StringLength(255)]
    public string? SmtpEmail { get; set; }

    [Column("smtp_password")]
    [StringLength(500)]
    public string? SmtpPassword { get; set; }

    [Column("smtp_enable_ssl")]
    public bool SmtpEnableSsl { get; set; } = true;

    [Column("smtp_sender_name")]
    [StringLength(255)]
    public string? SmtpSenderName { get; set; }

    [InverseProperty("Franchise")]
    public virtual ICollection<FranchiseTest> FranchiseTests { get; set; } = new List<FranchiseTest>();

    [InverseProperty("Franchise")]
    public virtual ICollection<Student> Students { get; set; } = new List<Student>();

    [InverseProperty("Franchise")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();

    [InverseProperty("Franchise")]
    public virtual ICollection<Document> Documents { get; set; } = new List<Document>();
}
