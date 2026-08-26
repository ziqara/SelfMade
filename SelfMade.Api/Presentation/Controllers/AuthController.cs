using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public AuthController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] UserDto request)
    {
        // Проверяем, свободен ли email
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Пользователь с таким email уже существует." });
        }

        // Хэшируем пароль перед сохранением в БД!
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            Password = passwordHash, // Сохраняем "абракадабру", а не реальный пароль
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

        return Ok(new { message = "Регистрация успешна!" });
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] LoginDto request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);

        // Проверяем, существует ли пользователь и совпадает ли пароль
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            return Unauthorized(new { message = "Неверный email или пароль." });
        }

        // Скоро здесь появится выдача JWT-токена!
        return Ok(new { message = "Успешный вход!", userId = user.Id });
    }
}

// DTO для входа
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// DTO для регистрации
public class UserDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}