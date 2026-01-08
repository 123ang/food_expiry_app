# 🚀 Quick Start Deployment - expiry-alert.link

**TL;DR**: Follow these essential steps to deploy your app to VPS.

---

## 1. DNS Setup (Do This First!)

At your domain registrar, add these A records:

```
expiry-alert.link        → YOUR_VPS_IP
api.expiry-alert.link    → YOUR_VPS_IP
www.expiry-alert.link    → YOUR_VPS_IP (optional)
```

**Wait 10-15 minutes** for DNS to propagate.

---

## 2. Server Setup (One-Time)

```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Install everything
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib nginx
sudo npm install -g pm2
sudo apt install -y certbot python3-certbot-nginx

# Setup PM2 startup
pm2 startup
# Follow the command it outputs
```

---

## 3. Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE expiry_alert;
CREATE USER expiry_user WITH ENCRYPTED PASSWORD '5792_Ang';
GRANT ALL PRIVILEGES ON DATABASE expiry_alert TO expiry_user;
\q

# Run migrations
cd /root/projects/backend
sudo -u postgres psql -U expiry_user -d expiry_alert -f migrations/001_initial_schema.sql
```

---

## 4. Backend Deployment

```bash
# Navigate to projects directory (or clone if not already done)
cd /root/projects

# If not already cloned, clone your repository:
# git clone YOUR_REPO_URL .

# Setup backend
cd backend
npm install
mkdir -p uploads
nano .env  # Create .env file (see below)

# Build and start
npm run build
pm2 start dist/app.js --name "expiry-alert-api"
pm2 save
```

### Backend .env Template

```env
NODE_ENV=production
PORT=3000
API_URL=https://api.expiry-alert.link
DATABASE_URL=postgresql://expiry_user:YOUR_PASSWORD@localhost:5432/expiry_alert
JWT_ACCESS_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="Expiry Alert <your-email@gmail.com>"
WEB_APP_URL=https://expiry-alert.link
MOBILE_DEEP_LINK_SCHEME=expiryalert
UPLOAD_DIR=/root/projects/backend/uploads
MAX_FILE_SIZE=5242880
```

---

## 5. Web App Deployment

### On Your Local Machine:

```bash
cd web-app/expiry-alert
npm install
npm run build
```

### Upload to Server:

```bash
# From local machine
scp -r build/* root@YOUR_VPS_IP:/root/projects/web-app/expiry-alert/build/
```

### On Server:

```bash
sudo chown -R www-data:www-data /root/projects/web-app/expiry-alert/build
```

---

## 6. Nginx Configuration

### API Config (`/etc/nginx/sites-available/api.expiry-alert.link`):

```nginx
server {
    listen 80;
    server_name api.expiry-alert.link;
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /root/projects/backend/uploads;
        expires 30d;
    }
}
```

### Web App Config (`/etc/nginx/sites-available/expiry-alert.link`):

```nginx
server {
    listen 80;
    server_name expiry-alert.link www.expiry-alert.link;
    root /root/projects/web-app/expiry-alert/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Sites:

```bash
sudo ln -s /etc/nginx/sites-available/api.expiry-alert.link /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/expiry-alert.link /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL Certificate

```bash
sudo certbot --nginx -d expiry-alert.link -d www.expiry-alert.link -d api.expiry-alert.link
```

Follow prompts. Certbot will automatically configure HTTPS.

---

## 8. Verify Everything

```bash
# Check backend
curl https://api.expiry-alert.link/health
pm2 status
pm2 logs expiry-alert-api

# Check web app
# Open: https://expiry-alert.link in browser
```

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | `pm2 restart expiry-alert-api` |
| DNS not resolving | Wait longer, check with `nslookup expiry-alert.link` |
| Permission denied | `sudo chown -R www-data:www-data /root/projects/web-app/expiry-alert/build` |
| Database error | Check `.env` DATABASE_URL is correct |
| SSL error | `sudo certbot certificates` to check status |

---

## Update Your App

```bash
cd /root/projects
git pull
cd backend && npm install && npm run build && pm2 restart expiry-alert-api
cd ../web-app/expiry-alert && npm install && npm run build
```

---

## Need More Details?

See the full guide: **`VPS_DEPLOYMENT_GUIDE.md`**

---

**Domain**: expiry-alert.link  
**API**: https://api.expiry-alert.link  
**Web**: https://expiry-alert.link
