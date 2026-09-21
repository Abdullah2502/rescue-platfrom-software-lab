# Software Requirements Specification (SRS)
# Disaster Management & Volunteer Recruitment Platform

**Version:** 1.0
**Date:** July 28, 2026
**Country:** Bangladesh
**Backend:** Spring Boot (Java)
**Frontend:** Next.js (React)

---

## 1. Introduction

### 1.1 Purpose
This document describes the functional and non-functional requirements for a web-based Disaster Management & Volunteer Recruitment Platform tailored for Bangladesh. The platform connects a Super Admin, approved NGOs, and Volunteers to coordinate disaster response activities, including volunteer recruitment, disaster event creation, and resource management at the Division → District → Thana (Upazila) level.

### 1.2 Scope
The system is a multi-tenant web application that enables:
- A **Super Admin** to manage all entities (NGOs, Volunteers, Divisions, Districts, Thanas).
- **NGOs** to register, get approved, manage volunteers, and create disaster events.
- **Volunteers** to register, receive recruitment emails, view assigned events, and respond to rescue requests.

### 1.3 Definitions, Acronyms, Abbreviations
| Term | Definition |
|------|------------|
| SRS | Software Requirements Specification |
| NGO | Non-Governmental Organization |
| NID | National ID (Bangladesh) |
| DTO | Data Transfer Object |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| SMTP | Simple Mail Transfer Protocol |
| CSV | Comma-Separated Values |

### 1.4 References
- Bangladesh administrative divisions (8 Divisions, 64 Districts, ~495 Upazilas/Thanas)
- Spring Boot 3.x documentation
- Next.js 14+ documentation

### 1.5 Overview
The remaining sections describe the system context, functional features, data requirements, external interfaces, and non-functional qualities of the platform.

---

## 2. Overall Description

### 2.1 Product Perspective
A standalone web application with:
- **Frontend:** Next.js (App Router) with TypeScript, Tailwind CSS, ShadCN UI.
- **Backend:** Spring Boot REST API with Spring Security (JWT), JPA/Hibernate, PostgreSQL.
- **Email Service:** SMTP (e.g., Gmail SMTP, SendGrid).
- **Maps (optional):** Leaflet/OpenStreetMap for geographic visualizations.

### 2.2 User Classes and Characteristics
| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | Internal system administrator | Full CRUD on every entity; approves/rejects NGOs |
| **NGO Admin** | Representative of an approved NGO | Manage volunteers (single + bulk), create disaster events, manage own events |
| **Volunteer** | Registered individual | View own dashboard, see assigned events, accept/reject invitations |

### 2.3 Operating Environment
- **Server:** Linux (Ubuntu 22.04 LTS or similar), JDK 17+, Node.js 18+
- **Client:** Modern browsers (Chrome, Firefox, Edge, Safari) — desktop and mobile responsive
- **DB:** PostgreSQL 15+

### 2.4 Design and Implementation Constraints
- Country fixed to **Bangladesh** — Division/District/Thana dropdowns are preloaded from a static dataset.
- All times are stored in UTC, displayed in Asia/Dhaka (UTC+6).
- Phone numbers must be valid Bangladeshi numbers (+880xxxxxxxxxx or 01xxxxxxxxx).
- Email is the unique identifier for volunteers and NGOs.
- Backend follows a layered architecture: Controller → Service → Repository.

### 2.5 Assumptions and Dependencies
- Static Bangladesh location dataset (CSV/JSON) is bundled with the backend seed data.
- SMTP credentials are available for sending volunteer recruitment emails.
- NID is optional during initial registration, mandatory for verification before deployment.

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
- **Login/Registration pages:** Separate routes for NGO and Volunteer registration.
- **Super Admin Dashboard:** KPIs, NGO approval queue, volunteer stats, division map.
- **NGO Dashboard:** Volunteer list, bulk add, disaster events, recruitment campaigns.
- **Volunteer Dashboard:** Assigned events, invitations, profile.
- **Forms:** Multi-step NGO registration, bulk volunteer CSV upload, event creation wizard.

#### 3.1.2 Hardware Interfaces
- None (standard web hosting).

#### 3.1.3 Software Interfaces
- **Database:** PostgreSQL via Spring Data JPA.
- **Email:** SMTP via Spring Mail.
- **Auth:** JWT issued via Spring Security.
- **File Storage:** Local filesystem for NGO logos and CSV uploads (S3-compatible option later).

#### 3.1.4 Communication Interfaces
- HTTPS RESTful API (`/api/v1/...`).
- JSON over HTTP/1.1.

### 3.2 Functional Requirements

#### 3.2.1 Authentication & Authorization
| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Users register via `/register/volunteer` or `/register/ngo`. |
| FR-AUTH-02 | NGO accounts default to status `PENDING` until Super Admin approval. |
| FR-AUTH-03 | Volunteers are active immediately after email verification. |
| FR-AUTH-04 | Login returns a JWT containing `userId`, `role`, and `ngoId` (if NGO). |
| FR-AUTH-05 | Passwords are hashed with BCrypt. |
| FR-AUTH-06 | Refresh tokens are supported for session continuation. |
| FR-AUTH-07 | Role-based route guards on frontend (Next.js middleware). |

#### 3.2.2 Super Admin Features
| ID | Requirement |
|----|-------------|
| FR-SA-01 | View all NGOs with status filter (PENDING, APPROVED, REJECTED). |
| FR-SA-02 | Approve / Reject NGO registration with reason. |
| FR-SA-03 | View / edit all volunteers; deactivate accounts. |
| FR-SA-04 | View all disaster events across NGOs. |
| FR-SA-05 | Manage Bangladesh Division / District / Thana seed data. |
| FR-SA-06 | View system audit logs. |
| FR-SA-07 | Manage Super Admin accounts (CRUD). |

#### 3.2.3 NGO Features
| ID | Requirement |
|----|-------------|
| FR-NGO-01 | Register with: name, email, password, registration number, logo, division, district, thana, contact phone, website. |
| FR-NGO-02 | Edit own profile. |
| FR-NGO-03 | Add a single volunteer (name, email, phone, division, district, thana, skills, NID). |
| FR-NGO-04 | Bulk add volunteers via CSV upload (system emails each volunteer). |
| FR-NGO-05 | Filter volunteers by division / district / thana / skill. |
| FR-NGO-06 | Create a disaster event (title, type, severity, description, location, start/end datetime, required volunteers count). |
| FR-NGO-07 | Invite volunteers to an event — selection filters by area. |
| FR-NGO-08 | Track volunteer response status (INVITED, ACCEPTED, DECLINED, DEPLOYED). |

#### 3.2.4 Volunteer Features
| ID | Requirement |
|----|-------------|
| FR-VOL-01 | Register (name, email, password, phone, division, district, thana, date of birth, gender, skills). |
| FR-VOL-02 | Receive email when added by an NGO. |
| FR-VOL-03 | Receive email when invited to a disaster event. |
| FR-VOL-04 | View all invitations in their dashboard. |
| FR-VOL-05 | Accept / Decline invitations. |
| FR-VOL-06 | Update profile and skills. |
| FR-VOL-07 | View history of past disaster deployments. |

#### 3.2.5 Location Management
| ID | Requirement |
|----|-------------|
| FR-LOC-01 | Static dataset of 8 Divisions, 64 Districts, and ~495 Thanas of Bangladesh. |
| FR-LOC-02 | Cascading dropdowns: Division → District → Thana. |
| FR-LOC-03 | Each volunteer and NGO is associated with one Division/District/Thana. |

#### 3.2.6 Disaster Event Management
| ID | Requirement |
|----|-------------|
| FR-EVT-01 | Event types: FLOOD, CYCLONE, EARTHQUAKE, FIRE, PANDEMIC, OTHER. |
| FR-EVT-02 | Severity levels: LOW, MEDIUM, HIGH, CRITICAL. |
| FR-EVT-03 | Event status: DRAFT, OPEN, ONGOING, CLOSED, CANCELLED. |
| FR-EVT-04 | Events are scoped to a Division/District/Thana or multiple. |
| FR-EVT-05 | Auto-link events to volunteers in the affected area (recommended pool). |

#### 3.2.7 Notifications
| ID | Requirement |
|----|-------------|
| FR-NOTIF-01 | Email on volunteer addition by NGO. |
| FR-NOTIF-02 | Email on event invitation. |
| FR-NOTIF-03 | Email on event status change to ACCEPTED by volunteer. |
| FR-NOTIF-04 | Email on NGO approval/rejection (to NGO). |

### 3.3 Non-Functional Requirements

#### 3.3.1 Performance
- API response time p95 ≤ 500 ms under 100 concurrent users.
- CSV bulk upload of 500 volunteers ≤ 10 seconds.

#### 3.3.2 Security
- All traffic over HTTPS.
- JWT with 1-hour access, 7-day refresh token.
- BCrypt password hashing (strength ≥ 10).
- CSRF protection on state-changing routes.
- Input validation with Bean Validation (JSR-380).

#### 3.3.3 Reliability
- 99.5% uptime target.
- Daily database backups.

#### 3.3.4 Usability
- Fully responsive (mobile-first).
- WCAG 2.1 AA color contrast.
- All forms have inline validation messages in English (Bengali support: future).

#### 3.3.5 Scalability
- Stateless backend (horizontal scale behind a load balancer).
- DB connection pooling (HikariCP).
- Async email sending via `@Async` or message queue.

#### 3.3.6 Maintainability
- Code style: Google Java Style + Airbnb React Style Guide.
- OpenAPI/Swagger docs auto-generated at `/swagger-ui.html`.
- Test coverage ≥ 70% on services.

#### 3.3.7 Localization
- All locations tied to Bangladesh.
- Date/time format: `dd MMM yyyy, hh:mm a` (BST).

---

## 4. Data Requirements (Conceptual)

### 4.1 Core Entities

| Entity | Key Fields |
|--------|-----------|
| **SuperAdmin** | id, name, email, passwordHash, role, createdAt |
| **Ngo** | id, name, email, passwordHash, registrationNo, logoUrl, phone, website, divisionId, districtId, thanaId, status (PENDING/APPROVED/REJECTED), rejectionReason, approvedAt, approvedBy |
| **Volunteer** | id, name, email, passwordHash, phone, nid, dob, gender, divisionId, districtId, thanaId, skills (List<String>), status, registeredAt |
| **Division** | id, name, bnName |
| **District** | id, name, bnName, divisionId |
| **Thana** | id, name, bnName, districtId |
| **DisasterEvent** | id, ngoId, title, type, severity, description, locationDivisionIds, locationDistrictIds, locationThanaIds, startAt, endAt, requiredVolunteers, status, createdAt |
| **EventInvitation** | id, eventId, volunteerId, ngoId, status (INVITED/ACCEPTED/DECLINED/DEPLOYED), respondedAt |
| **BulkUploadBatch** | id, ngoId, filename, totalRows, successCount, failedCount, errorsJson, createdAt |
| **Shelter** | id, ngoId, name, address, latitude, longitude, capacity, currentOccupancy, contactName, contactPhone, status, notes |
| **InventoryItem** | id, ngoId, shelterId, name, category, quantity, unit, reorderLevel, expiryDate, notes |
| **DistributionRecord** | id, ngoId, shelterId, inventoryItemId, recipientGroup, quantity, distributedAt, location, coordinates, status, notes |

### 4.2 Relationships
- `Ngo 1—* DisasterEvent`
- `Ngo 1—* Volunteer` (via NgoVolunteer join) — NGO can recruit any volunteer whose location matches the NGO's filter.
- `DisasterEvent *—* Volunteer` (via EventInvitation)
- `Division 1—* District 1—* Thana`
- `Ngo 1—* Shelter 1—* InventoryItem`
- `InventoryItem 1—* DistributionRecord`

---

## 5. Use Case Summary
See `use-case.md` for full details. High-level summary:
- UC-01: Volunteer Self-Registration
- UC-02: NGO Registration & Approval
- UC-03: Super Admin NGO Approval
- UC-04: NGO Adds Single Volunteer
- UC-05: NGO Bulk Add Volunteers (CSV)
- UC-06: NGO Creates Disaster Event
- UC-07: NGO Invites Volunteers by Area
- UC-08: Volunteer Receives & Responds to Invitation
- UC-09: Super Admin Manages Location Data

---

## 6. Acceptance Criteria

| Criterion | Measurement |
|-----------|-------------|
| A user can register as Volunteer or NGO | E2E test passes |
| Super Admin can approve/reject NGO | Manual + automated test |
| NGO can bulk-add 500 volunteers via CSV in < 10s | Performance test |
| Volunteer receives email when added/invited | Email log verification |
| Volunteer can accept/decline an invitation | API + UI test |
| Location dropdowns cascade properly | Unit test |
| NGO can manage shelters and live occupancy | API + UI test |
| Completed distributions deduct available stock | JUnit service test |
| Offline operational writes synchronize without duplicates | Browser integration test |
| Volunteers and administrators can view the operational map | Responsive UI test |

---

## 7. Glossary
- **Thana:** An Upazila (sub-district) in Bangladesh.
- **Division:** Top-level administrative unit of Bangladesh (e.g., Dhaka, Chittagong).
- **Approval:** Super Admin action transitioning NGO from PENDING → APPROVED.

---

*End of SRS*
