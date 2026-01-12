# Registration Flow Documentation

## Overview

This document describes what happens when a user downloads the app update and registers, covering two scenarios:
1. **New User** - Fresh installation with no existing data
2. **Existing User** - User with local data from previous app version

---

## 📱 Condition 1: New User with Fresh Installation

### Step-by-Step Flow

#### 1. App Launch (DatabaseContext)
- Local SQLite database is initialized via `initDatabase()`
- **For fresh users:** Default categories and locations are **NOT created locally** (to avoid duplicates)
- **For offline users:** Default categories and locations are created locally (for offline use)
- Local data is empty: 0 food items, 0 shopping items, 0 wish items

#### 2. User Opens Registration Screen (`signup.tsx`)
- User fills in: Full Name, Email, Password
- Clicks "Create Account"

#### 3. SignUp Function (`ApiContext.tsx` line 1237)
```
signUp() → authService.register() → Backend creates user in PostgreSQL
```
- Backend returns user object with UUID
- User is saved to local SQLite via `saveUserToLocal()`
- `loadUserData()` is called

#### 4. LoadUserData (`ApiContext.tsx` line 1102)
- Fetches user's groups from PostgreSQL → **Empty** (new user has no groups)
- Since no groups exist, `createGroup('Personal', ...)` is automatically called

#### 5. CreateGroup (`ApiContext.tsx` line 1391)
- **Backend (`groupService.ts` line 7):**
  - Creates group in PostgreSQL
  - **No default categories/locations are created** (changed from previous behavior)
- **Frontend:**
  - Gets all local categories/locations without `group_id` (local defaults)
  - **Pushes them to PostgreSQL** with the new Personal `group_id`
  - Updates local items with `cloud_id` and `group_id` from PostgreSQL response
  - This ensures local defaults are synced to PostgreSQL instead of creating duplicates

#### 6. Cleanup After Registration (`signUp` function)
- After `loadUserData()` completes, any local defaults without `group_id` are deleted
- This ensures only PostgreSQL defaults (with `group_id`) remain in local database

#### 7. Auto Sync Triggers (`autoSyncOnGroupChange` line 215)
- When `currentGroup` is set, sync runs automatically
- Pulls categories, locations, food items from PostgreSQL
- Since food_items is empty on both sides → nothing syncs

### End Result for New User
- ✅ Account created in PostgreSQL
- ✅ "Personal" group created in PostgreSQL
- ✅ Local default categories/locations are **pushed to PostgreSQL** with Personal `group_id`
- ✅ Categories/locations are linked to PostgreSQL via `cloud_id` and `group_id`
- ✅ No duplicates - local data becomes the source of truth in PostgreSQL
- ✅ User can start adding food items

---

## 📱 Condition 2: Existing User with Local Data (Update Installation)

### Step-by-Step Flow

#### 1. App Update
- User had the app before (offline mode)
- Local SQLite has: categories, locations, food items **WITHOUT `cloud_id`** (never synced)
- Example: 5 food items, 8 categories, 4 locations

#### 2. User Registers (`signup.tsx`)
- Same registration flow as above

#### 3. SignUp Function
- Creates user in PostgreSQL
- `loadUserData()` is called

#### 4. LoadUserData
- No groups exist → `createGroup('Personal', ...)` is called
- Backend creates group in PostgreSQL (no defaults created)

#### 5. CreateGroup
- Backend creates group only (no categories/locations)
- Frontend pushes local categories/locations to PostgreSQL with Personal `group_id`
- Local items are updated with `cloud_id` and `group_id` from PostgreSQL
- Result: **No duplicates** - local data is synced to PostgreSQL

#### 6. Auto Sync Triggers (`autoSyncOnGroupChange`)
- **Categories/Locations Sync:**
  - Pulls server categories → imports them
  - Local categories without `cloud_id` are **NOT matched** to server
  - Result: Duplicates until cleanup runs

- **Food Items Sync:**
  - Server has 0 food items
  - Local has 5 food items with `sync_status = 'pending'` and `cloud_id = NULL`
  - These are **pushed to PostgreSQL** when user clicks "Sync"

#### 7. SyncToServer (`ApiContext.tsx` line 1472)
When user manually syncs:
- **Categories/Locations:**
  - Local items without `cloud_id` are matched by name to server items
  - If found → local `cloud_id` is updated
  - If not found → pushed to server

- **Food Items:**
  - Local items without valid `cloud_id` → checked against server by name + expiry_date
  - If duplicate found → `cloud_id` updated
  - If new → pushed to server

- **Shopping/Wish Items:**
  - Items with `sync_status = 'pending'` are pushed to PostgreSQL

#### 8. Cleanup Runs
- Removes duplicate categories/locations with translation keys as names

### End Result for Existing User
- ✅ Account created in PostgreSQL
- ✅ "Personal" group created
- ✅ **Existing local categories/locations** are pushed to PostgreSQL with Personal `group_id`
- ✅ **Existing local food items** are linked to PostgreSQL
- ✅ No duplicates - local data is synced to PostgreSQL
- ✅ All data properly linked via `cloud_id` and `group_id`

---

## 🔄 Visual Flow Diagrams

### New User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEW USER FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│  Local SQLite          Registration         PostgreSQL          │
│  ┌──────────┐          ┌─────────┐          ┌──────────┐       │
│  │ Empty    │ ──────── │ signUp  │ ──────── │ User     │       │
│  │ defaults │          │         │          │ created  │       │
│  └──────────┘          └─────────┘          └──────────┘       │
│       │                     │                    │              │
│       │                     ▼                    │              │
│       │               createGroup()              │              │
│       │                     │                    ▼              │
│       │                     │          ┌──────────────────┐    │
│       │                     │          │ Personal group   │    │
│       │                     │          │ + 8 categories   │    │
│       │                     │          │ + 4 locations    │    │
│       │                     │          └──────────────────┘    │
│       │                     ▼                    │              │
│       │               Pull & Import              │              │
│       ▼                     │                    ▼              │
│  ┌──────────────┐          │          (Source of Truth)        │
│  │ Categories   │◄─────────┘                                   │
│  │ Locations    │                                              │
│  │ (with cloud_id)                                             │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Existing User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   EXISTING USER FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│  Local SQLite          Registration         PostgreSQL          │
│  ┌──────────────┐      ┌─────────┐          ┌──────────┐       │
│  │ 5 food items │ ──── │ signUp  │ ──────── │ User     │       │
│  │ 8 categories │      │         │          │ created  │       │
│  │ 4 locations  │      └─────────┘          └──────────┘       │
│  │ (no cloud_id)│           │                    │              │
│  └──────────────┘           ▼                    │              │
│       │               createGroup()              │              │
│       │                     │                    ▼              │
│       │                     │          ┌──────────────────┐    │
│       │                     │          │ Personal group   │    │
│       │                     │          │ + 8 categories   │    │
│       │                     │          │ + 4 locations    │    │
│       │                     │          │ + 0 food items   │    │
│       │                     │          └──────────────────┘    │
│       │                     ▼                    │              │
│       │          Pull categories/locations       │              │
│       │          (creates duplicates!)           │              │
│       ▼                     │                    │              │
│  ┌──────────────┐          │                    │              │
│  │ DUPLICATES   │◄─────────┘                    │              │
│  │ (cleanup     │                               │              │
│  │  removes)    │                               │              │
│  └──────────────┘                               │              │
│       │                                         │              │
│       │         Manual Sync (syncToServer)      │              │
│       ▼                     │                   ▼              │
│  ┌──────────────┐          │          ┌──────────────────┐    │
│  │ Food items   │──────────┼─────────►│ Food items       │    │
│  │ + cloud_id   │          │          │ (pushed from     │    │
│  │ (linked)     │          │          │  local)          │    │
│  └──────────────┘          │          └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Known Issues

### 1. Backend Creates Categories with Translation Keys as Names
- **Problem:** Backend creates categories with names like `category.vegetables` instead of `Vegetables`
- **Impact:** This creates duplicates when synced to local
- **Solution:** Cleanup function removes these duplicates automatically

### 2. Local Items Without `cloud_id` Don't Match Server Items by Default
- **Problem:** Local items without `cloud_id` are not automatically matched to server items
- **Impact:** Some duplicates may occur during first sync
- **Solution:** Name matching is used as fallback during `syncToServer()`

### 3. Group Filtering on Backend
- **Problem:** Backend sometimes returns items from other groups
- **Impact:** Frontend may receive categories/locations from wrong groups
- **Solution:** Frontend filters to only import items matching the requested `group_id`

---

## 🔑 Key Functions and Files

### Frontend Files
- `FoodExpiryApp/context/ApiContext.tsx` - Main sync and registration logic
  - `signUp()` (line 1237) - User registration
  - `loadUserData()` (line 1102) - Loads user groups and sets current group
  - `createGroup()` (line 1375) - Creates new group with default categories/locations
  - `autoSyncOnGroupChange()` (line 215) - Auto-syncs when group changes
  - `syncToServer()` (line 1472) - Manual sync function

- `FoodExpiryApp/app/auth/signup.tsx` - Registration UI

- `FoodExpiryApp/database/database.ts` - Database initialization and cleanup
  - `cleanupDuplicateCategoriesAndLocations()` (line 2048) - Removes duplicates

- `FoodExpiryApp/database/repository.ts` - Repository pattern for data access
  - `updateFromCloud()` - Imports items from PostgreSQL to local SQLite

### Backend Files
- `backend/src/services/groupService.ts` - Group creation service
  - `createGroup()` (line 7) - Creates group with default categories/locations

---

## 📊 Data Flow Summary

### New User
1. Empty local DB → Register → Create Personal group → Import defaults → Ready to use

### Existing User
1. Local DB with data (no cloud_id) → Register → Create Personal group → Import defaults (duplicates) → Cleanup → Manual sync → Link local data to PostgreSQL

---

## 🛠️ Technical Details

### Database Schema
- **Local SQLite:** Uses integer IDs, stores `cloud_id` (UUID) for linking to PostgreSQL
- **PostgreSQL:** Uses UUIDs as primary keys

### Sync Strategy
- **Pull First:** Categories and locations are pulled from server first
- **Push Second:** Food items, shopping items, and wish items are pushed from local to server
- **Deduplication:** Name matching and `cloud_id` matching prevent duplicates
- **Cleanup:** Automatic cleanup removes items with translation keys as names

### Group Management
- Each user gets a "Personal" group automatically
- Groups can be created manually
- Each group has its own categories, locations, and food items
- Group filtering ensures data isolation between groups

---

## 📝 Notes

- The cleanup function runs automatically after each sync
- Duplicates are expected during first sync for existing users
- All local data is preserved during registration
- PostgreSQL is the source of truth for synced data
- Local SQLite works offline and syncs when online
