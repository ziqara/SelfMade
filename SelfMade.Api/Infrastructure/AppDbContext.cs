using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }


        // DbSet — это наши таблицы в базе данных
        public DbSet<User> Users => Set<User>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<UserInterest> UserInterests => Set<UserInterest>();
        public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
        public DbSet<MoodLog> MoodLogs => Set<MoodLog>();
        public DbSet<AiRecommendation> AiRecommendations => Set<AiRecommendation>();
        public DbSet<UserProfile> UserProfiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Настройка таблицы Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(50);
                entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(100);
                entity.Property(e => e.Password).HasColumnName("password").HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<UserProfile>(entity =>
            {
                entity.ToTable("user_profiles");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.LearningTrack).HasColumnName("learning_track");
                entity.Property(e => e.CurrentLevel).HasColumnName("current_level");
                entity.Property(e => e.FreeTimeStart).HasColumnName("free_time_start");
                entity.Property(e => e.FreeTimeEnd).HasColumnName("free_time_end");
                entity.Property(e => e.SleepTime).HasColumnName("sleep_time");
                entity.Property(e => e.PreferredRest).HasColumnName("preferred_rest");
                entity.Property(e => e.DislikedRest).HasColumnName("disliked_rest");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable("categories");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.Type).HasColumnName("type");
            });

            modelBuilder.Entity<UserInterest>(entity =>
            {
                entity.ToTable("user_interests");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.CategoryId).HasColumnName("category_id");
                entity.Property(e => e.Title).HasColumnName("title");
                entity.Property(e => e.IsDevelopmentGoal).HasColumnName("is_development_goal");
            });

            modelBuilder.Entity<ActivityLog>(entity =>
            {
                entity.ToTable("activity_logs");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.CategoryId).HasColumnName("category_id");
                entity.Property(e => e.Title).HasColumnName("title");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.DurationMinutes).HasColumnName("duration_minutes");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.IsProductive).HasColumnName("is_productive");
            });

            modelBuilder.Entity<MoodLog>(entity =>
            {
                entity.ToTable("mood_logs");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.Score).HasColumnName("score");
                entity.Property(e => e.Note).HasColumnName("note");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            });

            modelBuilder.Entity<AiRecommendation>(entity =>
            {
                entity.ToTable("ai_recommendations");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.GoalId).HasColumnName("goal_id");
                entity.Property(e => e.Title).HasColumnName("title");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            });
        }
    }
}
