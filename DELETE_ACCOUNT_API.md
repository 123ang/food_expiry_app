# Delete Account API

Endpoint that permanently deletes the authenticated user's account and all associated data.  
Required by **App Store Guideline 5.1.1(v)**.

---

## Endpoint

| Method | Path | Auth |
|--------|------|------|
| `DELETE` | `/api/auth/me` | Bearer token required |

**Production URL:** `DELETE https://api.expiry-alert.link/api/auth/me`

---

## Request

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <access_token>` |

### Body

None (empty body).

---

## Response

### Success — `204 No Content`

Empty body. The account has been permanently deleted.

### Error — `401 Unauthorized`

```json
{ "error": "Access token required" }
```

```json
{ "error": "Token expired" }
```

### Error — `403 Forbidden`

```json
{ "error": "Invalid token" }
```

### Error — `500 Internal Server Error`

```json
{ "error": "Internal server error" }
```

---

## What gets deleted

Deletion runs inside a **database transaction**. If any step fails the whole operation is rolled back — the account is either fully deleted or not at all.

### Group ownership transfer

Before the user is deleted, the service checks every group where the user is an owner:

- **Group has other members** → ownership is transferred to the longest-standing other member (their role is promoted to `owner`). The group and its data are preserved for the remaining members.
- **Group has no other members** → the group is deleted via the FK cascade when the user row is removed.

### Cascade deletions (automatic via FK `ON DELETE CASCADE`)

After the optional ownership transfer, a single `DELETE FROM users` triggers cascades across every related table:

| Table | Reason |
|-------|--------|
| `devices` | `user_id → users(id)` |
| `sync_log` | `device_id → devices(id)`, `user_id → users(id)` |
| `user_settings` | `user_id → users(id)` |
| `group_memberships` | `user_id → users(id)` |
| `invitations` | `invited_by → users(id)`, `invited_user_id → users(id)` |
| `food_items` (created by user) | `created_by → users(id)` |
| `food_item_events` | `user_id → users(id)`, also via `food_items` cascade |
| `shopping_items` (created by user) | `created_by → users(id)` |
| `wish_items` (created by user) | `created_by → users(id)` |
| `groups` (solo-owner groups) | `created_by → users(id)` → cascades into all group data |

---

## Implementation

### Route — `backend/src/routes/auth.ts`

```
DELETE /auth/me
  → authenticateToken middleware
  → AuthService.deleteAccount(userId)
  → 204 No Content
```

### Service — `backend/src/services/authService.ts`

Method: `AuthService.deleteAccount(userId: string): Promise<void>`

- Opens a PostgreSQL transaction via `getClient()`.
- Transfers ownership of multi-member groups where the user is the owner.
- Executes `DELETE FROM users WHERE id = $1`.
- Commits on success; rolls back on any error.

---

## App Store compliance

- Deletion is **permanent** (hard delete, not soft delete / `deleted_at`).
- The iOS app presents a **double confirmation** before calling this endpoint.
- On `204` the app clears the local session and returns the user to the login screen.
- Satisfies **App Store Guideline 5.1.1(v)**: apps that support account creation must provide account deletion.

---

## Quick test (curl)

```bash
# 1. Login to get an access token
curl -s -X POST https://api.expiry-alert.link/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"your-password"}' \
  | jq .tokens.accessToken

# 2. Delete the account
curl -i -X DELETE https://api.expiry-alert.link/api/auth/me \
  -H "Authorization: Bearer <access_token>"
# Expected: HTTP/1.1 204 No Content
```
