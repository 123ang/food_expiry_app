# 🌐 Web App Integration Guide

> **Status**: API Services Complete - Ready for Component Updates  
> **Date**: January 8, 2026

---

## ✅ What's Been Created

### Complete API Service Layer

All services are ready to use and replace Firebase:

| Service | File | Status |
|---------|------|--------|
| **apiClient** | `services/apiClient.ts` | ✅ Complete |
| **apiService** | `services/apiService.ts` | ✅ Complete |

The `apiService.ts` includes:
- AuthService
- GroupService
- FoodItemService
- AnalyticsService
- CategoryService
- LocationService
- InvitationService

---

## 🔧 API Client Features

### Base Client (`apiClient.ts`)
- ✅ Automatic token refresh
- ✅ Request/response interceptors
- ✅ Error handling
- ✅ Token storage (localStorage)
- ✅ File upload support
- ✅ Retry logic for 401 errors

### Usage Example
```typescript
import { authService, foodItemService } from './services/apiService';

// Login
const result = await authService.login(email, password);
if (result.success) {
  console.log('User:', result.user);
}

// Get food items
const items = await foodItemService.getItems(groupId);
if (items.success) {
  console.log('Items:', items.items);
}
```

---

## 📋 Step-by-Step Integration

### 1. Update AuthContext.tsx

**Current**: Uses Firebase  
**Action**: Replace with new API service

```typescript
// OLD (Firebase)
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// NEW (Custom API)
import { authService, User } from '../services/apiService';
```

**Replace the entire AuthContext.tsx**:

```typescript
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const result = await authService.getCurrentUser();
        if (result.success) {
          setUser(result.user!);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user!);
    } else {
      throw new Error(result.error || 'Login failed');
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const result = await authService.register(email, password, fullName);
    if (result.success) {
      setUser(result.user!);
    } else {
      throw new Error(result.error || 'Registration failed');
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
  };

  const signInAsGuest = async () => {
    // Guest mode: create temporary account or use local storage
    // For now, just set a guest user
    setUser({
      id: 'guest',
      email: 'guest@local',
      full_name: 'Guest User',
      language_preference: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 2. Update Login.tsx

Replace Firebase auth with new service:

```typescript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const Login: React.FC = () => {
  const { signIn, signUp, signInAsGuest } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
    } catch (err: any) {
      setError(err.message || 'Failed to enter guest mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>{isSignUp ? t('signUp') : t('signIn')}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <input
            type="text"
            placeholder={t('fullName')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? t('loading') : isSignUp ? t('signUp') : t('signIn')}
        </button>
      </form>
      
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? t('alreadyHaveAccount') : t('needAccount')}
      </button>
      
      <button onClick={handleGuestMode} disabled={loading}>
        {t('continueAsGuest')}
      </button>
    </div>
  );
};
```

### 3. Replace firestoreService.ts

**Delete or rename** `firestoreService.ts` and use the new `apiService.ts` instead.

**Update all imports**:

```typescript
// OLD
import { FoodItemsService, AnalyticsService } from './firestoreService';

// NEW
import { foodItemService, analyticsService } from './apiService';
```

### 4. Update Analytics.tsx

Replace Firebase queries with API calls:

```typescript
import React, { useEffect, useState } from 'react';
import { analyticsService, AnalyticsSummary, CategoryBreakdown, MonthlyTrend } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export const Analytics: React.FC<{ groupId: string }> = ({ groupId }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [groupId]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    try {
      // Load summary
      const summaryResult = await analyticsService.getSummary(groupId, 3);
      if (summaryResult.success) {
        setSummary(summaryResult.summary!);
      }

      // Load category breakdown
      const categoryResult = await analyticsService.getCategoryBreakdown(groupId);
      if (categoryResult.success) {
        setCategoryBreakdown(categoryResult.breakdown!);
      }

      // Load monthly trends
      const trendsResult = await analyticsService.getMonthlyTrends(groupId, 12);
      if (trendsResult.success) {
        setMonthlyTrends(trendsResult.trends!);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      {/* Summary Section */}
      {summary && (
        <div className="analytics-summary">
          <h3>Waste Summary (Last 3 Months)</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Items</h4>
              <p>{summary.total_items}</p>
            </div>
            <div className="stat-card">
              <h4>Items Used</h4>
              <p className="text-green">{summary.items_used}</p>
            </div>
            <div className="stat-card">
              <h4>Items Wasted</h4>
              <p className="text-red">{summary.items_wasted}</p>
            </div>
            <div className="stat-card">
              <h4>Waste Percentage</h4>
              <p className={summary.waste_percentage > 20 ? 'text-red' : 'text-green'}>
                {summary.waste_percentage.toFixed(1)}%
              </p>
            </div>
            <div className="stat-card">
              <h4>Total Waste Value</h4>
              <p className="text-red">${summary.total_waste_value.toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h4>Avg Days Before Expiry</h4>
              <p>{summary.avg_days_before_expiry.toFixed(1)} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="category-breakdown">
          <h3>Waste by Category</h3>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Events</th>
                <th>Used</th>
                <th>Wasted</th>
                <th>Waste %</th>
                <th>Waste Value</th>
              </tr>
            </thead>
            <tbody>
              {categoryBreakdown.map((cat) => (
                <tr key={cat.category_id}>
                  <td>{cat.category_name}</td>
                  <td>{cat.total_events}</td>
                  <td className="text-green">{cat.used_count}</td>
                  <td className="text-red">{cat.wasted_count}</td>
                  <td className={cat.waste_percentage > 20 ? 'text-red' : 'text-green'}>
                    {cat.waste_percentage.toFixed(1)}%
                  </td>
                  <td className="text-red">${cat.total_waste_value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <div className="monthly-trends">
          <h3>Monthly Trends</h3>
          {/* Add chart here (e.g., using Chart.js or Recharts) */}
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Added</th>
                <th>Used</th>
                <th>Wasted</th>
                <th>Waste %</th>
                <th>Waste Value</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrends.map((trend) => (
                <tr key={trend.month}>
                  <td>{trend.month}</td>
                  <td>{trend.items_added}</td>
                  <td className="text-green">{trend.items_used}</td>
                  <td className="text-red">{trend.items_wasted}</td>
                  <td className={trend.waste_percentage > 20 ? 'text-red' : 'text-green'}>
                    {trend.waste_percentage.toFixed(1)}%
                  </td>
                  <td className="text-red">${trend.total_waste_value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

### 5. Update App.tsx

Ensure AuthProvider is wrapping the app:

```typescript
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
```

### 6. Add Group Management UI

Create a new component: `components/GroupManagement.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { groupService, invitationService, Group, GroupMember } from '../services/apiService';

export const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const result = await groupService.getGroups();
    if (result.success) {
      setGroups(result.groups!);
      if (result.groups!.length > 0) {
        selectGroup(result.groups![0]);
      }
    }
  };

  const selectGroup = async (group: Group) => {
    setSelectedGroup(group);
    const result = await groupService.getMembers(group.id);
    if (result.success) {
      setMembers(result.members!);
    }
  };

  const handleCreateGroup = async () => {
    const name = prompt('Enter group name:');
    if (!name) return;

    setLoading(true);
    const result = await groupService.createGroup(name);
    setLoading(false);

    if (result.success) {
      await loadGroups();
    } else {
      alert(result.error);
    }
  };

  const handleInvite = async () => {
    if (!selectedGroup || !inviteEmail) return;

    setLoading(true);
    const result = await invitationService.sendInvitation(selectedGroup.id, inviteEmail);
    setLoading(false);

    if (result.success) {
      alert('Invitation sent!');
      setInviteEmail('');
    } else {
      alert(result.error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    if (!confirm('Remove this member?')) return;

    const result = await groupService.removeMember(selectedGroup.id, memberId);
    if (result.success) {
      await selectGroup(selectedGroup);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="group-management">
      <div className="groups-list">
        <h3>My Groups</h3>
        <button onClick={handleCreateGroup} disabled={loading}>
          Create New Group
        </button>
        
        {groups.map((group) => (
          <div
            key={group.id}
            className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
            onClick={() => selectGroup(group)}
          >
            <h4>{group.name}</h4>
            <p>{group.description}</p>
            <small>Invite Code: {group.invite_code}</small>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className="group-details">
          <h3>{selectedGroup.name}</h3>
          <p>Invite Code: <strong>{selectedGroup.invite_code}</strong></p>

          <div className="invite-section">
            <h4>Invite Member</h4>
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button onClick={handleInvite} disabled={loading || !inviteEmail}>
              Send Invitation
            </button>
          </div>

          <div className="members-section">
            <h4>Members ({members.length})</h4>
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div>
                  <strong>{member.full_name || member.email}</strong>
                  <span className="role-badge">{member.role}</span>
                </div>
                {member.role !== 'admin' && (
                  <button onClick={() => handleRemoveMember(member.user_id)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 7. Add Disposal Tracking

When a user discards an item, log the event:

```typescript
import { foodItemService } from '../services/apiService';

const handleDispose = async (itemId: string, reason: string, price?: number) => {
  const result = await foodItemService.logEvent(itemId, {
    event_type: 'thrown_away',
    disposal_reason: reason,
    price_at_disposal: price,
  });

  if (result.success) {
    // Update UI
    alert('Item disposed successfully');
  } else {
    alert(result.error);
  }
};
```

---

## 🗑️ Files to Remove

After integration is complete, remove these Firebase-related files:

- `firebase.ts` or `firebaseConfig.ts`
- `services/firestoreService.ts`
- Any other Firebase imports

---

## 🔧 Configuration

### Update API URL

In `services/apiClient.ts`, update the production URL:

```typescript
const API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.yourdomain.com/api';  // ← Update this
```

### Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:3000/api
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

---

## 📊 Progress

| Task | Status |
|------|--------|
| API Services | ✅ Complete |
| AuthContext Update | ⏳ Pending |
| Login Component Update | ⏳ Pending |
| Replace firestoreService | ⏳ Pending |
| Analytics Update | ⏳ Pending |
| Group Management UI | ⏳ Pending |
| Disposal Tracking | ⏳ Pending |
| Remove Firebase Files | ⏳ Pending |
| Testing | ⏳ Pending |

---

## 💡 Key Benefits

### What You Get

1. **No More Firebase Dependency** ✅
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

---

## 🚀 Next Steps

1. **Update AuthContext.tsx** - Replace Firebase with new service
2. **Update Login.tsx** - Use authService
3. **Replace firestoreService.ts** - Use new apiService
4. **Update Analytics.tsx** - Use analyticsService
5. **Add GroupManagement.tsx** - New component
6. **Add disposal tracking** - Log events
7. **Test everything** - Full flow
8. **Remove Firebase** - Clean up

---

*Web app services ready for integration!*

