# 🍎 Expiry Alert - Backend API

Backend API for Expiry Alert food waste intelligence and universal sync system.

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (access + refresh tokens)
- **Email**: Nodemailer (Gmail SMTP)
- **Image Storage**: Local filesystem

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database & email configuration
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # TypeScript interfaces
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── app.ts           # Main application
├── migrations/          # Database migrations
├── uploads/             # Uploaded images
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Gmail account with App Password (for email)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
# Database
DATABASE_URL=postgresql://expiry_user:your-password@localhost:5432/expiry_alert

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Gmail SMTP
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### 3. Setup Database

```bash
# Create database
createdb expiry_alert

# Run migrations
psql -U postgres -d expiry_alert -f migrations/001_initial_schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| PATCH | `/api/users/me` | Update user profile |
| GET | `/api/users/me/settings` | Get user settings |
| PATCH | `/api/users/me/settings` | Update settings |

### Groups (Coming Soon)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create group |
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups/:id/invite` | Invite member |
| POST | `/api/invitations/join` | Join with code |

### Sync (Coming Soon)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync` | Universal sync |

### Analytics (Coming Soon)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Waste summary |
| GET | `/api/analytics/category-breakdown` | By category |
| GET | `/api/analytics/monthly-trends` | Monthly trends |

## 🔐 Authentication Flow

1. **Register/Login** → Receive access token (15min) + refresh token (30 days)
2. **API Requests** → Include `Authorization: Bearer <access_token>`
3. **Token Expired** → Call `/api/auth/refresh` with refresh token
4. **Logout** → Call `/api/auth/logout` to invalidate refresh token

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication on Gmail
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate password for "Mail" → "Other (Expiry Alert)"
4. Copy 16-character password to `.env` as `SMTP_PASS`

## 🗄️ Database Schema

See `migrations/001_initial_schema.sql` for complete schema.

### Key Tables

- `users` - User accounts
- `devices` - Registered devices (for refresh tokens)
- `groups` - Family/shared groups
- `group_memberships` - User-group relationships
- `invitations` - Group invitations
- `food_items` - Food items with expiry
- `food_item_events` - Consumption/disposal tracking
- `categories` - Food categories
- `locations` - Storage locations

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Using PM2 (Recommended)

```bash
pm2 start dist/app.js --name "expiry-alert-api"
pm2 save
pm2 startup
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

### Code Structure

- **Routes** (`src/routes/`) - Define API endpoints
- **Services** (`src/services/`) - Business logic
- **Middleware** (`src/middleware/`) - Auth, validation, errors
- **Models** (`src/models/`) - TypeScript types
- **Config** (`src/config/`) - Database & email setup

## 📝 License

Private - All rights reserved

## 👥 Support

For issues or questions, contact the development team.

