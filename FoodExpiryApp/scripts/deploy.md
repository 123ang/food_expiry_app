# 🚀 Quick Deployment Steps

## For Immediate Testing (5 minutes)

1. **Start development server:**
   ```bash
   npx expo start
   ```

2. **On iPhone:**
   - Install "Expo Go" from App Store
   - Scan QR code from terminal
   - App runs instantly in Expo Go!

---

## For Standalone App (30-60 minutes)

### Prerequisites Setup:
1. Create Expo account: https://expo.dev/signup
2. Get Apple Developer account: https://developer.apple.com ($99/year)

### Build Steps:
1. **Enable PowerShell scripts (Run as Administrator):**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Setup EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **Configure and build:**
   ```bash
   eas build:configure
   eas build --platform ios --profile preview
   ```

4. **Install on iPhone:**
   - Download .ipa from EAS dashboard
   - Use TestFlight or Diawi for installation

### Quick Links:
- **EAS Dashboard**: https://expo.dev/accounts/[username]/projects
- **TestFlight**: https://appstoreconnect.apple.com
- **Diawi (Easy .ipa installer)**: https://diawi.com

---

## Current Status ✅
- ✅ Project configured for iOS deployment
- ✅ Bundle identifier set: `com.foodexpiry.app`
- ✅ Icon issues fixed (no more question marks!)
- ✅ EAS configuration ready

**Ready to deploy!** 🎉 