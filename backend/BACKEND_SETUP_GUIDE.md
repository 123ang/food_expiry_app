# Backend setup guide

What’s already done in code and what you need to do on your side (migrations, env, run, test).

---

## What’s already done (no code changes needed)

- **Forgot password**
  - `POST /api/auth/forgot-password` — accepts `{ "email" }`, sends a 6-digit code by email.
  - `POST /api/auth/reset-password` — accepts `{ "email", "code", "password" }` (in-app) or `{ "token", "password" }` (link flow).
- **Database**
  - Migration file for password reset: `migrations/005_password_reset_tokens.sql`.
- **Email**
  - 6-digit code email template and sending logic (uses your existing SMTP config).

You don’t need to write any new backend code; you only need to run the migration, configure env, and run the server.

---

## What you need to do

### 1. Run the password-reset migration (required)

The `password_reset_tokens` table must exist. If you haven’t run migration 005 yet:

**Linux (e.g. on your server):**

```bash
cd ~/projects/food_expiry_app   # or your backend root
psql -h localhost -U postgres -d expiry_alert -f migrations/005_password_reset_tokens.sql
```

If you get “Peer authentication failed”, use:

```bash
psql -h localhost -U postgres -d expiry_alert -f migrations/005_password_reset_tokens.sql
# enter postgres password when prompted
```

Or run as the `postgres` system user:

```bash
sudo -u postgres psql -d expiry_alert -f migrations/005_password_reset_tokens.sql
```

**Windows (PowerShell):**

```powershell
cd C:\Users\User\Desktop\Website\foodexpiry\backend
psql -U postgres -d expiry_alert -f migrations/005_password_reset_tokens.sql
```

Replace `postgres` / `expiry_alert` with your DB user and database name if different.

**Check it worked:** In `psql` or any SQL client:

```sql
\dt password_reset_tokens
```

You should see the table.

---

### 2. Environment variables (required for email)

Forgot-password **sends an email** with the 6-digit code. These must be set in your backend `.env`:

| Variable    | Purpose           | Example                          |
|------------|-------------------|----------------------------------|
| `SMTP_USER`| Sender email      | `myexpiryalert@gmail.com`        |
| `SMTP_PASS`| App password      | Your Gmail app password         |
| `EMAIL_FROM` | “From” display (optional) | `"Expiry Alert <myexpiryalert@gmail.com>"` |

If `SMTP_USER` / `SMTP_PASS` are missing, the server will still run but **won’t send** the reset email (you’ll see a warning in logs).

**Gmail:** Use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password.

---

### 3. Optional environment variables

| Variable       | Purpose                          | When to set                      |
|----------------|----------------------------------|----------------------------------|
| `API_URL`      | Base URL of your API             | If you use a custom API URL      |
| `FRONTEND_URL` | Base URL for any reset *links*   | Only if you add a web reset page |

For the **in-app 6-digit code flow**, the iOS app never opens a link; the user only types the code. So you don’t need `FRONTEND_URL` for the current flow.

---

### 4. Run the backend

**Development:**

```bash
cd backend
npm install
npm run dev
```

**Production (example):**

```bash
cd backend
npm run build
npm start
# or use PM2: pm2 start dist/app.js --name "expiry-alert-api"
```

---

### 5. Quick test (forgot password + reset)

1. **Request a code**
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test@example.com"}'
   ```
   Expected: `200` and body like `{ "message": "If an account with that email exists..." }`.

2. **Check email** for the 6-digit code.

3. **Reset password**
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test@example.com","code":"123456","password":"newPassword123"}'
   ```
   Replace `123456` with the code from the email.  
   Expected: `200` and `{ "message": "Password has been reset successfully..." }`.

4. **Log in** with the same email and `newPassword123` (e.g. from the iOS app or login endpoint).

---

## Checklist

- [ ] Migration `005_password_reset_tokens.sql` run on your database
- [ ] `.env` has `SMTP_USER` and `SMTP_PASS` (and optionally `EMAIL_FROM`)
- [ ] Backend starts without errors (`npm run dev` or `npm start`)
- [ ] Test: request code → receive email → reset with code → login with new password

If all of the above are done, the backend is ready for the forgot-password flow; no further backend code is required.
