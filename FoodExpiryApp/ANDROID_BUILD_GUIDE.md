# 📱 Android Build & Google Play Store Guide for Expiry Alert

## 🚀 Quick Start - Build for Testing

### 1. Login to Expo Account
```bash
npx expo login
```

### 2. Build APK for Testing on Your Phone
```bash
# For testing on your device (APK file)
npx eas build --platform android --profile preview

# This will give you a downloadable APK file
```

### 3. Download and Install APK
1. When the build completes, you'll get a download link
2. Download the APK to your phone
3. Enable "Install unknown apps" in your phone's settings
4. Install the APK and test your app!

## 🏪 Google Play Store Publication

### Step 1: Create Google Play Console Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete developer profile

### Step 2: Create Service Account (for automated uploads)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Play Developer API
4. Create service account:
   - Go to IAM & Admin > Service Accounts
   - Create service account
   - Download JSON key file
   - Save as `service-account-key.json` in your project root

### Step 3: Create App in Play Console
1. Create new app in Play Console
2. Fill out app details:
   - **App Name**: Expiry Alert
   - **Category**: Lifestyle or Productivity
   - **Content Rating**: Everyone
   - **Privacy Policy**: Required (create one)

### Step 4: Prepare App Store Assets

#### Required Screenshots (1080x1920 or higher):
- At least 2 phone screenshots
- Optional: 7-inch and 10-inch tablet screenshots

#### App Icon:
- 512x512 PNG (already in your assets)

#### Feature Graphic:
- 1024x500 PNG for Play Store listing

### Step 5: Build Production App Bundle
```bash
# Build production App Bundle (recommended for Play Store)
npx eas build --platform android --profile production

# Or build APK if you prefer
npx eas build --platform android --profile production-apk
```

### Step 6: Upload to Play Console
```bash
# Automated upload (requires service account setup)
npx eas submit --platform android --profile production

# Or manually upload the .aab file in Play Console
```

## 🔧 Build Commands Reference

```bash
# Development build (for Expo Go)
npx expo start --dev-client

# Preview build (APK for testing)
npx eas build --platform android --profile preview

# Production build (AAB for Play Store)
npx eas build --platform android --profile production

# Production APK build
npx eas build --platform android --profile production-apk

# Submit to Play Store
npx eas submit --platform android
```

## 📋 Pre-Launch Checklist

### App Configuration ✅
- [x] App name: "Expiry Alert"
- [x] Package name: com.expiryalert.app
- [x] Version: 1.0.0
- [x] Version code: 1
- [x] Icons and splash screen
- [x] Permissions configured

### Store Listing Requirements
- [ ] App description (short & full)
- [ ] Screenshots (phone + tablet)
- [ ] Feature graphic (1024x500)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target age group
- [ ] App category

### Technical Requirements
- [ ] Target SDK 34 (Android 14)
- [ ] App Bundle (.aab) uploaded
- [ ] Release signed with upload key
- [ ] Privacy policy compliant
- [ ] Content rating approved

## 🎯 App Store Optimization (ASO)

### Title & Description
**Title**: Expiry Alert - Food Tracker

**Short Description**:
Never waste food again! Track expiry dates, get alerts, and reduce food waste with Expiry Alert.

**Full Description**:
🍎 **Never Let Food Expire Again!**

Expiry Alert is your personal food management assistant that helps you:

✅ **Track Expiry Dates** - Add all your food items with expiry dates
✅ **Smart Notifications** - Get alerts before food expires
✅ **Reduce Food Waste** - Save money and help the environment
✅ **Organize by Location** - Fridge, pantry, freezer - track everything
✅ **Categories & Tags** - Organize by food type for easy browsing
✅ **Beautiful Interface** - Modern, clean design that's easy to use

**Perfect For:**
- Busy families
- Meal planners
- Eco-conscious consumers
- Anyone tired of throwing away expired food

**Key Features:**
🔔 Customizable expiry alerts
📱 Intuitive food entry
🏠 Multiple storage locations
📊 Food waste tracking
🌱 Eco-friendly living

Download Expiry Alert today and take control of your food inventory!

### Keywords
food tracker, expiry date, food waste, meal planning, grocery, fridge, pantry, notifications, organizer, eco-friendly

## 🚨 Important Notes

### Security & Privacy
- No personal data collection
- All data stored locally
- Optional cloud sync with Firebase
- GDPR compliant

### Version Management
- Always increment `versionCode` for each release
- Follow semantic versioning for `version`
- Update release notes for each version

### Testing Recommendations
1. Test on multiple Android devices
2. Test all app flows
3. Verify notifications work
4. Test with different data loads
5. Check performance on older devices

## 📞 Support & Updates

### Release Strategy
1. **Internal Testing** - Upload to internal track
2. **Closed Testing** - Beta with selected users
3. **Open Testing** - Public beta (optional)
4. **Production** - Full release

### Post-Launch
- Monitor crash reports
- Respond to user reviews
- Regular updates with new features
- Performance monitoring

## 🎉 Launch Timeline

**Week 1**: Build and test APK
**Week 2**: Create Play Console listing
**Week 3**: Upload production build
**Week 4**: Review and launch!

Your app package: `com.expiryalert.app`
Your app will be available at: `https://play.google.com/store/apps/details?id=com.expiryalert.app` 