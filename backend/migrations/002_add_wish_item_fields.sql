-- Migration: Add price and rating fields to wish_items table
-- Date: 2026-01-09

-- Add price and rating columns to wish_items
ALTER TABLE wish_items 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing records to have default rating of 0
UPDATE wish_items SET rating = 0 WHERE rating IS NULL;
