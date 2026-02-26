# ClinicBooking API (.NET 8)

Clinic booking MVP backend built with **ASP.NET Core Web API**, **EF Core**, and **SQLite**.

## Current Features
- JWT Authentication: Register / Login
- Roles: User / Admin
- Admin endpoints protected with `[Authorize(Roles = "Admin")]`
- EF Core + SQLite + Migrations
- Seed Data:
  - Services & Doctors
  - Admin user via **User Secrets** (development)

## Tech Stack
- .NET 8
- ASP.NET Core Web API
- Entity Framework Core 8
- SQLite
- Swagger (OpenAPI)

## Getting Started

### Requirements
- .NET SDK 8.x

### Setup & Run
1. Restore packages:
   ```bash
   dotnet restore