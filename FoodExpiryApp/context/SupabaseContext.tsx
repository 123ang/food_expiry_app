import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useDatabase } from './DatabaseContext'
import { Alert } from 'react-native'
import { 
  saveUserToLocal, 
  getLocalUser, 
  getActiveLocalUser, 
  deactivateUser, 
  updateUserSubscription
} from '../database/database'
import { User as LocalUser } from '../database/models'

interface SupabaseContextType {
  // Authentication
  session: Session | null
  user: User | null
  localUser: LocalUser | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  
  // Groups & Sync
  currentGroup: Group | null
  userGroups: GroupMembership[]
  createGroup: (name: string, description?: string) => Promise<Group>
  joinGroup: (inviteCode: string) => Promise<void>
  inviteMember: (email: string) => Promise<void>
  
  // Subscription
  subscription: Subscription | null
  hasActiveSubscription: boolean
  createFamilySubscription: () => Promise<void>
  
  // Sync
  syncStatus: 'idle' | 'syncing' | 'error'
  lastSyncTime: Date | null
  syncToCloud: () => Promise<void>
  
  // Analytics
  trackItemUsed: (itemId: string) => Promise<void>
  trackItemThrownAway: (itemId: string, reason: string) => Promise<void>
}

interface Group {
  id: string
  name: string
  description: string | null
  created_by: string
  invite_code: string
  max_members: number
  created_at: string
  updated_at: string
}

interface GroupMembership {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  groups: Group
}

interface Subscription {
  id: string
  user_id: string
  group_id: string | null
  plan_type: 'free' | 'family'
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  annual_price: number
  paid_price: number
  current_period_start: string | null
  current_period_end: string | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [localUser, setLocalUser] = useState<LocalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [userGroups, setUserGroups] = useState<GroupMembership[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const database = useDatabase()

  // Check if user has active family subscription
  const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan_type === 'family'

  // Check for existing local user on app start
  const checkLocalUser = async () => {
    try {
      const activeUser = await getActiveLocalUser()
      if (activeUser) {
        setLocalUser(activeUser)
        // If we have a local user but no Supabase session, we're in local mode
        if (!session) {
          setLoading(false)
        }
      } else {
        // No active local user found, ensure loading is false
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking local user:', error)
      // If there's an error, still set loading to false to prevent infinite loading
      setLoading(false)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session first
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        // Then check for local user
        await checkLocalUser()

        // Always set loading to false after initialization
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth initialization timeout - forcing loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    initializeAuth()

    return () => clearTimeout(timeoutId)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // User signed in - save to local and load their data
        try {
          await saveUserToLocal({
            supabase_id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email || '',
            subscription_type: 'free' // Default to free
          })
          
          // Update local user state
          const savedUser = await getLocalUser(session.user.id)
          setLocalUser(savedUser)
          
          // Load cloud data
          await loadUserData(session.user.id)
        } catch (error) {
          console.error('Error handling sign in:', error)
        }
      } else {
        // User signed out - clear cloud data but keep local user active
        setCurrentGroup(null)
        setUserGroups([])
        setSubscription(null)
        // Don't clear localUser - it stays active for local mode
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      // Load user's groups
      const { data: groups, error: groupsError } = await supabase
        .from('group_memberships')
        .select(`
          id,
          group_id,
          user_id,
          role,
          joined_at,
          groups (
            id,
            name,
            description,
            created_by,
            invite_code,
            max_members,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)

      if (groupsError) throw groupsError

      setUserGroups(groups as any || [])
      
      // Set current group (first group if any)  
      if (groups && groups.length > 0) {
        setCurrentGroup(groups[0].groups as any)
      }

      // Load subscription
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error loading subscription:', subError)
      } else {
        setSubscription(sub)
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const signUp = async (email: string, password: string, userData: any): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) throw error

    // If signup successful and we have user data, save to local
    if (data.user) {
      await saveUserToLocal({
        supabase_id: data.user.id,
        email: data.user.email || '',
        full_name: userData.full_name || data.user.email || '',
        subscription_type: 'free'
      })
      
      const savedUser = await getLocalUser(data.user.id)
      setLocalUser(savedUser)
    }
  }

  const signIn = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // If signin successful, save/update user in local database
    if (data.user) {
      await saveUserToLocal({
        supabase_id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || data.user.email || '',
        subscription_type: 'free'
      })
      
      const savedUser = await getLocalUser(data.user.id)
      setLocalUser(savedUser)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Deactivate local user
    if (localUser) {
      await deactivateUser(localUser.supabase_id)
      setLocalUser(null)
    }
  }

  const createGroup = async (name: string, description?: string): Promise<Group> => {
    if (!user) throw new Error('Must be logged in to create a group')

    // Check if user already has a group
    if (userGroups.length > 0) {
      throw new Error('You can only create one group')
    }

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as owner
    const { error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'owner'
      })

    if (membershipError) throw membershipError

    // Reload user data
    await loadUserData(user.id)

    return data
  }

  const joinGroup = async (inviteCode: string) => {
    if (!user) throw new Error('Must be logged in to join a group')

    // Find group by invite code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single()

    if (groupError) throw new Error('Invalid invite code')

    // Check if user is already in this group
    const { data: existing } = await supabase
      .from('group_memberships')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)

    if (existing && existing.length > 0) {
      throw new Error('You are already a member of this group')
    }

    // Add user to group
    const { error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member'
      })

    if (membershipError) throw membershipError

    // Reload user data
    await loadUserData(user.id)
  }

  const inviteMember = async (email: string) => {
    if (!user || !currentGroup) throw new Error('Must be logged in and have a group')

    // Check if group has family subscription for multiple members
    if (!hasActiveSubscription) {
      throw new Error('You need a family subscription to invite members')
    }

    // Check current member count
    const { data: members, error: countError } = await supabase
      .from('group_memberships')
      .select('id')
      .eq('group_id', currentGroup.id)

    if (countError) throw countError

    if (members && members.length >= currentGroup.max_members) {
      throw new Error('Group has reached maximum member limit')
    }

    // Create invitation
    const { error } = await supabase
      .from('invitations')
      .insert({
        group_id: currentGroup.id,
        invited_by: user.id,
        invited_email: email
      })

    if (error) throw error

    Alert.alert('Success', `Invitation sent to ${email}`)
  }

  const createFamilySubscription = async () => {
    if (!user || !currentGroup) throw new Error('Must be logged in and have a group')

    // Here you would integrate with Stripe or your payment processor
    // For now, we'll create a mock subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        group_id: currentGroup.id,
        plan_type: 'family',
        status: 'active',
        annual_price: 120.00,
        paid_price: 40.00,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })

    if (error) throw error

    // Reload subscription data
    await loadUserData(user.id)
  }

  const syncToCloud = async () => {
    if (!user || !currentGroup) return

    setSyncStatus('syncing')
    try {
      // Get all local food items
      const localItems = database.foodItems

      for (const item of localItems) {
        // Check if item exists in cloud
        const { data: existing } = await supabase
          .from('food_items')
          .select('id')
          .eq('id', item.id.toString())

        if (!existing || existing.length === 0) {
          // Create new item in cloud with available fields
          await supabase.from('food_items').insert({
            id: item.id.toString(),
            group_id: currentGroup.id,
            created_by: user.id,
            name: item.name,
            quantity: item.quantity,
            category_id: item.category_id?.toString(),
            location_id: item.location_id?.toString(),
            expiry_date: item.expiry_date,
            notes: item.notes,
            image_url: item.image_uri
          })
        }
      }

      setLastSyncTime(new Date())
      setSyncStatus('idle')
    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
    }
  }

  const trackItemUsed = async (itemId: string) => {
    if (!user || !currentGroup) return

    try {
      await supabase.from('food_item_events').insert({
        food_item_id: itemId,
        group_id: currentGroup.id,
        user_id: user.id,
        event_type: 'used_completely'
      })
    } catch (error) {
      console.error('Error tracking item usage:', error)
    }
  }

  const trackItemThrownAway = async (itemId: string, reason: string) => {
    if (!user || !currentGroup) return

    try {
      await supabase.from('food_item_events').insert({
        food_item_id: itemId,
        group_id: currentGroup.id,
        user_id: user.id,
        event_type: 'thrown_away',
        disposal_reason: reason
      })
    } catch (error) {
      console.error('Error tracking item disposal:', error)
    }
  }

  const value: SupabaseContextType = {
    session,
    user,
    localUser,
    loading,
    isAuthenticated: !!(user || localUser),
    signUp,
    signIn,
    signOut,
    currentGroup,
    userGroups,
    createGroup,
    joinGroup,
    inviteMember,
    subscription,
    hasActiveSubscription,
    createFamilySubscription,
    syncStatus,
    lastSyncTime,
    syncToCloud,
    trackItemUsed,
    trackItemThrownAway
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
} 