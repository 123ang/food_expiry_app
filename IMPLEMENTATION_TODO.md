# 🍎 Expiry Alert - Implementation To-Do List

> **Project**: Food Waste Intelligence + Groups + Unified Backend  
> **Date Created**: January 8, 2026  
> **Backend**: Node.js + PostgreSQL  
> **Hosting**: Exabytes (own server)  
> **Image Storage**: Local server  
> **Email**: Gmail SMTP (setup guide included)

---

## 📋 Table of Contents

1. [Pre-Implementation Setup](#pre-implementation-setup)
2. [Phase 0: Backend Setup](#phase-0-backend-setup)
3. [Phase 1: Core API Endpoints](#phase-1-core-api-endpoints)
4. [Phase 2: Food Waste Intelligence](#phase-2-food-waste-intelligence-backend)
5. [Phase 3: Mobile App Updates](#phase-3-mobile-app-updates)
6. [Phase 4: Web App Updates](#phase-4-web-app-updates)
7. [Phase 5: Testing & Polish](#phase-5-testing--polish)
8. [Email Setup Guide](#email-setup-guide-gmail-smtp)
9. [Server Deployment Guide](#server-deployment-guide-exabytes)

---

## Pre-Implementation Setup

### Server Requirements
- [ ] Node.js 18+ installed on server
- [ ] PostgreSQL 14+ installed on server
- [ ] PM2 or similar process manager
- [ ] Nginx as reverse proxy
- [ ] SSL certificate (Let's Encrypt)
- [ ] Domain configured (e.g., `api.yourdomain.com`)

### Gmail SMTP Setup (for sending invitation emails)
- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Generate App Password for SMTP
- [ ] Note down credentials for `.env` file

### Local Development
- [ ] Clone repository
- [ ] Install Node.js 18+ locally
- [ ] Install PostgreSQL locally (or use Docker)

---

## Phase 0: Backend Setup

**Goal**: Create the foundational Node.js + PostgreSQL API

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Create `backend/` folder structure | ⬜ Pending | Express.js + TypeScript |
| 0.2 | Initialize npm project with dependencies | ⬜ Pending | express, pg, jsonwebtoken, bcrypt, nodemailer, cors, dotenv, uuid |
| 0.3 | Create TypeScript configuration | ⬜ Pending | tsconfig.json |
| 0.4 | Create database schema SQL file | ⬜ Pending | All tables with proper relationships |
| 0.5 | Setup PostgreSQL connection with pooling | ⬜ Pending | config/database.ts |
| 0.6 | Create error handling middleware | ⬜ Pending | middleware/errorHandler.ts |
| 0.7 | Create authentication middleware | ⬜ Pending | middleware/auth.ts (JWT verification) |
| 0.8 | Create base Express app | ⬜ Pending | src/app.ts |
| 0.9 | Create environment configuration | ⬜ Pending | .env.example with all required vars |
| 0.10 | Test database connection | ⬜ Pending | Health check endpoint |

### Files to Create:
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── email.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   └── index.ts
│   ├── services/
│   │   └── index.ts
│   ├── models/
│   │   └── index.ts
│   ├── utils/
│   │   └── index.ts
│   └── app.ts
├── migrations/
│   └── 001_initial_schema.sql
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Phase 1: Core API Endpoints

**Goal**: Implement all authentication, user, and group management endpoints

### 1.1 Authentication Endpoints

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 1.1.1 | `/auth/register` | POST | ⬜ Pending | Create new user account |
| 1.1.2 | `/auth/login` | POST | ⬜ Pending | Login, return access + refresh tokens |
| 1.1.3 | `/auth/refresh` | POST | ⬜ Pending | Refresh access token |
| 1.1.4 | `/auth/logout` | POST | ⬜ Pending | Invalidate refresh token |
| 1.1.5 | `/auth/forgot-password` | POST | ⬜ Pending | Send password reset email |
| 1.1.6 | `/auth/reset-password` | POST | ⬜ Pending | Reset password with token |

### 1.2 User Endpoints

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 1.2.1 | `/users/me` | GET | ⬜ Pending | Get current user profile |
| 1.2.2 | `/users/me` | PATCH | ⬜ Pending | Update user profile |
| 1.2.3 | `/users/me/settings` | GET | ⬜ Pending | Get user settings |
| 1.2.4 | `/users/me/settings` | PATCH | ⬜ Pending | Update user settings |
| 1.2.5 | `/users/me/avatar` | POST | ⬜ Pending | Upload avatar image |

### 1.3 Device Endpoints

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 1.3.1 | `/devices/register` | POST | ⬜ Pending | Register new device |
| 1.3.2 | `/devices` | GET | ⬜ Pending | List user's devices |
| 1.3.3 | `/devices/:id` | DELETE | ⬜ Pending | Remove device |

### 1.4 Group Endpoints

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 1.4.1 | `/groups` | POST | ⬜ Pending | Create new group |
| 1.4.2 | `/groups` | GET | ⬜ Pending | List user's groups |
| 1.4.3 | `/groups/:id` | GET | ⬜ Pending | Get group details |
| 1.4.4 | `/groups/:id` | PATCH | ⬜ Pending | Update group (name, description) |
| 1.4.5 | `/groups/:id` | DELETE | ⬜ Pending | Delete group (owner only) |
| 1.4.6 | `/groups/:id/members` | GET | ⬜ Pending | List group members |
| 1.4.7 | `/groups/:id/members/:userId` | DELETE | ⬜ Pending | Remove member from group |
| 1.4.8 | `/groups/:id/members/:userId` | PATCH | ⬜ Pending | Update member role |

### 1.5 Invitation Endpoints

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 1.5.1 | `/groups/:id/invite` | POST | ⬜ Pending | Send invitation (creates code + sends email) |
| 1.5.2 | `/invitations` | GET | ⬜ Pending | List pending invitations for user |
| 1.5.3 | `/invitations/join` | POST | ⬜ Pending | Join group via invite code |
| 1.5.4 | `/invitations/:id/accept` | POST | ⬜ Pending | Accept invitation |
| 1.5.5 | `/invitations/:id/decline` | POST | ⬜ Pending | Decline invitation |
| 1.5.6 | `/invitations/:code/verify` | GET | ⬜ Pending | Verify invite code is valid |

### 1.6 Universal Sync Endpoint

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 1.6.1 | `/sync` | POST | ⬜ Pending | Push local changes, pull server changes |

**Sync Payload Structure:**
```json
{
  "since": "2026-01-01T00:00:00Z",
  "device_id": "uuid",
  "payload": {
    "categories": [...],
    "locations": [...],
    "food_items": [...],
    "shopping_items": [...],
    "wish_items": [...],
    "user_settings": [...]
  }
}
```

---

## Phase 2: Food Waste Intelligence (Backend)

**Goal**: Track all food consumption/disposal events for analytics

### 2.1 Database Tables

| # | Task | Status | Description |
|---|------|--------|-------------|
| 2.1.1 | Create `food_item_events` table | ⬜ Pending | Track all consumption/disposal |
| 2.1.2 | Create `group_analytics` table | ⬜ Pending | Aggregated stats cache |
| 2.1.3 | Create analytics views | ⬜ Pending | Pre-computed queries |
| 2.1.4 | Create indexes for performance | ⬜ Pending | On frequently queried columns |

### 2.2 Food Item Event Endpoints

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 2.2.1 | `/food-items/:id/events` | POST | ⬜ Pending | Log consumption/disposal event |
| 2.2.2 | `/food-items/:id/events` | GET | ⬜ Pending | Get event history for item |

**Event Types:**
- `used_completely` - Item fully consumed
- `used_partially` - Part of item used
- `thrown_away` - Discarded (with reason)
- `gifted` - Given to someone else
- `expired_unused` - Expired without use

**Disposal Reasons (for thrown_away/expired_unused):**
- `expired` - Past expiry date
- `spoiled` - Went bad before expiry
- `too_much` - Bought too much
- `dislike` - Didn't like it
- `forgotten` - Forgot about it
- `other` - Other reason

### 2.3 Analytics Endpoints

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 2.3.1 | `/analytics/summary` | GET | ⬜ Pending | Overall waste summary |
| 2.3.2 | `/analytics/category-breakdown` | GET | ⬜ Pending | Waste by category |
| 2.3.3 | `/analytics/location-breakdown` | GET | ⬜ Pending | Waste by location |
| 2.3.4 | `/analytics/monthly-trends` | GET | ⬜ Pending | Month-over-month trends |
| 2.3.5 | `/analytics/most-wasted` | GET | ⬜ Pending | Most frequently wasted items |
| 2.3.6 | `/analytics/expiry-patterns` | GET | ⬜ Pending | Avg days before expiry when discarded |

**Analytics Response Example:**
```json
{
  "summary": {
    "total_items": 150,
    "items_used": 120,
    "items_wasted": 30,
    "waste_percentage": 20.0,
    "total_waste_value": 45.50,
    "avg_days_before_expiry": -2.5
  },
  "period": {
    "start": "2025-12-01",
    "end": "2026-01-08"
  }
}
```

### 2.4 Email Service

| # | Task | Status | Description |
|---|------|--------|-------------|
| 2.4.1 | Setup Gmail SMTP configuration | ⬜ Pending | Using App Password |
| 2.4.2 | Create email templates | ⬜ Pending | Invitation, password reset |
| 2.4.3 | Create `emailService.ts` | ⬜ Pending | Send emails via nodemailer |
| 2.4.4 | Test email delivery | ⬜ Pending | Verify emails are sent |

---

## Phase 3: Mobile App Updates

**Goal**: Replace Supabase with custom API, add Food Waste Intelligence

### 3.1 API Service Layer

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.1.1 | Create `services/ApiClient.ts` | ⬜ Pending | Base HTTP client with auth |
| 3.1.2 | Create `services/AuthService.ts` | ⬜ Pending | Login, register, refresh |
| 3.1.3 | Create `services/GroupService.ts` | ⬜ Pending | Group CRUD operations |
| 3.1.4 | Create `services/InvitationService.ts` | ⬜ Pending | Invite, join, accept |
| 3.1.5 | Create `services/SyncService.ts` | ⬜ Pending | Universal sync |
| 3.1.6 | Create `services/AnalyticsService.ts` | ⬜ Pending | Fetch analytics data |
| 3.1.7 | Create `services/FoodItemEventsService.ts` | ⬜ Pending | Log events |

### 3.2 Context Updates

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.2.1 | Update `ApiContext.tsx` | ⬜ Pending | Use new AuthService |
| 3.2.2 | Remove Supabase dependency | ⬜ Pending | Delete `lib/supabase.ts` |
| 3.2.3 | Update token storage | ⬜ Pending | Use SecureStore for tokens |

### 3.3 Authentication Screens

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.3.1 | Update `app/auth/login.tsx` | ⬜ Pending | Use new AuthService |
| 3.3.2 | Update `app/auth/signup.tsx` | ⬜ Pending | Use new AuthService |
| 3.3.3 | Create `app/auth/forgot-password.tsx` | ⬜ Pending | Password reset flow |

### 3.4 Food Waste Intelligence UI

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.4.1 | Create `DisposalReasonModal` component | ⬜ Pending | Reason picker (no notes) |
| 3.4.2 | Update `app/item/[id].tsx` | ⬜ Pending | Add "Use" and "Discard" buttons |
| 3.4.3 | Add price input (optional) | ⬜ Pending | Show only if setting enabled |
| 3.4.4 | Log events on item actions | ⬜ Pending | Call FoodItemEventsService |

### 3.5 Group Management

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.5.1 | Update `GroupManagementModal` in settings | ⬜ Pending | Use real API, not mock data |
| 3.5.2 | Implement `handleInviteUser` | ⬜ Pending | Call API to send invitation |
| 3.5.3 | Implement `handleRemoveMember` | ⬜ Pending | Call API to remove member |
| 3.5.4 | Create `app/groups/join.tsx` | ⬜ Pending | Enter invite code screen |
| 3.5.5 | Handle deep link for email invitations | ⬜ Pending | `expiryalert://join?code=XXX` |
| 3.5.6 | Show real group members | ⬜ Pending | Fetch from API |

### 3.6 Analytics Dashboard (Basic)

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.6.1 | Create analytics widget for dashboard | ⬜ Pending | Simple stats card |
| 3.6.2 | Show: waste %, items used, items wasted | ⬜ Pending | Last 30 days |
| 3.6.3 | Link to web for detailed analytics | ⬜ Pending | "View full analytics →" |

### 3.7 Settings Updates

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.7.1 | Add "Price Tracking" toggle | ⬜ Pending | Enable/disable price input |
| 3.7.2 | Save settings to server | ⬜ Pending | Sync via API |
| 3.7.3 | Update API URL configuration | ⬜ Pending | Point to new backend |

### 3.8 Sync Updates

| # | Task | Status | Description |
|---|------|--------|-------------|
| 3.8.1 | Update `SupabaseSyncService.ts` → `SyncService.ts` | ⬜ Pending | Use new API |
| 3.8.2 | Implement offline queue | ⬜ Pending | Queue events when offline |
| 3.8.3 | Auto-sync on reconnection | ⬜ Pending | Trigger sync when online |

---

## Phase 4: Web App Updates

**Goal**: Replace Firebase with custom API, add Groups support

### 4.1 API Service Layer

| # | Task | Status | Description |
|---|------|--------|-------------|
| 4.1.1 | Create `services/apiClient.ts` | ⬜ Pending | Base HTTP client |
| 4.1.2 | Create `services/authService.ts` | ⬜ Pending | Login, register, refresh |
| 4.1.3 | Create `services/groupService.ts` | ⬜ Pending | Group CRUD |
| 4.1.4 | Create `services/foodItemService.ts` | ⬜ Pending | Replace Firebase service |
| 4.1.5 | Create `services/analyticsService.ts` | ⬜ Pending | Fetch analytics |

### 4.2 Context Updates

| # | Task | Status | Description |
|---|------|--------|-------------|
| 4.2.1 | Update `AuthContext.tsx` | ⬜ Pending | Remove Firebase, use new API |
| 4.2.2 | Create `GroupContext.tsx` | ⬜ Pending | Manage current group state |
| 4.2.3 | Remove Firebase dependencies | ⬜ Pending | Delete firebase.ts |

### 4.3 Authentication

| # | Task | Status | Description |
|---|------|--------|-------------|
| 4.3.1 | Update `Login.tsx` | ⬜ Pending | Use new authService |
| 4.3.2 | Add password reset flow | ⬜ Pending | Forgot password page |
| 4.3.3 | Store tokens in httpOnly cookies | ⬜ Pending | Secure token storage |

### 4.4 Groups UI

| # | Task | Status | Description |
|---|------|--------|-------------|
| 4.4.1 | Create `components/Groups.tsx` | ⬜ Pending | List user's groups |
| 4.4.2 | Create `components/GroupManagement.tsx` | ⬜ Pending | Manage single group |
| 4.4.3 | Create `components/InviteMembers.tsx` | ⬜ Pending | Invite by email/show code |
| 4.4.4 | Create `components/JoinGroup.tsx` | ⬜ Pending | Enter invite code |
| 4.4.5 | Add group selector to header | ⬜ Pending | Switch between groups |
| 4.4.6 | Add routes for group pages | ⬜ Pending | /groups, /groups/:id, /join |

### 4.5 Analytics Enhancement

| # | Task | Status | Description |
|---|------|--------|-------------|
| 4.5.1 | Update `Analytics.tsx` | ⬜ Pending | Use new API endpoints |
| 4.5.2 | Add Food Waste Intelligence charts | ⬜ Pending | Detailed waste analysis |
| 4.5.3 | Add category breakdown chart | ⬜ Pending | Most wasted categories |
| 4.5.4 | Add monthly trends chart | ⬜ Pending | Waste over time |
| 4.5.5 | Add recommendations section | ⬜ Pending | Based on patterns |

### 4.6 Item Actions

| # | Task | Status | Description |
|---|------|--------|-------------|
| 4.6.1 | Update item detail page | ⬜ Pending | Add Use/Discard buttons |
| 4.6.2 | Create disposal reason modal | ⬜ Pending | Select reason |
| 4.6.3 | Log events to new API | ⬜ Pending | Track all actions |

### 4.7 Data Migration

| # | Task | Status | Description |
|---|------|--------|-------------|
| 4.7.1 | Update all service files | ⬜ Pending | Categories, Locations, Items |
| 4.7.2 | Remove Firebase imports | ⬜ Pending | Clean up dependencies |
| 4.7.3 | Update App.tsx routes | ⬜ Pending | Add new pages |

---

## Phase 5: Testing & Polish

| # | Task | Status | Description |
|---|------|--------|-------------|
| 5.1 | Test registration flow | ⬜ Pending | Both platforms |
| 5.2 | Test login flow | ⬜ Pending | Both platforms |
| 5.3 | Test token refresh | ⬜ Pending | Auto-refresh when expired |
| 5.4 | Test group creation | ⬜ Pending | Both platforms |
| 5.5 | Test email invitation | ⬜ Pending | Email received, link works |
| 5.6 | Test invite code | ⬜ Pending | Manual code entry works |
| 5.7 | Test member removal | ⬜ Pending | Member is removed |
| 5.8 | Test food item CRUD | ⬜ Pending | Both platforms |
| 5.9 | Test disposal flow | ⬜ Pending | Event is logged |
| 5.10 | Test analytics accuracy | ⬜ Pending | Numbers are correct |
| 5.11 | Test offline sync | ⬜ Pending | Mobile: offline → online |
| 5.12 | Test multi-device sync | ⬜ Pending | Changes appear on other device |
| 5.13 | Performance testing | ⬜ Pending | API response times |
| 5.14 | Security review | ⬜ Pending | Auth, SQL injection, etc. |

---

## Email Setup Guide (Gmail SMTP)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", enable **2-Step Verification**
3. Follow the prompts to set it up

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "Expiry Alert Server"
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
6. **Save this password** - you won't see it again!

### Step 3: Configure Environment Variables
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop  # App password (no spaces)
EMAIL_FROM="Expiry Alert <your-email@gmail.com>"
```

### Step 4: Test Email
After setting up the backend, test with:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### Troubleshooting
- **"Less secure app" error**: Make sure you're using App Password, not regular password
- **"Authentication failed"**: Check App Password is correct, no spaces
- **Emails going to spam**: Add SPF/DKIM records to your domain DNS

---

## Server Deployment Guide (Exabytes)

### Prerequisites on Server
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx
```

### Database Setup
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE expiry_alert;
CREATE USER expiry_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;
\q

# Run migrations
psql -U expiry_user -d expiry_alert -f migrations/001_initial_schema.sql
```

### Application Setup
```bash
# Clone and setup
cd /var/www
git clone <your-repo> expiry-alert-api
cd expiry-alert-api/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env  # Edit with your values

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/app.js --name "expiry-alert-api"
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
```

### Image Upload Directory
```bash
# Create uploads directory
sudo mkdir -p /var/www/expiry-alert-api/uploads
sudo chown -R www-data:www-data /var/www/expiry-alert-api/uploads

# Add to Nginx for serving static files
# In the server block, add:
location /uploads {
    alias /var/www/expiry-alert-api/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## Environment Variables Template

```env
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://expiry_user:your-password@localhost:5432/expiry_alert

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Expiry Alert <your-email@gmail.com>"

# App URLs (for email links)
WEB_APP_URL=https://yourdomain.com
MOBILE_DEEP_LINK_SCHEME=expiryalert

# Image Upload
UPLOAD_DIR=/var/www/expiry-alert-api/uploads
MAX_FILE_SIZE=5242880  # 5MB
```

---

## Database Schema Overview

### Core Tables
| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `devices` | Registered devices per user |
| `user_settings` | User preferences (price tracking, etc.) |
| `groups` | Family/shared groups |
| `group_memberships` | User-group relationships |
| `invitations` | Pending group invitations |

### Data Tables
| Table | Description |
|-------|-------------|
| `categories` | Food categories |
| `locations` | Storage locations |
| `food_items` | Food items with expiry |
| `food_item_events` | Consumption/disposal tracking |
| `shopping_items` | Shopping list |
| `wish_items` | Wish list |

### Analytics Tables
| Table | Description |
|-------|-------------|
| `group_analytics` | Aggregated daily stats per group |

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 0: Backend Setup | 4-6 hours | None |
| Phase 1: Core API | 6-8 hours | Phase 0 |
| Phase 2: Food Waste Intelligence | 3-4 hours | Phase 1 |
| Phase 3: Mobile Updates | 6-8 hours | Phase 2 |
| Phase 4: Web Updates | 6-8 hours | Phase 2 |
| Phase 5: Testing | 2-3 hours | Phase 3, 4 |
| **Total** | **~27-37 hours** | |

---

## Notes & Decisions

- **Database**: PostgreSQL (better JSON, date handling, UUID support)
- **Hosting**: Exabytes (own server)
- **Email**: Gmail SMTP with App Password
- **Image Storage**: Local server (`/uploads` directory)
- **Price Tracking**: Optional, controlled by user setting
- **Disposal Notes**: Not included (user request)
- **Analytics**: Basic on mobile, detailed on web
- **Invitations**: Both email link AND invite code supported

---

*Last Updated: January 8, 2026*

