# Food Expiry App - PHP API

This folder contains a simple PHP API for the Food Expiry App, designed to work with XAMPP for local development and testing.

## Setup Instructions

1. **Install XAMPP**
   - Download and install XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
   - Start Apache and MySQL services

2. **Copy Files to XAMPP**
   - Copy this entire `php_api` folder to your XAMPP `htdocs` directory
   - Example path: `C:\xampp\htdocs\php_api`

3. **Create Database**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `foodexpiry`
   - Import the `mysql_setup.sql` file to create tables and initial data

4. **Test the API**
   - Open your browser and navigate to: http://localhost/php_api/
   - You should see a JSON response indicating the API is running

## API Endpoints

### Users
- `GET /users.php?id=123` - Get user by ID
- `GET /users.php?email=user@example.com` - Get user by email
- `POST /users.php` - Create new user
- `POST /users.php?action=login` - Login user
- `PUT /users.php?id=123` - Update user

### Groups
- `GET /groups.php` - Get all groups
- `GET /groups.php?id=123` - Get group by ID
- `GET /groups.php?user_id=123` - Get groups for a user
- `POST /groups.php` - Create new group
- `PUT /groups.php?id=123` - Update group
- `DELETE /groups.php?id=123` - Delete group

### Food Items
- `GET /food_items.php` - Get all food items
- `GET /food_items.php?id=123` - Get food item by ID
- `GET /food_items.php?group_id=123` - Get food items for a group
- `POST /food_items.php` - Create new food item
- `PUT /food_items.php?id=123` - Update food item
- `DELETE /food_items.php?id=123` - Delete food item

### Sync
- `POST /sync.php?action=push` - Push local data to server
- `POST /sync.php?action=pull` - Pull server data to local
- `POST /sync.php?action=sync` - Bidirectional sync

## Next Steps

1. Update your React Native app to use this API instead of Supabase
2. Create an ApiContext component to handle API calls
3. Implement offline-first functionality with local SQLite and sync with this API

## Security Notes

This is a basic implementation for development and testing. For production:
- Add proper authentication with JWT or OAuth
- Implement HTTPS
- Add rate limiting
- Implement proper error handling and logging
- Consider using a PHP framework like Laravel for larger-scale deployment
