using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("user_passwords")]
[Index("UserId", Name = "UQ_user_passwords_user_id", IsUnique = true)]
public partial class UserPassword
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("password")]
    [StringLength(255)]
    public string Password { get; set; } = null!;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("UserPassword")]
    public virtual User User { get; set; } = null!;
}
