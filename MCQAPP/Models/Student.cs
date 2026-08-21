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

    [Column("gender")]
    [StringLength(20)]
    public string? Gender { get; set; }

    [Column("date_of_birth", TypeName = "date")]
    public DateTime? DateOfBirth { get; set; }

    [Column("mobile_no")]
    [StringLength(20)]
    public string? MobileNo { get; set; }

    [Column("alternate_mobile_no")]
    [StringLength(20)]
    public string? AlternateMobileNo { get; set; }

    [Column("email")]
    [StringLength(255)]
    public string? Email { get; set; }

    [Column("address_line1")]
    [StringLength(255)]
    public string? AddressLine1 { get; set; }

    [Column("address_line2")]
    [StringLength(255)]
    public string? AddressLine2 { get; set; }

    [Column("city")]
    [StringLength(100)]
    public string? City { get; set; }

    [Column("state")]
    [StringLength(100)]
    public string? State { get; set; }

    [Column("country")]
    [StringLength(100)]
    public string? Country { get; set; }

    [Column("postal_code")]
    [StringLength(20)]
    public string? PostalCode { get; set; }

    [Column("profile_image_url")]
    [StringLength(500)]
    public string? ProfileImageUrl { get; set; }

    [Column("status")]
    public bool Status { get; set; }

    [Column("ValidityDate", TypeName = "datetime")]
    public DateTime? ValidityDate { get; set; }

    [InverseProperty("Student")]
    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();

    [ForeignKey(nameof(FranchiseId))]
    [InverseProperty(nameof(Franchise.Students))]
    public virtual Franchise Franchise { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    [InverseProperty(nameof(User.Student))]
    public virtual User User { get; set; } = null!;
}
