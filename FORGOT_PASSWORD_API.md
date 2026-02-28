# Forgot Password API

Two-step password reset flow: request a reset link by email, then set a new password using the token from the link.

---

## Step 1 — Request Reset Email

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/auth/forgot-password` | None |

### Request body

```json
{
  "email": "user@example.com"
}
```

### Response — `200 OK` (always, even if email not found)

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

> The response is intentionally the same whether the email exists or not, to avoid leaking account information.

### What happens on the server

1. Looks up the user by email.
2. Invalidates any previous unused tokens for that user.
3. Generates a cryptographically random token (64 hex chars), stores its SHA-256 hash in `password_reset_tokens`.
4. Sends an email with a reset link: `{FRONTEND_URL}/reset-password?token=<token>`.
5. Token expires in **1 hour**.

### Email sent

Uses the `passwordReset` template already in `backend/src/config/email.ts`. The email includes:
- A "Reset Password" button linking to the reset page.
- Plain-text fallback with the same link.
- Note that the link expires in 1 hour.

---

## Step 2 — Reset Password

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/auth/reset-password` | None |

### Request body

```json
{
  "token": "abc123...def456",
  "password": "newSecurePassword"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `token` | string | Required. The raw token from the email link. |
| `password` | string | Required. Minimum 6 characters. |

### Response — `200 OK`

```json
{
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

### Error responses

| Status | When |
|--------|------|
| `400` | Token is missing, invalid, already used, or expired. |
| `400` | Password is missing or shorter than 6 characters. |

```json
{
  "error": "Invalid or expired reset token"
}
```

```json
{
  "error": "This reset token has already been used"
}
```

```json
{
  "error": "This reset token has expired"
}
```

### What happens on the server

1. Hashes the token and looks it up in `password_reset_tokens`.
2. Checks it hasn't been used and hasn't expired.
3. Updates the user's `password_hash` with the new password (bcrypt).
4. Marks the token as used (`used_at = NOW()`).
5. Invalidates **all** refresh tokens for the user (forces re-login on every device).

---

## Database

### Migration: `005_password_reset_tokens.sql`

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Run the migration

```bash
psql -h localhost -U postgres -d expiry_alert -f migrations/005_password_reset_tokens.sql
```

Or via the postgres system user:

```bash
sudo -u postgres psql -d expiry_alert -f migrations/005_password_reset_tokens.sql
```

---

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `FRONTEND_URL` | Base URL for the reset link in the email | `API_BASE_URL` or `https://api.expiry-alert.link` |
| `SMTP_USER` | Gmail address for sending email | *(required for email to work)* |
| `SMTP_PASS` | Gmail App Password | *(required for email to work)* |

---

## iOS App Integration

The iOS app needs:

1. **"Forgot Password" button** on the login screen.
2. Tapping it shows a text field for email and calls `POST /api/auth/forgot-password`.
3. Show a message: "Check your email for a reset link."
4. When the user taps the link in the email, it can either:
   - Open a **web page** that collects the new password and calls `POST /api/auth/reset-password`, or
   - **Deep-link** into the app (e.g. `expiryalert://reset-password?token=...`) where the app shows a "New password" form and calls the API.
5. On success, navigate to the login screen.

---

## Quick test (curl)

```bash
# 1. Request reset email
curl -s -X POST https://api.expiry-alert.link/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Copy the token from the email link, then:
curl -s -X POST https://api.expiry-alert.link/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<token_from_email>","password":"myNewPassword123"}'
```

---

## Files changed

| File | Change |
|------|--------|
| `migrations/005_password_reset_tokens.sql` | New table |
| `src/services/authService.ts` | `requestPasswordReset()`, `resetPassword()` |
| `src/middleware/validation.ts` | `forgotPassword`, `resetPassword` rules |
| `src/routes/auth.ts` | `POST /forgot-password`, `POST /reset-password` |
