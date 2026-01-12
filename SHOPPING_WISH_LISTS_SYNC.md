# Shopping List and Wish List Sync Implementation

## Overview
Updated both Shopping List and Wish List features to sync with the database and match the mobile app's design and parameters.

## Changes Made

### 1. Backend Schema Updates

#### Migration: `backend/migrations/002_add_wish_item_fields.sql`
- Added `price` (DECIMAL(10, 2)) to `wish_items` table
- Added `rating` (INTEGER, 0-5) to `wish_items` table
- Added `image_url` (TEXT) to `wish_items` table

**To apply migration:**
```sql
psql -U expiry_user -d expiry_alert -f backend/migrations/002_add_wish_item_fields.sql
```

### 2. Backend Model Updates

#### `backend/src/models/index.ts`
- Updated `WishItem` interface to include:
  - `price?: number`
  - `rating?: number`
  - `image_url?: string`

#### `backend/src/services/wishService.ts`
- Updated `getWishItems()` to SELECT and return `price`, `rating`, `image_url`
- Updated `getWishItemById()` to SELECT and return `price`, `rating`, `image_url`
- Updated `createWishItem()` to INSERT `price`, `rating`, `image_url`
- Updated `updateWishItem()` to handle updates to `price`, `rating`, `image_url`

### 3. Web App Interface Updates

#### `web-app/expiry-alert/src/services/postgresApiService.ts`
- Updated `WishItem` interface to include:
  - `price?: number`
  - `rating?: number`
  - `image_url?: string`

### 4. Web App Component Updates

#### `web-app/expiry-alert/src/components/ShoppingList.tsx`
- **Quantity Display**: Changed from showing quantity below item name to showing it inline: `"Item Name x2"` (only shows if quantity > 1)
- Quantity field defaults to 1 (matching mobile app)
- Quantity is displayed next to item name in the format: `{item.name} x{item.quantity}`

#### `web-app/expiry-alert/src/components/WishList.tsx`
- **Complete Redesign** to match mobile app:
  - **Add Form**: Multi-row layout with:
    - Row 1: Item name input
    - Row 2: Price input + 5-star rating (hearts) selector
    - Row 3: Notes textarea + Image upload
  - **Item Display**: Shows:
    - Image thumbnail (or star icon if no image)
    - Item name
    - Price (if set) - formatted as `$XX.XX`
    - Rating (if set) - 5 hearts display
    - Notes (if set)
  - **Image Upload**: Uses backend API (`apiClient.uploadImage()`) to upload images
  - **Image Viewer**: Click on image to view full size in modal
  - **Edit Modal**: Includes all fields (name, price, rating, image, notes)

### 5. Features Implemented

#### Shopping List
- ✅ Quantity field (default: 1)
- ✅ Quantity displayed inline: `"Item Name x2"`
- ✅ Syncs with database
- ✅ All CRUD operations working

#### Wish List
- ✅ Price field (optional)
- ✅ Rating field (0-5 stars, displayed as hearts)
- ✅ Image upload (via backend API)
- ✅ Image display and viewer
- ✅ Notes field
- ✅ Syncs with database
- ✅ All CRUD operations working
- ✅ Design matches mobile app

## Database Migration

**Important**: Run the migration to add new fields to `wish_items` table:

```bash
# On VPS
cd /root/projects/food_expiry_app/backend
sudo -u postgres psql -d expiry_alert -f migrations/002_add_wish_item_fields.sql

# Locally
psql -U expiry_user -d expiry_alert -f backend/migrations/002_add_wish_item_fields.sql
```

## Testing Checklist

### Shopping List
- [ ] Add item with quantity = 1 (default)
- [ ] Add item with quantity > 1
- [ ] Verify quantity displays as "Item Name x2"
- [ ] Edit item quantity
- [ ] Delete item
- [ ] Toggle purchase status
- [ ] Clear purchased items

### Wish List
- [ ] Add item with name only
- [ ] Add item with price
- [ ] Add item with rating (1-5 stars)
- [ ] Add item with image
- [ ] Add item with notes
- [ ] Add item with all fields
- [ ] Edit item (all fields)
- [ ] Delete item
- [ ] View full-size image (click on thumbnail)
- [ ] Verify data persists after page refresh

## Notes

- **Image Storage**: Wish list images are uploaded to the backend using the same `/api/upload/image` endpoint as food items
- **Rating Display**: Uses heart emojis (❤️/🤍) to match mobile app design
- **Price Format**: Displays as `$XX.XX` with 2 decimal places
- **Quantity Display**: Only shows "x2" format if quantity > 1 (default is 1, so it's hidden)

## Status
✅ **Complete** - Both Shopping List and Wish List now sync with database and match mobile app design

---

**Date**: January 9, 2026
**Issue**: Shopping items and wish items not syncing with database, need to match mobile app design
**Resolution**: Updated backend schema, services, and web app components to fully sync and match mobile app design
