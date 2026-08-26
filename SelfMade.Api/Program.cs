using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Infrastructure;
using SelfMade.Api.Infrastructure.AiServices;
using SelfMade.Api.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
builder.Services.AddScoped<IMoodRepository, MoodRepository>();
builder.Services.AddScoped<IAiService, DummyAiService>();

// 1. Подключаем PostgreSQL через EF Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();

// 2. Используем встроенный в .NET 10 OpenAPI вместо старого Swagger
builder.Services.AddOpenApi();

var app = builder.Build();

// 3. Настраиваем конвейер запросов
if (app.Environment.IsDevelopment())
{
    // В .NET 10 документация OpenAPI доступна по адресу /openapi/v1.json
    // А интерактивный интерфейс можно посмотреть через Scalar или встроенные эндпоинты
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();