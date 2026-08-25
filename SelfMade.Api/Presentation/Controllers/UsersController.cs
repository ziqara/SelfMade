using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    // Получить профиль пользователя по ID: GET /api/users/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponseDto>> GetUserById(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "Пользователь не найден." });
        }

        // Возвращаем данные без пароля ради безопасности!
        var response = new UserResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            CreatedAt = user.CreatedAt
        };

        return Ok(response);
    }
}

// DTO для безопасного ответа (без пароля в открытом виде)
public class UserResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}