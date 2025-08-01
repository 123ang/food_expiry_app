# Supabase API Integration Guide
## Food Expiry App with Cloud Sync, Groups & Family Packages

### 📋 Overview
This guide shows how to integrate your React Native Food Expiry App with Supabase for cloud syncing, group management, and family packages.

### 🔧 Setup

#### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

#### 2. Configure Supabase Client
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types (generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID)
export type Database = {
  // Your generated types will go here
}
```

#### 3. Add to your existing DatabaseContext
```typescript
// context/DatabaseContext.tsx
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface DatabaseContextType {
  // Existing local database methods
  // ... your existing methods
  
  // New Supabase methods
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signOut: () => Promise<void>
  syncData: () => Promise<void>
}
```

### 🔐 Authentication Flow

#### Sign Up
```typescript
const signUp = async (email: string, password: string, userData: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          avatar_url: userData.avatarUrl,
        }
      }
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}
```

#### Sign In
```typescript
const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}
```

#### Auth State Listener
```typescript
useEffect(() => {
  // Listen for auth changes
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // User signed in - sync data
        await syncData()
      } else {
        // User signed out - clear data
        await clearLocalData()
      }
    }
  )

  return () => {
    authListener.subscription.unsubscribe()
  }
}, [])
```

### 👥 Group Management

#### Create a Group
```typescript
const createGroup = async (name: string, description?: string) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Automatically add creator as owner
    await supabase
      .from('group_memberships')
      .insert({
        group_id: data.id,
        user_id: user?.id,
        role: 'owner'
      })
    
    return data
  } catch (error) {
    console.error('Error creating group:', error)
    throw error
  }
}
```

#### Get User's Groups
```typescript
const getUserGroups = async () => {
  try {
    const { data, error } = await supabase
      .from('group_memberships')
      .select(`
        group_id,
        role,
        joined_at,
        groups (
          id,
          name,
          description,
          created_by,
          invite_code,
          max_members,
          created_at
        )
      `)
      .eq('user_id', user?.id)
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching groups:', error)
    throw error
  }
}
```

#### Invite Members
```typescript
const inviteMember = async (groupId: string, email: string) => {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        group_id: groupId,
        invited_by: user?.id,
        invited_email: email
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Send invitation email (implement your email service)
    await sendInvitationEmail(email, data)
    
    return data
  } catch (error) {
    console.error('Error sending invitation:', error)
    throw error
  }
}
```

#### Accept Invitation
```typescript
const acceptInvitation = async (invitationId: string) => {
  try {
    const { error } = await supabase
      .rpc('accept_group_invitation', { invitation_id: invitationId })
    
    if (error) throw error
    
    // Refresh user's groups
    await getUserGroups()
  } catch (error) {
    console.error('Error accepting invitation:', error)
    throw error
  }
}
```

### 🍎 Food Items Sync

#### Sync Food Items
```typescript
const syncFoodItems = async (groupId: string) => {
  try {
    // Get all food items for the group
    const { data: remoteItems, error } = await supabase
      .from('food_items')
      .select(`
        *,
        categories (name, icon, color),
        locations (name, icon, temperature_zone),
        users!created_by (full_name, email)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Merge with local database
    await mergeWithLocalDatabase(remoteItems)
    
    return remoteItems
  } catch (error) {
    console.error('Error syncing food items:', error)
    throw error
  }
}
```

#### Add Food Item
```typescript
const addFoodItem = async (groupId: string, itemData: any) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .insert({
        group_id: groupId,
        created_by: user?.id,
        ...itemData
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Also save to local database for offline access
    await saveToLocalDatabase(data)
    
    return data
  } catch (error) {
    console.error('Error adding food item:', error)
    throw error
  }
}
```

#### Update Food Item
```typescript
const updateFoodItem = async (itemId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    
    // Update local database
    await updateLocalDatabase(itemId, updates)
    
    return data
  } catch (error) {
    console.error('Error updating food item:', error)
    throw error
  }
}
```

### 💳 Family Package & Subscriptions

#### Create Subscription (integrate with Stripe)
```typescript
const createFamilySubscription = async (groupId: string) => {
  try {
    // First create Stripe subscription (implement your Stripe integration)
    const stripeSubscription = await createStripeSubscription()
    
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user?.id,
        group_id: groupId,
        plan_type: 'family',
        status: 'active',
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: stripeSubscription.customer,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000)
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Update group max_members
    await supabase
      .from('groups')
      .update({ max_members: 4 })
      .eq('id', groupId)
    
    return data
  } catch (error) {
    console.error('Error creating family subscription:', error)
    throw error
  }
}
```

#### Check Subscription Status
```typescript
const getSubscriptionStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return data
  } catch (error) {
    console.error('Error checking subscription:', error)
    throw error
  }
}
```

### 🔄 Real-time Updates

#### Subscribe to Group Changes
```typescript
const subscribeToGroupUpdates = (groupId: string) => {
  const subscription = supabase
    .channel(`group-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'food_items',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => {
        console.log('Food item change:', payload)
        // Update local state/database
        handleFoodItemChange(payload)
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_memberships',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => {
        console.log('Membership change:', payload)
        // Update group members list
        handleMembershipChange(payload)
      }
    )
    .subscribe()

  return subscription
}

// Cleanup subscription
const unsubscribeFromUpdates = (subscription: any) => {
  supabase.removeChannel(subscription)
}
```

### 📱 Integration with Existing Local Database

#### Sync Strategy
```typescript
const syncWithLocal = async () => {
  try {
    // 1. Get user's groups
    const groups = await getUserGroups()
    
    for (const group of groups) {
      // 2. Sync food items for each group
      await syncFoodItems(group.group_id)
      
      // 3. Sync categories and locations
      await syncCategories(group.group_id)
      await syncLocations(group.group_id)
    }
    
    // 4. Push any local changes to cloud
    await pushLocalChangesToCloud()
    
  } catch (error) {
    console.error('Sync error:', error)
  }
}

const mergeWithLocalDatabase = async (remoteItems: any[]) => {
  // Implement merge logic based on timestamps
  // Handle conflicts (last-write-wins or user choice)
  for (const item of remoteItems) {
    const localItem = await getLocalItem(item.id)
    
    if (!localItem) {
      // New item from remote
      await saveToLocalDatabase(item)
    } else if (new Date(item.updated_at) > new Date(localItem.updated_at)) {
      // Remote is newer
      await updateLocalDatabase(item.id, item)
    }
    // Local is newer or same - keep local version
  }
}
```

### 🔒 Security Best Practices

1. **Row Level Security (RLS)**: Already implemented in the schema
2. **Input validation**: Always validate data before sending to Supabase
3. **Error handling**: Implement comprehensive error handling
4. **Offline support**: Keep local database as primary, sync with cloud
5. **Data encryption**: Use Supabase's built-in encryption for sensitive data

### 📊 Database Migration from Local to Cloud

```typescript
const migrateLocalToCloud = async () => {
  try {
    // 1. Create user's first group
    const group = await createGroup("My Family", "Primary food tracking group")
    
    // 2. Migrate food items
    const localItems = await getAllLocalFoodItems()
    for (const item of localItems) {
      await addFoodItem(group.id, {
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        unit: item.unit,
        purchase_date: item.purchaseDate,
        expiry_date: item.expiryDate,
        notes: item.notes,
        image_url: item.imageUrl,
        // Map local category/location to cloud equivalents
        category_id: await mapCategoryToCloud(item.categoryId),
        location_id: await mapLocationToCloud(item.locationId)
      })
    }
    
    // 3. Clear local database after successful migration
    await clearLocalDatabase()
    
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}
```

This design provides:
- ✅ Cloud syncing across devices
- ✅ Group sharing with invite system  
- ✅ Family package with 4-member limit
- ✅ Secure data access with RLS
- ✅ Real-time updates
- ✅ Offline-first architecture
- ✅ Subscription management
- ✅ Business rule enforcement 