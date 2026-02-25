using ClinicBooking.Auth;
using ClinicBooking.Data;
using ClinicBooking.DTOs.Auth;
using ClinicBooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthController(AppDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        // 1) Check email unique
        var exists = await _db.Users.AnyAsync(u => u.Email == req.Email);
        if (exists)
            return BadRequest(new { message = "Email already exists" });

        // 2) Hash password
        var hash = PasswordHasher.HashPassword(req.Password);

        // 3) Create user (default role: User)
        var user = new User
        {
            FullName = req.FullName,
            Email = req.Email.Trim().ToLower(),
            PasswordHash = hash,
            Role = UserRole.User
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // 4) Return token immediately (اختياري لكنه مريح)
        var token = _jwt.CreateToken(user);

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            role = user.Role.ToString(),
            token
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLower();

        // 1) Find user
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return Unauthorized(new { message = "Invalid credentials" });

        // 2) Verify password
        var ok = PasswordHasher.VerifyPassword(req.Password, user.PasswordHash);
        if (!ok)
            return Unauthorized(new { message = "Invalid credentials" });

        // 3) Create token
        var token = _jwt.CreateToken(user);

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            role = user.Role.ToString(),
            token
        });
    }
}