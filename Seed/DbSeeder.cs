using ClinicBooking.Auth;
using ClinicBooking.Data;
using ClinicBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Seed;

public static class DbSeeder
{
    // ✅ لاحظي: صار عندنا IConfiguration parameter
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        // 1) Seed Admin (آمن)
        await SeedAdminAsync(db, config);

        // 2) Seed Services + Doctors (مرة واحدة)
        if (await db.Services.AnyAsync())
            return;

        var services = new List<Service>
        {
            new() { Name = "Dentistry" },
            new() { Name = "Cardiology" },
            new() { Name = "Dermatology" },
            new() { Name = "Orthopedics" },
            new() { Name = "Pediatrics" }
        };

        await db.Services.AddRangeAsync(services);
        await db.SaveChangesAsync();

        var dentistryId = services.First(s => s.Name == "Dentistry").Id;
        var cardiologyId = services.First(s => s.Name == "Cardiology").Id;
        var dermatologyId = services.First(s => s.Name == "Dermatology").Id;

        var doctors = new List<Doctor>
        {
            new()
            {
                FullName = "Dr. Lina Ahmad",
                Title = "Senior Dentist",
                Bio = "Specialized in cosmetic dentistry and root canals.",
                ClinicName = "Smile Clinic",
                Fee = 25,
                Rating = 4.7,
                ServiceId = dentistryId,
                IsActive = true
            },
            new()
            {
                FullName = "Dr. Omar Saleh",
                Title = "Consultant Cardiologist",
                Bio = "Heart health, ECG, and hypertension management.",
                ClinicName = "HeartCare Center",
                Fee = 40,
                Rating = 4.5,
                ServiceId = cardiologyId,
                IsActive = true
            },
            new()
            {
                FullName = "Dr. Rania Khaled",
                Title = "Dermatologist",
                Bio = "Skin treatment, acne, and laser therapy.",
                ClinicName = "DermaPlus",
                Fee = 30,
                Rating = 4.8,
                ServiceId = dermatologyId,
                IsActive = true
            }
        };

        await db.Doctors.AddRangeAsync(doctors);
        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminAsync(AppDbContext db, IConfiguration config)
    {
        // ✅ إذا في Admin موجود، ما نعمل شيء
        var adminExists = await db.Users.AnyAsync(u => u.Role == UserRole.Admin);
        if (adminExists) return;

        // ✅ قراءة القيم من User Secrets / Environment
        var email = config["Admin:Email"];
        var password = config["Admin:Password"];

        // ✅ إذا مش موجودين، ما ننشئ Admin (بأمان)
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return;

        email = email.Trim().ToLower();

        // ✅ منع تكرار نفس الإيميل
        var emailExists = await db.Users.AnyAsync(u => u.Email == email);
        if (emailExists) return;

        var admin = new User
        {
            FullName = "System Admin",
            Email = email,
            PasswordHash = PasswordHasher.HashPassword(password),
            Role = UserRole.Admin
        };

        db.Users.Add(admin);
        await db.SaveChangesAsync();
    }
}