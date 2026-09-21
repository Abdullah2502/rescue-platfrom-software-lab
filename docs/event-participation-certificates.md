# Event participation and certificates

## Product behavior

Nexora uses a volunteer-led event flow. NGOs, volunteers, and super admins can create disaster events. Every active volunteer can browse open events, open the event detail, and join directly. A volunteer can withdraw at any time while the event remains visible in their history.

NGOs do not invite people to events. Their event list and detail pages show the live aggregate participant count (`joined / needed`) and event status. Participant identities are intentionally not exposed in the NGO interface.

When an NGO finishes an event by closing it, Nexora automatically generates one certificate for every current participant. Super admins can also create platform events, monitor every event, and rerun generation from the certificate registry when needed. Generation is idempotent: one certificate exists per event and volunteer. Certificates remain available to volunteers through the Certificates page and can be printed from the browser.

## API surface

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/volunteer/events` | Volunteer | Browse open, ongoing, and closed events |
| POST | `/api/v1/volunteer/events` | Volunteer | Create an event |
| POST | `/api/v1/volunteer/events/{id}/join` | Volunteer | Join an open/ongoing event |
| DELETE | `/api/v1/volunteer/events/{id}/join` | Volunteer | Withdraw participation |
| GET | `/api/v1/volunteer/certificates` | Volunteer | View issued certificates |
| GET | `/api/v1/ngo/events` | NGO admin | View owned events and participant counts |
| POST | `/api/v1/ngo/events` | NGO admin | Create an NGO event |
| POST | `/api/v1/admin/events` | Super admin | Create a platform event |
| GET | `/api/v1/admin/events` | Super admin | Monitor all events |
| POST | `/api/v1/admin/events/{id}/certificates/generate` | Super admin | Retry generation for all joiners |
| GET | `/api/v1/admin/certificates` | Super admin | View the certificate registry |

## Data model

- `event_participations` stores one unique `(event_id, volunteer_id)` join record.
- `certificates` stores the immutable certificate number, event, volunteer, issue time, and issuing actor (the NGO finisher or super admin retry action).
- `disaster_events` now supports NGO, volunteer, or super-admin ownership. Existing invitation tables are retained for database compatibility, but invitation endpoints and screens are removed from the active product flow.

## Certificate assumptions

Certificates are issued automatically for current participation records when an NGO closes an event; the admin Generate action is an idempotent retry. Withdrawal removes the participation record; certificates already issued remain as an audit record. Certificate IDs use the stable format `NXR-<year>-<event id>-<volunteer id>`.

## Theme

The frontend supports dark and light mode from the account header. The preference is stored in `localStorage` as `nexora-theme` and respects the system preference on first load.
