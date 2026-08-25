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

    // Регистрация: POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto request)
    {
        // Проверяем, не занят ли email
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Пользователь с такой почтой уже существует." });
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            Password = request.Password, // В будущем здесь будет хэширование!
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync(); // или SaveChangesAsync() в зависимости от твоего метода

        return Ok(new { message = "Регистрация прошла успешно!", userId = user.Id });
    }

    // Вход: POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);

        // Проверяем существование пользователя и пароль
        if (user == null || user.Password != request.Password)
        {
            return Unauthorized(new { message = "Неверный email или пароль." });
        }

        return Ok(new { message = "Успешный вход!", userId = user.Id, username = user.Username });
    }
}

// DTO для передачи данных из запроса
public class RegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}