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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Настройка таблицы Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Username).HasColumnName("username");
                entity.Property(e => e.Email).HasColumnName("email");
                entity.Property(e => e.Password).HasColumnName("password");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            });

            // Точно так же можно настроить остальные таблицы по мере необходимости:
            modelBuilder.Entity<Category>().ToTable("categories");
            modelBuilder.Entity<UserInterest>().ToTable("user_interests");
            modelBuilder.Entity<ActivityLog>().ToTable("activity_logs");
            modelBuilder.Entity<MoodLog>().ToTable("mood_logs");
            modelBuilder.Entity<AiRecommendation>().ToTable("ai_recommendations");
        }
    }
}
