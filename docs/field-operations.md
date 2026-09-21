# Field Operations: Shelters, Inventory, Distribution, Maps, and Offline Sync

## Overview

Nexora's Field Operations workspace connects emergency-shelter capacity, relief inventory, and aid distributions in one operational record. The same data powers a map for NGO administrators, volunteers, and super administrators.

## Role Access

| Capability | NGO Admin | Volunteer | Super Admin |
|---|---:|---:|---:|
| View shelters, inventory, distributions, and map | Yes, own NGO | Yes, all active records | Yes, all active records |
| Create and update shelters | Yes | No | No |
| Create and update inventory | Yes | No | No |
| Record and update distributions | Yes | No | No |

Writes are scoped to the authenticated NGO. Ownership is checked again in the service layer before every update.

## Data Model

- `Shelter`: NGO owner, name, address, coordinates, capacity, current occupancy, contact details, status, and notes.
- `InventoryItem`: NGO owner, optional shelter, category, current quantity, unit, reorder threshold, optional expiry date, and notes.
- `DistributionRecord`: NGO owner, inventory item, optional shelter, recipient group, quantity, time, location, coordinates, status, and notes.

Completing a distribution deducts its quantity from the linked inventory item in the same transaction. Reopening or cancelling a completed record restores that quantity. A distribution cannot exceed available stock.

## API

All endpoints require JWT authentication.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/operations/summary` | All roles | Operational totals |
| `GET` | `/api/v1/operations/shelters` | All roles | Visible shelters |
| `POST` | `/api/v1/operations/shelters` | NGO | Create shelter |
| `PUT` | `/api/v1/operations/shelters/{id}` | NGO owner | Update shelter |
| `GET` | `/api/v1/operations/inventory` | All roles | Visible stock lines |
| `POST` | `/api/v1/operations/inventory` | NGO | Create stock line |
| `PUT` | `/api/v1/operations/inventory/{id}` | NGO owner | Update stock line |
| `GET` | `/api/v1/operations/distributions` | All roles | Visible distribution history |
| `POST` | `/api/v1/operations/distributions` | NGO | Record distribution |
| `PATCH` | `/api/v1/operations/distributions/{id}/status` | NGO owner | Change distribution status |

## Frontend Routes

- `/ngo/operations`: full management workspace.
- `/volunteer/operations`: read-only shelters, stock, distribution, and map view.
- `/admin/operations`: platform-wide read-only supervision view.

The interactive map uses Leaflet and OpenStreetMap tiles. Shelter and distribution markers open operational details. Text lists remain available when map tiles cannot load.

The workspace refreshes operational data every 30 seconds and immediately after successful local writes or offline synchronization, so field teams share a current view without manually reloading the page.

## Offline Behavior

The frontend registers `/sw.js` to cache same-origin application pages and static assets. NGO operational submissions use an IndexedDB mutation queue when the browser is offline or a network request fails.

- A queued action is shown in the global offline-sync indicator.
- The queue retries in order after the browser reconnects.
- Create requests include a stable `clientReference`, and the backend treats retries idempotently to prevent duplicate field records.
- API responses and authentication data are not cached by the service worker.

## Validation and Tests

Backend validation covers Bangladesh coordinate bounds, non-negative stock, positive distribution quantities, and shelter occupancy not exceeding capacity. JUnit tests verify completed-distribution stock deduction, insufficient-stock rejection, and shelter-capacity rejection. The full Spring application-context test also discovers the new entities, repositories, service, and controller.
