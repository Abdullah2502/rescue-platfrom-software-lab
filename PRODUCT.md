# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Volunteers responding to disaster events across Bangladesh, often from phones and unreliable networks.
- NGO administrators coordinating volunteers, shelters, supplies, and aid delivery.
- Super administrators supervising organizations, events, locations, certificates, and platform-wide operations.

## Product Purpose

Nexora coordinates disaster-response work between NGOs, volunteers, and platform administrators. Success means responders can discover current operations, commit to events, locate shelter and aid resources, record field activity, and retain an auditable participation history.

## Positioning

Nexora combines Bangladesh's Division, District, and Thana hierarchy with direct volunteer participation and a shared operational record for events, shelters, supplies, distributions, and certificates.

## Operating Context

The product is used during disaster preparation and active response. Field connectivity may be intermittent, so operational submissions must remain available locally and synchronize after the connection returns.

## Capabilities and Constraints

- JWT authentication and role-based access for volunteers, NGO administrators, and super administrators.
- NGOs and administrators create and monitor disaster events; volunteers can discover and join events directly.
- Event completion generates participation certificates.
- NGOs manage emergency shelters, inventory, and aid distributions.
- All authenticated roles can view operational shelter and distribution data on an interactive map.
- Offline operational submissions are queued in the browser and retried when connectivity returns.
- The platform uses a Next.js frontend, Spring Boot REST API, PostgreSQL, and Bangladesh administrative location data.

Role boundaries for the new operational modules are inferred from the user's feature brief and the existing RBAC model: NGOs write organization-owned records, while volunteers and super administrators receive platform-wide operational visibility.

## Brand Commitments

The product name is Nexora. Existing copy uses direct emergency-operations language and prioritizes clarity, urgency, and traceability.

## Evidence on Hand

- Existing implementation and product documentation in `architecture.md`, `srs.md`, `use-case.md`, and `docs/`.
- No verified customer claims, response-time benchmarks, or deployment statistics are available and must not be fabricated.

## Product Principles

1. Field actions must remain usable under unreliable connectivity.
2. Operational records should show ownership, location, time, and current status.
3. Volunteers should find actionable information without invitation gates.
4. Resource quantities and distribution records must remain auditable.
5. Critical workflows must be understandable on mobile screens.

## Accessibility & Inclusion

Interfaces must be keyboard accessible, support light and dark modes, preserve readable contrast, and avoid relying on color alone for operational status.
