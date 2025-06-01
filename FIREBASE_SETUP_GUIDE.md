# 🔥 Firebase Setup Guide for Expiry Alert

## Prerequisites
- Node.js installed
- Firebase account
- Firebase project created (expiry-alert-9c004)

## 🚀 Quick Setup Steps

### 1. Enable PowerShell Scripts (Windows)
If you encounter script execution errors, run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Navigate to Project Directory
```bash
cd C:\Users\User\Desktop\Website\foodexpiry\web-app\expiry-alert
```

### 3. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 4. Login to Firebase
```bash
firebase login
```
This will open a browser window - sign in with your Google account.

### 5. Initialize Firebase Project
```bash
firebase init
```

**Select the following options:**
- ✅ **Firestore**: Configure security rules and indexes files
- ✅ **Hosting**: Configure files for Firebase Hosting

**Firestore Configuration:**
- Rules file: `firestore.rules` (default)
- Indexes file: `firestore.indexes.json` (default)

**Hosting Configuration:**
- Public directory: `build`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No`
- Overwrite index.html: `No`

### 6. Enable Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `expiry-alert-9c004`
3. Click "Firestore Database" in the left sidebar
4. Click "Create database"
5. Choose "Start in test mode" (for now)
6. Select a location (choose the closest to your users)

### 7. Build and Deploy

First, build the React app:
```bash
npm run build
```

Deploy to Firebase Hosting:
```bash
firebase deploy
```

## 📊 Firestore Database Structure

Your database will have these collections:

### `foodItems` Collection
```json
{
  "id": "auto-generated",
  "name": "Organic Milk",
  "expiryDate": "2024-01-30",
  "category": "Dairy",
  "location": "Main Refrigerator",
  "quantity": "1 gallon",
  "notes": "Opened 3 days ago",
  "userId": "user-auth-id",
  "addedDate": "2024-01-25T10:00:00.000Z",
  "createdAt": "firestore-timestamp"
}
```

### `categories` Collection
```json
{
  "id": "auto-generated",
  "name": "Fruits",
  "description": "Fresh fruits and berries",
  "icon": "🍎",
  "color": "#ef4444",
  "userId": "user-auth-id",
  "createdAt": "2024-01-25T10:00:00.000Z"
}
```

### `locations` Collection
```json
{
  "id": "auto-generated",
  "name": "Main Refrigerator",
  "description": "Primary fridge in kitchen",
  "temperature": "refrigerated",
  "userId": "user-auth-id",
  "createdAt": "2024-01-25T10:00:00.000Z"
}
```

## 🔐 Security Rules

The `firestore.rules` file ensures:
- Users can only access their own data
- Authentication is required for production
- Demo mode allows open access (remove in production)

## 🌐 Hosting Configuration

The `firebase.json` includes:
- Single-page app configuration
- Static file caching
- Proper routing for React Router

## 🔧 Local Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy everything
firebase deploy

# View deployed app
firebase open hosting:site
```

## 🎯 Next Steps

1. **Enable Authentication** (optional):
   - Go to Firebase Console > Authentication
   - Enable Email/Password provider
   - Update security rules to require auth

2. **Configure Environment Variables**:
   - Your Firebase config is already set in `src/firebase.ts`
   - Consider using environment variables for production

3. **Test the Application**:
   - Add food items
   - Create categories and locations
   - Verify data persists in Firestore

## 🚨 Important Notes

- **Demo Mode**: Current setup allows open access for testing
- **Production**: Remove demo rules and enable authentication
- **Data Persistence**: All data is stored in Firestore
- **Real-time Updates**: Components will update automatically when data changes

## 📱 Integration with Mobile App

Your Firestore database can be shared between:
- ✅ Web app (React)
- ✅ Mobile app (React Native)
- Same collections and data structure
- Real-time synchronization across platforms

## 🎉 Success!

After completing these steps, you'll have:
- ✅ Firestore database running
- ✅ Web app hosted on Firebase
- ✅ Real-time data synchronization
- ✅ Secure user data isolation
- ✅ Production-ready infrastructure

Your app will be available at: `https://expiry-alert-9c004.web.app` 