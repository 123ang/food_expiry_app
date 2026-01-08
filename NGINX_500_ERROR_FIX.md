# Fixing Nginx 500 Internal Server Error

## Quick Diagnosis

Run these commands on your VPS to diagnose the issue:

```bash
# 1. Check if web app build files exist
ls -la /root/projects/web-app/expiry-alert/build/

# 2. Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log

# 3. Check if you're accessing via HTTPS but only HTTP is configured
sudo cat /etc/nginx/sites-available/expiry-alert.link | grep listen
```

## Common Issues & Fixes

### Issue 1: Accessing HTTPS but Only HTTP Configured

**Symptom:** You access `https://expiry-alert.link` but Nginx only has `listen 80` (HTTP)

**Solution:** Set up SSL certificate:

```bash
# Install SSL certificate (if not done yet)
sudo certbot --nginx -d expiry-alert.link -d www.expiry-alert.link -d api.expiry-alert.link

# This will automatically:
# - Get SSL certificates
# - Update nginx configs to listen on port 443 (HTTPS)
# - Set up HTTP to HTTPS redirect
```

### Issue 2: Web App Build Files Missing

**Symptom:** Build directory doesn't exist or is empty

**Solution:** Build and deploy the web app:

```bash
# On your VPS
cd /root/projects/web-app/expiry-alert

# Install dependencies (if needed)
npm install

# Build the app
npm run build

# Verify build files exist
ls -la build/

# Set permissions
sudo chown -R www-data:www-data /root/projects/web-app/expiry-alert/build
sudo chmod -R 755 /root/projects/web-app/expiry-alert/build
```

### Issue 3: Permission Issues

**Symptom:** Nginx can't read the files (check error logs)

**Solution:** Fix permissions:

```bash
# Fix ownership
sudo chown -R www-data:www-data /root/projects/web-app/expiry-alert/build
sudo chmod -R 755 /root/projects/web-app/expiry-alert/build

# Reload Nginx
sudo systemctl reload nginx
```

### Issue 4: Wrong Path in Nginx Config

**Symptom:** Nginx looking in wrong directory

**Solution:** Verify and update Nginx config:

```bash
# Check current config
sudo cat /etc/nginx/sites-available/expiry-alert.link | grep root

# Should show:
# root /root/projects/web-app/expiry-alert/build;

# If wrong, edit it:
sudo nano /etc/nginx/sites-available/expiry-alert.link

# Then test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Step-by-Step Fix

### Step 1: Check What's Wrong

```bash
# Check Nginx error log (most important!)
sudo tail -30 /var/log/nginx/error.log
```

This will tell you exactly what's wrong.

### Step 2: Verify Build Files Exist

```bash
ls -la /root/projects/web-app/expiry-alert/build/index.html
```

If this file doesn't exist, you need to build the web app.

### Step 3: Check Nginx Config

```bash
# Test Nginx configuration
sudo nginx -t

# If errors, fix them
# If OK, reload
sudo systemctl reload nginx
```

### Step 4: Set Up SSL (If Accessing via HTTPS)

```bash
# If you're accessing https://expiry-alert.link but getting errors
sudo certbot --nginx -d expiry-alert.link -d www.expiry-alert.link -d api.expiry-alert.link
```

## Quick Fix Commands

```bash
# 1. Build web app (if not built)
cd /root/projects/web-app/expiry-alert
npm install
npm run build

# 2. Fix permissions
sudo chown -R www-data:www-data /root/projects/web-app/expiry-alert/build
sudo chmod -R 755 /root/projects/web-app/expiry-alert/build

# 3. Check Nginx config
sudo nginx -t

# 4. Reload Nginx
sudo systemctl reload nginx

# 5. Check error logs
sudo tail -f /var/log/nginx/error.log
```

## Most Likely Issue

Based on your screenshot showing HTTPS, you're probably accessing `https://expiry-alert.link` but:
1. SSL certificate is not set up yet, OR
2. Nginx config only has HTTP (port 80) configured

**Quick fix:**
```bash
sudo certbot --nginx -d expiry-alert.link -d www.expiry-alert.link -d api.expiry-alert.link
```

This will automatically configure HTTPS for you.
