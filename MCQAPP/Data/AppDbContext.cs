using System;
using System.Collections.Generic;
using MCQAPP.Models;
using Microsoft.EntityFrameworkCore;

namespace MCQAPP.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Answer> Answers { get; set; }

    public virtual DbSet<Attempt> Attempts { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Franchise> Franchises { get; set; }

    public virtual DbSet<FranchiseTest> FranchiseTests { get; set; }

    public virtual DbSet<Option> Options { get; set; }

    public virtual DbSet<Question> Questions { get; set; }

    public virtual DbSet<Student> Students { get; set; }

    public virtual DbSet<Test> Tests { get; set; }

    public virtual DbSet<TestQuestion> TestQuestions { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=SUDIPTA\\SQLEXPRESS;Database=McqAppDb;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Answer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__answers__3213E83FF95B81A4");

            entity.HasOne(d => d.Attempt).WithMany(p => p.Answers).HasConstraintName("FK_answers_attempt");

            entity.HasOne(d => d.Question).WithMany(p => p.Answers)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_answers_question");

            entity.HasOne(d => d.SelectedOption).WithMany(p => p.Answers)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_answers_option");
        });

        modelBuilder.Entity<Attempt>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__attempts__3213E83FDF50BD79");

            entity.HasOne(d => d.Student).WithMany(p => p.Attempts)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_attempts_student");

            entity.HasOne(d => d.Test).WithMany(p => p.Attempts)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_attempts_test");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__categori__3213E83FFEF89732");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent).HasConstraintName("FK_categories_parent");
        });

        modelBuilder.Entity<Franchise>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__franchis__3213E83F1F6BEFE5");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status).HasDefaultValue(true);
        });

        modelBuilder.Entity<FranchiseTest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__franchis__3213E83FAA1B7BE9");

            entity.HasOne(d => d.Franchise).WithMany(p => p.FranchiseTests).HasConstraintName("FK_franchise_tests_franchise");

            entity.HasOne(d => d.Test).WithMany(p => p.FranchiseTests).HasConstraintName("FK_franchise_tests_test");
        });

        modelBuilder.Entity<Option>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__options__3213E83FAD7A838A");

            entity.Property(e => e.IsCorrect).HasDefaultValue(false);

            entity.HasOne(d => d.Question).WithMany(p => p.Options).HasConstraintName("FK_options_question");
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__question__3213E83F88673D17");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Category).WithMany(p => p.QuestionCategories)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_questions_category");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Questions).HasConstraintName("FK_questions_user");

            entity.HasOne(d => d.Subject).WithMany(p => p.QuestionSubjects)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_questions_subject");
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__students__3213E83F84C6C858");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Franchise).WithMany(p => p.Students)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_students_franchise");

            entity.HasOne(d => d.User).WithOne(p => p.Student)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_students_user");
        });

        modelBuilder.Entity<Test>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__tests__3213E83F9CDB9766");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Category).WithMany(p => p.TestCategories)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_tests_category");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Tests).HasConstraintName("FK_tests_user");

            entity.HasOne(d => d.Subject).WithMany(p => p.TestSubjects).HasConstraintName("FK_tests_subject");
        });

        modelBuilder.Entity<TestQuestion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__test_que__3213E83F52FEB723");

            entity.HasOne(d => d.Question).WithMany(p => p.TestQuestions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_test_questions_question");

            entity.HasOne(d => d.Test).WithMany(p => p.TestQuestions).HasConstraintName("FK_test_questions_test");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__users__3213E83FB5B6773B");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Franchise).WithMany(p => p.Users).HasConstraintName("FK_users_franchise");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
