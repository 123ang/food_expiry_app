# Auto Sign-In Implementation

## Overview
Implemented automatic sign-in functionality so users don't need to manually sign in every time to establish Supabase connection.

## Parameters Stored Locally

### 1. **User Data (SQLite Database)**
- `email` - User's email address
- `supabase_id` - Supabase user ID
- `full_name` - User's display name
- `subscription_type` - 'free' or 'family'
- `is_active` - Boolean indicating if user is active
- `last_login` - Timestamp of last login

### 2. **Session Data (AsyncStorage)**
Stored as: `supabase_session_{email}`

Contains:
- `access_token` - JWT token for API authentication
- `refresh_token` - Token to refresh the access token
- `expires_at` - Session expiration timestamp
- `user` - Complete Supabase user object
- `token_type` - Usually "bearer"

## How Auto Sign-In Works

### 1. **App Initialization**
```
1. Check for existing Supabase session
2. If no session, check for local user
3. If local user exists, attempt auto sign-in
4. Use stored session tokens to restore session
5. Load user groups and data
```

### 2. **Sign-In Process**
```
1. User signs in with email/password
2. Supabase returns session data
3. Session is stored in AsyncStorage
4. User data is saved/updated in SQLite
5. User groups are loaded
```

### 3. **Auto Sign-In Process**
```
1. Get local user email
2. Retrieve stored session for that email
3. Check if session is not expired
4. Restore session using access/refresh tokens
5. If successful, load user data and groups
6. If failed, clear invalid session data
```

## Benefits

- ✅ **No Manual Sign-In Required** - Users stay signed in automatically
- ✅ **Secure** - Uses Supabase's built-in token refresh mechanism
- ✅ **Handles Expiration** - Automatically clears expired sessions
- ✅ **Fallback** - Falls back to offline mode if auto sign-in fails
- ✅ **Clean Logout** - Properly clears all stored data on sign out

## Security Considerations

- Passwords are NEVER stored locally
- Only secure session tokens are stored
- Sessions have expiration dates
- Invalid/expired sessions are automatically cleared
- Tokens are stored per-user (isolated by email)

## Debug Information

The implementation includes detailed logging:
- Session storage/retrieval attempts
- Token validation results
- Auto sign-in success/failure
- Session expiration handling

## Usage

Users will now automatically stay signed in between app sessions. The sync button will work immediately without requiring manual sign-in, as long as the stored session is valid.