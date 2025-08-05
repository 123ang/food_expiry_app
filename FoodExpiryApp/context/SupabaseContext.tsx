import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { saveUserToLocal, getLocalUser, getActiveLocalUser, deactivateUser, updateUserSubscription } from '../database/database'
import { User as LocalUser } from '../database/models'
import { Category, Location, FoodItem } from '../database/models'
import { useDatabase } from './DatabaseContext'
import { CategoryRepository, LocationRepository, FoodItemRepository } from '../database/repository'
import { Alert } from 'react-native'
import { inAppPurchaseService } from '../services/InAppPurchaseService'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SupabaseContextType {
  // Authentication
  session: Session | null
  user: User | null
  localUser: LocalUser | null
  loading: boolean
  isAuthenticated: boolean
  isOnlineMode: boolean
  isOfflineMode: boolean
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
  invite_code: string | null
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

// Helper functions for session storage
const getStoredSession = async (email: string) => {
  try {
    const sessionKey = `supabase_session_${email}`
    const storedSession = await AsyncStorage.getItem(sessionKey)
    if (storedSession) {
      const parsed = JSON.parse(storedSession)
      // Check if session is not expired
      const expiresAt = parsed.expires_at ? new Date(parsed.expires_at * 1000) : null
      if (expiresAt && expiresAt > new Date()) {
        return parsed
      } else {
        // Session expired, remove it
        await AsyncStorage.removeItem(sessionKey)
        return null
      }
    }
    return null
  } catch (error) {
    console.error('Error getting stored session:', error)
    return null
  }
}

const storeSession = async (email: string, session: any) => {
  try {
    const sessionKey = `supabase_session_${email}`
    await AsyncStorage.setItem(sessionKey, JSON.stringify(session))
    console.log('SupabaseContext: Session stored for:', email)
    console.log('SupabaseContext: Stored session data includes:', {
      access_token: session.access_token ? 'YES' : 'NO',
      refresh_token: session.refresh_token ? 'YES' : 'NO',
      expires_at: session.expires_at,
      user_id: session.user?.id
    })
  } catch (error) {
    console.error('Error storing session:', error)
  }
}

const clearStoredSession = async (email: string) => {
  try {
    const sessionKey = `supabase_session_${email}`
    await AsyncStorage.removeItem(sessionKey)
    console.log('SupabaseContext: Session cleared for:', email)
  } catch (error) {
    console.error('Error clearing stored session:', error)
  }
}

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
  const [isOnline, setIsOnline] = useState(true) // Track online/offline status

  const database = useDatabase()

  // Check if user has active family subscription
  const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan_type === 'family'

  // Check for existing local user on app start
  const checkLocalUser = async () => {
    try {
      console.log('SupabaseContext: Checking for local user...')
      const activeUser = await getActiveLocalUser()
      if (activeUser) {
        console.log('SupabaseContext: Found active local user:', activeUser.email)
        setLocalUser(activeUser)
        
        // If we have a local user but no Supabase session, we're in offline mode
        if (!session) {
          console.log('SupabaseContext: No Supabase session, using offline mode')
          setLoading(false)
        }
      } else {
        console.log('SupabaseContext: No active local user found')
        setLoading(false)
      }
    } catch (error) {
      console.error('SupabaseContext: Error checking local user:', error)
      setLoading(false)
    }
  }

  const attemptAutoSignIn = async (localUser: LocalUser) => {
    try {
      console.log('SupabaseContext: Attempting auto sign-in with stored credentials...')
      
      // Check if we have stored session data
      const storedSession = await getStoredSession(localUser.email)
      if (storedSession) {
        console.log('SupabaseContext: Found stored session, attempting to restore...')
        
        // Try to set the session
        const { data, error } = await supabase.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token
        })
        
        if (error) {
          console.error('SupabaseContext: Failed to restore session:', error)
          // Clear invalid stored session
          await clearStoredSession(localUser.email)
          return false
        }
        
        if (data.session) {
          console.log('SupabaseContext: Session restored successfully for:', localUser.email)
          setSession(data.session)
          setUser(data.session.user)
          
          // Load user data
          await loadUserData(data.session.user.id)
          return true
        }
      }
      
      console.log('SupabaseContext: No valid stored session found for auto sign-in')
      return false
    } catch (error) {
      console.error('SupabaseContext: Error during auto sign-in:', error)
      return false
    }
  }

  // Enhanced authentication state calculation
  const isAuthenticated = !!(user || localUser)
  const isOnlineMode = !!(user && session)
  const isOfflineMode = !!(localUser && !session)
  
  // Debug authentication status
  console.log('SupabaseContext: Auth Status Debug:', {
    hasUser: !!user,
    hasSession: !!session,
    hasLocalUser: !!localUser,
    isAuthenticated,
    isOnlineMode,
    isOfflineMode,
    userEmail: user?.email,
    localUserEmail: localUser?.email
  })

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('SupabaseContext: Initializing authentication...')
        
        // Get initial session first
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        // Check for local user
        await checkLocalUser()

        // If no session but we have a local user, try auto sign-in
        if (!session) {
          const activeUser = await getActiveLocalUser()
          if (activeUser && activeUser.email) {
            console.log('SupabaseContext: No session found, attempting auto sign-in for:', activeUser.email)
            await attemptAutoSignIn(activeUser)
          }
        }

        // Always set loading to false after initialization
        setLoading(false)
        console.log('SupabaseContext: Authentication initialized')
      } catch (error) {
        console.error('SupabaseContext: Error initializing auth:', error)
        setLoading(false)
      }
    }

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('SupabaseContext: Auth initialization timeout - forcing loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    initializeAuth()

    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('SupabaseContext: Auth state change:', event, session?.user?.id)
      
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // User signed in - save to local and load their data
        try {
          console.log('SupabaseContext: User signed in, saving to local...')
          await saveUserToLocal({
            supabase_id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email || '',
            subscription_type: 'free' // Default to free
          })
          
          // Update local user state
          const savedUser = await getLocalUser(session.user.id)
          setLocalUser(savedUser)
          console.log('SupabaseContext: Local user saved:', savedUser?.email)
          
          // Load cloud data (groups will be handled by signIn function)
          await loadUserData(session.user.id)
        } catch (localError) {
          console.error('SupabaseContext: Error saving to local database:', localError)
          // Don't throw here - the signin was successful, just local save failed
        }
      } else {
        // User signed out - clear all data
        console.log('SupabaseContext: User signed out, clearing all data...')
        setCurrentGroup(null)
        setUserGroups([])
        setSubscription(null)
        setLocalUser(null) // Clear local user when signed out
        console.log('SupabaseContext: All data cleared')
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      // Get user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Debug: Direct query to see all groups for this user
      console.log('SupabaseContext: Direct query - checking all groups for user:', userId)
      const { data: allGroups, error: allGroupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', userId)
      
      if (allGroupsError) {
        console.error('SupabaseContext: Error querying all groups:', allGroupsError)
      } else {
        console.log('SupabaseContext: Direct query - All groups created by user:', allGroups?.length || 0)
        allGroups?.forEach((group, index) => {
          console.log(`SupabaseContext: Direct query - Group ${index + 1}:`, {
            id: group.id,
            name: group.name,
            description: group.description,
            created_by: group.created_by
          })
        })
      }

      // Get user's groups
      const { data: groupMemberships, error: groupsError } = await supabase
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

      // Debug: Check group memberships
      console.log('SupabaseContext: Group memberships found:', groupMemberships?.length || 0)
      groupMemberships?.forEach((membership, index) => {
        console.log(`SupabaseContext: Membership ${index + 1}:`, {
          id: membership.id,
          group_id: membership.group_id,
          user_id: membership.user_id,
          role: membership.role,
          group_name: (membership.groups as any)?.name
        })
      })

      // Get user's subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is fine
        throw subscriptionError
      }

      // Save user to local database with subscription type
      const localUserId = await saveUserToLocal({
        supabase_id: userId,
        email: userData.email,
        full_name: userData.full_name || '',
        subscription_type: userData.subscription_type || 'free',
        subscription_expires_at: subscriptionData?.current_period_end || null
      })

      // Update local user state
      const localUserData = await getLocalUser(userId)
      setLocalUser(localUserData)

      // Update groups state
      const groups = groupMemberships?.map(membership => ({
        id: membership.id,
        group_id: membership.group_id,
        user_id: membership.user_id,
        role: membership.role,
        joined_at: membership.joined_at,
        groups: membership.groups as unknown as Group
      })) || []

      console.log('SupabaseContext: Loaded groups from Supabase:', groups.length)
      groups.forEach((group, index) => {
        console.log(`SupabaseContext: Group ${index + 1}:`, {
          id: group.groups.id,
          name: group.groups.name,
          description: group.groups.description,
          role: group.role
        })
      })

      setUserGroups(groups)

      // Set current group to the first group (usually Personal)
      if (groups.length > 0) {
        setCurrentGroup(groups[0].groups)
        console.log('SupabaseContext: Set current group to:', groups[0].groups.name)
      }

      // Update subscription state
      if (subscriptionData) {
        setSubscription({
          id: subscriptionData.id,
          user_id: subscriptionData.user_id,
          group_id: subscriptionData.group_id,
          plan_type: subscriptionData.plan_type,
          status: subscriptionData.status,
          annual_price: 0, // These fields might not exist in your schema
          paid_price: 0,
          current_period_start: subscriptionData.current_period_start,
          current_period_end: subscriptionData.current_period_end
        })
      } else {
        setSubscription(null)
      }

      console.log('SupabaseContext: User data loaded successfully')
    } catch (error) {
      console.error('SupabaseContext: Error loading user data:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: any): Promise<void> => {
    console.log('SupabaseContext: Starting signup for email:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: undefined // Disable email confirmation
      }
    })

    if (error) {
      console.log('SupabaseContext: Signup error:', error)
      throw error
    }

    console.log('SupabaseContext: Signup successful, user:', data.user?.id)

    // If signup successful and we have user data, save to local
    if (data.user) {
      try {
        console.log('SupabaseContext: Saving user to local database...')
        await saveUserToLocal({
          supabase_id: data.user.id,
          email: data.user.email || '',
          full_name: userData.full_name || data.user.email || '',
          subscription_type: 'free'
        })
        
        const savedUser = await getLocalUser(data.user.id)
        setLocalUser(savedUser)
        console.log('SupabaseContext: User saved to local database successfully')
        
        // Manually create user profile in Supabase if trigger fails
        try {
          console.log('SupabaseContext: Attempting to create user profile manually...')
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              full_name: userData.full_name || data.user.email || '',
              avatar_url: userData.avatar_url || null,
              timezone: 'UTC',
              language_preference: 'en'
            })
          
          if (profileError) {
            if (profileError.code === '23505') { // Unique constraint violation
              console.log('SupabaseContext: User profile already exists (trigger worked)')
            } else {
              console.error('SupabaseContext: Error creating user profile manually:', profileError)
            }
          } else {
            console.log('SupabaseContext: User profile created manually successfully')
          }
        } catch (manualError) {
          console.error('SupabaseContext: Error in manual profile creation:', manualError)
        }
        
        // Automatically create personal group for new user
        try {
          console.log('SupabaseContext: Creating personal group for new user...')
          await createGroup('Personal', 'Your personal food management group')
          console.log('SupabaseContext: Personal group created successfully')
        } catch (groupError) {
          console.error('SupabaseContext: Error creating personal group:', groupError)
          // Don't throw here - the signup was successful, just group creation failed
        }
        
        // Test if user profile was created in Supabase
        setTimeout(async () => {
          try {
            if (data.user) {
              const { data: profileData, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single()
              
              if (profileError) {
                console.error('SupabaseContext: Error checking user profile:', profileError)
              } else {
                console.log('SupabaseContext: User profile created in Supabase:', profileData)
              }
            }
          } catch (checkError) {
            console.error('SupabaseContext: Error checking user profile:', checkError)
          }
        }, 2000) // Wait 2 seconds for trigger to execute
        
      } catch (localError) {
        console.error('SupabaseContext: Error saving to local database:', localError)
        // Don't throw here - the signup was successful, just local save failed
      }
    }
  }

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('SupabaseContext: Starting sign in...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('SupabaseContext: Sign in error:', error)
      throw error
    }

    console.log('SupabaseContext: Sign in successful')
    
    // Store session for auto sign-in
    if (data.session) {
      await storeSession(email, data.session)
    }

    // If signin successful, save/update user in local database
    if (data.user) {
      try {
        await saveUserToLocal({
          supabase_id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.email || '',
          subscription_type: 'free'
        })
        
        const savedUser = await getLocalUser(data.user.id)
        setLocalUser(savedUser)
        console.log('SupabaseContext: Local user saved:', savedUser?.email)
        
        // Load user data including groups
        await loadUserData(data.user.id)
        
        // Check if user has groups after loading data
        const { data: groups, error: groupsError } = await supabase
          .from('group_memberships')
          .select('id')
          .eq('user_id', data.user.id)

        if (groupsError) {
          console.error('SupabaseContext: Error checking groups:', groupsError)
        } else if (!groups || groups.length === 0) {
          try {
            console.log('SupabaseContext: Creating personal group for existing user...')
            await createGroup('Personal', 'Your personal food management group')
            console.log('SupabaseContext: Personal group created for existing user')
            
            // Reload user data to update userGroups state
            await loadUserData(data.user.id)
          } catch (groupError) {
            console.error('SupabaseContext: Error creating personal group for existing user:', groupError)
            // Don't throw here - the signin was successful, just group creation failed
          }
        } else {
          console.log('SupabaseContext: User already has groups:', groups.length)
        }
      } catch (localError) {
        console.error('SupabaseContext: Error saving to local database:', localError)
        // Don't throw here - the signin was successful, just local save failed
      }
    }
    
    console.log('SupabaseContext: Sign in completed')
  }

  const signOut = async () => {
    try {
      console.log('SupabaseContext: Starting sign out...')
      
      // Clear stored session
      if (localUser?.email) {
        await clearStoredSession(localUser.email)
      }
      
      // Clear session and user state
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SupabaseContext: Supabase sign out error:', error)
        throw error
      }

      console.log('SupabaseContext: Supabase sign out successful')

      // Clear local user data
      if (localUser) {
        try {
          await deactivateUser(localUser.supabase_id)
          console.log('SupabaseContext: Local user deactivated')
        } catch (deactivateError) {
          console.error('SupabaseContext: Error deactivating local user:', deactivateError)
          // Don't throw here - the sign out was successful, just local cleanup failed
        }
      }

      // Clear all state
      setLocalUser(null)
      setUser(null)
      setSession(null)
      setCurrentGroup(null)
      setUserGroups([])
      setSubscription(null)
      
      console.log('SupabaseContext: Sign out completed successfully')
    } catch (error) {
      console.error('SupabaseContext: Sign out error:', error)
      throw error
    }
  }

  // Function to switch to offline mode (useful for testing or when Supabase is unavailable)
  const switchToOfflineMode = async () => {
    try {
      console.log('SupabaseContext: Switching to offline mode...')
      
      // Clear Supabase session but keep local user
      await supabase.auth.signOut()
      
      // Clear Supabase-related state but keep local user
      setSession(null)
      setUser(null)
      setCurrentGroup(null)
      setUserGroups([])
      setSubscription(null)
      
      console.log('SupabaseContext: Switched to offline mode successfully')
    } catch (error) {
      console.error('SupabaseContext: Error switching to offline mode:', error)
      throw error
    }
  }

  // Function to check if we can sync with Supabase
  const canSyncWithSupabase = () => {
    return isOnlineMode && isAuthenticated
  }

  const createGroup = async (name: string, description?: string): Promise<Group> => {
    // Use session user instead of state user to avoid timing issues
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user
    
    if (!currentUser) throw new Error('Must be logged in to create a group')

    // Check if user already has a group with the same name by querying database directly
    const { data: existingGroups, error: checkError } = await supabase
      .from('group_memberships')
      .select(`
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
      .eq('user_id', currentUser.id)

    if (checkError) throw checkError

    const existingGroup = existingGroups?.find((g: any) => g.groups.name.toLowerCase() === name.toLowerCase())
    if (existingGroup) {
      throw new Error(`You already have a group named "${name}"`)
    }

    // Determine if this is a personal group
    const isPersonalGroup = name.toLowerCase() === 'personal' || (existingGroups && existingGroups.length === 0)

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: currentUser.id,
        invite_code: isPersonalGroup ? null : undefined, // No invite code for personal groups
        max_members: isPersonalGroup ? 1 : 4 // Max 1 member for personal, 4 for family groups
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as owner
    const { error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: data.id,
        user_id: currentUser.id,
        role: 'owner'
      })

    if (membershipError) throw membershipError

    // Reload user data
    await loadUserData(currentUser.id)

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

    // Check if this is a personal group (max_members = 1)
    if (currentGroup.max_members === 1) {
      throw new Error('Cannot invite members to a personal group')
    }

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
    if (!user) throw new Error('Must be logged in to purchase premium package')

    // Ensure user has a group - create personal group if needed
    let groupToUse = currentGroup;
    if (!groupToUse) {
      console.log('SupabaseContext: No current group found, creating personal group for subscription...')
      try {
        groupToUse = await createGroup('Personal', 'Your personal food management group');
        console.log('SupabaseContext: Personal group created for subscription:', groupToUse.name)
      } catch (error) {
        console.error('SupabaseContext: Failed to create personal group for subscription:', error)
        throw new Error('Failed to create user group. Please try again.');
      }
    }

    // Calculate pricing based on current date
    const isEarlyBird = new Date() < new Date('2026-01-01T00:00:00Z')
    const paidPrice = isEarlyBird ? 57.92 : 579.2
    const regularPrice = 579.2

    try {
      // Attempt in-app purchase
      const purchaseResult = await inAppPurchaseService.purchaseProduct('premium_package_annual')
      
      if (purchaseResult.success) {
        // In-app purchase successful, create subscription in database
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            group_id: groupToUse.id,
            plan_type: 'family',
            status: 'active',
            annual_price: regularPrice,
            paid_price: paidPrice,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            stripe_subscription_id: purchaseResult.transactionId // Store the transaction ID
          })

        if (error) throw error

        // Reload subscription data
        await loadUserData(user.id)
        
        console.log('SupabaseContext: Premium package purchased successfully via in-app purchase')
      } else {
        throw new Error(purchaseResult.error || 'Purchase failed')
      }
    } catch (error) {
      console.error('SupabaseContext: In-app purchase error:', error)
      
      // Fallback to mock purchase for development/testing
      console.log('SupabaseContext: Falling back to mock purchase for development')
      
      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          group_id: groupToUse.id,
          plan_type: 'family',
          status: 'active',
          annual_price: regularPrice,
          paid_price: paidPrice,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (dbError) throw dbError

      // Reload subscription data
      await loadUserData(user.id)
    }
  }

  // Migration function to update items without group_id
  const migrateItemsToGroup = async (groupId: string) => {
    try {
      console.log('SupabaseContext: Migrating items without group_id to group:', groupId)
      
      // Get database instance from DatabaseContext
      const { getDatabase } = await import('../database/database')
      const db = await getDatabase()
      if (!db) return
      
      const itemsWithoutGroup = await db.getAllAsync(
        'SELECT * FROM food_items WHERE group_id IS NULL'
      )
      
      console.log('SupabaseContext: Found', itemsWithoutGroup.length, 'items without group_id')
      
      // Update each item to have the current group_id
      for (const item of itemsWithoutGroup) {
        await db.runAsync(
          'UPDATE food_items SET group_id = ? WHERE id = ?',
          [groupId, item.id]
        )
      }
      
      // Also update shopping items if they exist
      try {
        const shoppingItemsWithoutGroup = await db.getAllAsync(
          'SELECT * FROM shopping_items WHERE group_id IS NULL'
        )
        
        console.log('SupabaseContext: Found', shoppingItemsWithoutGroup.length, 'shopping items without group_id')
        
        for (const item of shoppingItemsWithoutGroup) {
          await db.runAsync(
            'UPDATE shopping_items SET group_id = ? WHERE id = ?',
            [groupId, item.id]
          )
        }
      } catch (error) {
        // shopping_items table might not have group_id column yet
        console.log('SupabaseContext: Shopping items table not ready for group migration')
      }
      
      // Also update wish lists if they exist
      try {
        const wishItemsWithoutGroup = await db.getAllAsync(
          'SELECT * FROM wish_lists WHERE group_id IS NULL'
        )
        
        console.log('SupabaseContext: Found', wishItemsWithoutGroup.length, 'wish items without group_id')
        
        for (const item of wishItemsWithoutGroup) {
          await db.runAsync(
            'UPDATE wish_lists SET group_id = ? WHERE id = ?',
            [groupId, item.id]
          )
        }
      } catch (error) {
        // wish_lists table might not have group_id column yet
        console.log('SupabaseContext: Wish lists table not ready for group migration')
      }
      
      console.log('SupabaseContext: Migration completed successfully')
    } catch (error) {
      console.error('SupabaseContext: Error during migration:', error)
    }
  }

  const syncToCloud = async (): Promise<void> => {
    if (!user) return;
    
    // Ensure user has a group - create personal group if needed
    let groupToUse = currentGroup;
    if (!groupToUse) {
      console.log('SupabaseContext: No current group found, creating personal group...')
      try {
        groupToUse = await createGroup('Personal', 'Your personal food management group');
        console.log('SupabaseContext: Personal group created for sync:', groupToUse.name)
      } catch (error) {
        console.error('SupabaseContext: Failed to create personal group for sync:', error)
        return;
      }
    }
    
    // Migrate existing items without group_id to current group
    await migrateItemsToGroup(groupToUse.id)
    
    setSyncStatus('syncing')
    try {
      // Get database refresh function
      const { refreshAll, getFoodItemsByGroup } = database;
      
      console.log('SupabaseContext: Starting sync with Supabase...')
      
      // 1. Sync Categories
      console.log('SupabaseContext: Syncing categories...')
      const localCategories = await CategoryRepository.getAll();
      
      // Get cloud categories for this group
      const { data: cloudCategories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('group_id', groupToUse.id)
      
      if (catError) throw catError
      
      // Add local categories to cloud if they don't exist
      for (const localCat of localCategories) {
        const cloudMatch = cloudCategories?.find((c: any) => c.name.toLowerCase() === localCat.name.toLowerCase())
        
        if (!cloudMatch) {
          // Create in cloud
          await supabase.from('categories').insert({
            name: localCat.name,
            icon: localCat.icon,
            color: '#4ECDC4', // Default color
            created_by: user.id,
            group_id: groupToUse.id
          })
        }
      }
      
      // Add cloud categories to local if they don't exist
      if (cloudCategories) {
        for (const cloudCat of cloudCategories) {
          const localMatch = localCategories.find((c: Category) => c.name.toLowerCase() === cloudCat.name.toLowerCase())
          
          if (!localMatch) {
            // Create in local
            await CategoryRepository.create({
              name: cloudCat.name,
              icon: cloudCat.icon || ''
            })
          }
        }
      }
      
      // 2. Sync Locations
      console.log('SupabaseContext: Syncing locations...')
      const localLocations = await LocationRepository.getAll()
      
      // Get cloud locations for this group
      const { data: cloudLocations, error: locError } = await supabase
        .from('locations')
        .select('*')
        .eq('group_id', groupToUse.id)
      
      if (locError) throw locError
      
      // Add local locations to cloud if they don't exist
      for (const localLoc of localLocations) {
        const cloudMatch = cloudLocations?.find((l: any) => l.name.toLowerCase() === localLoc.name.toLowerCase())
        
        if (!cloudMatch) {
          // Create in cloud
          await supabase.from('locations').insert({
            name: localLoc.name,
            icon: localLoc.icon,
            temperature_zone: 'room', // Default
            created_by: user.id,
            group_id: groupToUse.id
          })
        }
      }
      
      // Add cloud locations to local if they don't exist
      if (cloudLocations) {
        for (const cloudLoc of cloudLocations) {
          const localMatch = localLocations.find((l: Location) => l.name.toLowerCase() === cloudLoc.name.toLowerCase())
          
          if (!localMatch) {
            // Create in local
            await LocationRepository.create({
              name: cloudLoc.name,
              icon: cloudLoc.icon || ''
            })
          }
        }
      }
      
      // 3. Sync Food Items
      console.log('SupabaseContext: Syncing food items...')
      
      // First, get ALL local food items (not filtered by group)
      const { getDatabase } = await import('../database/database')
      const db = await getDatabase()
      const allLocalItems = await db.getAllAsync('SELECT * FROM food_items')
      
      console.log('===LOCAL=== All food items in local database:')
      allLocalItems.forEach((item: any, index: number) => {
        console.log(`Local Item ${index + 1}:`, {
          id: item.id,
          name: item.name,
          group_id: item.group_id,
          category_id: item.category_id,
          location_id: item.location_id,
          expiry_date: item.expiry_date
        })
      })
      
      // Use getFoodItemsByGroup with the group_id parameter
      const localItems = await getFoodItemsByGroup(groupToUse.id)
      console.log('===LOCAL=== Filtered food items for group', groupToUse.id, ':', localItems.length, 'items')
      
      // Get cloud items for this group
      const { data: cloudItems, error: itemError } = await supabase
        .from('food_items')
        .select('*')
        .eq('group_id', groupToUse.id)
        
      console.log('===SUPABASE=== Food items in cloud for group', groupToUse.id, ':')
      if (cloudItems && cloudItems.length > 0) {
        cloudItems.forEach((item: any, index: number) => {
          console.log(`Cloud Item ${index + 1}:`, {
            id: item.id,
            name: item.name,
            group_id: item.group_id,
            category_id: item.category_id,
            location_id: item.location_id,
            expiry_date: item.expiry_date
          })
        })
      } else {
        console.log('No cloud items found for this group')
      }
      
      if (itemError) throw itemError
      
      // Add local items to cloud if they don't exist
      for (const localItem of localItems) {
        // Skip items that don't belong to the current group
        if (localItem.group_id && localItem.group_id !== groupToUse.id) continue
        
        // For items without group_id, update them to have the current group
        if (!localItem.group_id) {
          await database.updateFoodItem({
            ...localItem,
            group_id: groupToUse.id
          })
          localItem.group_id = groupToUse.id
        }
        
        const cloudMatch = cloudItems?.find((i: any) => 
          i.name.toLowerCase() === localItem.name.toLowerCase() && 
          i.expiry_date === localItem.expiry_date
        )
        
        if (!cloudMatch) {
          // Create in cloud
          await supabase.from('food_items').insert({
            name: localItem.name,
            quantity: localItem.quantity,
            category_id: localItem.category_id ? localItem.category_id.toString() : null,
            location_id: localItem.location_id ? localItem.location_id.toString() : null,
            group_id: groupToUse.id,
            created_by: user.id,
            expiry_date: localItem.expiry_date,
            notes: localItem.notes,
            image_url: localItem.image_uri
          })
        }
      }
      
      // Add cloud items to local if they don't exist
      if (cloudItems) {
        for (const cloudItem of cloudItems) {
          const localMatch = localItems.find((i: FoodItem) => 
            i.name.toLowerCase() === cloudItem.name.toLowerCase() && 
            i.expiry_date === cloudItem.expiry_date
          )
          
          if (!localMatch) {
            // Create in local using the database context
            await database.createFoodItem({
              name: cloudItem.name,
              quantity: cloudItem.quantity || 1,
              category_id: cloudItem.category_id ? parseInt(cloudItem.category_id) : null,
              location_id: cloudItem.location_id ? parseInt(cloudItem.location_id) : null,
              group_id: cloudItem.group_id,
              expiry_date: cloudItem.expiry_date,
              reminder_days: 3, // Default
              notes: cloudItem.notes || null,
              image_uri: cloudItem.image_url || null,
              created_at: new Date().toISOString().split('T')[0]
            })
          }
        }
      }
      
      // 4. Sync Shopping Items (if available)
      try {
        console.log('SupabaseContext: Syncing shopping items...')
        
        // Get all local shopping items
        const allLocalShoppingItems = await db.getAllAsync('SELECT * FROM shopping_items')
        console.log('===LOCAL=== All shopping items in local database:')
        allLocalShoppingItems.forEach((item: any, index: number) => {
          console.log(`Local Shopping Item ${index + 1}:`, {
            id: item.id,
            name: item.name,
            group_id: item.group_id,
            done: item.done,
            created_at: item.created_at
          })
        })
        
        // Get cloud shopping items for this group
        const { data: cloudShoppingItems } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('group_id', groupToUse.id)
          
        console.log('===SUPABASE=== Shopping items in cloud for group', groupToUse.id, ':')
        if (cloudShoppingItems && cloudShoppingItems.length > 0) {
          cloudShoppingItems.forEach((item: any, index: number) => {
            console.log(`Cloud Shopping Item ${index + 1}:`, {
              id: item.id,
              name: item.name,
              group_id: item.group_id,
              done: item.done,
              created_at: item.created_at
            })
          })
        } else {
          console.log('No cloud shopping items found for this group')
        }
      } catch (error) {
        console.error('SupabaseContext: Error syncing shopping items:', error)
      }
      
      // 5. Sync Wish Lists (if available)
      console.log('SupabaseContext: Syncing wish lists...')
      try {
        // Get all local wish list items
        const allLocalWishItems = await db.getAllAsync('SELECT * FROM wish_lists')
        console.log('===LOCAL=== All wish list items in local database:')
        allLocalWishItems.forEach((item: any, index: number) => {
          console.log(`Local Wish Item ${index + 1}:`, {
            id: item.id,
            name: item.name,
            group_id: item.group_id,
            price: item.price,
            rating: item.rating,
            created_at: item.created_at
          })
        })
        
        // Get cloud wish list items for this group
        const { data: cloudWishItems, error: wishError } = await supabase
          .from('wish_lists')
          .select('*')
          .eq('group_id', groupToUse.id)
        
        console.log('===SUPABASE=== Wish list items in cloud for group', groupToUse.id, ':')
        if (cloudWishItems && cloudWishItems.length > 0) {
          cloudWishItems.forEach((item: any, index: number) => {
            console.log(`Cloud Wish Item ${index + 1}:`, {
              id: item.id,
              name: item.name,
              group_id: item.group_id,
              price: item.price,
              rating: item.rating,
              created_at: item.created_at
            })
          })
        } else {
          console.log('No cloud wish list items found for this group')
        }
        
        if (wishError) throw wishError
        
        // Bidirectional sync logic for wish lists
        // This is left for future implementation
      } catch (error) {
        console.error('SupabaseContext: Error syncing wish lists:', error)
      }
      
      // 6. Sync User Subscription Type
      console.log('SupabaseContext: Syncing user subscription type...')
      try {
        // Get user data from Supabase
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('subscription_type')
          .eq('id', user.id)
          .single()
        
        if (userError) throw userError
        
        // Update local user subscription type
        if (userData && localUser) {
          await updateUserSubscription(
            user.id,
            userData.subscription_type || 'free'
          )
          
          // Update local user state
          const updatedLocalUser = await getLocalUser(user.id)
          setLocalUser(updatedLocalUser)
        }
      } catch (error) {
        console.error('SupabaseContext: Error syncing user subscription type:', error)
      }
      
      console.log('SupabaseContext: Sync completed successfully')
      setLastSyncTime(new Date())
      setSyncStatus('idle')
      
      // Refresh local data after sync
      await refreshAll()
    } catch (error) {
      console.error('SupabaseContext: Sync error:', error)
      setSyncStatus('error')
    }
  }
  
  // Helper functions for mapping IDs between local and cloud
  const mapCloudCategoryToLocal = async (cloudId: string | null, localCategories: Category[]): Promise<number | null> => {
    if (!cloudId || !localCategories) return null
    
    try {
      const { data: cloudCategory } = await supabase
        .from('categories')
        .select('name')
        .eq('id', cloudId)
        .single()
      
      if (!cloudCategory) return null
      
      const localMatch = localCategories.find((c: Category) => c.name.toLowerCase() === cloudCategory.name.toLowerCase())
      return localMatch?.id || null
    } catch (error) {
      console.error('Error mapping cloud category to local:', error)
      return null
    }
  }
  
  const mapCloudLocationToLocal = async (cloudId: string | null, localLocations: Location[]): Promise<number | null> => {
    if (!cloudId || !localLocations) return null
    
    try {
      const { data: cloudLocation } = await supabase
        .from('locations')
        .select('name')
        .eq('id', cloudId)
        .single()
      
      if (!cloudLocation) return null
      
      const localMatch = localLocations.find((l: Location) => l.name.toLowerCase() === cloudLocation.name.toLowerCase())
      return localMatch?.id || null
    } catch (error) {
      console.error('Error mapping cloud location to local:', error)
      return null
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
    isAuthenticated,
    isOnlineMode,
    isOfflineMode,
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