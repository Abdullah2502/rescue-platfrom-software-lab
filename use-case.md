# Use Case Document
# Disaster Management & Volunteer Recruitment Platform

**Version:** 1.0
**Date:** July 28, 2026
**Country:** Bangladesh

This document describes all use cases identified during requirements elicitation for the platform. Each use case follows a standard structure: **ID**, **Name**, **Actor(s)**, **Preconditions**, **Main Flow**, **Alternative Flows**, **Postconditions**, and **Business Rules**.

---

## Actors

| Actor | Description |
|-------|-------------|
| **Volunteer (V)** | An individual who registers to be recruited for disaster response |
| **NGO Admin (N)** | A representative of a registered NGO who manages volunteers and events |
| **Super Admin (SA)** | The platform administrator with full privileges |
| **System (S)** | Automated platform behavior (email sender, scheduler) |

---

## Use Case Index

- **UC-01:** Volunteer Self-Registration
- **UC-02:** NGO Registration
- **UC-03:** Super Admin Reviews & Approves/Rejects NGO
- **UC-04:** Login & Session Management
- **UC-05:** Volunteer Profile Management
- **UC-06:** NGO Profile Management
- **UC-07:** NGO Adds Single Volunteer
- **UC-08:** NGO Bulk Adds Volunteers via CSV
- **UC-09:** NGO Filters Volunteers by Location
- **UC-10:** NGO Creates Disaster Event
- **UC-11:** NGO Invites Volunteers to Event
- **UC-12:** Volunteer Receives Invitation
- **UC-13:** Volunteer Accepts / Declines Invitation
- **UC-14:** NGO Tracks Event Participation
- **UC-15:** Super Admin Manages Bangladesh Locations
- **UC-16:** Super Admin Manages Volunteers
- **UC-17:** System Sends Notifications (Email)
- **UC-18:** NGO Views Recommended Volunteer Pool for Event
- **UC-19:** Super Admin Dashboard & Reporting

---

## UC-01: Volunteer Self-Registration

| Field | Detail |
|-------|--------|
| **Actor(s)** | Volunteer |
| **Goal** | Create a volunteer account on the platform |
| **Preconditions** | None |
| **Postconditions** | Volunteer record created; verification email sent |

**Main Flow**
1. Volunteer opens `/register/volunteer`.
2. Volunteer fills form: name, email, password, phone (+880 or 01xxxxxxxxx), date of birth, gender, division, district, thana, skills (multi-select).
3. Frontend validates with Zod (email format, password ≥ 8 chars, phone BD format).
4. Frontend `POST /api/v1/auth/register/volunteer`.
5. Backend checks email uniqueness → BCrypt hashes password → INSERT Volunteer.
6. System (S) sends email "Welcome — verify your email" with token link.
7. Volunteer clicks verification link → status becomes `ACTIVE`.
8. 201 Created returned; UI shows success.

**Alternative Flows**
- **A1: Email already exists** → 409 Conflict "Email already registered".
- **A2: Invalid location** → 400 "Invalid division/district/thana combination".
- **A3: Weak password** → 400 "Password must be 8+ chars with 1 number".

**Business Rules**
- BR-V-01: Email must be unique.
- BR-V-02: Phone must match `/^(\+880|0)1[3-9]\d{8}$/`.
- BR-V-03: NID is optional at registration.

---

## UC-02: NGO Registration

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | Submit NGO registration for Super Admin review |
| **Preconditions** | NGO has a valid registration number |
| **Postconditions** | NGO created with status `PENDING`; email sent to NGO |

**Main Flow**
1. NGO Admin opens `/register/ngo`.
2. NGO Admin enters: NGO name, email, password, registration number, contact phone, website (optional), logo (upload), division, district, thana.
3. `POST /api/v1/auth/register/ngo`.
4. Backend validates, INSERTs with status `PENDING`.
5. System sends email "Registration received — pending review".
6. 201 Created returned.

**Alternative Flows**
- A1: Email already used by another NGO → 409.
- A2: registration_no already used → 409.

**Business Rules**
- BR-N-01: NGO cannot login while status is `PENDING`.
- BR-N-02: Logo file size ≤ 2 MB; JPG/PNG only.

---

## UC-03: Super Admin Reviews & Approves/Rejects NGO

| Field | Detail |
|-------|--------|
| **Actor(s)** | Super Admin |
| **Goal** | Approve or reject a PENDING NGO |
| **Preconditions** | NGO has status `PENDING` |
| **Postconditions** | NGO status updated; email sent |

**Main Flow (Approve)**
1. Super Admin opens `/admin/ngos?status=PENDING`.
2. Selects an NGO and clicks "Approve".
3. Backend `POST /api/v1/admin/ngos/{id}/approve`.
4. Backend updates status=`APPROVED`, `approvedAt`, `approvedBy`.
5. System emails NGO: "Your NGO is approved — you can now log in".
6. 200 OK.

**Alternative Flows (Reject)**
1. Super Admin clicks "Reject" and provides reason (≥ 10 chars).
2. Backend updates status=`REJECTED`, `rejectionReason`.
3. System emails NGO: "Your NGO registration was rejected — reason: ..."
4. 200 OK.

**Business Rules**
- BR-SA-01: Only `ROLE_SUPER_ADMIN` can perform this.
- BR-SA-02: Reason is mandatory for rejection.

---

## UC-04: Login & Session Management

| Field | Detail |
|-------|--------|
| **Actor(s)** | Volunteer, NGO Admin, Super Admin |
| **Goal** | Authenticate and receive a JWT |
| **Preconditions** | User has an active account |
| **Postconditions** | JWT issued; user gains access to role-specific dashboard |

**Main Flow**
1. User submits email + password to `POST /api/v1/auth/login`.
2. Backend verifies BCrypt hash.
3. If NGO status is `PENDING`/`REJECTED` → 403 with reason.
4. Backend returns access token (1h) + refresh token (7d).
5. Frontend stores tokens and routes to dashboard by role.

**Alternative Flows**
- A1: Invalid credentials → 401.
- A2: NGO not approved → 403 "NGO not approved".

**Business Rules**
- BR-AUTH-01: Max 5 failed attempts per 15 min per IP (rate limit).
- BR-AUTH-02: Refresh token rotation on each refresh.

---

## UC-05: Volunteer Profile Management

| Field | Detail |
|-------|--------|
| **Actor(s)** | Volunteer |
| **Goal** | Update own profile |
| **Preconditions** | Volunteer logged in |
| **Postconditions** | Volunteer record updated |

**Main Flow**
1. Volunteer navigates to `/volunteer/profile`.
2. Edits phone, address (Division/District/Thana), skills.
3. `PUT /api/v1/volunteer/profile`.
4. Backend validates owner and updates.
5. 200 OK.

**Business Rules**
- BR-V-04: Email cannot be changed (used as identifier).
- BR-V-05: Skills are a list of free-text tags (max 20).

---

## UC-06: NGO Profile Management

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | Edit NGO profile (contact, logo, location) |
| **Preconditions** | NGO `APPROVED` and logged in |
| **Postconditions** | NGO record updated |

**Main Flow**
1. NGO navigates to `/ngo/profile`.
2. Updates fields except email, registration number.
3. `PUT /api/v1/ngo/profile`.
4. Backend verifies ownership (ngoId matches token).
5. 200 OK.

---

## UC-07: NGO Adds Single Volunteer

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin, Volunteer |
| **Goal** | Recruit a single volunteer |
| **Preconditions** | NGO approved; volunteer email does not exist |
| **Postconditions** | Volunteer created; "added by NGO" email sent |

**Main Flow**
1. NGO navigates to `/ngo/volunteers/new`.
2. Fills form: name, email, phone, division, district, thana, skills (optional), NID (optional).
3. Frontend `POST /api/v1/ngo/volunteers`.
4. Backend creates Volunteer with `passwordHash = tempHash` (system generates random temp password or sets "must change on first login").
5. System sends email: "You have been added by {NgoName} — set your password".
6. 201 Created.

**Alternative Flows**
- A1: Email already exists → backend links existing volunteer to NGO instead of creating new one (idempotent recruitment).
- A2: Invalid data → 400.

**Business Rules**
- BR-N-03: NGO can only target volunteers whose division matches NGO's division (default), but can pick others with explicit filter.

---

## UC-08: NGO Bulk Adds Volunteers via CSV

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | Recruit many volunteers at once |
| **Preconditions** | NGO approved |
| **Postconditions** | N volunteers created; emails queued; BulkUploadBatch saved |

**Main Flow**
1. NGO downloads CSV template from `/ngo/volunteers/bulk`.
2. NGO fills template (header required: `name,email,phone,division,district,thana,skills,nid`).
3. NGO uploads CSV at `/ngo/volunteers/bulk`.
4. Frontend `POST /api/v1/ngo/volunteers/bulk` (multipart).
5. Backend:
   - Parses CSV (papaparse / Commons CSV)
   - Validates each row
   - Skips rows with errors → collects into `errors[]`
   - Bulk INSERT valid rows (JDBC batch)
   - Queues async emails per volunteer
   - Creates `BulkUploadBatch` row
6. Returns `200 OK` with `{totalRows, successCount, failedCount, errors[]}`.

**Alternative Flows**
- A1: CSV parse error → 400 with line number.
- A2: File too big (>5 MB) → 413.

**Business Rules**
- BR-N-04: Max 5,000 rows per upload.
- BR-N-05: Duplicate emails within file → error reported.
- BR-N-06: Async email; UI shows "queued".

---

## UC-09: NGO Filters Volunteers by Location

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | List volunteers matching location criteria |
| **Preconditions** | NGO approved |
| **Postconditions** | Filtered list returned |

**Main Flow**
1. NGO opens `/ngo/volunteers`.
2. Selects filters: division (required), district (optional), thana (optional), skill (optional).
3. Frontend `GET /api/v1/ngo/volunteers?divisionId=&districtId=&thanaId=&skill=`.
4. Backend returns paged list.
5. NGO can select rows to invite to an event.

---

## UC-10: NGO Creates Disaster Event

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | Open a disaster event requiring volunteers |
| **Preconditions** | NGO approved |
| **Postconditions** | DisasterEvent created with status `OPEN` |

**Main Flow**
1. NGO navigates to `/ngo/events/new`.
2. Fills: title, type (FLOOD/CYCLONE/...), severity, description, affected locations (multi-select division/district/thana), required volunteers count, start/end datetime.
3. `POST /api/v1/ngo/events`.
4. Backend saves event with status `OPEN`.
5. 201 Created.

**Business Rules**
- BR-E-01: `required_volunteers > 0`.
- BR-E-02: `endAt > startAt`.
- BR-E-03: At least one location must be specified.

---

## UC-11: NGO Invites Volunteers to Event

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | Invite a list of volunteers to an event |
| **Preconditions** | Event exists with status `OPEN`; volunteers exist |
| **Postconditions** | EventInvitation rows created; emails queued |

**Main Flow**
1. NGO opens event detail → clicks "Invite Volunteers".
2. Modal shows volunteers filtered by event location.
3. NGO selects N volunteers → clicks "Send Invitations".
4. `POST /api/v1/events/{id}/invitations {volunteerIds: [1,2,3]}`.
5. Backend inserts `EventInvitation` rows (status=`INVITED`), skipping duplicates.
6. System queues email per volunteer.
7. 200 OK `{invited: N, skipped: M}`.

**Alternative Flows**
- A1: Volunteer already invited → silently skipped.

**Business Rules**
- BR-E-04: Cannot invite when event status is `CLOSED`/`CANCELLED`.

---

## UC-12: Volunteer Receives Invitation

| Field | Detail |
|-------|--------|
| **Actor(s)** | System, Volunteer |
| **Goal** | Volunteer learns about invitation |
| **Trigger** | NGO sends invitation |
| **Postconditions** | Volunteer has unread invitation |

**Main Flow**
1. System sends email: "You have been invited to {EventTitle} at {location}. Accept or decline here."
2. Email link routes to `/volunteer/invitations`.
3. Invitation appears on Volunteer Dashboard.

---

## UC-13: Volunteer Accepts / Declines Invitation

| Field | Detail |
|-------|--------|
| **Actor(s)** | Volunteer |
| **Goal** | Respond to invitation |
| **Preconditions** | Invitation status `INVITED` |
| **Postconditions** | Invitation updated; NGO notified |

**Main Flow**
1. Volunteer clicks invitation.
2. Reviews event details.
3. Clicks "Accept" or "Decline".
4. `PATCH /api/v1/invitations/{id} {status: ACCEPTED|DECLINED}`.
5. Backend verifies volunteer ownership, updates status and `respondedAt`.
6. System emails NGO: "X volunteers accepted your event".
7. 200 OK.

**Alternative Flows**
- A1: Invitation already responded → 409.
- A2: Event `CLOSED` → 409.

---

## UC-14: NGO Tracks Event Participation

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | View who accepted/declined for an event |
| **Preconditions** | Event exists |
| **Postconditions** | Read-only summary returned |

**Main Flow**
1. NGO opens `/ngo/events/{id}`.
2. UI shows counts and table: `Invited / Accepted / Declined / Deployed`.
3. NGO can mark accepted volunteers as `DEPLOYED` after event.

---

## UC-15: Super Admin Manages Bangladesh Locations

| Field | Detail |
|-------|--------|
| **Actor(s)** | Super Admin |
| **Goal** | Maintain Divisions / Districts / Thanas |
| **Preconditions** | Data preloaded on first migration |
| **Postconditions** | Location data updated |

**Main Flow**
1. SA opens `/admin/locations`.
2. Can add a Thana, fix a name, or remove unused rows.
3. `POST/PUT/DELETE /api/v1/admin/locations/{type}/{id}`.

**Business Rules**
- BR-SA-03: Deleting a Thana that has volunteers is blocked.

---

## UC-16: Super Admin Manages Volunteers

| Field | Detail |
|-------|--------|
| **Actor(s)** | Super Admin |
| **Goal** | View, edit, deactivate any volunteer |
| **Preconditions** | Volunteer exists |
| **Postconditions** | Volunteer status updated |

**Main Flow**
1. SA opens `/admin/volunteers?division=&q=`.
2. Searches, filters, pagination.
3. Can deactivate (`status=INACTIVE`) or reactivate.
4. `PATCH /api/v1/admin/volunteers/{id}`.

---

## UC-17: System Sends Notifications (Email)

| Field | Detail |
|-------|--------|
| **Actor(s)** | System |
| **Goal** | Deliver transactional emails |
| **Trigger** | Registration, approval, volunteer added, event invite, response |
| **Postconditions** | Email sent via SMTP; logged |

**Main Flow**
1. Service layer calls `EmailService.sendVolunteerAdded(...)` annotated with `@Async`.
2. EmailService composes Thymeleaf template.
3. `JavaMailSender.send()` invoked.
4. On exception → log, retry once, mark as `FAILED`.

**Templates**
- Volunteer added
- Event invitation
- Volunteer responded (to NGO)
- NGO approved/rejected

---

## UC-18: NGO Views Recommended Volunteer Pool for Event

| Field | Detail |
|-------|--------|
| **Actor(s)** | NGO Admin |
| **Goal** | Get a suggested list of volunteers for the event location |
| **Preconditions** | Event created |
| **Postconditions** | List returned |

**Main Flow**
1. NGO opens event detail.
2. UI calls `GET /api/v1/events/{id}/recommended-volunteers`.
3. Backend returns volunteers in event's divisions/districts/thanas, not already invited, active.

---

## UC-19: Super Admin Dashboard & Reporting

| Field | Detail |
|-------|--------|
| **Actor(s)** | Super Admin |
| **Goal** | High-level KPIs |
| **Preconditions** | None |
| **Postconditions** | Dashboard rendered |

**Main Flow**
1. SA opens `/admin/dashboard`.
2. Backend `GET /api/v1/admin/stats`:
   - Total NGOs by status
   - Total volunteers
   - Active events
   - Volunteer deployments per month
3. UI renders cards + charts.

---

## Field Operations Use Cases

| ID | Feature | Use Case Sketch |
|----|---------|-----------------|
| UC-F1 | Rescue requests | Citizens/Volunteers create rescue requests; NGO assigns volunteers |
| UC-F2 | Shelters | NGO creates and updates shelter location, capacity, occupancy, contact, and status; all roles can view active records |
| UC-F3 | Inventory | NGO tracks categorized supplies by warehouse or shelter, including reorder thresholds and expiry |
| UC-F4 | Distribution | NGO plans or completes an aid delivery; completion deducts stock and records recipients, time, and location |
| UC-F5 | Interactive map | Authenticated users inspect shelter and distribution markers with operational details |
| UC-F6 | Offline field collection | NGO submissions queue in IndexedDB and synchronize in order when connectivity returns |
| UC-F7 | Report generation | SA generates PDF report (events, deployments, stats) |

---

## Use Case Diagram (Textual)

```
                         ┌─────────────────────┐
                         │   Super Admin (SA)  │
                         └──┬───────┬────────┬─┘
                            │       │        │
               UC-03 Approve│       │UC-15   │UC-16/UC-19
                  NGO       │       │Manage  Manage/Dashboard
                            ▼       ▼Locations Volunteers
        ┌─────────────────────────────┐
        │  Use Cases: NGO Approval,   │
        │  Location mgmt, Volunteer   │
        │  mgmt, Dashboard            │
        └─────────────────────────────┘

   ┌──────────────────┐         ┌────────────────────┐
   │  NGO Admin (N)   │         │  Volunteer (V)     │
   └──┬──────┬────┬───┘         └──┬──────────┬──────┬─┘
      │      │    │                │          │      │
 UC-02 │  UC-07 │ UC-10/UC-11    UC-01   UC-05  UC-12/UC-13
 Reg   │ Add 1 │ Events/Invite   Register Profile Receive/
 NGO   │ Bulk  │                 Vol.    Edit    Respond
       │ UC-08│UC-09/UC-14              │      │
       │ Filter│Track                          │
       └──────┘────┘                           │
                                               │
                              System (S): UC-17 emails
```

---

## Summary

This document enumerates **19 use cases** (plus 7 future ones) covering:

- **Authentication & Accounts:** UC-01, UC-02, UC-03, UC-04
- **Profile:** UC-05, UC-06
- **Volunteer Management:** UC-07, UC-08, UC-09, UC-16
- **Events & Invitations:** UC-10, UC-11, UC-12, UC-13, UC-14, UC-18
- **Locations:** UC-15
- **Cross-cutting:** UC-17 (email), UC-19 (dashboard)

Each use case is implementation-ready and tied to REST endpoints defined in `architecture.md`.

---

*End of Use Case Document*
