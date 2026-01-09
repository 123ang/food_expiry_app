# Expo Local API Setup Guide

## Current Configuration

The API is already configured in `FoodExpiryApp/services/ApiClient.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.expiry-alert.link/api';  // Production
```

## Testing Setup

### Option 1: iOS Simulator / Android Emulator (Easiest)

`localhost` works directly with simulators/emulators:

1. **Start your backend locally:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend should be running at `http://localhost:3000`

2. **Start Expo:**
   ```bash
   cd FoodExpiryApp
   npm start
   ```

3. **Run on simulator/emulator:**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator

The app will automatically use `http://localhost:3000/api` in development mode.

### Option 2: Physical Device Testing

**Important:** `localhost` won't work on physical devices because it refers to the device itself, not your computer.

**Solution:** Use your computer's local IP address.

#### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

**macOS/Linux:**
```bash
ifconfig
# Or
ip addr show
# Look for your local IP (usually 192.168.x.x or 10.0.x.x)
```

#### Step 2: Update API URL for Physical Device

Temporarily update `FoodExpiryApp/services/ApiClient.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api'  // Replace with YOUR computer's IP
  : 'https://api.expiry-alert.link/api';
```

**Or create an environment variable approach:**

Create `FoodExpiryApp/config.ts`:
```typescript
// For physical device testing, set this to your computer's IP
// For simulator/emulator, use 'localhost'
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000'  // Change this to your IP
  : 'https://api.expiry-alert.link';

export const API_URL = `${API_BASE_URL}/api`;
```

Then update `ApiClient.ts`:
```typescript
import { API_URL } from '../config';
```

#### Step 3: Make Sure Backend Allows Your IP

Update backend CORS in `backend/src/app.ts`:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.WEB_APP_URL || 'https://expiry-alert.link']
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:19006',
        'http://192.168.1.100:3000',  // Add your IP
        'exp://192.168.1.100:8081',   // Expo dev server
      ],
  credentials: true,
}));
```

#### Step 4: Start Backend and Expo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Expo
cd FoodExpiryApp
npm start
```

#### Step 5: Connect Physical Device

1. Make sure your phone and computer are on the same WiFi network
2. Scan the QR code with Expo Go app
3. The app will connect to your backend

### Option 3: Use ngrok for Testing (Advanced)

If you want to test from anywhere (not just same WiFi):

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Create tunnel:**
   ```bash
   ngrok http 3000
   ```

3. **Update API URL:**
   ```typescript
   const API_URL = __DEV__ 
     ? 'https://your-ngrok-url.ngrok.io/api'  // Use ngrok URL
     : 'https://api.expiry-alert.link/api';
   ```

## Quick Test

### Verify Backend is Running

```bash
# Test backend health endpoint
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Verify API Endpoints

```bash
# Test API endpoint
curl http://localhost:3000/api/health
```

### Check Expo Connection

1. Open Expo DevTools (usually at `http://localhost:19002`)
2. Check console for API connection errors
3. Use React Native Debugger to see network requests

## Troubleshooting

### "Network request failed"

**On Physical Device:**
- Make sure you're using your computer's IP, not `localhost`
- Verify phone and computer are on same WiFi
- Check Windows Firewall isn't blocking port 3000

**On Simulator/Emulator:**
- Make sure backend is running on `localhost:3000`
- Check backend logs for connection attempts

### "CORS error"

- Update backend CORS to include your IP address
- Make sure `credentials: true` is set in CORS config

### "Connection refused"

- Verify backend is running: `curl http://localhost:3000/health`
- Check if port 3000 is correct in your `.env` file
- Make sure no firewall is blocking the connection

## Production Switch

When ready for production, the app will automatically use:
```typescript
'https://api.expiry-alert.link/api'
```

No code changes needed - it switches based on `__DEV__` flag.

## Summary

- **Simulator/Emulator:** Use `localhost:3000` (already configured ✅)
- **Physical Device:** Change to your computer's IP address (e.g., `192.168.1.100:3000`)
- **Production:** Automatically uses `https://api.expiry-alert.link/api` ✅
