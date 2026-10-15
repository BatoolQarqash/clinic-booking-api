using ClinicBooking.Auth;
using ClinicBooking.Data;
using ClinicBooking.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ClinicBooking API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Read connection string once so we can inspect what runtime is actually using
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'ConnectionStrings:DefaultConnection' is not configured. " +
        "Locally: dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"<connection string>\". " +
        "In Docker/Azure: set the environment variable ConnectionStrings__DefaultConnection.");
}

// Print useful startup diagnostics
Console.WriteLine("========== APP STARTUP DIAGNOSTICS ==========");
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"ASPNETCORE_ENVIRONMENT: {Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "(null)"}");
Console.WriteLine($"ConnectionStrings__DefaultConnection env var exists: {!string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"))}");

// Hide password before printing
var safeConnectionString = connectionString;
if (safeConnectionString.Contains("Password=", StringComparison.OrdinalIgnoreCase))
{
    var parts = safeConnectionString.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList();
    for (int i = 0; i < parts.Count; i++)
    {
        if (parts[i].TrimStart().StartsWith("Password=", StringComparison.OrdinalIgnoreCase))
        {
            parts[i] = "Password=***";
        }
    }
    safeConnectionString = string.Join(';', parts) + ";";
}

Console.WriteLine($"Resolved DefaultConnection: {safeConnectionString}");
Console.WriteLine("============================================");

// EF Core - SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// CORS (Dev)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// JWT
var jwt = builder.Configuration.GetSection("Jwt");
var key = jwt["Key"];

if (string.IsNullOrWhiteSpace(key))
{
    throw new InvalidOperationException(
        "JWT signing key 'Jwt:Key' is not configured. " +
        "Locally: dotnet user-secrets set \"Jwt:Key\" \"<random key>\". " +
        "In Docker/Azure: set the environment variable Jwt__Key.");
}

// HMAC-SHA256 requires a key of at least 256 bits (32 bytes)
if (Encoding.UTF8.GetByteCount(key) < 32)
{
    throw new InvalidOperationException(
        "JWT signing key 'Jwt:Key' is too short. Use at least 32 bytes, e.g. the output of `openssl rand -base64 64`.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
        };
    });

// DI
builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<ClinicBooking.Services.SlotService>();
builder.Services.AddScoped<ClinicBooking.Services.AppointmentService>();

var app = builder.Build();

// Global exception middleware
app.UseMiddleware<ClinicBooking.Middlewares.ExceptionHandlingMiddleware>();

// Apply migrations + seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupMigration");

    try
    {
        logger.LogInformation("Starting database migration...");
        await db.Database.MigrateAsync();
        logger.LogInformation("Database migration completed successfully.");

        logger.LogInformation("Starting database seeding...");
        await DbSeeder.SeedAsync(db, builder.Configuration);
        logger.LogInformation("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration/seeding failed during startup.");
        throw;
    }
}

app.UseCors("DevCors");

// Swagger: always in Development, or anywhere when EnableSwagger=true (e.g. the public demo)
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("EnableSwagger"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();