# Fix PostgreSQL Connection on Windows

## Problem
Getting "password authentication failed" when trying to connect to PostgreSQL on Windows.

## Solutions

### Solution 1: Use pgAdmin (Easiest)

pgAdmin is a GUI tool that comes with PostgreSQL installation:

1. **Open pgAdmin** (search for "pgAdmin" in Windows Start menu)
2. **Connect to server:**
   - Right-click "Servers" → "Create" → "Server"
   - General tab: Name = "Local PostgreSQL"
   - Connection tab:
     - Host: `localhost`
     - Port: `5432`
     - Username: `postgres`
     - Password: The password you set during PostgreSQL installation
3. **Create database:**
   - Right-click "Databases" → "Create" → "Database"
   - Name: `expiry_alert`
4. **Create user:**
   - Right-click "Login/Group Roles" → "Create" → "Login/Group Role"
   - General tab: Name = `expiry_user`
   - Definition tab: Password = `your_password`
   - Privileges tab: Check "Can login?"

### Solution 2: Reset PostgreSQL Password

If you forgot the password:

```powershell
# 1. Open Command Prompt as Administrator
# 2. Navigate to PostgreSQL bin directory (usually):
cd "C:\Program Files\PostgreSQL\14\bin"

# 3. Reset password using Windows authentication
psql -U postgres -d postgres

# If that doesn't work, try:
.\psql.exe -U postgres
```

**Alternative: Edit pg_hba.conf**

1. Find `pg_hba.conf` file (usually in `C:\Program Files\PostgreSQL\14\data\`)
2. Open as Administrator
3. Find line: `host all all 127.0.0.1/32 md5`
4. Change to: `host all all 127.0.0.1/32 trust`
5. Restart PostgreSQL service
6. Connect: `psql -U postgres`
7. Change password: `ALTER USER postgres WITH PASSWORD 'newpassword';`
8. Change `pg_hba.conf` back to `md5`
9. Restart PostgreSQL service

### Solution 3: Use Windows Authentication

```powershell
# Connect using Windows user (if PostgreSQL was installed with Windows auth)
psql -U $env:USERNAME -d postgres
```

### Solution 4: Use Docker (Recommended - No Password Issues)

```powershell
# Pull PostgreSQL image
docker pull postgres:14

# Run PostgreSQL container
docker run --name expiry-alert-db `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=expiry_alert `
  -p 5432:5432 `
  -d postgres:14

# Connect (password is "postgres")
docker exec -it expiry-alert-db psql -U postgres -d expiry_alert
```

Then create user:
```sql
CREATE USER expiry_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;
```

### Solution 5: Check PostgreSQL Service

```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start service if stopped
Start-Service postgresql-x64-14  # Adjust version number
```

### Solution 6: Use Connection String Directly

Skip `psql` and use the connection string in your `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/expiry_alert
```

The backend will connect directly without needing `psql`.

## Quick Setup Script for Windows

Create a file `setup-db.ps1`:

```powershell
# Set your PostgreSQL password here
$POSTGRES_PASSWORD = "your_postgres_password"
$DB_PASSWORD = "your_db_password"

# Path to psql (adjust version number)
$PSQL_PATH = "C:\Program Files\PostgreSQL\14\bin\psql.exe"

# Set password in environment
$env:PGPASSWORD = $POSTGRES_PASSWORD

# Create database and user
& $PSQL_PATH -U postgres -c "CREATE DATABASE expiry_alert;"
& $PSQL_PATH -U postgres -c "CREATE USER expiry_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
& $PSQL_PATH -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;"
& $PSQL_PATH -U postgres -c "ALTER DATABASE expiry_alert OWNER TO expiry_user;"

Write-Host "Database setup complete!"
```

Run: `.\setup-db.ps1`

## Recommended: Use Docker

Docker is the easiest option - no password issues, easy to reset:

```powershell
# Start PostgreSQL
docker run --name expiry-alert-db `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=expiry_alert `
  -p 5432:5432 `
  -d postgres:14

# Connect and setup
docker exec -it expiry-alert-db psql -U postgres -d expiry_alert -c "CREATE USER expiry_user WITH ENCRYPTED PASSWORD 'your_password';"
docker exec -it expiry-alert-db psql -U postgres -d expiry_alert -c "GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;"
```

Then in your `.env`:
```env
DATABASE_URL=postgresql://expiry_user:your_password@localhost:5432/expiry_alert
```
