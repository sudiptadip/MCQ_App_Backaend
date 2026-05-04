using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Models;

[Table("franchise_tests")]
public partial class FranchiseTest
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("franchise_id")]
    public int FranchiseId { get; set; }

    [Column("test_id")]
    public int TestId { get; set; }

    [ForeignKey("FranchiseId")]
    [InverseProperty("FranchiseTests")]
    public virtual Franchise Franchise { get; set; } = null!;

    [ForeignKey("TestId")]
    [InverseProperty("FranchiseTests")]
    public virtual Test Test { get; set; } = null!;
}
