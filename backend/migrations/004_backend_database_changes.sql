-- Migration 004: BACKEND_DATABASE_CHANGES (Part A + Part B)
-- Part A: is_customization for categories and locations
-- Part B: shopping_items new columns; wish_items currency_code and rating 1-5

-- =====================================================
-- PART A: Categories & Locations
-- =====================================================

-- Categories: is_customization (false = seed/default, true = user-added)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_customization BOOLEAN DEFAULT false;
UPDATE categories SET is_customization = false WHERE is_customization IS NULL;

-- Locations: is_customization
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_customization BOOLEAN DEFAULT false;
UPDATE locations SET is_customization = false WHERE is_customization IS NULL;

-- =====================================================
-- PART B: Shopping items
-- =====================================================

ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS where_to_buy VARCHAR(255) NULL;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS moved_to_inventory BOOLEAN DEFAULT false;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL;

-- =====================================================
-- PART B: Wish items
-- =====================================================

ALTER TABLE wish_items ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) NULL;

-- Rating: desire level 1-5. Normalize existing invalid values then add check.
UPDATE wish_items SET rating = 3 WHERE rating IS NULL OR rating < 1 OR rating > 5;
ALTER TABLE wish_items DROP CONSTRAINT IF EXISTS wish_items_rating_check;
ALTER TABLE wish_items ADD CONSTRAINT wish_items_rating_check CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE wish_items ALTER COLUMN rating SET DEFAULT 3;
