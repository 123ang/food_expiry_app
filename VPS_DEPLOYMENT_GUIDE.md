# 🚀 VPS Deployment Guide - expiry-alert.link

Complete step-by-step guide to deploy your Expiry Alert application to a VPS.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Domain Configuration](#domain-configuration)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Web App Deployment](#web-app-deployment)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL Certificate Setup](#ssl-certificate-setup)
9. [Process Management (PM2)](#process-management-pm2)
10. [Environment Variables](#environment-variables)
11. [Testing & Verification](#testing--verification)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- VPS with Ubuntu 20.04+ (or similar Linux distribution)
- Root or sudo access to the server
- Domain `expiry-alert.link` pointing to your VPS IP
- SSH access to your server
- Git installed on your local machine

---

## Server Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### Step 2: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 3: Install Node.js 18+

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x or higher
npm --version
```

### Step 4: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

### Step 5: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
```

### Step 6: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (usually something like: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-username --hp /home/your-username)
```

### Step 7: Install Certbot (for SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## Domain Configuration

### DNS Records Setup

Before proceeding, configure your DNS records at your domain registrar:

1. **A Record**: Point `expiry-alert.link` to your VPS IP address
   ```
   Type: A
   Name: @
   Value: YOUR_VPS_IP_ADDRESS
   TTL: 3600
   ```

2. **A Record**: Point `api.expiry-alert.link` to your VPS IP address
   ```
   Type: A
   Name: api
   Value: YOUR_VPS_IP_ADDRESS
   TTL: 3600
   ```

3. **A Record** (Optional): Point `www.expiry-alert.link` to your VPS IP
   ```
   Type: A
   Name: www
   Value: YOUR_VPS_IP_ADDRESS
   TTL: 3600
   ```

**Wait 5-15 minutes** for DNS propagation before proceeding.

### Verify DNS

```bash
# Check if DNS is resolving
nslookup expiry-alert.link
nslookup api.expiry-alert.link
```

---

## Database Setup

### Step 1: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run:
CREATE DATABASE expiry_alert;
CREATE USER expiry_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;
ALTER DATABASE expiry_alert OWNER TO expiry_user;

# Exit PostgreSQL
\q
```

**⚠️ Important**: Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password. Save it securely!

### Step 2: Run Database Migrations

```bash
# Navigate to projects directory
cd /root/projects

# Clone your repository (if not already cloned)
# If using Git:
git clone YOUR_REPOSITORY_URL .
# OR if already cloned, just navigate:
cd /root/projects

# Navigate to backend
cd backend

# Run migrations (as postgres user, which has full access)
sudo -u postgres psql -d expiry_alert -f migrations/001_initial_schema.sql

# Alternative: If you need to use expiry_user, use password authentication:
# psql -U expiry_user -d expiry_alert -h localhost -f migrations/001_initial_schema.sql
# (It will prompt for password)
```

---

## Backend Deployment

### Step 1: Prepare Backend Directory

```bash
# Navigate to project directory
cd /root/projects/backend

# Install dependencies
npm install

# Create uploads directory
mkdir -p uploads
sudo chown -R $USER:$USER uploads
```

### Step 2: Create Environment File

```bash
# Create .env file
nano .env
```

**First, generate JWT secrets (run these commands in terminal):**

```bash
# Generate access token secret
openssl rand -base64 64

# Generate refresh token secret (run again)
openssl rand -base64 64
```

**Copy the output from each command, then paste the following configuration (update with your values):**

```env
# Server
NODE_ENV=production
PORT=3006
API_URL=https://api.expiry-alert.link

# Database
DATABASE_URL=postgresql://expiry_user:YOUR_DB_PASSWORD@localhost:5432/expiry_alert

# JWT Secrets (paste the generated secrets here)
JWT_ACCESS_SECRET=paste_first_generated_secret_here
JWT_REFRESH_SECRET=paste_second_generated_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="Expiry Alert <your-email@gmail.com>"

# App URLs
WEB_APP_URL=https://expiry-alert.link
MOBILE_DEEP_LINK_SCHEME=expiryalert

# Image Upload
UPLOAD_DIR=/root/projects/backend/uploads
MAX_FILE_SIZE=5242880
```

**Save and exit** (Ctrl+X, then Y, then Enter)

**Note:** Make sure to replace `paste_first_generated_secret_here` and `paste_second_generated_secret_here` with the actual secrets you generated above.

### Step 3: Build and Start Backend

```bash
# Build TypeScript
npm run build

# Test if it runs
npm start
# Press Ctrl+C to stop

# Start with PM2
pm2 start dist/app.js --name "expiry-alert-api"

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs expiry-alert-api
```

---

## Web App Deployment

### Step 1: Build React App

On your **local machine**, update the API URL in your web app configuration, then build:

```bash
# Navigate to web app directory
cd web-app/expiry-alert

# Update API URL in your code (check src/services/apiClient.ts or similar)
# Set API_URL to: https://api.expiry-alert.link

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates a `build/` directory with production-ready files.

### Step 2: Upload Build to Server

**Option A: Using SCP (from local machine)**

```bash
# From your local machine
scp -r web-app/expiry-alert/build/* root@YOUR_VPS_IP:/root/projects/web-app/expiry-alert/build/
```

**Option B: Using Git (on server)**

```bash
# On server, if you cloned the repo
cd /root/projects/web-app/expiry-alert

# Install dependencies
npm install

# Build on server
npm run build
```

### Step 3: Set Permissions

```bash
# Set proper permissions
sudo chown -R www-data:www-data /root/projects/web-app/expiry-alert/build
sudo chmod -R 755 /root/projects/web-app/expiry-alert/build
```

---

## Nginx Configuration

### Step 1: Configure API Subdomain

```bash
# Create Nginx config for API
sudo nano /etc/nginx/sites-available/api.expiry-alert.link
```

Paste the following:

```nginx
server {
    listen 80;
    server_name api.expiry-alert.link;

    # Increase body size for image uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve uploaded images
    location /uploads {
        alias /root/projects/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Save and exit.

### Step 2: Configure Main Domain (Web App)

```bash
# Create Nginx config for main domain
sudo nano /etc/nginx/sites-available/expiry-alert.link
```

Paste the following:

```nginx
server {
    listen 80;
    server_name expiry-alert.link www.expiry-alert.link;

    root /root/projects/web-app/expiry-alert/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save and exit.

### Step 3: Enable Sites

```bash
# Enable API site
sudo ln -s /etc/nginx/sites-available/api.expiry-alert.link /etc/nginx/sites-enabled/

# Enable main site
sudo ln -s /etc/nginx/sites-available/expiry-alert.link /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### Step 1: Obtain SSL Certificates

```bash
# Get SSL certificate for both domains
sudo certbot --nginx -d expiry-alert.link -d www.expiry-alert.link -d api.expiry-alert.link

# Follow the prompts:
# - Enter your email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

Certbot will automatically:
- Obtain certificates
- Update Nginx configurations
- Set up auto-renewal

### Step 2: Verify Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run
```

### Step 3: Update Backend CORS (if needed)

After SSL is set up, make sure your backend `.env` has:

```env
WEB_APP_URL=https://expiry-alert.link
API_URL=https://api.expiry-alert.link
```

And update CORS in `backend/src/app.ts` to include your production domain.

---

## Process Management (PM2)

### Useful PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs expiry-alert-api

# Restart application
pm2 restart expiry-alert-api

# Stop application
pm2 stop expiry-alert-api

# Delete application from PM2
pm2 delete expiry-alert-api

# Monitor resources
pm2 monit

# Save current process list
pm2 save
```

### Auto-Restart on Server Reboot

PM2 should already be configured, but verify:

```bash
# Check startup script
pm2 startup

# If needed, run the command it outputs
```

---

## Environment Variables

### Backend Environment Variables Summary

Make sure your `/root/projects/backend/.env` includes:

```env
NODE_ENV=production
PORT=3006
API_URL=https://api.expiry-alert.link
DATABASE_URL=postgresql://expiry_user:PASSWORD@localhost:5432/expiry_alert
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
SMTP_USER=...
SMTP_PASS=...
WEB_APP_URL=https://expiry-alert.link
UPLOAD_DIR=/root/projects/backend/uploads
```

### Update Web App API URL

Before building the web app, ensure it points to:

```
https://api.expiry-alert.link
```

Check files like:
- `web-app/expiry-alert/src/services/apiClient.ts`
- `web-app/expiry-alert/src/config.ts`
- Or any environment variable files

---

## Testing & Verification

### Step 1: Test Backend API

```bash
# Test health endpoint
curl https://api.expiry-alert.link/health

# Or test locally on server
curl http://localhost:3006/health
```

### Step 2: Test Web App

1. Open browser: `https://expiry-alert.link`
2. Check browser console for errors
3. Test login/registration
4. Verify API calls are going to `api.expiry-alert.link`

### Step 3: Test Image Uploads

1. Upload an image through the app
2. Verify it's accessible at: `https://api.expiry-alert.link/uploads/filename.jpg`

### Step 4: Check Logs

```bash
# Backend logs
pm2 logs expiry-alert-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs expiry-alert-api --lines 50

# Check if port is in use
sudo netstat -tulpn | grep 3006

# Verify .env file exists and has correct values
cat /root/projects/backend/.env

# Test database connection
psql -U expiry_user -d expiry_alert -h localhost
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs expiry-alert-api

# Verify backend is listening on port 3006
curl http://localhost:3006/health
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually if needed
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### Database Connection Errors

```bash
# Test PostgreSQL connection
sudo -u postgres psql -d expiry_alert

# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database user permissions
sudo -u postgres psql -c "\du"
```

### Permission Issues

```bash
# Fix uploads directory permissions
sudo chown -R $USER:$USER /root/projects/backend/uploads
sudo chmod -R 755 /root/projects/backend/uploads

# Fix web app permissions
sudo chown -R www-data:www-data /root/projects/web-app/expiry-alert/build
sudo chmod -R 755 /root/projects/web-app/expiry-alert/build
```

### DNS Not Resolving

```bash
# Check DNS propagation
nslookup expiry-alert.link
nslookup api.expiry-alert.link

# Flush DNS cache (on local machine)
# Windows: ipconfig /flushdns
# Linux/Mac: sudo systemd-resolve --flush-caches
```

---

## Maintenance

### Updating the Application

```bash
# 1. Pull latest changes (if using Git)
cd /root/projects
git pull

# 2. Update backend
cd backend
npm install
npm run build
pm2 restart expiry-alert-api

# 3. Update web app
cd ../web-app/expiry-alert
npm install
npm run build
# Files are already in the correct location

# 4. Check logs
pm2 logs expiry-alert-api
```

### Backup Database

```bash
# Create backup
sudo -u postgres pg_dump expiry_alert > /var/backups/expiry_alert_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql expiry_alert < /var/backups/expiry_alert_YYYYMMDD.sql
```

### Monitor Server Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# PM2 monitoring
pm2 monit
```

---

## Security Checklist

- [ ] Firewall configured (UFW recommended)
- [ ] SSH key authentication enabled
- [ ] Strong database passwords
- [ ] JWT secrets are secure (64+ characters)
- [ ] Gmail App Password for SMTP (not regular password)
- [ ] SSL certificates installed and auto-renewing
- [ ] Nginx security headers configured
- [ ] File upload size limits set
- [ ] Regular backups scheduled
- [ ] PM2 process manager running
- [ ] Non-root user for application (recommended)

### Setup Firewall (UFW)

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Quick Reference

### Important Paths

- Backend: `/root/projects/backend`
- Web App: `/root/projects/web-app/expiry-alert/build`
- Uploads: `/root/projects/backend/uploads`
- Nginx Configs: `/etc/nginx/sites-available/`
- PM2 Config: `~/.pm2/`

### Important URLs

- Web App: `https://expiry-alert.link`
- API: `https://api.expiry-alert.link`
- API Health: `https://api.expiry-alert.link/health`

### Useful Commands

```bash
# Restart everything
pm2 restart expiry-alert-api && sudo systemctl reload nginx

# View all logs
pm2 logs && sudo tail -f /var/log/nginx/error.log

# Check services
pm2 status && sudo systemctl status nginx && sudo systemctl status postgresql
```

---

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs expiry-alert-api`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all services are running
4. Check environment variables
5. Verify DNS is resolving correctly

---

**Last Updated**: January 2026  
**Domain**: expiry-alert.link
