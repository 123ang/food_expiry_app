# 🚀 Supabase Setup Instructions

## Step 1: Create Database Tables

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard
2. **Select your project**: `ymojsxntclhpkikmirix`
3. **Go to SQL Editor** (on the left sidebar)
4. **Copy and paste** the entire content from `create-supabase-tables.sql`
5. **Click "RUN"** to execute the script

This will create all the necessary tables for:
- ✅ User authentication and profiles
- ✅ Groups and memberships  
- ✅ Family subscriptions
- ✅ Food items with cloud sync
- ✅ Analytics tracking
- ✅ Default categories and locations

## Step 2: Enable Row Level Security (Optional)

If you want additional security policies, you can also run the `supabase-rls-policies.sql` script in the same way.

## Step 3: Verify Setup

After running the script, you should see these tables in your Database → Tables:
- `users`
- `groups`
- `group_memberships`
- `subscriptions`
- `invitations`
- `categories`
- `locations`
- `food_items`
- `food_item_events`
- `shopping_items`

## ✅ You're Done!

Your Food Expiry App now supports:
- 🔐 User authentication 
- 👥 Family groups (up to 4 members with subscription)
- 💰 Family packages ($40 discounted, $120 regular)
- ☁️ Cloud synchronization
- 📊 Usage analytics
- 📱 Real-time collaboration

The app will work offline-first and sync when connected to the internet! 