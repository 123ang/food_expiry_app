# 📱 iOS Deployment Guide for FoodExpiryApp

## 🚀 Quick Start Options

### Option 1: Development Testing (Fastest)
**Use this for immediate testing while developing**

1. **Install Expo Go on iPhone**
   - Download "Expo Go" from App Store

2. **Start Development Server**
   ```bash
   npx expo start
   ```

3. **Connect iPhone**
   - Ensure iPhone and computer are on same WiFi
   - Scan QR code with iPhone camera
   - App opens in Expo Go

---

## 📦 Building Standalone Apps

### Option 2: EAS Build (Recommended)
**Creates a real app file that can be installed directly**

#### Prerequisites:
- Expo/EAS Account (free): https://expo.dev/signup
- Apple Developer Account ($99/year) - only for App Store distribution

#### Step 1: Setup EAS CLI
```bash
# Enable PowerShell scripts (Run PowerShell as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login
```

#### Step 2: Configure Project
```bash
# In your project directory
cd foodexpiry/FoodExpiryApp

# Initialize EAS
eas build:configure

# Update app.json with unique bundle identifier
```

#### Step 3: Build for iOS

**For Internal Testing (No App Store needed):**
```bash
# Build development version
eas build --platform ios --profile development

# Or build preview version  
eas build --platform ios --profile preview
```

**For App Store Distribution:**
```bash
# Build production version
eas build --platform ios --profile production
```

#### Step 4: Install on iPhone

**Development/Preview Builds:**
1. Download .ipa file from EAS dashboard
2. Install via:
   - **TestFlight** (easiest): Upload to App Store Connect
   - **Apple Configurator 2** (Mac only)
   - **3uTools** (Windows) 
   - **Diawi** (web-based installer)

**Production Builds:**
1. Upload to App Store Connect
2. Submit for App Store review
3. Distribute via App Store

---

## 🛠 Alternative Methods

### Option 3: Expo Classic Build (Legacy)
```bash
# Install Expo CLI
npm install -g @expo/cli

# Build for iOS
expo build:ios
```

### Option 4: Local Development Build
```bash
# Create development build
eas build --platform ios --profile development --local
```

---

## 📋 Required Configurations

### Update app.json for iOS:
```json
{
  "expo": {
    "name": "FoodExpiryApp",
    "slug": "food-expiry-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.foodexpiryapp",
      "buildNumber": "1",
      "supportsTablet": true
    }
  }
}
```

### Apple Developer Account Setup:
1. Sign up at https://developer.apple.com
2. Create App ID with your bundle identifier
3. Generate certificates and provisioning profiles
4. Add to EAS credentials: `eas credentials`

---

## 🔧 Installation Methods for Testing

### Method 1: TestFlight (Easiest)
1. Upload .ipa to App Store Connect
2. Add testers via email
3. Testers install TestFlight app
4. Install your app via TestFlight

### Method 2: Direct Installation Tools
- **Diawi**: https://diawi.com (upload .ipa, get install link)
- **3uTools**: Windows tool for installing .ipa files
- **Apple Configurator 2**: Mac tool for device management

### Method 3: Development Provisioning
1. Add device UDIDs to Apple Developer portal
2. Create development provisioning profile
3. Build with development profile
4. Install via Xcode or Apple Configurator

---

## 🚨 Common Issues & Solutions

### Issue: "App cannot be installed"
**Solution**: Check bundle identifier and provisioning profile

### Issue: Icons showing as question marks
**Solution**: We've already fixed this with the new icon system!

### Issue: Build fails on EAS
**Solution**: Check expo doctor for compatibility issues:
```bash
npx expo doctor
```

### Issue: Cannot install .ipa file
**Solutions**:
- Ensure device is registered in provisioning profile
- Use TestFlight for easier distribution
- Check iOS version compatibility

---

## 📱 Quick Commands Summary

```bash
# Development testing
npx expo start

# Build for internal testing
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production

# Check project health
npx expo doctor

# Update dependencies
npx expo install --fix
```

---

## 🎯 Recommended Workflow

1. **Development**: Use Expo Go for rapid testing
2. **Internal Testing**: EAS preview builds with TestFlight
3. **Production**: EAS production builds to App Store

This ensures smooth progression from development to production! 📱✨ 