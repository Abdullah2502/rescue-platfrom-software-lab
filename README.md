# Nexora — Disaster Response & Volunteer Coordination Platform

Nexora is an enterprise-grade disaster management and volunteer mobilization platform tailored for Bangladesh. It connects **Super Admins**, **registered NGOs**, and **civic volunteers** to rapidly report, coordinate, verify, and resolve emergency response operations across Bangladesh's 8 Divisions, 64 Districts, and 495+ Thanas.

The solution features a reactive **Next.js 14** web application coupled with a secure **Spring Boot** REST API backed by **PostgreSQL**.

---

## Table of Contents
1. [Core Features](#core-features)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
   - [1. Create PostgreSQL Database](#1-create-postgresql-database)
   - [2. Configure Database Username & Password](#2-configure-database-username--password)
   - [3. Start Backend (Spring Boot)](#3-start-backend-spring-boot)
   - [4. Start Frontend (Next.js)](#4-start-frontend-nextjs)
6. [Default Seeded Credentials](#default-seeded-credentials)
7. [Application Routes Map](#application-routes-map)
8. [Testing & Production Builds](#testing--production-builds)
9. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Core Features

- **Event Proposal & Approval Workflow**:
  - Volunteers can submit disaster event proposals (`PENDING_REVIEW`) targeted to Super Admin or a specific partner NGO.
  - Volunteers cannot self-approve; Super Admin or the assigned NGO reviews, inspects, and approves (`OPEN`) or rejects (`REJECTED`) proposals.
- **NGO Partner Directory**:
  - Searchable and division-filtered NGO directory with verified registration credentials modal.
  - Direct "Request Event to this NGO" action.
- **Real-Time Global Broadcast Chat**:
  - Role-attributed chat room (`/global-chat`) with sender badges (`ADMIN`, `NGO OFFICER`, `VOLUNTEER`).
  - Super Admin announcement pinning (prominent sticky banner).
- **Event-Based Operations Chat**:
  - Automatic dedicated private chat room for every disaster response event (`/events/[id]/chat`).
  - **Strict Access Control**: Restricted exclusively to joined volunteers and the organizing NGO, with universal Super Admin oversight.
  - Organizing NGOs and Super Admins can pin critical mission updates (rendezvous points, emergency contacts, medical notices).
- **Unread Chat Counters & Notification Badges**:
  - Real-time unread badge counts on desktop and mobile sidebar buttons (`Global Chat` and `Event Chats`).
  - Dedicated **Operational Communications** dashboard widget showing unread global transmissions and mission channel breakdowns with message previews.
  - Automatic read receipt acknowledgment upon entering rooms.
- **Volunteer Self-Join & Participation Tracking**:
  - Direct event participation with overlap collision detection and automated certificate issuance upon event closure.
- **Shelters & Aid Distribution Management**:
  - Operations tracking for emergency shelters, capacity ratios, and relief inventory items.
- **Cloud-Backed File Uploads**:
  - Cloudinary-backed certificate and document attachment pipeline.

---

## User Roles & Permissions

| Role | Access Scope & Responsibilities |
| :--- | :--- |
| **Super Admin** | Platform-wide oversight, NGO registration vetting/approval, volunteer management, universal access to all event chat rooms, global message pinning, national disaster telemetry, certificate issuance, and location administration. |
| **NGO Admin** | Organization profile management, volunteer directory management (including CSV bulk roster import), dispatching disaster events, approving volunteer event proposals, managing owned shelters/supplies, and organizing private mission chats with pinning privileges. |
| **Volunteer** | Profile and skills management, browsing partner NGOs, proposing event requests, joining/withdrawing from open disaster operations, participating in joined mission chat rooms, participating in global broadcasts, and downloading participation certificates. |

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Radix UI, Zustand.
- **Backend**: Java 21, Spring Boot 4.1, Spring Security (Stateless JWT + RBAC), Spring Data JPA / Hibernate, Spring Mail (SMTP), Springdoc OpenAPI.
- **Database**: PostgreSQL 15+.
- **Storage**: Cloudinary / Multipart upload integration.

---

## Prerequisites

Before starting, ensure the following are installed on your machine:

1. **Java Development Kit (JDK) 21** or newer:
   - Check with: `java -version`
2. **Node.js (v18.x or v20.x+)** and **npm**:
   - Check with: `node -v` and `npm -v`
3. **PostgreSQL (v15+)** (Local service or Docker container):
   - Check with: `psql --version`
4. **Git**:
   - Check with: `git --version`

---

## Step-by-Step Setup Guide

### 1. Create PostgreSQL Database

You must create an empty database named `nexora` in PostgreSQL before starting the backend.

#### Option A: Using `psql` Command Line
Open your terminal (PowerShell, Command Prompt, or Bash) and run:

```bash
# Connect to PostgreSQL (enter your PostgreSQL root password when prompted)
psql -U postgres
```

Inside the PostgreSQL interactive shell, run:
```sql
CREATE DATABASE nexora;
\q
```

#### Option B: Using pgAdmin GUI
1. Open **pgAdmin**.
2. Connect to your PostgreSQL server.
3. Right-click **Databases** &rarr; **Create** &rarr; **Database...**
4. Set **Database** name to `nexora` and click **Save**.

#### Option C: Using Docker
If you prefer running PostgreSQL via Docker:
```bash
docker run --name nexora-postgres -e POSTGRES_DB=nexora -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine
```

---

### 2. Configure Database Username & Password

The backend needs to know your PostgreSQL username and password to connect. You can configure this in **either** of two places:

#### Method 1: Using `.env` File (Recommended)
Inside the `Nexora/` directory, create a `.env` file (you can copy `.env.example`):

**On Windows (PowerShell):**
```powershell
Copy-Item Nexora/.env.example Nexora/.env
```

**On Linux/macOS:**
```bash
cp Nexora/.env.example Nexora/.env
```

Open `Nexora/.env` in your editor and update `DB_USERNAME` and `DB_PASSWORD` to match your local PostgreSQL credentials:

```env
# --- Database (PostgreSQL) ---
DB_URL=jdbc:postgresql://localhost:5432/nexora
DB_USERNAME=postgres          # <-- Change to your PostgreSQL username if different
DB_PASSWORD=your_password_here # <-- Change to your PostgreSQL password
```

#### Method 2: Directly in `application.yaml`
If you prefer not using a `.env` file, open:  
[`Nexora/src/main/resources/application.yaml`](Nexora/src/main/resources/application.yaml)

Locate the `datasource` block (around line 16) and set your credentials:

```yaml
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/nexora}
    username: ${DB_USERNAME:postgres}            # <-- Default is postgres
    password: ${DB_PASSWORD:your_password_here}  # <-- Replace with your PostgreSQL password
    driver-class-name: org.postgresql.Driver
```

> [!TIP]
> If your PostgreSQL server runs on a non-standard port (e.g. `5433`), update `localhost:5432` to `localhost:5433` in the `DB_URL`.

---

### 3. Start Backend (Spring Boot)

Navigate to the `Nexora/` directory and run the application using Maven:

**On Windows (PowerShell / Command Prompt):**
```powershell
cd Nexora
.\mvnw.cmd spring-boot:run
```
*(Or if you have Maven installed globally: `mvn spring-boot:run`)*

**On macOS / Linux:**
```bash
cd Nexora
chmod +x mvnw
./mvnw spring-boot:run
```

#### What Happens on Initial Boot?
- **Automatic Schema Creation**: Hibernate automatically builds all relational tables, indexes, and constraints (`spring.jpa.hibernate.ddl-auto: update`).
- **Location Seeding**: Populates all 8 Bangladesh Divisions, 64 Districts, and 533 Thanas (`BangladeshSeeder`, `BangladeshThanaSeeder`).
- **Super Admin Account**: Automatically provisions the root Super Admin account.

The backend will be ready when you see:
```text
Started NexoraApplication in X.XXX seconds
Tomcat started on port 8080 (http) with context path '/'
```

---

### 4. Start Frontend (Next.js)

In a **separate terminal window**, navigate to the `frontend/` directory, install dependencies, and launch the development server:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will start at:  
👉 **`http://localhost:3000`**

---

## Default Seeded Credentials

When the backend boots for the first time, the root Super Admin account is pre-seeded:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@nexora.bd` | `Admin@12345` |

### To test Volunteer & NGO workflows:
- **Volunteer**: Register directly at `http://localhost:3000/register/volunteer`. Login as Super Admin to verify the volunteer from `/admin/volunteers`, or use the approved volunteer account.
- **NGO**: Register an organization at `http://localhost:3000/register/ngo`. Log in as Super Admin to approve the NGO registration from `/admin/ngos`, then sign in as the approved NGO.

---

## Application Routes Map

### Public Routes
- `/` — Tactical landing page with national incident summary
- `/login` — Unified role-based authentication portal
- `/register/volunteer` — Volunteer self-registration with skills and cascading district selection
- `/register/ngo` — NGO organizational registration

### Super Admin Console (`/admin/*`)
- `/admin/dashboard` — Platform telemetry, live metrics, and unread communication card
- `/admin/global-chat` — Standalone platform broadcast chat with message pinning
- `/admin/event-chats` — Directory of all active disaster event rooms with unread badges
- `/admin/events` — Disaster event monitoring, review of volunteer proposals, and status updates
- `/admin/ngos` — NGO verification, credential audits, and approval queue
- `/admin/volunteers` — Volunteer verification, skill filtering, and roster administration
- `/admin/certificates` — Certificate generation and compliance
- `/admin/locations` — Bangladesh administrative hierarchy browser

### NGO Console (`/ngo/*`)
- `/ngo/dashboard` — Operational overview, live event status, and unread communications widget
- `/ngo/global-chat` — Global platform feed
- `/ngo/event-chats` — Managed mission chat directory with unread counts
- `/ngo/events` — Incident management and review/approval of volunteer proposals
- `/ngo/events/new` — Create and deploy a new disaster response operation
- `/ngo/volunteers` — Volunteer roster management and CSV bulk roster upload
- `/ngo/operations` — Shelters and relief inventory management
- `/ngo/profile` — Verified NGO headquarters and registration profile

### Volunteer Console (`/volunteer/*`)
- `/volunteer/dashboard` — Personal commitments, response history, and unread communications card
- `/volunteer/global-chat` — Real-time broadcast chat with `VOLUNTEER` badge
- `/volunteer/event-chats` — Joined mission channels with unread activity indicators
- `/volunteer/events` — Dual view: Open disaster operations & "My Event Requests" tracking
- `/volunteer/events/new` — Propose a disaster response event to Super Admin or an NGO
- `/volunteer/ngos` — Verified partner NGO directory with modal credentials and direct request CTA
- `/volunteer/certificates` — Downloadable digital participation certificates
- `/volunteer/profile` — Personal skills and geographical district update

---

## Testing & Production Builds

### Backend Automated Tests
Run unit and integration tests (tests run against an in-memory or PostgreSQL configuration):
```powershell
cd Nexora
.\mvnw.cmd test
```

### Frontend Production Build
To check TypeScript compilation and bundle production static assets:
```powershell
cd frontend
npm run build
npm run start
```

---

## Troubleshooting & FAQ

#### 1. `FATAL: password authentication failed for user "postgres"`
- **Cause**: The password specified in `Nexora/.env` or `Nexora/src/main/resources/application.yaml` does not match your local PostgreSQL password.
- **Solution**: Open `Nexora/.env` and update `DB_PASSWORD=your_actual_password`. Restart the backend.

#### 2. `FATAL: database "nexora" does not exist`
- **Cause**: The `nexora` database has not been created in PostgreSQL yet.
- **Solution**: Connect via `psql -U postgres` and run `CREATE DATABASE nexora;`.

#### 3. Port 8080 or Port 3000 is already in use
- **Windows**: Find and terminate the process holding the port:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force
  ```
- **macOS / Linux**:
  ```bash
  lsof -ti:8080 | xargs kill -9
  ```

#### 4. OpenAPI / Swagger Documentation
When the Spring Boot backend is running, complete interactive REST API documentation is available at:
👉 **`http://localhost:8080/swagger-ui.html`**
