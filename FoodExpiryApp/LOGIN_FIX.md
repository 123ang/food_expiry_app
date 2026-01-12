# Login/Signup Fix - Cannot Enter Dashboard

## Issue
After successful login, users were immediately redirected back to the login screen instead of staying on the dashboard.

**Error logs:**
```
LOG  LoginScreen: Sign in successful, navigating to home...
LOG  Dashboard: User not authenticated, redirecting to login...
```

## Root Cause
The `LoginScreen` and `SignUpScreen` were calling `authService.login()` and `authService.register()` directly, which only stored authentication tokens in `apiClient` but **did not update the `ApiContext`'s `user` state**.

This meant:
1. Login was successful (tokens were stored)
2. Navigation to dashboard occurred
3. Dashboard checked `isAuthenticated` (which is `!!user`)
4. Since `user` state was `null`, `isAuthenticated` was `false`
5. Dashboard redirected back to login

## Solution
Updated both `LoginScreen` and `SignUpScreen` to use the context methods (`signIn` and `signUp` from `ApiContext`) instead of calling `authService` directly.

### Files Modified:

#### 1. `app/auth/login.tsx`
**Before:**
```typescript
import authService from '../../services/AuthService'

const handleSignIn = async () => {
  // ...
  const result = await authService.login(email, password)
  // ...
}
```

**After:**
```typescript
import { useApi } from '../../context/ApiContext'

const { signIn } = useApi()

const handleSignIn = async () => {
  // ...
  await signIn(email, password)
  // ...
}
```

#### 2. `app/auth/signup.tsx`
**Before:**
```typescript
import authService from '../../services/AuthService'

const handleSignUp = async () => {
  // ...
  const result = await authService.register(email, password, fullName)
  // ...
  // Redirected to login screen
}
```

**After:**
```typescript
import { useApi } from '../../context/ApiContext'

const { signUp } = useApi()

const handleSignUp = async () => {
  // ...
  await signUp(email, password, { full_name: fullName })
  // ...
  // Now redirects directly to dashboard
}
```

#### 3. `context/ApiContext.tsx` (Added logging)
Added console logs to track user state updates during login:
```typescript
console.log('ApiContext: Setting user state after login:', savedUser);
setUser(savedUser);
// ...
console.log('ApiContext: Login complete, user should be authenticated now');
```

#### 4. `app/index.tsx` (Enhanced logging)
Added more detailed logging to track authentication state:
```typescript
console.log('Dashboard: Auth check - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'user:', !!user);
```

## Why This Works

The `signIn` and `signUp` methods in `ApiContext`:
1. Call `authService.login()` / `authService.register()` to authenticate with backend
2. Store tokens in `apiClient`
3. **Save user to local database** via `saveUserToLocal()`
4. **Update the context's `user` state** via `setUser()`
5. Load user data (groups, etc.)

This ensures that `isAuthenticated` becomes `true` before the dashboard's redirect check runs.

## Testing
After this fix:
1. ✅ Login successfully sets user state
2. ✅ Dashboard recognizes authenticated user
3. ✅ No redirect loop
4. ✅ User stays on dashboard after login
5. ✅ Signup now redirects directly to dashboard (instead of login screen)

## Status
✅ **Fixed** - Users can now successfully log in and access the dashboard

---

**Date:** January 9, 2026
**Issue:** Login redirect loop
**Resolution:** Use ApiContext methods instead of direct authService calls
