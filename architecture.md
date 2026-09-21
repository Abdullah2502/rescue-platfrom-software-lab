# Architecture Document
# Disaster Management & Volunteer Recruitment Platform

**Version:** 1.0
**Date:** July 28, 2026
**Country:** Bangladesh
**Backend:** Spring Boot 3.x (Java 17)
**Frontend:** Next.js 14+ (TypeScript, App Router)

---

## 1. Architectural Goals

| Goal | Description |
|------|-------------|
| **Separation of Concerns** | Clear frontend/backend split with REST contract |
| **Security First** | JWT-based auth, BCrypt, RBAC at every endpoint |
| **Scalability** | Stateless backend, async jobs for emails |
| **Maintainability** | Layered architecture, DTOs, OpenAPI docs |
| **Localization** | Bangladesh-specific location data baked in |
| **Extensibility** | Easy to add features shown in the Feature Selection list (rescue requests, shelters, inventory, distribution, offline mode, reports, map) |

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        BROWSER (User)                       │
│   Volunteer / NGO / Super Admin (Next.js SPA - PWA ready)   │
└──────────────────┬─────────────────────────────────────────┘
                   │  HTTPS / JSON
                   ▼
┌────────────────────────────────────────────────────────────┐
│                       API GATEWAY (Nginx)                   │
└──────────────────┬─────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌────────────────────────────────────┐
│   Next.js (UI)   │  │      Spring Boot REST API          │
│   Port 3000      │  │      Port 8080                    │
│  TypeScript      │  │   ┌──────────────────────────┐    │
│  ShadCN UI       │  │   │ Security (JWT + RBAC)     │    │
│  TanStack Query  │  │   │ Controllers / Services    │    │
│  Zod (forms)     │  │   │ Repositories (JPA)        │    │
│  NextAuth?       │  │   │ Validators (Bean Valid.)  │    │
└──────────────────┘  │   │ Async Mail Sender @Async   │    │
                      │   └──────────────────────────┘    │
                      └──────┬──────────────┬─────────────┘
                             │              │
                             ▼              ▼
                    ┌────────────────┐ ┌─────────────────────┐
                    │  PostgreSQL    │ │  SMTP / Email       │
                    │  Port 5432     │ │  (Gmail / SendGrid) │
                    └────────────────┘ └─────────────────────┘
                             │
                             ▼
                    ┌────────────────────────────┐
                    │  File Storage (Local FS)   │
                    │  - NGO logos               │
                    │  - CSV uploads             │
                    └────────────────────────────┘
```

---

## 3. Backend Architecture (Spring Boot)

### 3.1 Module / Package Layout

```
com.disaster.management
├── DisasterManagementApplication.java
├── config/
│   ├── SecurityConfig.java        // JWT, CORS, RBAC, BCrypt
│   ├── CorsConfig.java
│   ├── AsyncConfig.java
│   ├── OpenApiConfig.java
│   └── MailConfig.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthFilter.java
│   ├── CustomUserDetailsService.java
│   └── PasswordEncoderConfig.java
├── common/
│   ├── BaseEntity.java            // createdAt, updatedAt, isActive
│   ├── ApiResponse.java           // wrapper {success, data, error}
│   ├── PageResponse.java
│   ├── exception/                 // GlobalExceptionHandler, custom exceptions
│   └── util/
├── location/
│   ├── controller/LocationController.java
│   ├── service/LocationService.java
│   ├── repository/DivisionRepository.java
│   ├── entity/Division.java
│   ├── entity/District.java
│   ├── entity/Thana.java
│   └── dto/...
├── auth/
│   ├── controller/AuthController.java
│   ├── service/AuthService.java
│   ├── dto/{LoginRequest, RegisterVolunteerRequest, RegisterNgoRequest, AuthResponse}
│   └── repository/{UserRepository, VolunteerRepository, NgoRepository, SuperAdminRepository}
├── ngo/
│   ├── controller/NgoController.java
│   ├── service/NgoService.java
│   ├── entity/Ngo.java
│   ├── repository/NgoRepository.java
│   ├── dto/...
│   └── enums/NgoStatus.java
├── volunteer/
│   ├── controller/VolunteerController.java
│   ├── service/VolunteerService.java
│   ├── entity/Volunteer.java
│   ├── repository/VolunteerRepository.java
│   └── dto/...
├── volunteerinvitation/
│   ├── (cross-cut: NGO invites volunteer)
│   └── ...
├── event/
│   ├── controller/DisasterEventController.java
│   ├── service/DisasterEventService.java
│   ├── entity/DisasterEvent.java
│   ├── repository/DisasterEventRepository.java
│   ├── enums/{EventType, Severity, EventStatus}
│   └── dto/...
├── invitation/
│   ├── controller/EventInvitationController.java
│   ├── service/EventInvitationService.java
│   ├── entity/EventInvitation.java
│   ├── repository/EventInvitationRepository.java
│   ├── enums/InvitationStatus.java
│   └── dto/...
├── bulkupload/
│   ├── controller/BulkUploadController.java
│   ├── service/BulkUploadService.java     // CSV parser + async email
│   ├── entity/BulkUploadBatch.java
│   └── dto/...
├── email/
│   ├── EmailService.java                  // @Async
│   └── templates/{VolunteerAdded.html, EventInvite.html, NgoApproved.html}
└── admin/
    ├── controller/{SuperAdminController, AdminNgoController, AdminVolunteerController}
    └── ...
```

### 3.2 Layered Architecture

```
@RestController        (HTTP boundary — request/response only)
        ↓
@Service               (Business logic, transactions, validation)
        ↓
@Repository            (Spring Data JPA — DB access only)
        ↓
PostgreSQL
```

### 3.3 Security Architecture

- **Authentication:** JWT Access Token (1h) + Refresh Token (7d).
- **Authorization:**
  - `ROLE_SUPER_ADMIN`
  - `ROLE_NGO_ADMIN`
  - `ROLE_VOLUNTEER`
  - Custom `@PreAuthorize("hasRole('NGO_ADMIN') and #ngoId == authentication.principal.ngoId")` for NGO-scoped access.
- **CORS:** allowed origins = frontend URLs.
- **CSRF:** disabled (stateless JWT API), but double-submit token pattern for NGO bulk uploads.

### 3.4 Data Flow — Key Scenarios

**A. NGO Registration → Approval → Login**
```
Volunteer/Ngo submits POST /api/v1/auth/register/ngo
   → AuthService.create() → bcrypt → INSERT (status=PENDING)
   → Email "we received your registration" (async)
   → 201 Created

SuperAdmin POST /api/v1/admin/ngos/{id}/approve
   → NgoService.approve() → status=APPROVED, approvedBy=adminId
   → Email "your NGO is approved" (async)
   → 200 OK
```

**B. NGO Adds Volunteer (Single / Bulk)**
```
POST /api/v1/ngo/volunteers (single)
   → VolunteerService.create()
   → Email "you have been added" (async)

POST /api/v1/ngo/volunteers/bulk (multipart CSV)
   → BulkUploadService.parse() → validate → insert batch → INSERT n volunteers
   → Async email for each volunteer via ThreadPoolTaskExecutor
   → BulkUploadBatch row tracks success/failure counts
```

**C. NGO Creates Disaster Event**
```
POST /api/v1/ngo/events
   → DisasterEventService.create()
   → Suggest volunteers in event location
   → Return event + recommendedVolunteers[]
```

**D. NGO Invites Volunteer**
```
POST /api/v1/events/{id}/invitations {volunteerIds: []}
   → EventInvitationService.inviteBatch()
   → INSERT invitations (status=INVITED)
   → Async email per volunteer
```

**E. Volunteer Responds**
```
PATCH /api/v1/invitations/{id} {status: ACCEPTED}
   → EventInvitationService.respond() (volunteerId must own invitation)
   → status=ACCEPTED, respondedAt=now
   → Email NGO (async)
```

### 3.5 Async Processing

- `@EnableAsync` with `ThreadPoolTaskExecutor` (core=5, max=20, queue=200).
- Emails queued for: registration confirmation, NGO approval, volunteer addition, event invitation, response.

### 3.6 Database Schema (ER Overview)

```
DIVISION (id, name, bn_name)
   └── DISTRICT (id, name, bn_name, division_id FK)
            └── THANA (id, name, bn_name, district_id FK)

SUPER_ADMIN (id, name, email UNIQUE, password_hash, role, created_at)

NGO (id, name, email UNIQUE, password_hash, registration_no,
     logo_url, phone, website,
     division_id FK, district_id FK, thana_id FK,
     status ENUM, rejection_reason, approved_at, approved_by FK)

VOLUNTEER (id, name, email UNIQUE, password_hash, phone, nid,
           dob, gender ENUM,
           division_id FK, district_id FK, thana_id FK,
           skills JSONB, status, registered_at)

DISASTER_EVENT (id, ngo_id FK, title, type ENUM, severity ENUM,
                description, start_at, end_at,
                required_volunteers, status ENUM, created_at)

EVENT_LOCATION (event_id FK, division_id FK, district_id FK NULL, thana_id FK NULL)
                — composite, multiple rows allowed

EVENT_INVITATION (id, event_id FK, volunteer_id FK, ngo_id FK,
                  status ENUM, invited_at, responded_at)
                  UNIQUE(event_id, volunteer_id)

BULK_UPLOAD_BATCH (id, ngo_id FK, filename, total_rows,
                   success_count, failed_count, errors_json, created_at)
```

### 3.7 API Surface (REST — `/api/v1`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/volunteer` | public | Volunteer register |
| POST | `/auth/register/ngo` | public | NGO register (status PENDING) |
| POST | `/auth/login` | public | Login → JWT |
| POST | `/auth/refresh` | public | Refresh token |
| GET | `/locations/divisions` | public | List divisions |
| GET | `/locations/districts?divisionId=` | public | List districts |
| GET | `/locations/thanas?districtId=` | public | List thanas |
| GET | `/admin/ngos?status=` | SUPER_ADMIN | List NGOs |
| POST | `/admin/ngos/{id}/approve` | SUPER_ADMIN | Approve NGO |
| POST | `/admin/ngos/{id}/reject` | SUPER_ADMIN | Reject NGO |
| GET | `/admin/volunteers` | SUPER_ADMIN | List all volunteers |
| GET | `/ngo/profile` | NGO_ADMIN | Get own profile |
| PUT | `/ngo/profile` | NGO_ADMIN | Update profile |
| GET | `/ngo/volunteers?division=&district=&thana=` | NGO_ADMIN | Filtered list |
| POST | `/ngo/volunteers` | NGO_ADMIN | Add one volunteer |
| POST | `/ngo/volunteers/bulk` | NGO_ADMIN | Upload CSV |
| GET | `/ngo/events` | NGO_ADMIN | Own events |
| POST | `/ngo/events` | NGO_ADMIN | Create event |
| POST | `/events/{id}/invitations` | NGO_ADMIN | Invite volunteers |
| GET | `/volunteer/dashboard` | VOLUNTEER | My dashboard |
| GET | `/volunteer/invitations` | VOLUNTEER | My invitations |
| PATCH | `/invitations/{id}` | VOLUNTEER | Accept/Decline |

OpenAPI/Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 4. Frontend Architecture (Next.js)

### 4.1 Folder Structure

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    // landing
│   │   ├── login/
│   │   ├── register/volunteer/
│   │   └── register/ngo/
│   ├── (admin)/admin/
│   │   ├── dashboard/
│   │   ├── ngos/[page].tsx
│   │   └── volunteers/[page].tsx
│   ├── (ngo)/ngo/
│   │   ├── dashboard/
│   │   ├── volunteers/
│   │   │   ├── page.tsx                // list with area filter
│   │   │   ├── new/page.tsx
│   │   │   └── bulk/page.tsx           // CSV upload
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── profile/
│   ├── (volunteer)/volunteer/
│   │   ├── dashboard/
│   │   ├── invitations/
│   │   └── profile/
│   └── api/                            // BFF routes (optional)
├── components/
│   ├── ui/                             // ShadCN
│   ├── forms/                          // register, login, event, etc.
│   ├── tables/
│   ├── charts/
│   └── layout/
├── lib/
│   ├── api.ts                          // fetch wrapper with auth
│   ├── auth.ts                         // token storage
│   ├── validators/                     // Zod schemas
│   └── utils/
├── hooks/
│   ├── useAuth.ts
│   ├── useNgoList.ts                   // TanStack Query
│   └── ...
├── stores/                             // Zustand for UI state
└── types/                              // mirrors backend DTOs
```

### 4.2 Tech Stack
- **Framework:** Next.js 14+ App Router
- **Language:** TypeScript
- **UI:** Tailwind CSS + ShadCN UI
- **Forms:** React Hook Form + Zod
- **Data:** TanStack Query (React Query) v5
- **Auth state:** Zustand or React Context + localStorage (refresh token in HTTP-only cookie ideally)
- **HTTP:** native `fetch` with interceptor
- **Maps:** Leaflet (for future map features)
- **Charts:** Recharts (dashboards)
- **CSV:** papaparse

### 4.3 State Management
- **Server state** → TanStack Query (cache, refetch, optimistic updates).
- **UI state** → Zustand (modals, filters).
- **Auth state** → Context provider + localStorage (with refresh).

### 4.4 Routing & Access Control
- Next.js middleware checks JWT and role claims, redirects to `/login` or respective dashboard.

### 4.5 Theming
- Tailwind + ShadCN, dark-mode capable (matches the design reference image).

---

## 5. Cross-Cutting Concerns

### 5.1 Logging
- Logback with JSON encoder.
- MDC for `userId`, `ngoId`, `requestId`.

### 5.2 Error Handling
- `@RestControllerAdvice` → consistent `ApiResponse` shape:
  ```json
  { "success": false, "error": { "code": "NGO_NOT_APPROVED", "message": "..." } }
  ```

### 5.3 Validation
- DTOs annotated with Jakarta Bean Validation.
- Frontend mirrors with Zod for early checks.

### 5.4 Configuration
- `application.yml` profiles: `dev`, `staging`, `prod`.
- Secrets via env vars: `DB_URL`, `DB_PASSWORD`, `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`.

### 5.5 Database Migrations
- Flyway with seed scripts:
  - `V1__create_schema.sql`
  - `V2__seed_bangladesh_locations.sql` (divisions/districts/thanas)
  - `V3__seed_super_admin.sql`

---

## 6. Deployment Architecture

```
┌─────────────────────────┐     ┌────────────────────────┐
│  Vercel (Next.js)       │     │  AWS EC2 / Render      │
│  Frontend (auto-scale)  │ ──► │  Spring Boot (Docker)  │
└─────────────────────────┘     └────┬───────────────────┘
                                     │
                              ┌──────┴──────┐
                              ▼             ▼
                       ┌──────────┐  ┌──────────────┐
                       │ RDS/     │  │ SMTP (SES /  │
                       │ Postgres │  │  SendGrid)   │
                       └──────────┘  └──────────────┘
```

- **Containerization:** Dockerfile for backend (`eclipse-temurin:17-jre`).
- **CI/CD:** GitHub Actions → build → test → deploy.
- **Monitoring:** Spring Actuator + Prometheus + Grafana (optional).

---

## 7. Security Considerations

| Risk | Mitigation |
|------|-----------|
| SQL Injection | JPA parameterized queries |
| XSS | React auto-escapes; sanitize on backend for HTML email bodies |
| CSRF | Stateless JWT; SameSite cookies on refresh |
| Brute force | Rate limit on `/auth/login` via Bucket4j |
| Email enumeration on register | Always-200 + queue email |
| Privilege escalation | RBAC + ownership checks at service layer |

---

## 8. Operational Modules and Extensibility

| Feature | How to extend |
|---------|---------------|
| Role-Based auth | Already RBAC-ready; add new `ROLE_X` guards |
| Dashboard & Stats | Add `/admin/stats`, `/ngo/stats` with aggregation |
| Rescue requests | New `RescueRequest` entity + controller |
| Shelters | Implemented as NGO-owned `Shelter` records with live capacity and coordinates |
| Inventory | Implemented as NGO-owned stock lines with shelter assignment, thresholds, and expiry |
| Distribution tracking | Implemented with planned/completed/cancelled states and transactional stock deduction |
| Interactive map | Implemented with Leaflet and OpenStreetMap shelter/distribution layers |
| Offline mode | Implemented with a service worker and an IndexedDB mutation queue |
| Report generation | JasperReports or OpenPDF for PDF |

---

*End of Architecture Document*
