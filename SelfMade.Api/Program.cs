using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Infrastructure;
using SelfMade.Api.Infrastructure.Repositories;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Регистрация сервисов и репозиториев
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
builder.Services.AddScoped<IMoodRepository, MoodRepository>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IAiService, GeminiAiService>();
builder.Services.AddScoped<IUserInterestRepository, UserInterestRepository>();

// Настройка JWT Аутентификации
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Подключаем PostgreSQL через EF Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();

// Используем встроенный в .NET 10 OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Настраиваем конвейер запросов (Порядок очень важен!)
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();