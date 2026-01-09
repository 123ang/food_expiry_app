# 💻 Local Deployment Guide - Expiry Alert

Complete guide to run the Expiry Alert application on your local machine for development and testing.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Web App Setup](#web-app-setup)
5. [Running the Application](#running-the-application)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js)

### Verify Installation

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check PostgreSQL version (should be 14+)
psql --version
```

---

## Database Setup

### Windows

#### Option 1: Install PostgreSQL Directly

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. PostgreSQL service should start automatically

#### Option 2: Use Docker (Recommended)

```bash
# Pull PostgreSQL image
docker pull postgres:14

# Run PostgreSQL container
docker run --name expiry-alert-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=expiry_alert \
  -p 5432:5432 \
  -d postgres:14
```

### macOS

```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database and User

```bash
# Connect to PostgreSQL
# Windows: Use pgAdmin or psql from command prompt
# macOS/Linux: Use psql

# Option 1: Using psql command line
psql -U postgres

# Inside PostgreSQL prompt:
CREATE DATABASE expiry_alert;
CREATE USER expiry_user WITH ENCRYPTED PASSWORD '920214';
GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;
ALTER DATABASE expiry_alert OWNER TO expiry_user;
\q

# Option 2: Using createdb (if you have permissions)
createdb expiry_alert
```

**Note**: Replace `your_local_password` with a password of your choice (you'll use this in `.env` file).

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

Create a `.env` file in the `backend/` directory:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# macOS/Linux
touch .env
```

### Step 4: Configure Environment Variables

Open `.env` file and add the following:

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
# Format: postgresql://username:password@localhost:5432/database_name
DATABASE_URL=postgresql://expiry_user:your_local_password@localhost:5432/expiry_alert

# JWT Secrets (generate with: openssl rand -base64 64)
# Or use any random string for local development
JWT_ACCESS_SECRET=local-dev-access-secret-change-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email (Gmail SMTP) - Optional for local development
# You can skip email setup if you don't need email features
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="Expiry Alert <your-email@gmail.com>"

# App URLs
WEB_APP_URL=http://localhost:3001
MOBILE_DEEP_LINK_SCHEME=expiryalert

# Image Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**Important Notes:**
- Replace `your_local_password` with the password you set for `expiry_user`
- For local development, you can use simple strings for JWT secrets
- Email setup is optional - you can leave SMTP values empty if not needed
- `UPLOAD_DIR=./uploads` means images will be stored in `backend/uploads/`

### Step 5: Create Uploads Directory

```bash
# Create uploads directory
mkdir uploads

# Windows (if mkdir doesn't work)
# md uploads
```

### Step 6: Run Database Migrations

```bash
# Make sure PostgreSQL is running, then:
psql -U expiry_user -d expiry_alert -f migrations/001_initial_schema.sql

# If you get permission errors, try:
psql -U postgres -d expiry_alert -f migrations/001_initial_schema.sql
```

**Alternative (if psql command doesn't work):**

1. Open pgAdmin (Windows) or any PostgreSQL client
2. Connect to your database
3. Open the SQL query tool
4. Copy and paste the contents of `migrations/001_initial_schema.sql`
5. Execute the query

### Step 7: Verify Backend Setup

```bash
# Build TypeScript (optional, dev mode uses ts-node)
npm run build

# Start development server
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   🍎 Expiry Alert API Server          ║
║                                        ║
║   Environment: development             ║
║   Port: 3000                           ║
║   URL: http://localhost:3000           ║
║                                        ║
║   Status: ✅ Running                   ║
╚════════════════════════════════════════╝
```

**Backend is now running at:** `http://localhost:3000`

Press `Ctrl+C` to stop the server.

---

## Web App Setup

### Step 1: Navigate to Web App Directory

```bash
cd web-app/expiry-alert
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Verify API URL Configuration

The web app should already be configured to use `http://localhost:3000/api` in development mode. Check `src/services/apiClient.ts`:

```typescript
const API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.expiry-alert.link/api';  // Production
```

This should already be correct for local development.

### Step 4: Start Development Server

```bash
npm start
```

The web app will:
- Start on `http://localhost:3001` (or next available port)
- Automatically open in your browser
- Hot reload on file changes

**Web app is now running at:** `http://localhost:3001`

---

## Running the Application

### Option 1: Run in Separate Terminals (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Web App:**
```bash
cd web-app/expiry-alert
npm start
```

### Option 2: Use npm-run-all (Run Both Together)

Install `npm-run-all` globally:
```bash
npm install -g npm-run-all
```

Create a script in the root `package.json`:
```json
{
  "scripts": {
    "dev": "npm-run-all --parallel dev:backend dev:web",
    "dev:backend": "cd backend && npm run dev",
    "dev:web": "cd web-app/expiry-alert && npm start"
  }
}
```

Then run:
```bash
npm run dev
```

### Option 3: Use Concurrently

Install `concurrently` in the root:
```bash
npm install --save-dev concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix backend\" \"npm start --prefix web-app/expiry-alert\""
  }
}
```

---

## Environment Variables

### Backend Environment Variables

| Variable | Description | Example (Local) |
|----------|-------------|-----------------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend port | `3000` |
| `API_URL` | Backend API URL | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://expiry_user:password@localhost:5432/expiry_alert` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Any random string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Any random string |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `30d` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email password (App Password) | `your-app-password` |
| `WEB_APP_URL` | Frontend URL | `http://localhost:3001` |
| `UPLOAD_DIR` | Image upload directory | `./uploads` |

### Web App Environment Variables

The web app uses hardcoded URLs in `apiClient.ts` based on `NODE_ENV`. No `.env` file needed for basic setup.

If you need to customize, create `.env.local` in `web-app/expiry-alert/`:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

---

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Or use browser
# Open: http://localhost:3000/health
```

### Test Web App

1. Open browser: `http://localhost:3001`
2. Try registering a new user
3. Try logging in
4. Check browser console for errors (F12)

### Test Database Connection

```bash
# Connect to database
psql -U expiry_user -d expiry_alert

# List tables
\dt

# Check users table
SELECT * FROM users;

# Exit
\q
```

### Test Image Upload

1. Register/Login in web app
2. Try uploading an image
3. Check if file appears in `backend/uploads/` directory

---

## Troubleshooting

### Backend Issues

#### "Cannot find module" errors

```bash
# Delete node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Database connection errors

**Error: `password authentication failed`**
- Check `.env` file - `DATABASE_URL` password must match PostgreSQL user password
- Verify user exists: `psql -U postgres -c "\du"`

**Error: `database does not exist`**
- Create database: `createdb expiry_alert` or use pgAdmin

**Error: `connection refused`**
- Check if PostgreSQL is running:
  - Windows: Services → PostgreSQL
  - macOS: `brew services list`
  - Linux: `sudo systemctl status postgresql`

#### Port 3000 already in use

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill the process or change PORT in .env
```

#### TypeScript compilation errors

```bash
# Clean and rebuild
cd backend
rm -rf dist
npm run build
```

### Web App Issues

#### "Cannot find module" errors

```bash
cd web-app/expiry-alert
rm -rf node_modules package-lock.json
npm install
```

#### Port 3001 already in use

The React dev server will automatically try the next available port (3002, 3003, etc.)

#### API calls failing (CORS errors)

- Make sure backend is running on port 3000
- Check backend CORS configuration in `backend/src/app.ts`
- Verify `WEB_APP_URL` in backend `.env` matches web app URL

#### "Module not found" errors

```bash
# Clear cache and reinstall
cd web-app/expiry-alert
rm -rf node_modules .cache
npm install
npm start
```

### Database Issues

#### Migration errors

```bash
# Drop and recreate database (WARNING: Deletes all data)
psql -U postgres -c "DROP DATABASE expiry_alert;"
createdb expiry_alert
psql -U expiry_user -d expiry_alert -f migrations/001_initial_schema.sql
```

#### Permission denied errors

```bash
# Grant permissions
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO expiry_user;
\q
```

### Email Issues (Optional)

If you don't need email features, you can skip SMTP configuration. The app will work without it, but features like password reset and invitations won't send emails.

**Gmail App Password Setup:**
1. Enable 2-Factor Authentication on Gmail
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate app password for "Mail"
4. Use that password in `SMTP_PASS`

---

## Development Workflow

### Making Changes

1. **Backend changes**: Save file → Nodemon auto-restarts
2. **Web app changes**: Save file → Hot reload in browser
3. **Database changes**: Update migration file → Run migration

### Database Migrations

When you need to update the database schema:

1. Create new migration file: `migrations/002_add_new_table.sql`
2. Run migration:
   ```bash
   psql -U expiry_user -d expiry_alert -f migrations/002_add_new_table.sql
   ```

### Debugging

**Backend:**
- Check terminal output for errors
- Use `console.log()` for debugging
- Check PM2 logs if using PM2: `pm2 logs`

**Web App:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls
- Use React DevTools extension

---

## Quick Reference

### Important URLs

- **Backend API**: `http://localhost:3000`
- **Web App**: `http://localhost:3001`
- **API Health**: `http://localhost:3000/health`
- **API Docs**: Check `backend/README.md`

### Important Commands

```bash
# Backend
cd backend
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server

# Web App
cd web-app/expiry-alert
npm start            # Start dev server
npm run build        # Build for production

# Database
psql -U expiry_user -d expiry_alert    # Connect to database
\dt                                    # List tables
\q                                     # Exit psql
```

### Important Paths

```
Project Root/
├── backend/
│   ├── .env                    # Backend environment variables
│   ├── uploads/                # Uploaded images
│   └── migrations/             # Database migrations
└── web-app/
    └── expiry-alert/
        └── src/                # React source code
```

---

## Next Steps

Once everything is running locally:

1. ✅ Test all features
2. ✅ Make your changes
3. ✅ Test again
4. ✅ Deploy to VPS (see `VPS_DEPLOYMENT_GUIDE.md`)

---

## Additional Resources

- **Backend README**: `backend/README.md`
- **VPS Deployment**: `VPS_DEPLOYMENT_GUIDE.md`
- **Quick Start**: `DEPLOYMENT_QUICK_START.md`

---

**Happy Coding! 🚀**
