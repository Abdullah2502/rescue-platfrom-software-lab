# Nexora

Nexora is a disaster management and volunteer recruitment platform for Bangladesh. It connects NGOs, volunteers, and system administrators so that disaster-response events can be created, joined, monitored, and documented.

The repository contains a Next.js frontend and a Spring Boot REST API backed by PostgreSQL.

## Features

- Volunteer registration, profile management, and event participation
- NGO registration with administrator approval
- NGO volunteer management, including CSV bulk upload
- Disaster event creation and management
- Volunteer discovery by Division, District, and Thana
- Direct volunteer participation in open events
- Participation tracking and certificate management
- Super Admin dashboards for NGOs, volunteers, events, locations, and certificates
- JWT authentication with role-based access control
- Email notifications through SMTP
- Bangladesh administrative location hierarchy

## User Roles

### Volunteer

Volunteers can register, maintain their profile and skills, browse disaster events, join events, withdraw from events, and view participation certificates.

### NGO Admin

NGO administrators can register their organization, manage volunteers, create disaster events, upload volunteers in bulk, and monitor event participation.

### Super Admin

Super Admins can approve or reject NGO registrations, manage volunteers and events, administer Bangladesh location data, and manage certificates.

## Technology Stack

### Frontend

- Next.js 14 with the App Router
- React 18
- TypeScript
- Tailwind CSS
- Radix UI and custom UI components
- Zustand for client-side authentication state
- React Hook Form and Zod for forms and validation
- Papa Parse for CSV processing

### Backend

- Java 21
- Spring Boot 4.1
- Spring Web MVC
- Spring Security
- Spring Data JPA and Hibernate
- PostgreSQL
- JSON Web Tokens
- Spring Mail
- OpenCSV
- Springdoc OpenAPI and Swagger UI
- Maven Wrapper

## Project Structure

```text
.
├── frontend/       Next.js web application
├── Nexora/         Spring Boot backend
├── architecture.md System architecture and data flow
├── srs.md          Software requirements specification
├── use-case.md     Use-case documentation
└── docs/           Feature-specific documentation
```

## Prerequisites

Install the following before running the project:

- Node.js 18 or newer
- npm
- Java 21
- PostgreSQL 15 or newer (or Docker)

## Database Setup

Nexora uses **PostgreSQL** as its relational database. You can run PostgreSQL either using **Docker** (recommended for quick setup) or via a **local PostgreSQL installation**.

### Option 1: Run PostgreSQL with Docker (Recommended)

If you have Docker installed, you can spin up a PostgreSQL container in one command:

```powershell
docker run --name nexora-postgres `
  -e POSTGRES_DB=nexora `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -p 5432:5432 `
  -d postgres:16-alpine
```

To stop or restart the container later:

```powershell
# Stop container
docker stop nexora-postgres

# Start container
docker start nexora-postgres
```

---

### Option 2: Run PostgreSQL Locally (psql / pgAdmin)

If you installed PostgreSQL directly on your machine:

1. Ensure the PostgreSQL service is running:
   - **Windows**: Check *Services* (`services.msc`) and make sure `postgresql-x64-<version>` is running, or run in PowerShell:
     ```powershell
     Start-Service postgresql*
     ```
   - **Linux / macOS**:
     ```bash
     sudo systemctl start postgresql   # Linux
     brew services start postgresql@16 # macOS Homebrew
     ```

2. Open your terminal or Command Prompt and connect via `psql`:
   ```bash
   psql -U postgres
   ```

3. Create the `nexora` database:
   ```sql
   CREATE DATABASE nexora;
   ```

4. Verify database creation:
   ```sql
   \l
   \q
   ```

*(Alternatively, open **pgAdmin**, right-click **Databases** > **Create** > **Database...**, name it `nexora`, and click Save).*

---

### Database Schema & Automatic Seeding

You **do not** need to manually execute SQL schema scripts or table migrations:

- **Automatic Schema Generation**: When the backend boots, Hibernate automatically creates and updates all required tables, constraints, and sequences (`spring.jpa.hibernate.ddl-auto: update`).
- **Data Seeding**: On the initial startup, Spring Boot automatically seeds:
  - Bangladesh administrative divisions, districts, and thanas (`BangladeshSeeder`, `BangladeshThanaSeeder`).
  - The default Super Admin account (`SuperAdminSeeder`):
    - **Email**: `admin@nexora.bd`
    - **Password**: `Admin@12345`

---

## Configuration

### Frontend

The frontend uses `NEXT_PUBLIC_API_URL` to locate the backend API. Create `frontend/.env.local` when the API is not running at the default address:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend

The backend reads configuration from environment variables or a `.env` file placed inside `Nexora/`. Copy the template to get started:

```powershell
cp Nexora/.env.example Nexora/.env
```

Adjust the database credentials to match your PostgreSQL setup:

```env
DB_URL=jdbc:postgresql://localhost:5432/nexora
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000
MAIL_USERNAME=your_smtp_username
MAIL_PASSWORD=your_smtp_password
SUPER_ADMIN_EMAIL=admin@nexora.bd
SUPER_ADMIN_PASSWORD=change-this-password
```

Do not commit real passwords, JWT secrets, or SMTP credentials.

## Running Locally

Start the backend first:

```powershell
cd Nexora
.\mvnw.cmd spring-boot:run
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The applications will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
- Health endpoint: http://localhost:8080/actuator/health

On Windows, use `mvnw.cmd`. On macOS or Linux, use `./mvnw`.

## Production Builds

Build the frontend:

```powershell
cd frontend
npm run build
npm run start
```

Build and test the backend:

```powershell
cd Nexora
.\mvnw.cmd clean verify
```

## Main Frontend Routes

- `/` - Public landing page
- `/login` - User login
- `/register/volunteer` - Volunteer registration
- `/register/ngo` - NGO registration
- `/volunteer/dashboard` - Volunteer dashboard
- `/volunteer/events` - Volunteer event list
- `/volunteer/certificates` - Volunteer certificates
- `/ngo/dashboard` - NGO dashboard
- `/ngo/events` - NGO event management
- `/ngo/volunteers` - NGO volunteer management
- `/admin/dashboard` - Super Admin dashboard
- `/admin/ngos` - NGO approval and management
- `/admin/events` - Event administration
- `/admin/locations` - Location management
- `/admin/certificates` - Certificate management

## API Notes

The frontend sends requests to the backend using the shared API helpers in `frontend/lib/api.ts`. Authenticated requests include the JWT access token in the `Authorization` header.

The backend exposes REST endpoints under `/api/v1/...` and returns response objects using a success or error structure. API documentation is available through Swagger UI when the backend is running.

## Testing and Quality Checks

Run the frontend checks and production build with:

```powershell
cd frontend
npm run lint
npm run build
```

Run backend tests with:

```powershell
cd Nexora
.\mvnw.cmd test
```

## Documentation

- [Architecture](architecture.md)
- [Software Requirements Specification](srs.md)
- [Use Cases](use-case.md)
- [Event Participation Certificates](docs/event-participation-certificates.md)

## License

No license has been specified for this project yet.
