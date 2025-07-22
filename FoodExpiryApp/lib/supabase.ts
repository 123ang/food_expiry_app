import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymojsxntclhpkikmirix.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltb2pzeG50Y2xocGtpa21pcml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODI4NzAsImV4cCI6MjA2ODc1ODg3MH0.u9pdzkuWUZyIhMSGKCgoq3i9erB6xxnuzdjJHiKdUOw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          language_preference: string
          notification_preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          language_preference?: string
          notification_preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          language_preference?: string
          notification_preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          invite_code: string
          max_members: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          invite_code?: string
          max_members?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          invite_code?: string
          max_members?: number
          created_at?: string
          updated_at?: string
        }
      }
      food_items: {
        Row: {
          id: string
          group_id: string
          created_by: string
          name: string
          brand: string | null
          quantity: number
          unit: string | null
          category_id: string | null
          location_id: string | null
          purchase_date: string | null
          expiry_date: string | null
          notes: string | null
          image_url: string | null
          barcode: string | null
          is_consumed: boolean
          consumed_at: string | null
          consumed_by: string | null
          purchase_price: number | null
          estimated_value: number | null
          original_quantity: number
          remaining_quantity: number
          last_used_at: string | null
          usage_frequency: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          created_by: string
          name: string
          brand?: string | null
          quantity?: number
          unit?: string | null
          category_id?: string | null
          location_id?: string | null
          purchase_date?: string | null
          expiry_date?: string | null
          notes?: string | null
          image_url?: string | null
          barcode?: string | null
          is_consumed?: boolean
          consumed_at?: string | null
          consumed_by?: string | null
          purchase_price?: number | null
          estimated_value?: number | null
          original_quantity?: number
          remaining_quantity?: number
          last_used_at?: string | null
          usage_frequency?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          created_by?: string
          name?: string
          brand?: string | null
          quantity?: number
          unit?: string | null
          category_id?: string | null
          location_id?: string | null
          purchase_date?: string | null
          expiry_date?: string | null
          notes?: string | null
          image_url?: string | null
          barcode?: string | null
          is_consumed?: boolean
          consumed_at?: string | null
          consumed_by?: string | null
          purchase_price?: number | null
          estimated_value?: number | null
          original_quantity?: number
          remaining_quantity?: number
          last_used_at?: string | null
          usage_frequency?: number
          created_at?: string
          updated_at?: string
        }
      }
      food_item_events: {
        Row: {
          id: string
          food_item_id: string
          group_id: string
          user_id: string
          event_type: 'used_completely' | 'used_partially' | 'thrown_away' | 'gifted' | 'expired_unused'
          quantity_affected: number
          disposal_reason: 'expired' | 'spoiled' | 'too_much' | 'dislike' | 'forgotten' | 'other' | null
          disposal_notes: string | null
          days_since_purchase: number | null
          days_before_expiry: number | null
          location_at_disposal: string | null
          category_at_disposal: string | null
          created_at: string
        }
        Insert: {
          id?: string
          food_item_id: string
          group_id: string
          user_id: string
          event_type: 'used_completely' | 'used_partially' | 'thrown_away' | 'gifted' | 'expired_unused'
          quantity_affected?: number
          disposal_reason?: 'expired' | 'spoiled' | 'too_much' | 'dislike' | 'forgotten' | 'other' | null
          disposal_notes?: string | null
          days_since_purchase?: number | null
          days_before_expiry?: number | null
          location_at_disposal?: string | null
          category_at_disposal?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          food_item_id?: string
          group_id?: string
          user_id?: string
          event_type?: 'used_completely' | 'used_partially' | 'thrown_away' | 'gifted' | 'expired_unused'
          quantity_affected?: number
          disposal_reason?: 'expired' | 'spoiled' | 'too_much' | 'dislike' | 'forgotten' | 'other' | null
          disposal_notes?: string | null
          days_since_purchase?: number | null
          days_before_expiry?: number | null
          location_at_disposal?: string | null
          category_at_disposal?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          group_id: string | null
          plan_type: 'free' | 'family'
          status: 'active' | 'cancelled' | 'expired' | 'trial'
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          annual_price: number
          paid_price: number
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id?: string | null
          plan_type?: 'free' | 'family'
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          annual_price?: number
          paid_price?: number
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string | null
          plan_type?: 'free' | 'family'
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          annual_price?: number
          paid_price?: number
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 