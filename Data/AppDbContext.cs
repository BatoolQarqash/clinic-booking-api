using ClinicBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicBooking.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Appointment>()
            .HasIndex(a => a.SlotId)
            .IsUnique();

        modelBuilder.Entity<AvailabilitySlot>()
            .HasIndex(s => new { s.DoctorId, s.StartTime })
            .IsUnique();

        modelBuilder.Entity<Doctor>()
            .Property(d => d.Fee)
            .HasPrecision(10, 2);

        // Doctor -> AvailabilitySlots
        modelBuilder.Entity<AvailabilitySlot>()
            .HasOne(s => s.Doctor)
            .WithMany(d => d.Slots)
            .HasForeignKey(s => s.DoctorId)
            .OnDelete(DeleteBehavior.NoAction);

        // Appointment -> Doctor
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Doctor)
            .WithMany(d => d.Appointments)
            .HasForeignKey(a => a.DoctorId)
            .OnDelete(DeleteBehavior.NoAction);

        // Appointment -> Slot
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Slot)
            .WithMany(s => s.Appointments)
            .HasForeignKey(a => a.SlotId)
            .OnDelete(DeleteBehavior.NoAction);

        // Appointment -> User
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.User)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}