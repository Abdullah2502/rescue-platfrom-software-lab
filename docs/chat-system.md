# Chat and Communication System

## Architecture & Product Overview

Nexora provides a real-time, multi-room chat system that powers communication across disaster relief operations. The system is split into two distinct channels:

1. **Global Platform Chat (`/chat/global`)**: Accessible to all authenticated users (**Super Admins**, **NGO Admins**, and **Volunteers**). Serves as a nationwide coordination channel for broadcasting urgent announcements, asking general operational questions, and sharing disaster telemetry across regions.
2. **Event Operations Chat (`/chat/events/{eventId}`)**: Dedicated operational rooms attached to specific disaster events. Access is scoped strictly to:
   - **Volunteers** currently joined in that specific disaster event.
   - **NGO Admins** who organize/manage that event.
   - **Super Admins** monitoring platform operations.

---

## Data Model

The chat system relies on two main JPA entities: `ChatMessage` and `ChatReadReceipt`.

### 1. `ChatMessage` (`chat_messages` table)
- **`id`**: Primary key (`BIGINT`, Auto Increment).
- **`event`**: `ManyToOne` relationship to `DisasterEvent`. 
  - `null` = Global platform message.
  - `non-null` = Event-specific operations message.
- **`senderId`**, **`senderRole`**, **`senderName`**, **`senderEmail`**: Denormalized sender details captured at send time to maintain audit history even if user profiles change.
- **`message`**: Text payload (max 2000 characters).
- **`pinned`**: Boolean flag indicating if the message is pinned to the top of the chat room.
- **`pinnedBy`**, **`pinnedAt`**: Metadata tracking who pinned the message and when.
- **Indexes**: Indexed on `event_id` and `created_at` for high-performance timeline queries.

### 2. `ChatReadReceipt` (`chat_read_receipts` table)
- **`userId`**, **`userRole`**: Composite user identity tracking who read the chat.
- **`event`**: `ManyToOne` to `DisasterEvent` (`null` for Global chat, `non-null` for specific Event chat).
- **`lastReadMessageId`**: ID of the highest message ID the user has seen in this room.
- **`lastReadAt`**: Timestamp when the read marker was last updated.
- **Indexes**: Indexed on `(user_id, user_role)` and `event_id`.

---

## Backend Services & Access Control

The backend logic is encapsulated inside `ChatService` and exposed via `ChatController` under `/api/v1/chat/...`.

### Access Control Rules
- **Global Chat**:
  - `GET /api/v1/chat/global` & `POST /api/v1/chat/global`: Requires `isAuthenticated()`.
  - `PATCH /api/v1/chat/global/{messageId}/pin`: Restricted strictly to `ROLE_SUPER_ADMIN`.
- **Event Operations Chat**:
  - `GET /api/v1/chat/events`: Lists only the chat rooms accessible to the current user (events where a volunteer has joined, events owned by an NGO, or all events for a Super Admin).
  - `GET /api/v1/chat/events/{eventId}` & `POST /api/v1/chat/events/{eventId}`: Verifies that the volunteer is joined or the user has admin authority over the event before fetching/sending messages.
  - `PATCH /api/v1/chat/events/{eventId}/{messageId}/pin`: Restricted to `ROLE_SUPER_ADMIN` or the managing `ROLE_NGO_ADMIN`.
- **Unread Tracking & Read Receipts**:
  - `GET /api/v1/chat/unread-summary`: Returns aggregate unread counts for Global chat and each accessible Event chat by comparing the latest message IDs against the user's `ChatReadReceipt`.
  - `POST /api/v1/chat/global/read` & `POST /api/v1/chat/events/{eventId}/read`: Upserts `ChatReadReceipt` with the newest message ID.

---

## REST API Surface

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/chat/global` | Authenticated | List global platform messages |
| `POST` | `/api/v1/chat/global` | Authenticated | Post a message to global chat |
| `PATCH` | `/api/v1/chat/global/{messageId}/pin` | Super Admin | Pin/unpin a global message |
| `GET` | `/api/v1/chat/events` | Authenticated | List accessible event chat summaries |
| `GET` | `/api/v1/chat/events/{eventId}` | Authorized User | List messages for a specific event room |
| `POST` | `/api/v1/chat/events/{eventId}` | Authorized User | Post a message to an event room |
| `PATCH` | `/api/v1/chat/events/{eventId}/{messageId}/pin` | Admin / NGO | Pin/unpin an event chat message |
| `GET` | `/api/v1/chat/unread-summary` | Authenticated | Fetch unread badge counts across all chats |
| `POST` | `/api/v1/chat/global/read` | Authenticated | Mark global chat as read |
| `POST` | `/api/v1/chat/events/{eventId}/read` | Authorized User | Mark event chat as read |

---

## Frontend Architecture

The UI implementation is composed of reusable components located in `frontend/components/chat/`:

### 1. `ChatRoom.tsx`
- **Live Polling Engine**: Automatically polls the active chat endpoint every 3 seconds to pull fresh messages and keep the timeline up-to-date without requiring full page reloads.
- **Auto-Scroll & Read Marker**: Scrolls to the bottom on initial load / new messages and automatically dispatches read receipts (`markAsRead`) for the highest visible message ID.
- **Role Badges & Styling**: Distinct visual styling and icons based on `senderRole`:
  - **Super Admin**: Amber/Gold shield badge (`ShieldAlert`).
  - **NGO Admin**: Red building badge (`Building2`).
  - **Volunteer**: Emerald volunteer badge (`HeartHandshake`).
  - **Self Messages**: Right-aligned shaded message bubbles.
- **Pinned Announcement Banner**: Sticky top banner displaying pinned announcements, expandable/collapsible by users.

### 2. `UnreadChatsCard.tsx`
- Renders an unread activity card on user dashboards showing total unread count badges and direct jump links to active event chats.

### 3. Route Structure
- `/volunteer/global-chat`, `/ngo/global-chat`, `/admin/global-chat`
- `/volunteer/event-chats`, `/ngo/event-chats`, `/admin/event-chats`
- `/volunteer/events/[id]/chat`, `/ngo/events/[id]/chat`, `/admin/events/[id]/chat`

