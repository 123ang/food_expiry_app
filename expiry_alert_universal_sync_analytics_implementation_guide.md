# 🍎 Expiry Alert – Universal Sync & Analytics Implementation Guide

> **Audience:** Mobile & Web Developers  
> **Platforms:** Expo (React Native) Mobile App + Web App  
> **Backend:** Node.js + MySQL (storage-agnostic, S3/R2 or server uploads)  
> **Architecture Principle:** Offline‑First, Login‑Once, Universal Sync

---

## 1. Purpose of This Document

This document defines **how to implement a universal offline‑first sync system** for **ALL application data** (not only food items) across:

- 📱 **Mobile app (Expo / React Native)**
- 🌐 **Web app (same UI, larger screen)**
- ☁️ **Backend (MySQL + API)**

It also specifies:
- Authentication model (login once)
- Image sync strategy
- New device onboarding
- Analytics design (what to track & why)

This document is the **single source of truth** for implementation.

---

## 2. Core Product Decisions (Non‑Negotiable)

### 2.1 Offline‑First
- All user actions **write to local storage first**
- App must function fully **without internet**
- Sync happens opportunistically when online

### 2.2 Login Once (Persistent Session)
- User logs in or registers **once**
- Session persists across app restarts
- Re‑login only required if:
  - user logs out manually
  - refresh token expires / revoked

### 2.3 Universal Sync (ALL DATA)
If a table is user‑generated, shared, or configurable, it **must sync**.

No table‑specific sync logic allowed.

---

## 3. Data Domains Covered by Sync

| Domain | Table |
|------|------|
| User profile | users |
| Devices | devices |
| Groups (Family) | groups |
| Group members | memberships |
| Categories | categories |
| Locations | locations |
| Food items | food_items |
| Images (metadata) | images |
| Shopping list | shopping_items |
| Wish list | wish_items |
| App settings | user_settings |
| Notification settings | notification_settings |

> Rule: **If a table has `cloud_id` or `group_id`, it must be synced.**

---

## 4. Required Sync Columns (ALL TABLES)

Every sync‑enabled table **must include**:

```sql
cloud_id CHAR(36) PRIMARY KEY,
created_at DATETIME,
updated_at DATETIME,
deleted_at DATETIME NULL,
version INT DEFAULT 1
```

Local DB also includes:
```sql
sync_status TEXT CHECK (sync_status IN ('pending','synced','conflict'))
```

### Why
- `cloud_id`: stable cross‑device identity
- `updated_at`: incremental sync
- `deleted_at`: soft delete propagation
- `version`: conflict detection
- `sync_status`: local sync state

---

## 5. Authentication & Login‑Once Model

### 5.1 Token Strategy

- **Access Token** (short‑lived, e.g. 15–30 min)
- **Refresh Token** (long‑lived, device‑bound)

Stored:
- Mobile: **SecureStore**
- Web: **HttpOnly cookies**

### 5.2 Device Registration

Each device is registered once:

```http
POST /devices/register
```

Server stores:
- user_id
- device_uuid
- device_name

Refresh tokens are linked to device_id.

---

## 6. Universal Sync Architecture

### 6.1 Sync Is Entity‑Agnostic

The sync engine **does not know business meaning**.
It only syncs entities by name.

### 6.2 Push Payload (Client → Server)

```json
{
  "since": "2026-01-01T00:00:00Z",
  "device_id": "uuid",
  "payload": {
    "categories": [...],
    "locations": [...],
    "food_items": [...],
    "images": [...],
    "shopping_items": [...],
    "wish_items": [...],
    "user_settings": [...],
    "notification_settings": [...],
    "groups": [...],
    "memberships": [...]
  }
}
```

### 6.3 Pull Payload (Server → Client)

```json
{
  "server_time": "2026-01-08T02:00:00Z",
  "changes": {
    "categories": [...],
    "locations": [...],
    "food_items": [...],
    "images": [...],
    "shopping_items": [...],
    "wish_items": [...],
    "user_settings": [...],
    "notification_settings": [...],
    "groups": [...],
    "memberships": [...]
  }
}
```

---

## 7. Sync Execution Order (MANDATORY)

```
1. Push all local dirty metadata (ALL tables)
2. Upload pending image files
3. Pull server changes since last_sync_at
4. Apply remote changes locally
5. Update last_sync_at
```

Never reverse this order.

---

## 8. Image Sync Design

### 8.1 Image = Metadata + File

- Metadata synced via universal sync
- File uploaded separately

### Metadata fields
- cloud_id
- item_cloud_id
- version
- content_hash
- url
- deleted_at

### Upload rules
Upload file only if:
- no `url`
- OR `content_hash` changed
- OR `version` increased

### New Device
- Pull metadata first
- Display via URL
- Download file **on demand**

---

## 9. Conflict Resolution Rules

| Entity | Resolution |
|------|-----------|
| Categories | Server wins |
| Locations | Server wins |
| Food items | Latest updated_at |
| Images | Highest version |
| Shopping/Wish | Latest updated_at |
| Settings | Latest device write |

Conflicted rows marked:
```sql
sync_status = 'conflict'
```

---

## 10. New Device Flow

1. User logs in
2. Device registers
3. Full sync pull (since = epoch)
4. UI renders immediately
5. Images downloaded lazily

No special logic required.

---

## 11. Analytics System (Recommended)

### 11.1 Why Analytics
Analytics are used to:
- Improve UX
- Reduce food waste
- Measure feature value
- Guide product decisions

### 11.2 Events Table

```sql
CREATE TABLE events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  device_id BIGINT,
  event_name VARCHAR(80),
  entity_type VARCHAR(40),
  entity_cloud_id CHAR(36),
  event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  meta JSON
);
```

### 11.3 Events to Track (Suggested)

#### User & App
- app_open
- app_background
- login_success
- logout

#### Core Usage
- food_item_created
- food_item_updated
- food_item_consumed
- food_item_discarded
- image_added
- image_removed

#### Notifications
- reminder_scheduled
- reminder_sent
- reminder_opened

#### Engagement
- shopping_item_added
- wish_item_added
- calendar_view_opened

---

## 12. Key Analytics You Can Build

### Product Metrics
- DAU / WAU / MAU
- Retention (Day 1 / 7 / 30)
- Avg items per user

### Food Waste Intelligence
- Discard vs consumed ratio
- Most wasted categories
- Avg days before expiry
- Reminder effectiveness

### Feature Value
- % users using photos
- % users using shopping list
- % family group adoption

---

## 13. Web App Implementation Notes

### Recommended Approach
**React Native Web**

Why:
- Same components
- Same design
- Same logic
- Faster delivery

### Differences
- Larger layout
- Multi‑column views
- Keyboard shortcuts

### Sync & Auth
- Uses same API
- Same universal sync engine
- Tokens via cookies

---

## 14. What Developers Must NOT Do

❌ Write server‑first logic
❌ Hard‑delete synced data
❌ Sync only food items
❌ Store images inside MySQL
❌ Require login every app launch

---

## 15. Final Notes

This architecture:
- scales to more features
- supports offline usage
- supports families & sharing
- supports mobile + web
- supports analytics & insights

This document should be followed **strictly** for all future development.

---

*Expiry Alert – Built for long‑term scale, not quick hacks.*

