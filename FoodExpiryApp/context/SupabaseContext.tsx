import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { saveUserToLocal, getLocalUser, getActiveLocalUser, deactivateUser, updateUserSubscription } from '../database/database'
import { User as LocalUser } from '../database/models'
import { Category, Location, FoodItem } from '../database/models'
import { useDatabase } from './DatabaseContext'
import { CategoryRepository, LocationRepository, FoodItemRepository } from '../database/repository'
import { Alert } from 'react-native'

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

        // Then check for local user
        await checkLocalUser()

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

  const syncToCloud = async (): Promise<void> => {
    if (!user || !currentGroup) return;
    
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
        .eq('group_id', currentGroup.id)
      
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
            group_id: currentGroup.id
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
        .eq('group_id', currentGroup.id)
      
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
            group_id: currentGroup.id
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
      // Use getFoodItemsByGroup with the group_id parameter
      const localItems = await getFoodItemsByGroup(currentGroup.id)
      
      // Get cloud items for this group
      const { data: cloudItems, error: itemError } = await supabase
        .from('food_items')
        .select('*')
        .eq('group_id', currentGroup.id)
      
      if (itemError) throw itemError
      
      // Add local items to cloud if they don't exist
      for (const localItem of localItems) {
        // Skip items that don't belong to the current group
        if (localItem.group_id && localItem.group_id !== currentGroup.id) continue
        
        // For items without group_id, update them to have the current group
        if (!localItem.group_id) {
          await database.updateFoodItem({
            ...localItem,
            group_id: currentGroup.id
          })
          localItem.group_id = currentGroup.id
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
            group_id: currentGroup.id,
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
        // Shopping item sync would go here if we had a ShoppingItemRepository
        // This is left for future implementation
      } catch (error) {
        console.error('SupabaseContext: Error syncing shopping items:', error)
      }
      
      // 5. Sync Wish Lists (if available)
      console.log('SupabaseContext: Syncing wish lists...')
      try {
        // Get cloud wish list items for this group
        const { data: cloudWishItems, error: wishError } = await supabase
          .from('wish_lists')
          .select('*')
          .eq('group_id', currentGroup.id)
        
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