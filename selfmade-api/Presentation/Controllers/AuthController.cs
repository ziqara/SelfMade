using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Web;

namespace SelfMade.Api.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AuthController> _logger;

    private const string OAuthStateCookie = "oauth_state";

    // Внедряем IConfiguration, чтобы читать секретный ключ из appsettings.json
    public AuthController(
        IUserRepository userRepository,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<AuthController> logger)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] UserDto request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Пользователь с таким email уже существует." });
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            Password = passwordHash,
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

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            return Unauthorized(new { message = "Неверный email или пароль." });
        }

        var tokenString = GenerateJwtToken(user);

        return Ok(new { message = "Успешный вход!", token = tokenString, userId = user.Id });
    }

    // === Вход через Google/GitHub ===
    // Без cookie-сессий и без готовых Microsoft.AspNetCore.Authentication.* пакетов —
    // тот же принцип, что и у GeminiAiService: простые запросы через HttpClient,
    // минимум магии. Схема: редирект на провайдера -> он возвращает code на наш callback ->
    // меняем code на access_token -> получаем email пользователя -> находим/создаем
    // локального User по email -> выдаем свой JWT -> редиректим обратно на фронтенд с токеном.

    [HttpGet("google/login")]
    public IActionResult GoogleLogin()
    {
        var clientId = _configuration["Authentication:Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return RedirectToFrontendWithError("Вход через Google не настроен на сервере.");
        }

        var state = SetOAuthStateCookie();
        var redirectUri = BuildCallbackUri("google");

        var query = HttpUtility.ParseQueryString(string.Empty);
        query["client_id"] = clientId;
        query["redirect_uri"] = redirectUri;
        query["response_type"] = "code";
        query["scope"] = "openid email profile";
        query["state"] = state;
        query["prompt"] = "select_account";

        return Redirect($"https://accounts.google.com/o/oauth2/v2/auth?{query}");
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        if (!ValidateOAuthState(state))
        {
            return RedirectToFrontendWithError("Не удалось подтвердить запрос входа. Попробуйте еще раз.");
        }

        if (!string.IsNullOrEmpty(error) || string.IsNullOrEmpty(code))
        {
            return RedirectToFrontendWithError("Вход через Google отменен.");
        }

        var clientId = _configuration["Authentication:Google:ClientId"];
        var clientSecret = _configuration["Authentication:Google:ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return RedirectToFrontendWithError("Вход через Google не настроен на сервере.");
        }

        var client = _httpClientFactory.CreateClient("OAuth");

        try
        {
            var tokenResponse = await client.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"] = BuildCallbackUri("google"),
                ["grant_type"] = "authorization_code"
            }));

            if (!tokenResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("Google token exchange failed: {Status}", tokenResponse.StatusCode);
                return RedirectToFrontendWithError("Не удалось войти через Google. Попробуйте еще раз.");
            }

            using var tokenDoc = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync());
            var accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString();

            var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            userInfoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var userInfoResponse = await client.SendAsync(userInfoRequest);

            if (!userInfoResponse.IsSuccessStatusCode)
            {
                return RedirectToFrontendWithError("Не удалось получить данные аккаунта Google.");
            }

            using var userDoc = JsonDocument.Parse(await userInfoResponse.Content.ReadAsStringAsync());
            var root = userDoc.RootElement;

            var emailVerified = root.TryGetProperty("email_verified", out var verifiedProp) && verifiedProp.GetBoolean();
            var email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
            var name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;

            if (string.IsNullOrEmpty(email) || !emailVerified)
            {
                return RedirectToFrontendWithError("У аккаунта Google нет подтвержденного email.");
            }

            var user = await FindOrCreateOAuthUserAsync(email, name ?? email);
            var jwt = GenerateJwtToken(user);
            return Redirect($"{GetFrontendBaseUrl()}/oauth-callback?token={Uri.EscapeDataString(jwt)}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google OAuth callback failed");
            return RedirectToFrontendWithError("Не удалось войти через Google. Попробуйте еще раз.");
        }
    }

    [HttpGet("github/login")]
    public IActionResult GitHubLogin()
    {
        var clientId = _configuration["Authentication:GitHub:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return RedirectToFrontendWithError("Вход через GitHub не настроен на сервере.");
        }

        var state = SetOAuthStateCookie();
        var redirectUri = BuildCallbackUri("github");

        var query = HttpUtility.ParseQueryString(string.Empty);
        query["client_id"] = clientId;
        query["redirect_uri"] = redirectUri;
        query["scope"] = "read:user user:email";
        query["state"] = state;

        return Redirect($"https://github.com/login/oauth/authorize?{query}");
    }

    [HttpGet("github/callback")]
    public async Task<IActionResult> GitHubCallback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        if (!ValidateOAuthState(state))
        {
            return RedirectToFrontendWithError("Не удалось подтвердить запрос входа. Попробуйте еще раз.");
        }

        if (!string.IsNullOrEmpty(error) || string.IsNullOrEmpty(code))
        {
            return RedirectToFrontendWithError("Вход через GitHub отменен.");
        }

        var clientId = _configuration["Authentication:GitHub:ClientId"];
        var clientSecret = _configuration["Authentication:GitHub:ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return RedirectToFrontendWithError("Вход через GitHub не настроен на сервере.");
        }

        var client = _httpClientFactory.CreateClient("OAuth");

        try
        {
            var tokenRequest = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token")
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["code"] = code,
                    ["client_id"] = clientId,
                    ["client_secret"] = clientSecret,
                    ["redirect_uri"] = BuildCallbackUri("github")
                })
            };
            tokenRequest.Headers.Add("Accept", "application/json");
            var tokenResponse = await client.SendAsync(tokenRequest);

            if (!tokenResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("GitHub token exchange failed: {Status}", tokenResponse.StatusCode);
                return RedirectToFrontendWithError("Не удалось войти через GitHub. Попробуйте еще раз.");
            }

            using var tokenDoc = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync());
            if (!tokenDoc.RootElement.TryGetProperty("access_token", out var accessTokenProp))
            {
                return RedirectToFrontendWithError("Не удалось войти через GitHub. Попробуйте еще раз.");
            }
            var accessToken = accessTokenProp.GetString();

            // GitHub требует User-Agent на каждый запрос к API
            var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
            userRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            userRequest.Headers.UserAgent.ParseAdd("SelfMade-App");
            var userResponse = await client.SendAsync(userRequest);

            if (!userResponse.IsSuccessStatusCode)
            {
                return RedirectToFrontendWithError("Не удалось получить данные аккаунта GitHub.");
            }

            using var userDoc = JsonDocument.Parse(await userResponse.Content.ReadAsStringAsync());
            var login = userDoc.RootElement.TryGetProperty("login", out var loginProp) ? loginProp.GetString() : null;
            var publicEmail = userDoc.RootElement.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;

            var email = publicEmail;

            // Публичный email на GitHub часто скрыт — запрашиваем список email отдельно
            if (string.IsNullOrEmpty(email))
            {
                var emailsRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
                emailsRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
                emailsRequest.Headers.UserAgent.ParseAdd("SelfMade-App");
                var emailsResponse = await client.SendAsync(emailsRequest);

                if (emailsResponse.IsSuccessStatusCode)
                {
                    using var emailsDoc = JsonDocument.Parse(await emailsResponse.Content.ReadAsStringAsync());
                    foreach (var item in emailsDoc.RootElement.EnumerateArray())
                    {
                        var isPrimary = item.TryGetProperty("primary", out var p) && p.GetBoolean();
                        var isVerified = item.TryGetProperty("verified", out var v) && v.GetBoolean();
                        if (isPrimary && isVerified && item.TryGetProperty("email", out var e))
                        {
                            email = e.GetString();
                            break;
                        }
                    }
                }
            }

            if (string.IsNullOrEmpty(email))
            {
                return RedirectToFrontendWithError("На аккаунте GitHub нет подтвержденного email. Добавьте и подтвердите email в настройках GitHub.");
            }

            var user = await FindOrCreateOAuthUserAsync(email, login ?? email);
            var jwt = GenerateJwtToken(user);
            return Redirect($"{GetFrontendBaseUrl()}/oauth-callback?token={Uri.EscapeDataString(jwt)}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GitHub OAuth callback failed");
            return RedirectToFrontendWithError("Не удалось войти через GitHub. Попробуйте еще раз.");
        }
    }

    private async Task<User> FindOrCreateOAuthUserAsync(string email, string suggestedName)
    {
        var existing = await _userRepository.GetByEmailAsync(email);
        if (existing != null)
        {
            return existing;
        }

        var user = new User
        {
            Username = SanitizeUsername(suggestedName, email),
            Email = email,
            // Локальный пароль этому аккаунту не нужен — вход только через провайдера.
            // Ставим случайный хэш, чтобы не оставлять пустое поле и не дать войти по паролю.
            Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

        return user;
    }

    private static string SanitizeUsername(string raw, string emailFallback)
    {
        var candidate = new string(raw.Where(c => !char.IsWhiteSpace(c)).ToArray());
        if (candidate.Length < 3)
        {
            candidate = emailFallback.Split('@')[0];
        }
        if (candidate.Length < 3)
        {
            candidate = candidate.PadRight(3, '0');
        }
        return candidate.Length > 50 ? candidate[..50] : candidate;
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string BuildCallbackUri(string provider) => $"{Request.Scheme}://{Request.Host}/api/auth/{provider}/callback";

    private string GetFrontendBaseUrl() => _configuration["App:FrontendBaseUrl"] ?? "http://localhost:5173";

    private IActionResult RedirectToFrontendWithError(string message) =>
        Redirect($"{GetFrontendBaseUrl()}/oauth-callback?error={Uri.EscapeDataString(message)}");

    // Простая защита от CSRF в OAuth-редиректе: кладем случайное значение в
    // HttpOnly-cookie перед уходом на провайдера, сверяем с тем, что провайдер
    // вернет в query-параметре state. Без серверных сессий это самый простой
    // надежный вариант.
    private string SetOAuthStateCookie()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append(OAuthStateCookie, state, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
            Expires = DateTimeOffset.UtcNow.AddMinutes(10)
        });
        return state;
    }

    private bool ValidateOAuthState(string? returnedState)
    {
        var cookieState = Request.Cookies[OAuthStateCookie];
        Response.Cookies.Delete(OAuthStateCookie);
        return !string.IsNullOrEmpty(returnedState) && !string.IsNullOrEmpty(cookieState) && returnedState == cookieState;
    }
}

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
