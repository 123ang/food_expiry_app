# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for image storage in your Expiry Alert app.

## 🔧 Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. Your Expiry Alert app running locally or deployed

## 📋 Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Expiry Alert Images")
4. Click "Create"

### 2. Enable Google Drive API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

### 3. Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields:
     - App name: "Expiry Alert"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: `../auth/drive.file`
   - Add test users (your email)

4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Expiry Alert Web Client"
   - Authorized redirect URIs:
     - For local development: `http://localhost:3000/auth/google`
     - For production: `https://yourdomain.com/auth/google`

5. Download the credentials JSON file

### 4. Configure Environment Variables

Create a `.env.local` file in your project root with:

```env
# Google Drive API Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_client_secret_here

# Optional: Customize folder name
REACT_APP_DRIVE_FOLDER_NAME=Expiry Alert Images
```

**Important:** 
- Replace `your_client_id_here` and `your_client_secret_here` with values from your downloaded credentials
- Add `.env.local` to your `.gitignore` file
- Never commit these credentials to version control

### 5. Update Firestore Schema (Optional)

Add image fields to your food items:

```typescript
// In firestoreService.ts, update FoodItem interface
export interface FoodItem {
  // ... existing fields
  imageId?: string;        // Google Drive file ID
  imageUrl?: string;       // Public image URL
  imageThumbnail?: string; // Thumbnail URL for faster loading
}
```

## 🚀 Integration Examples

### Basic Usage in AddItem Component

```typescript
import ImageUpload from '../components/ImageUpload';

// In your AddItem component
const [imageData, setImageData] = useState({
  imageId: '',
  imageUrl: ''
});

const handleImageUploaded = (fileId: string, imageUrl: string) => {
  setImageData({ imageId: fileId, imageUrl });
};

// In your form
<ImageUpload 
  onImageUploaded={handleImageUploaded}
  currentImageId={imageData.imageId}
  currentImageUrl={imageData.imageUrl}
/>
```

### Saving with Food Item

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const foodItemData = {
    // ... other form data
    imageId: imageData.imageId,
    imageUrl: imageData.imageUrl,
  };
  
  await FoodItemsService.addItem(foodItemData, user.uid);
};
```

## 🔐 Security Considerations

### OAuth2 Scopes
- `https://www.googleapis.com/auth/drive.file`: Only access files created by the app
- More secure than full Drive access

### File Permissions
- Images are made publicly viewable for easy sharing
- Only the user can delete their images
- Files are organized in a dedicated folder

### Token Management
- Access tokens are stored in localStorage
- Refresh tokens handle automatic renewal
- Users can revoke access anytime from Google Account settings

## 📱 User Experience Flow

1. **First Time:**
   - User sees "Connect Google Drive" button
   - Clicks → Opens Google OAuth in new tab
   - Authorizes → Returns to app
   - Can now upload images

2. **Uploading:**
   - Drag & drop or click to select image
   - Auto-compression for large files
   - Real-time progress feedback
   - Preview with edit/delete options

3. **Storage:**
   - Images saved to "Expiry Alert Images" folder in user's Drive
   - Organized automatically
   - Accessible from Drive if needed

## 🛠️ Troubleshooting

### Common Issues

**"Access blocked" error:**
- Your OAuth consent screen needs verification for production
- Add your domain to authorized origins
- Ensure redirect URIs match exactly

**"Invalid client" error:**
- Check client ID and secret are correct
- Verify environment variables are loaded
- Ensure OAuth client is for "Web application"

**Upload failures:**
- Check Google Drive API is enabled
- Verify user has sufficient Drive storage
- Test with smaller image files first

### Testing in Development

1. Start your development server
2. Navigate to your app
3. Try connecting Google Drive
4. Upload a test image
5. Check your Google Drive for the "Expiry Alert Images" folder

## 🔄 Alternative Storage Options

If Google Drive doesn't work for your use case:

1. **Firebase Storage**: Built-in with Firebase, good for teams
2. **Cloudinary**: Image optimization and CDN
3. **AWS S3**: Enterprise-grade, more complex setup
4. **Local Storage**: For offline-first apps

## 📊 Benefits of Google Drive Integration

✅ **Cost-effective**: 15GB free storage per user  
✅ **User-controlled**: Images in user's own Drive  
✅ **Familiar**: Users already know Google Drive  
✅ **Reliable**: Google's infrastructure  
✅ **Accessible**: Users can access images outside the app  
✅ **Privacy**: Only user can access their images  

## 🔄 Migration from Firebase Storage

If you're currently using Firebase Storage:

1. Create a migration script to copy existing images
2. Update database references to include Google Drive IDs
3. Gradually migrate users to new system
4. Keep Firebase as fallback for transition period

## 📞 Support

If you need help with setup:
1. Check Google Cloud Console documentation
2. Review OAuth2 troubleshooting guides
3. Test with minimal example first
4. Verify all environment variables are set correctly

Remember: Always test thoroughly in development before deploying to production! 