# 📱 Mobile App Integration Guide

> **Status**: API Services Complete - Ready for Screen Updates  
> **Date**: January 8, 2026

---

## ✅ What's Been Created

### Complete API Service Layer (7 Services)

All services are ready to use and replace Supabase:

| Service | File | Status |
|---------|------|--------|
| **ApiClient** | `services/ApiClient.ts` | ✅ Complete |
| **AuthService** | `services/AuthService.ts` | ✅ Complete |
| **GroupService** | `services/GroupService.ts` | ✅ Complete |
| **InvitationService** | `services/InvitationService.ts` | ✅ Complete |
| **FoodItemService** | `services/FoodItemService.ts` | ✅ Complete |
| **AnalyticsService** | `services/AnalyticsService.ts` | ✅ Complete |
| **CategoryService** | `services/CategoryService.ts` | ✅ Complete |
| **LocationService** | `services/LocationService.ts` | ✅ Complete |

---

## 🔧 API Client Features

### Base Client (`ApiClient.ts`)
- ✅ Automatic token refresh
- ✅ Request/response interceptors
- ✅ Error handling
- ✅ Token storage (AsyncStorage)
- ✅ File upload support
- ✅ Retry logic for 401 errors

### Usage Example
```typescript
import apiClient from './services/ApiClient';

// GET request
const response = await apiClient.get('/endpoint');

// POST request
const response = await apiClient.post('/endpoint', { data });

// With authentication (automatic)
// Token is automatically added to headers if available
```

---

## 📋 Next Steps: Update Screens & Components

### 1. Update ApiContext.tsx

**Current**: Uses Supabase  
**Action**: Replace with new services

```typescript
// OLD (Supabase)
import { supabase } from '../lib/supabase';

// NEW (Custom API)
import authService from '../services/AuthService';
import groupService from '../services/GroupService';
import invitationService from '../services/InvitationService';
```

**Key Changes**:
- Replace `supabase.auth.signUp()` → `authService.register()`
- Replace `supabase.auth.signInWithPassword()` → `authService.login()`
- Replace `supabase.auth.signOut()` → `authService.logout()`
- Replace Supabase group queries → `groupService` methods
- Remove `supabaseSyncService` imports

### 2. Update Authentication Screens

#### `app/auth/login.tsx`
```typescript
// Replace
import { useSupabase } from '../../context/SupabaseContext';
const { signIn } = useSupabase();

// With
import authService from '../../services/AuthService';
const result = await authService.login(email, password);
```

#### `app/auth/signup.tsx`
```typescript
// Replace Supabase signup
// With
const result = await authService.register(email, password, fullName);
```

### 3. Update Food Item Screens

#### `app/add.tsx` - Add Food Item
```typescript
import foodItemService from '../services/FoodItemService';

const handleSave = async () => {
  const result = await foodItemService.createItem({
    group_id: currentGroup.id,
    name,
    quantity,
    category_id,
    location_id,
    expiry_date,
    purchase_price, // NEW: Optional price tracking
  });
  
  if (result.success) {
    // Success
  }
};
```

#### `app/item/[id].tsx` - Item Details
Add disposal tracking:

```typescript
import foodItemService from '../../services/FoodItemService';

// Log disposal event
const handleDispose = async (reason: string) => {
  const result = await foodItemService.logEvent(itemId, {
    event_type: 'thrown_away',
    disposal_reason: reason,
    price_at_disposal: item.purchase_price, // If price tracking enabled
  });
};

// Log usage event
const handleUse = async () => {
  const result = await foodItemService.logEvent(itemId, {
    event_type: 'used_completely',
  });
};
```

### 4. Create Disposal Reason Modal

Create new component: `components/DisposalReasonModal.tsx`

```typescript
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (reason: string) => void;
}

const reasons = [
  { value: 'expired', label: '⏰ Expired', icon: '⏰' },
  { value: 'spoiled', label: '🤢 Spoiled', icon: '🤢' },
  { value: 'too_much', label: '📦 Too Much', icon: '📦' },
  { value: 'dislike', label: '😕 Didn\'t Like', icon: '😕' },
  { value: 'forgotten', label: '🤦 Forgotten', icon: '🤦' },
  { value: 'other', label: '❓ Other', icon: '❓' },
];

export const DisposalReasonModal: React.FC<Props> = ({ visible, onClose, onSelect }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Why are you discarding this item?</Text>
          
          {reasons.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={styles.reasonButton}
              onPress={() => {
                onSelect(reason.value);
                onClose();
              }}
            >
              <Text style={styles.reasonIcon}>{reason.icon}</Text>
              <Text style={styles.reasonLabel}>{reason.label}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  reasonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  reasonLabel: {
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
});
```

### 5. Update Group Management

#### `app/settings.tsx` - Fix Group Management Modal
Replace mock data with real API calls:

```typescript
import groupService from '../services/GroupService';
import invitationService from '../services/InvitationService';

// Load real members
const loadMembers = async () => {
  const result = await groupService.getMembers(currentGroup.id);
  if (result.success) {
    setGroupMembers(result.members);
  }
};

// Send real invitation
const handleInviteUser = async () => {
  const result = await invitationService.sendInvitation(currentGroup.id, inviteEmail);
  if (result.success) {
    Alert.alert('Success', 'Invitation sent!');
  } else {
    Alert.alert('Error', result.error);
  }
};

// Remove member
const handleRemoveMember = async (memberId: string) => {
  const result = await groupService.removeMember(currentGroup.id, memberId);
  if (result.success) {
    await loadMembers(); // Reload
  }
};
```

### 6. Create Join Group Screen

Create new file: `app/groups/join.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import invitationService from '../../services/InvitationService';
import { router } from 'expo-router';

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setLoading(true);
    const result = await invitationService.joinWithCode(inviteCode.trim().toUpperCase());
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'You have joined the group!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to join group');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Join a Group
      </Text>
      
      <Text style={{ marginBottom: 10 }}>Enter Invite Code:</Text>
      <TextInput
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="ABCD1234"
        autoCapitalize="characters"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 15,
          fontSize: 18,
          marginBottom: 20,
        }}
      />
      
      <TouchableOpacity
        onPress={handleJoin}
        disabled={loading}
        style={{
          backgroundColor: '#22c55e',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Joining...' : 'Join Group'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 7. Add Analytics Widget to Dashboard

Update `app/index.tsx` to show basic stats:

```typescript
import analyticsService from '../services/AnalyticsService';

const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  loadAnalytics();
}, [currentGroup]);

const loadAnalytics = async () => {
  if (!currentGroup) return;
  
  const result = await analyticsService.getSummary(currentGroup.id, 1); // Last month
  if (result.success) {
    setAnalytics(result.summary);
  }
};

// In render:
{analytics && (
  <View style={styles.analyticsCard}>
    <Text style={styles.analyticsTitle}>This Month</Text>
    <View style={styles.analyticsRow}>
      <View style={styles.analyticsStat}>
        <Text style={styles.analyticsValue}>{analytics.items_used}</Text>
        <Text style={styles.analyticsLabel}>Used</Text>
      </View>
      <View style={styles.analyticsStat}>
        <Text style={[styles.analyticsValue, { color: '#f44336' }]}>
          {analytics.items_wasted}
        </Text>
        <Text style={styles.analyticsLabel}>Wasted</Text>
      </View>
      <View style={styles.analyticsStat}>
        <Text style={[styles.analyticsValue, { color: analytics.waste_percentage > 20 ? '#f44336' : '#4caf50' }]}>
          {analytics.waste_percentage.toFixed(1)}%
        </Text>
        <Text style={styles.analyticsLabel}>Waste Rate</Text>
      </View>
    </View>
  </View>
)}
```

### 8. Add Price Tracking Toggle

Update `app/settings.tsx`:

```typescript
import authService from '../services/AuthService';

const [priceTrackingEnabled, setPriceTrackingEnabled] = useState(false);

// Load setting
useEffect(() => {
  loadSettings();
}, []);

const loadSettings = async () => {
  const result = await authService.getSettings();
  if (result.success) {
    setPriceTrackingEnabled(result.settings.price_tracking_enabled);
  }
};

// Toggle setting
const togglePriceTracking = async (value: boolean) => {
  const result = await authService.updateSettings({
    price_tracking_enabled: value,
  });
  
  if (result.success) {
    setPriceTrackingEnabled(value);
  }
};

// In render:
<View style={styles.settingRow}>
  <Text style={styles.settingLabel}>Track Item Prices</Text>
  <Switch
    value={priceTrackingEnabled}
    onValueChange={togglePriceTracking}
  />
</View>
```

---

## 🗑️ Files to Remove

After integration is complete, remove these Supabase-related files:

- `lib/supabase.ts`
- `services/SupabaseSyncService.ts`
- Any other Supabase imports

---

## 🔧 Configuration

### Update API URL

In `services/ApiClient.ts`, update the production URL:

```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.yourdomain.com/api';  // ← Update this
```

### Deep Link Configuration

For invite links, update `app.json`:

```json
{
  "expo": {
    "scheme": "expiryalert",
    "ios": {
      "associatedDomains": ["applinks:yourdomain.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "expiryalert",
              "host": "join"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

---

## ✅ Testing Checklist

After making changes, test:

- [ ] User registration
- [ ] User login
- [ ] Token refresh (wait 15 minutes)
- [ ] Create food item
- [ ] Update food item
- [ ] Delete food item
- [ ] Log disposal event with reason
- [ ] Log usage event
- [ ] View analytics
- [ ] Create group
- [ ] Invite member (email)
- [ ] Join group (code)
- [ ] Remove member
- [ ] Price tracking toggle
- [ ] Offline mode (queue events)

---

## 📊 Progress

| Task | Status |
|------|--------|
| API Services | ✅ Complete |
| ApiContext Update | ⏳ Pending |
| Auth Screens Update | ⏳ Pending |
| Food Item Screens Update | ⏳ Pending |
| Disposal Modal | ⏳ Pending |
| Group Management Fix | ⏳ Pending |
| Join Group Screen | ⏳ Pending |
| Analytics Widget | ⏳ Pending |
| Price Tracking Toggle | ⏳ Pending |
| Remove Supabase Files | ⏳ Pending |
| Testing | ⏳ Pending |

---

## 💡 Key Benefits

### What You Get

1. **No More Supabase Dependency** ✅
   - Full control over backend
   - No vendor lock-in
   - Custom business logic

2. **Food Waste Intelligence** ✅
   - Track why items are discarded
   - Get actionable insights
   - Reduce waste over time

3. **Better Group Management** ✅
   - Real invitation system
   - Email + code options
   - Role-based permissions

4. **Optional Price Tracking** ✅
   - See financial impact of waste
   - User-controlled feature

5. **Offline-First Ready** ✅
   - API client handles retries
   - Token refresh automatic
   - Queue events when offline

---

## 🚀 Next Steps

1. **Update ApiContext.tsx** - Replace Supabase with new services
2. **Update auth screens** - Use AuthService
3. **Update food item screens** - Use FoodItemService
4. **Create disposal modal** - Track waste reasons
5. **Fix group management** - Use real API
6. **Add join group screen** - Handle invite codes
7. **Add analytics widget** - Show basic stats
8. **Add price tracking toggle** - User setting
9. **Test everything** - Full flow
10. **Remove Supabase** - Clean up

---

*Mobile app services ready for integration!*

