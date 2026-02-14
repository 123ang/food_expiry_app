# How to Execute Migration 004 (Backend Database Changes)

This guide runs the migration that adds `is_customization`, shopping fields, and wishlist changes from `BACKEND_DATABASE_CHANGES.md`.

---

## 1. Run the migration SQL

From the **backend** folder, run the migration against your PostgreSQL database.

### Option A: Using `psql` (recommended)

**Linux (avoid "Peer authentication failed"):** use `-h localhost` so the server uses password auth instead of peer:

```bash
cd ~/projects/food_expiry_app   # or your backend path
psql -h localhost -U postgres -d expiry_alert -f migrations/004_backend_database_changes.sql
```

Or with password in env (no prompt):

```bash
PGPASSWORD=your_postgres_password psql -h localhost -U postgres -d expiry_alert -f migrations/004_backend_database_changes.sql
```

**If you must use peer auth**, run as the `postgres` system user:

```bash
sudo -u postgres psql -d expiry_alert -f migrations/004_backend_database_changes.sql
```

**Windows (PowerShell):**

```powershell
cd C:\Users\User\Desktop\Website\foodexpiry\backend
psql -U postgres -d expiry_alert -f migrations/004_backend_database_changes.sql
```

Replace `postgres` with your DB user and `expiry_alert` with your DB name if different. On Windows you may need the full path to `psql` (e.g. `"C:\Program Files\PostgreSQL\16\bin\psql.exe"`).

### Option B: Using connection string from `.env`

If your `.env` has `DATABASE_URL=postgresql://user:password@host:5432/dbname`:

```powershell
cd C:\Users\User\Desktop\Website\foodexpiry\backend
# Example (adjust user/db to match your DATABASE_URL):
psql "postgresql://expiry_user:YOUR_PASSWORD@localhost:5432/expiry_alert" -f migrations/004_backend_database_changes.sql
```

### Option C: From pgAdmin or another client

1. Open your database (e.g. `expiry_alert`).
2. Open a Query Tool / SQL window.
3. Open the file `backend/migrations/004_backend_database_changes.sql` in an editor.
4. Copy its contents and execute in the Query Tool.

---

## 2. If the migration fails on the wish_items constraint

You may see an error like:

```text
ERROR: constraint "wish_items_rating_check" does not exist
```

Then the rating constraint has a different name. Fix it like this:

1. Find the real constraint name:

```sql
SELECT conname
FROM pg_catalog.pg_constraint
WHERE conrelid = 'public.wish_items'::regclass
  AND contype = 'c';
```

2. Open `migrations/004_backend_database_changes.sql` and replace:

- `wish_items_rating_check` with the name you got (e.g. `wish_items_rating_check_old`).

3. Run the migration again (only the part that failed, or the full file if you prefer).

---

## 3. Verify the backend

```powershell
cd C:\Users\User\Desktop\Website\foodexpiry\backend
npm install
npx tsc --noEmit
```

There should be no TypeScript errors.

---

## 4. (Optional) Run the API and test

```powershell
cd C:\Users\User\Desktop\Website\foodexpiry\backend
npm run dev
```

Then call your API (e.g. categories, locations, shopping, wish) and check that responses include the new fields (`is_customization`, `where_to_buy`, `currency_code`, etc.) as in `BACKEND_DATABASE_CHANGES.md`.

---

## Quick reference

| Step | Command / action |
|------|-------------------|
| Run migration | `psql -U postgres -d expiry_alert -f migrations/004_backend_database_changes.sql` |
| TypeScript check | `npx tsc --noEmit` |
| Start dev server | `npm run dev` |
