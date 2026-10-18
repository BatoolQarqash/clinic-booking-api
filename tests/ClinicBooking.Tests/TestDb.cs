using ClinicBooking.Data;
using ClinicBooking.Models;
using ClinicBooking.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Time.Testing;

namespace ClinicBooking.Tests;

/// <summary>
/// The real AppDbContext on an in-memory SQLite database, so unique/filtered indexes and
/// foreign keys are enforced like on SQL Server. Seeds one service, one doctor and two users.
/// </summary>
public sealed class TestDb : IDisposable
{
    // 10:00 UTC = 13:00 in Amman (UTC+3). A server running in UTC would see "now" as 10:00.
    public static readonly DateTimeOffset UtcNow = new(2026, 6, 1, 10, 0, 0, TimeSpan.Zero);
    public static readonly DateTime ClinicNow = new(2026, 6, 1, 13, 0, 0);

    private readonly SqliteConnection _connection;

    public AppDbContext Db { get; }
    public FakeTimeProvider Time { get; } = new(UtcNow);
    public int DoctorId { get; }
    public int UserId { get; }
    public int OtherUserId { get; }

    public TestDb()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        Db = NewContext();
        Db.Database.EnsureCreated();

        var doctor = new Doctor { FullName = "Dr. Test", Service = new Service { Name = "Dentistry" } };
        var user = new User { FullName = "Patient One", Email = "one@example.com", PasswordHash = "x" };
        var other = new User { FullName = "Patient Two", Email = "two@example.com", PasswordHash = "x" };
        Db.AddRange(doctor, user, other);
        Db.SaveChanges();

        DoctorId = doctor.Id;
        UserId = user.Id;
        OtherUserId = other.Id;
    }

    /// <summary>A fresh context on the same database, for checking what was really saved.</summary>
    public AppDbContext NewContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);

    public AppointmentService Appointments() =>
        new(Db, Time, new ConfigurationBuilder().Build()); // default Clinic:TimeZoneId (Asia/Amman)

    public SlotService Slots() => new(Db);

    /// <summary>Adds a 30-minute slot starting at the given clinic-local time.</summary>
    public AvailabilitySlot AddSlot(DateTime start, bool isBooked = false)
    {
        var slot = new AvailabilitySlot { DoctorId = DoctorId, StartTime = start, EndTime = start.AddMinutes(30), IsBooked = isBooked };
        Db.AvailabilitySlots.Add(slot);
        Db.SaveChanges();
        return slot;
    }

    public Appointment AddAppointment(int slotId, AppointmentStatus status)
    {
        var appt = new Appointment { UserId = UserId, DoctorId = DoctorId, SlotId = slotId, Status = status };
        Db.Appointments.Add(appt);
        Db.SaveChanges();
        return appt;
    }

    public void Dispose()
    {
        Db.Dispose();
        _connection.Dispose();
    }
}
