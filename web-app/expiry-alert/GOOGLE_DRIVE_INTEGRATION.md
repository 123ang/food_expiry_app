# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for your Expiry Alert app to store food item images.

## 🚀 Quick Start

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project** (or use existing)
   - Click "Select a project" dropdown
   - Click "NEW PROJECT"
   - Name: `expiry-alert-app`
   - Click "CREATE"

3. **Enable Google Drive API**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click on it and click "ENABLE"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "CREATE CREDENTIALS" > "OAuth client ID"
   - If prompted, configure OAuth consent screen first (see below)
   - Application type: "Web application"
   - Name: `Expiry Alert Web App`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google` (for development)
     - `https://yourdomain.com/auth/google` (for production)
   - Click "CREATE"
   - Copy the Client ID and Client Secret

### 2. OAuth Consent Screen Configuration

1. **Go to OAuth consent screen**
   - In "APIs & Services" > "OAuth consent screen"
   - User Type: "External" (unless you have Google Workspace)
   - Click "CREATE"

2. **App Information**
   - App name: `Expiry Alert`
   - User support email: Your email
   - Developer contact information: Your email
   - Click "SAVE AND CONTINUE"

3. **Scopes**
   - Click "ADD OR REMOVE SCOPES"
   - Add: `https://www.googleapis.com/auth/drive.file`
   - This allows the app to create and manage files it creates
   - Click "UPDATE" and "SAVE AND CONTINUE"

4. **Test users** (for development)
   - Add your email and any test users
   - Click "SAVE AND CONTINUE"

### 3. Environment Variables Setup

Create a `.env.local` file in your project root with:

```env
# Google Drive Integration
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_client_secret_here

# Existing Firebase config (keep these)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Test the Integration

1. **Start your development server**
   ```bash
   npm start
   ```

2. **Add a new food item**
   - Go to Dashboard > Add Item
   - Fill in the form details
   - Click "Choose Image" in the new image upload section
   - You'll be prompted to authenticate with Google
   - Grant permissions to access Google Drive
   - Upload an image

3. **Verify in Google Drive**
   - Go to [drive.google.com](https://drive.google.com)
   - Look for "Expiry Alert Images" folder
   - Your uploaded image should be there

## 🔧 How It Works

### File Organization
- Creates a dedicated "Expiry Alert Images" folder in Google Drive
- All food item images are stored in this folder
- Images are made publicly viewable (with direct link)
- Automatic image compression before upload

### Image Features
- **Compression**: Images are automatically compressed to reduce storage
- **Thumbnails**: Google Drive provides thumbnails for faster loading
- **Public URLs**: Images get shareable URLs for display in the app
- **Organization**: All images are neatly organized in one folder

### Data Storage
Food items now include:
- `imageId`: Google Drive file ID
- `imageUrl`: Public view URL
- `imageThumbnail`: Thumbnail URL for faster loading

## 📱 User Experience

### For Users
1. **First Time Setup**
   - When first uploading an image, users authenticate with Google
   - Permission is requested only once
   - Authentication persists across sessions

2. **Uploading Images**
   - Click "Choose Image" when adding/editing food items
   - Images are automatically compressed and uploaded
   - Progress indicator shows upload status
   - Preview appears immediately after upload

3. **Managing Images**
   - Replace images by uploading new ones
   - Remove images if not needed
   - Images are automatically deleted from Google Drive when removed

## 🔒 Security & Privacy

### What We Access
- **Limited Scope**: Only `drive.file` scope (files created by the app)
- **No Full Access**: Cannot see or modify other Google Drive files
- **User Control**: Users can revoke access anytime in Google account settings

### Data Privacy
- Images are stored in user's own Google Drive
- No images stored on our servers
- Users maintain full control over their data
- Can delete images anytime from Google Drive

## 🚀 Deployment Considerations

### Production Setup
1. **Update OAuth Settings**
   - Add your production domain to authorized origins
   - Add production redirect URI
   - Update environment variables for production

2. **Domain Verification**
   - For published apps, verify your domain in Google Cloud Console
   - Required for non-localhost production URLs

### Scaling
- Google Drive API has generous quotas
- For high-volume apps, consider Google Cloud Storage instead
- Monitor usage in Google Cloud Console

## 🛠 Troubleshooting

### Common Issues

1. **"Access denied" or "Permission denied"**
   - Check OAuth consent screen configuration
   - Ensure correct scopes are added
   - Verify redirect URIs match exactly

2. **"Invalid client" error**
   - Double-check Client ID in environment variables
   - Ensure client is configured for web application
   - Check authorized domains

3. **Images not displaying**
   - Check if images are public (should be automatic)
   - Verify image URLs are being saved correctly
   - Check browser console for errors

4. **Upload failures**
   - Check network connection
   - Verify file size (max 10MB recommended)
   - Check file type (images only)

### Debug Mode
Enable detailed logging by adding to your environment:
```env
REACT_APP_DEBUG_GOOGLE_DRIVE=true
```

## 📈 Monitoring

### Google Cloud Console
- Monitor API usage in "APIs & Services" > "Dashboard"
- Check quotas and limits
- View error logs if issues occur

### App Analytics
- Upload success/failure rates
- Image storage usage
- User authentication flow completion

## 🔄 Migration from Firebase Storage

If you were previously using Firebase Storage:

1. **Keep Both Systems** (recommended)
   - New items use Google Drive
   - Existing items keep Firebase URLs
   - Gradual migration as items are edited

2. **Full Migration** (optional)
   - Download existing images from Firebase
   - Re-upload to Google Drive
   - Update database references
   - Clean up Firebase Storage

## 📋 Checklist

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] OAuth credentials created
- [ ] OAuth consent screen configured
- [ ] Environment variables set
- [ ] App tested with image upload
- [ ] Production domains configured
- [ ] Users can authenticate successfully

## 🆘 Support

Need help? Common solutions:
1. Check all environment variables are set correctly
2. Verify OAuth redirect URIs match your domain exactly
3. Ensure Google Drive API is enabled
4. Check OAuth consent screen is properly configured
5. Test with a fresh browser/incognito window

For more help, check the Google Cloud Console documentation or create an issue in the project repository. 