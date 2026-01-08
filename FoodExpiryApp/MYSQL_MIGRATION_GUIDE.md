# MySQL Migration Guide

This guide explains how to migrate from Supabase to MySQL/PHP using XAMPP for local development.

## Overview

The migration process involves:

1. Setting up a local MySQL database using XAMPP
2. Using a simple PHP API for backend operations
3. Replacing SupabaseContext with ApiContext in the React Native app
4. Maintaining offline functionality with local SQLite

## Setup Instructions

### 1. XAMPP Setup

1. Download and install XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Start Apache and MySQL services
3. Copy the `php_api` folder to your XAMPP `htdocs` directory (e.g., `C:\xampp\htdocs\php_api`)
4. Open phpMyAdmin (http://localhost/phpmyadmin)
5. Create a new database named `foodexpiry`
6. Import the `php_api/mysql_setup.sql` file to create tables and initial data

### 2. API Configuration

1. Edit `php_api/config.php` to set your database credentials (default is username: 'root', password: '')
2. Test the API by visiting http://localhost/php_api/
3. You should see a JSON response indicating the API is running

### 3. App Configuration

1. Update `context/ApiContext.tsx` to point to your XAMPP server:
   ```typescript
   const API_BASE_URL = 'http://localhost/php_api';
   ```
   
   If testing on a physical device, use your computer's local IP address:
   ```typescript
   const API_BASE_URL = 'http://192.168.1.x/php_api';
   ```

2. Make sure the app is using ApiContext instead of SupabaseContext:
   - `app/_layout.tsx` should use `<ApiProvider>` instead of `<SupabaseProvider>`
   - Components should import from `useApi` instead of `useSupabase`

## Migration to Production

Once you've tested everything locally, you can migrate to a production environment:

1. Set up a web hosting account with PHP and MySQL support
2. Create a MySQL database on your hosting
3. Upload the PHP files to your hosting
4. Update the `API_BASE_URL` in ApiContext.tsx to point to your production server
5. Deploy your updated app

## Data Structure

The MySQL database structure mirrors the SQLite structure:

- `users`: User accounts and authentication
- `groups`: User groups for organizing items
- `group_memberships`: Relationships between users and groups
- `food_items`: Food items with expiry dates
- `categories`: Food categories
- `locations`: Storage locations
- `shopping_items`: Shopping list items
- `wish_items`: Wish list items

## API Endpoints

The PHP API provides these endpoints:

- `users.php`: User authentication and management
- `groups.php`: Group management
- `food_items.php`: Food item CRUD operations
- `sync.php`: Data synchronization between app and server

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, make sure your PHP API has the correct headers (already included in `config.php`)
- **Network Errors**: When testing on a physical device, ensure it's on the same network as your XAMPP server
- **Database Connection**: Verify your MySQL credentials in `config.php`
- **Sync Issues**: Check that your device can reach the API server and that the API_BASE_URL is correct

