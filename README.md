# ClinicBooking API

A clinic appointment booking backend built with **ASP.NET Core 8 Web API**, **Entity Framework Core** and **SQL Server**. Patients browse medical services and doctors, see available time slots, and book or cancel appointments. Admins manage doctors, generate availability slots, and review all bookings.

**Live demo:** `<!-- TODO: add Azure URL, e.g. https://<your-app>.azurewebsites.net/swagger -->`

<!-- TODO: screenshots
![Swagger UI](docs/screenshots/swagger.png)
![Doctors page](docs/screenshots/doctors.png)
![Admin dashboard](docs/screenshots/admin-dashboard.png)
-->

---

## Features

**Authentication & authorization**
- Register and login with JWT bearer tokens
- Role-based access (`User`, `Admin`) using `[Authorize(Roles = "Admin")]`
- Passwords hashed with PBKDF2 (SHA-256, 100,000 iterations, random salt) and checked with a constant-time comparison

**Patients**
- Browse medical services (Dentistry, Cardiology, Neurology, …)
- List active doctors, filter by service and search by name or title
- Top-rated doctors endpoint
- View doctor details and available slots for a given date
- Book an appointment:
  - slots in the past are rejected
  - the slot must belong to the selected doctor
  - double booking returns `409 Conflict`, backed by a unique index on the slot
- View own appointments
- Cancel an appointment (blocked within 1 hour of the start time)

**Admins**
- Doctors: create, update, get, list, soft delete (`IsActive = false`)
- Doctor photo upload (`.jpg`, `.jpeg`, `.png`, `.webp`, max 3 MB), stored under `wwwroot/uploads/doctors`
- Generate slots in bulk for a day from start time, end time and slot length (5–240 min); existing slots are skipped
- Delete unbooked slots
- List all appointments with pagination and filters (status, doctor, user email, date range)
- List registered users

**Platform**
- Global exception middleware that returns a ProblemDetails-style JSON with a `traceId` (no internal details outside Development)
- EF Core migrations and seed data (services, sample doctors, initial admin) applied automatically on startup
- Swagger / OpenAPI with JWT "Authorize" support
- Docker image and `docker-compose.yml` (API + SQL Server 2022)
- Optional vanilla HTML/CSS/JS frontend in [`frontend/`](frontend/) (landing page, doctors, booking, favorites, admin dashboard)

## Tech Stack

| Area | Technology |
|------|------------|
| Runtime | .NET 8, ASP.NET Core Web API |
| Data | Entity Framework Core 8, SQL Server (2022 in Docker) |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`), PBKDF2 hashing |
| API docs | Swashbuckle (Swagger / OpenAPI) |
| DevOps | Docker, Docker Compose |
| Frontend (optional) | HTML, CSS, vanilla JavaScript |

## Architecture

```
ClinicBooking/
├── Controllers/        HTTP endpoints (public, user, admin)
├── Services/           Business logic: AppointmentService (book/cancel rules), SlotService (bulk slot generation)
├── Data/               AppDbContext (indexes, relationships), design-time factory for EF tools
├── Models/             Entities: User, Service, Doctor, AvailabilitySlot, Appointment
├── DTOs/               Request models with DataAnnotations validation (Auth, Appointments, Admin)
├── Auth/               JwtTokenService, PasswordHasher (PBKDF2)
├── Middlewares/        ExceptionHandlingMiddleware (global error handling)
├── Seed/               DbSeeder: services, sample doctors, initial admin from configuration
├── Migrations/         EF Core migrations (SQL Server)
├── wwwroot/uploads/    Uploaded doctor images (served as static files)
├── frontend/           Optional static frontend that calls the API
├── Program.cs          DI, JWT, Swagger, CORS, migrations + seeding at startup
├── Dockerfile
└── docker-compose.yml
```

**Request flow:** `Controller → Service (booking/slot rules) → AppDbContext → SQL Server`. Simple read endpoints query `AppDbContext` directly from the controller.

**Data model:** a `Service` has many `Doctor`s. A `Doctor` has many `AvailabilitySlot`s. An `Appointment` links a `User`, a `Doctor` and one `AvailabilitySlot`. Unique indexes: `User.Email`, `Appointment.SlotId`, and `(AvailabilitySlot.DoctorId, StartTime)`.

## Getting Started

### Option A: Docker (API + SQL Server)

Requirements: Docker Desktop.

```bash
cp .env.example .env
# edit .env and set SA_PASSWORD, JWT_KEY (and optionally ADMIN_EMAIL / ADMIN_PASSWORD)
# generate a JWT key on one line:  openssl rand -base64 64 | tr -d '\n'

docker compose up --build
```

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger (when `ENABLE_SWAGGER=true`)

The API runs migrations on startup. If SQL Server is not ready yet, the container exits and restarts (`restart: on-failure`) until it can connect.

### Option B: Local (.NET SDK + your own SQL Server)

Requirements: .NET 8 SDK and a SQL Server instance (LocalDB, Developer edition, or `docker run` of `mcr.microsoft.com/mssql/server:2022-latest`).

Secrets are never stored in `appsettings.json`. Use [user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets) for local development:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,1433;Database=ClinicBookingDb;User Id=sa;Password=<YOUR_SA_PASSWORD>;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "<at least 32 random bytes, e.g. openssl rand -base64 64>"

# optional: initial admin account
dotnet user-secrets set "Admin:Email" "admin@example.com"
dotnet user-secrets set "Admin:Password" "<ADMIN_PASSWORD>"

dotnet run --launch-profile https
```

Swagger opens at https://localhost:7075/swagger. The database is created and seeded on first run.

**Frontend (optional):** serve the `frontend/` folder with any static server (for example the VS Code Live Server extension) and open `frontend/pages/landing.html`. The API base URL is set in [`frontend/js/config.js`](frontend/js/config.js).

## Configuration

All settings can be provided through `appsettings.json`, user secrets, or environment variables. Environment variables use `__` (double underscore) in place of `:`. See [`appsettings.example.json`](appsettings.example.json) and [`.env.example`](.env.example).

| Environment variable | Config key | Required | Description |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings:DefaultConnection` | Yes | SQL Server connection string |
| `Jwt__Key` | `Jwt:Key` | Yes | JWT signing key (HMAC-SHA256), at least 32 bytes |
| `Jwt__Issuer` | `Jwt:Issuer` | No | Token issuer (default `ClinicBooking`) |
| `Jwt__Audience` | `Jwt:Audience` | No | Token audience (default `ClinicBookingUsers`) |
| `Jwt__ExpiresMinutes` | `Jwt:ExpiresMinutes` | No | Token lifetime in minutes (default `120`) |
| `Admin__Email` | `Admin:Email` | No | Initial admin email, created on startup if no admin exists |
| `Admin__Password` | `Admin:Password` | No | Initial admin password (used together with `Admin__Email`) |
| `EnableSwagger` | `EnableSwagger` | No | `true` exposes Swagger outside Development (default `false`) |
| `ASPNETCORE_ENVIRONMENT` | n/a | No | `Development` / `Production` |

If a required value is missing, the app stops at startup with an error that names the missing setting.

Docker Compose variables in `.env`: `SA_PASSWORD`, `JWT_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ENABLE_SWAGGER`.

## API Endpoints

Access levels: **Public** = no token. **User** = any authenticated user (JWT). **Admin** = `Admin` role.

### Auth

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user and return a JWT |
| POST | `/api/auth/login` | Public | Log in and return a JWT |

### Services & Doctors

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/services` | Public | List all medical services |
| GET | `/api/doctors?serviceId=&q=` | Public | List active doctors, filter by service, search by name or title |
| GET | `/api/doctors/top?take=5` | Public | Top-rated active doctors (max 20) |
| GET | `/api/doctors/{id}` | Public | Doctor details |
| GET | `/api/doctors/{id}/slots?date=YYYY-MM-DD` | Public | Available (unbooked) slots for a day |

### Appointments

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/appointments` | User | Book a slot (`{ doctorId, slotId }`) |
| GET | `/api/appointments/my` | User | List the current user's appointments |
| PATCH | `/api/appointments/{id}/cancel` | User | Cancel own appointment (not within 1 hour of start) |

### Admin

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/admin/health` | Admin | Check admin access |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/doctors` | Admin | List all doctors (including inactive) |
| GET | `/api/admin/doctors/{id}` | Admin | Get a doctor |
| POST | `/api/admin/doctors` | Admin | Create a doctor (`multipart/form-data`, optional `ImageFile`) |
| PUT | `/api/admin/doctors/{id}` | Admin | Update a doctor (optionally replace the image) |
| DELETE | `/api/admin/doctors/{id}` | Admin | Soft delete (deactivate) a doctor |
| POST | `/api/admin/slots/bulk` | Admin | Generate slots for a doctor and day (`{ doctorId, date, startTime, endTime, slotMinutes }`) |
| DELETE | `/api/admin/slots/{slotId}` | Admin | Delete an unbooked slot |
| GET | `/api/admin/appointments` | Admin | Paginated appointments, filters: `page`, `pageSize`, `status`, `doctorId`, `userEmail`, `from`, `to` |

## Roadmap

- [ ] Unit and integration tests (xUnit, `WebApplicationFactory`)
- [ ] Restrict CORS to known origins in production
- [ ] Refresh tokens
- [ ] Rate limiting (especially on `/api/auth/*`)
