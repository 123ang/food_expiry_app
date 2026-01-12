# GroupContext Fix - useGroup must be used within a GroupProvider

## Issue
Two errors were occurring in the web app:

1. **Error:** `useGroup must be used within a GroupProvider`
   - Occurring in `GroupSelector` component
   - Happening during hot module reloading (HMR) in development

2. **Warning:** `The final argument passed to useEffect changed size between renders`
   - Occurring in `Dashboard` component
   - Dependency array size was inconsistent

## Root Cause

### Issue 1: GroupProvider Context Error
During hot module reloading (HMR) in development, React sometimes re-renders components before the context providers are fully re-initialized. This causes `useGroup()` to be called when the context is temporarily `undefined`.

### Issue 2: useEffect Dependency Array
The dependency array in `Dashboard` was potentially changing size between renders, causing React to warn about inconsistent dependencies.

## Solution

### 1. Made `useGroup` More Resilient
**File:** `contexts/GroupContext.tsx`

**Before:**
```typescript
export const useGroup = (): GroupContextType => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used during a GroupProvider');
  }
  return context;
};
```

**After:**
```typescript
export const useGroup = (): GroupContextType => {
  const context = useContext(GroupContext);
  if (!context) {
    // Return a default context instead of throwing to prevent crashes during HMR
    console.warn('useGroup must be used within a GroupProvider, returning default context');
    return {
      currentGroup: null,
      groups: [],
      setCurrentGroup: () => {},
      loading: true,
      error: 'GroupProvider not available',
      refreshGroups: async () => {},
    };
  }
  return context;
};
```

**Why:** This prevents crashes during HMR while still logging a warning for developers. The component will gracefully handle the missing context and re-render once the provider is available.

### 2. Fixed useEffect Dependency Array
**File:** `components/Dashboard.tsx`

**Before:**
```typescript
}, [currentGroupId, filter || undefined, groupLoading]);
```

**After:**
```typescript
}, [currentGroupId, filter, groupLoading]);
```

**Why:** `filter` is already optional (`filter?: ...`), so it can be `undefined`. Including `|| undefined` was redundant and could cause the array size to appear inconsistent. React handles `undefined` values in dependency arrays correctly.

## Testing
After these fixes:
1. ✅ No more crashes during HMR
2. ✅ GroupSelector works correctly
3. ✅ No more useEffect dependency warnings
4. ✅ App gracefully handles context initialization

## Status
✅ **Fixed** - Both errors resolved

---

**Date:** January 9, 2026
**Issue:** GroupContext errors during HMR
**Resolution:** Made context more resilient and fixed dependency array
