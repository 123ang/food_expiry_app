# ✅ VPS Deployment Checklist - expiry-alert.link

Quick checklist to ensure everything is configured correctly before and after deployment.

---

## Pre-Deployment Checklist

### Domain & DNS
- [ ] Domain `expiry-alert.link` registered
- [ ] A record for `expiry-alert.link` → VPS IP
- [ ] A record for `api.expiry-alert.link` → VPS IP
- [ ] A record for `www.expiry-alert.link` → VPS IP (optional)
- [ ] DNS propagation verified (wait 5-15 minutes)

### Server Prerequisites
- [ ] VPS with Ubuntu 20.04+ or similar
- [ ] SSH access configured
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] Certbot installed

### Code Preparation
- [ ] Backend code ready
- [ ] Web app API URL updated to `https://api.expiry-alert.link`
- [ ] Web app built for production (`npm run build`)
- [ ] All environment variables documented

### Credentials Prepared
- [ ] Database password generated
- [ ] JWT access secret generated (`openssl rand -base64 64`)
- [ ] JWT refresh secret generated (`openssl rand -base64 64`)
- [ ] Gmail App Password generated (if using Gmail SMTP)
- [ ] All credentials saved securely

---

## Deployment Steps Checklist

### Server Setup
- [ ] System packages updated
- [ ] Node.js installed and verified
- [ ] PostgreSQL installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed and startup configured
- [ ] Certbot installed

### Database Setup
- [ ] Database `expiry_alert` created
- [ ] User `expiry_user` created with password
- [ ] Permissions granted
- [ ] Migrations run successfully
- [ ] Database connection tested

### Backend Deployment
- [ ] Project cloned/uploaded to `/var/www/expiry-alert`
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file created with all variables
- [ ] `uploads/` directory created with permissions
- [ ] TypeScript compiled (`npm run build`)
- [ ] Backend started with PM2
- [ ] PM2 process saved
- [ ] Backend logs checked (no errors)

### Web App Deployment
- [ ] API URL updated in `src/services/apiClient.ts`
- [ ] Web app dependencies installed
- [ ] Production build created (`npm run build`)
- [ ] Build files uploaded to `/var/www/expiry-alert/web-app/build`
- [ ] Permissions set correctly (`www-data:www-data`)

### Nginx Configuration
- [ ] API config created (`/etc/nginx/sites-available/api.expiry-alert.link`)
- [ ] Web app config created (`/etc/nginx/sites-available/expiry-alert.link`)
- [ ] Sites enabled (symlinks created)
- [ ] Default site removed (optional)
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx reloaded

### SSL Setup
- [ ] SSL certificates obtained for all domains
- [ ] HTTP to HTTPS redirect configured
- [ ] Auto-renewal tested (`certbot renew --dry-run`)
- [ ] Certificates verified in browser

### Environment Variables
- [ ] Backend `.env` configured with:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `API_URL=https://api.expiry-alert.link`
  - [ ] `DATABASE_URL` with correct credentials
  - [ ] `JWT_ACCESS_SECRET` (64+ characters)
  - [ ] `JWT_REFRESH_SECRET` (64+ characters)
  - [ ] `SMTP_USER` and `SMTP_PASS` (Gmail App Password)
  - [ ] `WEB_APP_URL=https://expiry-alert.link`
  - [ ] `UPLOAD_DIR` path correct

---

## Post-Deployment Verification

### Backend API
- [ ] `https://api.expiry-alert.link/health` returns success
- [ ] API responds to requests
- [ ] CORS headers correct
- [ ] Image uploads work (`/uploads` accessible)
- [ ] PM2 process running (`pm2 status`)
- [ ] No errors in PM2 logs

### Web App
- [ ] `https://expiry-alert.link` loads correctly
- [ ] No console errors in browser
- [ ] API calls go to `api.expiry-alert.link`
- [ ] Login/registration works
- [ ] Static assets load (CSS, JS, images)
- [ ] React Router works (page navigation)

### SSL & Security
- [ ] HTTPS working on both domains
- [ ] SSL certificate valid (green lock in browser)
- [ ] HTTP redirects to HTTPS
- [ ] Security headers present (check browser DevTools)

### Database
- [ ] Database connection successful
- [ ] Tables created (verify with `psql`)
- [ ] User registration creates database records
- [ ] Data persists correctly

### Email (if configured)
- [ ] SMTP credentials correct
- [ ] Test email sent successfully
- [ ] Invitation emails work (if implemented)

---

## Testing Checklist

### Functional Testing
- [ ] User registration
- [ ] User login
- [ ] Token refresh
- [ ] Food item creation
- [ ] Food item update
- [ ] Food item deletion
- [ ] Image upload
- [ ] Image display
- [ ] Group creation (if implemented)
- [ ] Group invitation (if implemented)
- [ ] Analytics (if implemented)

### Performance Testing
- [ ] API response times acceptable (< 500ms)
- [ ] Page load times acceptable (< 3s)
- [ ] Image uploads work (< 10MB)
- [ ] No memory leaks (check PM2 monit)

### Security Testing
- [ ] Unauthorized API access blocked
- [ ] SQL injection protection (test with malicious input)
- [ ] XSS protection (test with script tags)
- [ ] CORS configured correctly
- [ ] File upload restrictions work

---

## Maintenance Checklist

### Regular Tasks
- [ ] Monitor PM2 logs weekly
- [ ] Check disk space monthly
- [ ] Review Nginx error logs monthly
- [ ] Backup database weekly
- [ ] Update dependencies quarterly
- [ ] Review SSL certificate expiration (auto-renewal should handle)

### Update Procedure
- [ ] Pull latest code
- [ ] Update backend dependencies (`npm install`)
- [ ] Rebuild backend (`npm run build`)
- [ ] Restart PM2 process (`pm2 restart expiry-alert-api`)
- [ ] Rebuild web app (`npm run build`)
- [ ] Verify everything works
- [ ] Check logs for errors

---

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Backend not starting | Check PM2 logs: `pm2 logs expiry-alert-api` |
| 502 Bad Gateway | Verify backend running: `pm2 status` |
| SSL errors | Check cert: `sudo certbot certificates` |
| Database errors | Test connection: `psql -U expiry_user -d expiry_alert` |
| Permission errors | Fix ownership: `sudo chown -R www-data:www-data /var/www/expiry-alert` |
| DNS not resolving | Wait for propagation, check: `nslookup expiry-alert.link` |

---

## Important Files & Paths

```
Backend:
  Location: /var/www/expiry-alert/backend
  Config: /var/www/expiry-alert/backend/.env
  Logs: pm2 logs expiry-alert-api
  Uploads: /var/www/expiry-alert/backend/uploads

Web App:
  Location: /var/www/expiry-alert/web-app/build
  Source: /var/www/expiry-alert/web-app/expiry-alert

Nginx:
  Configs: /etc/nginx/sites-available/
  Logs: /var/log/nginx/

Database:
  Name: expiry_alert
  User: expiry_user
  Location: /var/lib/postgresql/
```

---

## Support Contacts

- **Server Provider**: [Your VPS provider support]
- **Domain Registrar**: [Your domain registrar support]
- **Documentation**: See `VPS_DEPLOYMENT_GUIDE.md` for detailed steps

---

**Last Updated**: January 2026  
**Domain**: expiry-alert.link
