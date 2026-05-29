using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MCQAPP.Models;

[Table("documents")]
public partial class Document
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("franchise_id")]
    public int? FranchiseId { get; set; }

    [Column("file_name")]
    [StringLength(255)]
    public string FileName { get; set; } = null!;

    [Column("file_path")]
    [StringLength(500)]
    public string FilePath { get; set; } = null!;

    [Column("url")]
    [StringLength(500)]
    public string Url { get; set; } = null!;

    [Column("content_type")]
    [StringLength(100)]
    public string? ContentType { get; set; }

    [Column("file_size")]
    public long FileSize { get; set; }

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; }

    [ForeignKey("FranchiseId")]
    [InverseProperty("Documents")]
    public virtual Franchise? Franchise { get; set; }
}
