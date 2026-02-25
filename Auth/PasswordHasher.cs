using System.Security.Cryptography;

namespace ClinicBooking.Auth;

public static class PasswordHasher
{
    // فنكشن لإنشاء Hash آمن (PBKDF2)
    public static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);

        var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            salt,
            iterations: 100000,
            hashAlgorithm: HashAlgorithmName.SHA256);

        byte[] hash = pbkdf2.GetBytes(32);

        // نخزنهم كنص: iterations.salt.hash
        return $"100000.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    // فنكشن للتحقق من كلمة مرور مقارنة بالـ hash
    public static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split('.');
        if (parts.Length != 3) return false;

        int iterations = int.Parse(parts[0]);
        byte[] salt = Convert.FromBase64String(parts[1]);
        byte[] hash = Convert.FromBase64String(parts[2]);

        var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256);

        byte[] computed = pbkdf2.GetBytes(32);

        // مقارنة آمنة (تمنع timing attacks)
        return CryptographicOperations.FixedTimeEquals(computed, hash);
    }
}