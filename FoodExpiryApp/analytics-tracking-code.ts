// Analytics Tracking Implementation for Food Expiry App
// Tracks usage, disposal, and provides waste insights

// Import types - adjust paths as needed for your project
// import { supabase } from '../lib/supabase'
// import { db } from '../database/database' // Your SQLite database instance

// Mock interfaces for demonstration - replace with your actual implementations
declare const supabase: any
declare const db: any

// Types for analytics
export type DisposalReason = 'expired' | 'spoiled' | 'too_much' | 'dislike' | 'forgotten' | 'other'
export type ConsumptionType = 'used_completely' | 'used_partially' | 'thrown_away' | 'gifted' | 'expired_unused'

interface AnalyticsEvent {
  id: string
  food_item_id: string
  event_type: ConsumptionType
  quantity_affected: number
  disposal_reason?: DisposalReason
  disposal_notes?: string
  created_at: Date
  sync_status: 'pending_upload' | 'synced'
}

interface WasteAnalytics {
  totalItemsAdded: number
  totalItemsUsed: number
  totalItemsWasted: number
  wastePercentage: number
  avgDaysBeforeExpiry: number
  wasteByCategory: CategoryWaste[]
  wasteByLocation: LocationWaste[]
  monthlySavings: number
  recommendations: WasteReduction[]
}

interface CategoryWaste {
  categoryName: string
  totalItems: number
  wastedItems: number
  wastePercentage: number
  avgDaysWasted: number
}

interface LocationWaste {
  locationName: string
  totalItems: number
  wastedItems: number
  wastePercentage: number
}

interface WasteReduction {
  type: 'category' | 'location' | 'timing'
  message: string
  impact: string
  actionable: boolean
}

// ===== CORE ANALYTICS FUNCTIONS =====

/**
 * Track when a food item is used, thrown away, or expires
 */
export const trackFoodItemEvent = async (
  itemId: string,
  eventType: ConsumptionType,
  quantityAffected: number = 1,
  disposalReason?: DisposalReason,
  notes?: string
): Promise<void> => {
  try {
    // 1. Create analytics event
    const event: AnalyticsEvent = {
      id: generateUUID(),
      food_item_id: itemId,
      event_type: eventType,
      quantity_affected: quantityAffected,
      disposal_reason: disposalReason,
      disposal_notes: notes,
      created_at: new Date(),
      sync_status: 'pending_upload'
    }

    // 2. Save to local analytics table first
    await saveAnalyticsEventLocally(event)

    // 3. Update the food item status locally
    await updateFoodItemStatus(itemId, eventType, quantityAffected)

    // 4. Try to sync to cloud (background)
    await syncAnalyticsToCloud(event)

    console.log(`📊 Analytics: ${eventType} tracked for item ${itemId}`)
    
  } catch (error) {
    console.error('Failed to track analytics event:', error)
    throw error
  }
}

/**
 * Save analytics event to local SQLite database
 */
const saveAnalyticsEventLocally = async (event: AnalyticsEvent): Promise<void> => {
  // Your existing SQLite database implementation
  await db.executeSql(
    `INSERT INTO local_analytics_events 
     (id, food_item_id, event_type, quantity_affected, disposal_reason, disposal_notes, created_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.food_item_id,
      event.event_type,
      event.quantity_affected,
      event.disposal_reason,
      event.disposal_notes,
      event.created_at.toISOString(),
      event.sync_status
    ]
  )
}

/**
 * Update food item status after analytics event
 */
const updateFoodItemStatus = async (
  itemId: string, 
  eventType: ConsumptionType, 
  quantityAffected: number
): Promise<void> => {
  const isConsumed = ['used_completely', 'thrown_away', 'expired_unused'].includes(eventType)
  
  if (isConsumed) {
    // Item is fully consumed
    await db.executeSql(
      `UPDATE food_items 
       SET is_consumed = 1, consumed_at = ?, remaining_quantity = 0, usage_frequency = usage_frequency + 1
       WHERE id = ?`,
      [new Date().toISOString(), itemId]
    )
  } else {
    // Partial usage
    await db.executeSql(
      `UPDATE food_items 
       SET remaining_quantity = MAX(0, remaining_quantity - ?), 
           usage_frequency = usage_frequency + 1,
           last_used_at = ?
       WHERE id = ?`,
      [quantityAffected, new Date().toISOString(), itemId]
    )
  }
}

/**
 * Sync analytics event to Supabase cloud
 */
const syncAnalyticsToCloud = async (event: AnalyticsEvent): Promise<void> => {
  try {
    if (!isOnline() || !getCurrentUser()) return

    const { error } = await supabase
      .from('food_item_events')
      .insert({
        id: event.id,
        food_item_id: event.food_item_id,
        group_id: getCurrentGroupId(),
        user_id: getCurrentUser()?.id,
        event_type: event.event_type,
        quantity_affected: event.quantity_affected,
        disposal_reason: event.disposal_reason,
        disposal_notes: event.disposal_notes,
        created_at: event.created_at.toISOString()
      })

    if (error) throw error

    // Mark as synced locally
    await db.executeSql(
      'UPDATE local_analytics_events SET sync_status = ? WHERE id = ?',
      ['synced', event.id]
    )

  } catch (error) {
    console.log('Analytics sync failed, will retry later:', error)
    // Event remains in 'pending_upload' status for later retry
  }
}

// ===== USER-FRIENDLY TRACKING METHODS =====

/**
 * Mark item as completely used
 */
export const markItemUsed = async (itemId: string, notes?: string): Promise<void> => {
  await trackFoodItemEvent(itemId, 'used_completely', 1, undefined, notes)
}

/**
 * Mark item as partially used
 */
export const markItemPartiallyUsed = async (
  itemId: string, 
  quantityUsed: number, 
  notes?: string
): Promise<void> => {
  await trackFoodItemEvent(itemId, 'used_partially', quantityUsed, undefined, notes)
}

/**
 * Mark item as thrown away
 */
export const markItemThrownAway = async (
  itemId: string,
  reason: DisposalReason,
  notes?: string
): Promise<void> => {
  await trackFoodItemEvent(itemId, 'thrown_away', 1, reason, notes)
}

/**
 * Mark item as expired and unused
 */
export const markItemExpired = async (itemId: string, notes?: string): Promise<void> => {
  await trackFoodItemEvent(itemId, 'expired_unused', 1, 'expired', notes)
}

/**
 * Mark item as gifted to someone
 */
export const markItemGifted = async (itemId: string, notes?: string): Promise<void> => {
  await trackFoodItemEvent(itemId, 'gifted', 1, undefined, notes)
}

// ===== ANALYTICS RETRIEVAL & INSIGHTS =====

/**
 * Get comprehensive waste analytics for the group
 */
export const getWasteAnalytics = async (timeRange: 'week' | 'month' | 'year' = 'month'): Promise<WasteAnalytics> => {
  try {
    const groupId = getCurrentGroupId()
    if (!groupId) throw new Error('No group selected')

    // Get analytics from cloud for group-wide insights
    const { data: groupAnalytics, error } = await supabase
      .from('waste_summary_by_category')
      .select('*')
      .eq('group_id', groupId)

    if (error) throw error

    // Calculate comprehensive analytics
    const totalItems = groupAnalytics.reduce((sum: number, cat: any) => sum + cat.total_events, 0)
    const wastedItems = groupAnalytics.reduce((sum: number, cat: any) => sum + cat.thrown_away_count + cat.expired_count, 0)
    const usedItems = groupAnalytics.reduce((sum: number, cat: any) => sum + cat.used_count, 0)
    
    const wastePercentage = totalItems > 0 ? (wastedItems / totalItems) * 100 : 0

    // Get monthly trends
    const { data: monthlyTrends } = await supabase
      .from('monthly_waste_trends')
      .select('*')
      .eq('group_id', groupId)
      .order('month', { ascending: false })
      .limit(12)

    // Calculate potential savings (assume $2 per wasted item)
    const monthlySavings = wastedItems * 2

    return {
      totalItemsAdded: totalItems,
      totalItemsUsed: usedItems,
      totalItemsWasted: wastedItems,
      wastePercentage: Math.round(wastePercentage * 100) / 100,
      avgDaysBeforeExpiry: calculateAvgDaysBeforeExpiry(groupAnalytics),
      wasteByCategory: mapCategoryWaste(groupAnalytics),
      wasteByLocation: await getWasteByLocation(groupId),
      monthlySavings,
      recommendations: generateWasteReductions(groupAnalytics, monthlyTrends)
    }

  } catch (error) {
    console.error('Failed to get waste analytics:', error)
    // Fallback to local analytics if cloud fails
    return await getLocalWasteAnalytics()
  }
}

/**
 * Generate personalized waste reduction recommendations
 */
const generateWasteReductions = (
  categoryData: any[], 
  monthlyTrends: any[]
): WasteReduction[] => {
  const recommendations: WasteReduction[] = []

  // Find most wasted category
  const mostWastedCategory = categoryData
    .sort((a, b) => b.waste_percentage - a.waste_percentage)[0]

  if (mostWastedCategory && mostWastedCategory.waste_percentage > 30) {
    recommendations.push({
      type: 'category',
      message: `You waste ${mostWastedCategory.waste_percentage.toFixed(1)}% of ${mostWastedCategory.category_name}`,
      impact: `Reducing this by half could save you $${(mostWastedCategory.thrown_away_count * 2 * 0.5).toFixed(0)} monthly`,
      actionable: true
    })
  }

  // Check for improving trends
  if (monthlyTrends.length >= 2) {
    const currentMonth = monthlyTrends[0]
    const lastMonth = monthlyTrends[1]
    
    if (currentMonth.items_thrown < lastMonth.items_thrown) {
      recommendations.push({
        type: 'timing',
        message: `Great job! You've reduced waste by ${lastMonth.items_thrown - currentMonth.items_thrown} items this month`,
        impact: `You're saving approximately $${((lastMonth.items_thrown - currentMonth.items_thrown) * 2).toFixed(0)} monthly`,
        actionable: false
      })
    }
  }

  return recommendations
}

/**
 * Get real-time analytics updates from group members
 */
export const subscribeToAnalyticsUpdates = (
  groupId: string,
  onUpdate: (analytics: WasteAnalytics) => void
): void => {
  const subscription = supabase
    .channel(`analytics-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'food_item_events',
        filter: `group_id=eq.${groupId}`
      },
             async (payload: any) => {
         console.log('Analytics update from group member:', payload)
        
        // Refresh analytics and notify UI
        const updatedAnalytics = await getWasteAnalytics()
        onUpdate(updatedAnalytics)
      }
    )
    .subscribe()

  // Store subscription for cleanup
  return subscription
}

/**
 * Sync all pending analytics events to cloud
 */
export const syncPendingAnalytics = async (): Promise<void> => {
  try {
    // Get all pending events from local database
    const [results] = await db.executeSql(
      'SELECT * FROM local_analytics_events WHERE sync_status = ?',
      ['pending_upload']
    )

    const pendingEvents = results.rows.raw()

    for (const event of pendingEvents) {
      await syncAnalyticsToCloud({
        ...event,
        created_at: new Date(event.created_at)
      })
    }

    console.log(`📊 Synced ${pendingEvents.length} pending analytics events`)

  } catch (error) {
    console.error('Failed to sync pending analytics:', error)
  }
}

// ===== UTILITY FUNCTIONS =====

const calculateAvgDaysBeforeExpiry = (data: any[]): number => {
  const validDays = data
    .map(cat => cat.avg_days_before_expiry)
    .filter(days => days !== null && days !== undefined)
  
  return validDays.length > 0 
    ? Math.round((validDays.reduce((sum, days) => sum + days, 0) / validDays.length) * 100) / 100
    : 0
}

const mapCategoryWaste = (data: any[]): CategoryWaste[] => {
  return data.map(cat => ({
    categoryName: cat.category_name || 'Unknown',
    totalItems: cat.total_events,
    wastedItems: cat.thrown_away_count + cat.expired_count,
    wastePercentage: cat.waste_percentage,
    avgDaysWasted: cat.avg_days_before_expiry || 0
  }))
}

const getWasteByLocation = async (groupId: string): Promise<LocationWaste[]> => {
  // Similar implementation for location-based waste analysis
  // This would query food_items joined with locations
  return []
}

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const isOnline = (): boolean => {
  // Implement your network connectivity check
  return true
}

const getCurrentUser = () => {
  // Get current authenticated user
  return supabase.auth.getUser()
}

const getCurrentGroupId = (): string => {
  // Get current group ID from your app state
  return 'your-group-id'
}

const getLocalWasteAnalytics = async (): Promise<WasteAnalytics> => {
  // Fallback analytics from local database when offline
  // Implement based on your local SQLite schema
  return {
    totalItemsAdded: 0,
    totalItemsUsed: 0,
    totalItemsWasted: 0,
    wastePercentage: 0,
    avgDaysBeforeExpiry: 0,
    wasteByCategory: [],
    wasteByLocation: [],
    monthlySavings: 0,
    recommendations: []
  }
}

// ===== USAGE EXAMPLES =====

/*
// Example: When user taps "Used" button
await markItemUsed(itemId, "Made a delicious dinner!")

// Example: When user taps "Throw Away" button  
await markItemThrownAway(itemId, "expired", "Found it moldy in the fridge")

// Example: When checking expired items automatically
await markItemExpired(itemId, "Auto-detected expiry")

// Example: Get analytics for dashboard
const analytics = await getWasteAnalytics('month')
console.log(`Waste percentage: ${analytics.wastePercentage}%`)
console.log(`Potential monthly savings: $${analytics.monthlySavings}`)

// Example: Subscribe to real-time updates
const subscription = subscribeToAnalyticsUpdates(groupId, (analytics) => {
  setAnalyticsState(analytics)
  showNotification(`Group waste reduced to ${analytics.wastePercentage}%!`)
})
*/ 