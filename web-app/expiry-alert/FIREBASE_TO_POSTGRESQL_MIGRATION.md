# Firebase to PostgreSQL Migration Guide

## Overview
This guide explains how to migrate the web-app from Firebase/Firestore to PostgreSQL backend.

## Status
- ✅ **Authentication** - Migrated to PostgreSQL
- ✅ **API Service** - Created `postgresApiService.ts`
- ⏳ **Components** - Need migration (see below)

## Migration Steps

### 1. Update Imports
Replace Firebase imports with PostgreSQL API service:

**Before:**
```typescript
import { getFoodItems, addFoodItem } from '../services/firestoreService';
```

**After:**
```typescript
import { getFoodItems, addFoodItem } from '../services/postgresApiService';
```

### 2. Update Data Structure

#### Food Items
**Firebase:**
```typescript
{
  id: string;
  name: string;
  expiryDate: string;  // camelCase
  categoryId: string;
  locationId: string;
  userId: string;
}
```

**PostgreSQL:**
```typescript
{
  id: string;
  name: string;
  expiry_date: string;  // snake_case
  category_id: string;
  location_id: string;
  group_id: string;     // replaces userId
  created_by: string;
}
```

#### Key Differences:
- **Field names**: `camelCase` → `snake_case`
- **User context**: `userId` → `group_id` + `created_by`
- **Status**: `'in-date'` → `'fresh'`

### 3. Get Current Group ID

Add this hook to components that need group context:

```typescript
import { useState, useEffect } from 'react';
import { getGroups } from '../services/postgresApiService';

const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

useEffect(() => {
  const loadGroup = async () => {
    const groups = await getGroups();
    if (groups.length > 0) {
      setCurrentGroupId(groups[0].id);
    }
  };
  loadGroup();
}, []);
```

### 4. Component-Specific Changes

#### Dashboard.tsx
```typescript
// OLD
const items = await getFoodItems(user.uid);

// NEW
const items = await getFoodItems(currentGroupId);

// Update status mapping
item.status === 'in-date' → item.status === 'fresh'
```

#### AddItem.tsx
```typescript
// OLD
await addFoodItem({
  name,
  expiryDate,
  categoryId,
  locationId,
  userId: user.uid
});

// NEW
await addFoodItem({
  name,
  expiry_date: expiryDate,
  category_id: categoryId,
  location_id: locationId,
  group_id: currentGroupId,
  quantity: 1,
  original_quantity: 1,
  remaining_quantity: 1,
  is_consumed: false,
  usage_frequency: 0,
  version: 0,
  sync_status: 'pending'
});
```

#### CategoryList.tsx / LocationList.tsx
```typescript
// OLD
const categories = await getCategories(user.uid);

// NEW
const categories = await getCategories(currentGroupId);

// Add group_id when creating
await addCategory({
  name,
  icon,
  color,
  group_id: currentGroupId,
  is_default: false,
  version: 0
});
```

### 5. Remove Firebase Dependencies

#### Analytics.tsx & PurchaseHistory.tsx
These components use Firebase-specific features (purchases, item actions) that don't exist in the current PostgreSQL backend.

**Options:**
1. **Disable temporarily** - Show "Coming soon" message
2. **Use food_item_events table** - Backend has this for tracking
3. **Create new endpoints** - Add purchase/action tracking to backend

**Recommended: Option 1 (Temporary)**
```typescript
return (
  <div className="analytics">
    <h2>Analytics</h2>
    <div className="coming-soon">
      <h3>📊 Coming Soon</h3>
      <p>Analytics features are being migrated to the new system.</p>
      <p>Check back soon!</p>
    </div>
  </div>
);
```

### 6. Update App.tsx

Remove Firebase initialization:

```typescript
// REMOVE
import { initializeUserData } from './services/firestoreService';

// In useEffect
if (user) {
  initializeUserData(user.uid, language); // REMOVE THIS
}

// ADD
import { initializeUserData } from './services/postgresApiService';

// In useEffect
if (user) {
  initializeUserData(); // No parameters needed
}
```

## Quick Migration Checklist

- [ ] Dashboard.tsx
  - [ ] Import postgresApiService
  - [ ] Add currentGroupId state
  - [ ] Update getFoodItems call
  - [ ] Map `fresh` status
  
- [ ] AddItem.tsx
  - [ ] Import postgresApiService
  - [ ] Add currentGroupId state
  - [ ] Update field names to snake_case
  - [ ] Add required PostgreSQL fields
  
- [ ] CategoryList.tsx
  - [ ] Import postgresApiService
  - [ ] Add currentGroupId state
  - [ ] Update getCategories call
  - [ ] Add group_id to new categories
  
- [ ] LocationList.tsx
  - [ ] Import postgresApiService
  - [ ] Add currentGroupId state
  - [ ] Update getLocations call
  - [ ] Add group_id to new locations
  
- [ ] ItemDetails.tsx
  - [ ] Import postgresApiService
  - [ ] Update field names to snake_case
  - [ ] Update getFoodItemById call
  
- [ ] AddCategory.tsx / AddLocation.tsx
  - [ ] Import postgresApiService
  - [ ] Add currentGroupId state
  - [ ] Update field names to snake_case
  
- [ ] Analytics.tsx
  - [ ] Show "Coming Soon" message
  
- [ ] PurchaseHistory.tsx
  - [ ] Show "Coming Soon" message

## Testing

After migration:
1. Start backend: `cd backend && npm run dev`
2. Start web-app: `cd web-app/expiry-alert && npm start`
3. Test each feature:
   - ✅ Login/Register
   - ⏳ View dashboard
   - ⏳ Add food item
   - ⏳ Add category
   - ⏳ Add location
   - ⏳ Edit/delete items

## Common Issues

### Issue: "group_id is required"
**Solution:** Make sure you're getting the current group before making API calls:
```typescript
const groups = await getGroups();
const groupId = groups[0]?.id;
```

### Issue: "Cannot read property 'expiryDate'"
**Solution:** Update field names from camelCase to snake_case:
```typescript
item.expiryDate → item.expiry_date
item.categoryId → item.category_id
```

### Issue: "Status 'in-date' not found"
**Solution:** Update status values:
```typescript
'in-date' → 'fresh'
'expiring-soon' → 'expiring-soon' (same)
'expired' → 'expired' (same)
```

## Need Help?

The PostgreSQL API service (`postgresApiService.ts`) includes:
- All CRUD operations for food items, categories, locations
- Helper functions for status calculation
- Dashboard stats calculation
- Automatic group initialization

Refer to the service file for available functions and their signatures.
