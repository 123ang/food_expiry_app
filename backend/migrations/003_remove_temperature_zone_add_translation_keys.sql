-- Migration: Remove temperature_zone column and add translation_key to categories
-- Date: 2026-01-11

-- Drop temperature_zone column from locations table (if it exists)
ALTER TABLE locations DROP COLUMN IF EXISTS temperature_zone;

-- Add translation_key column to categories table (if it doesn't exist)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS translation_key VARCHAR(100);

-- Add translation_key column to locations table (if it doesn't exist)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS translation_key VARCHAR(100);

-- Update existing default categories to use translation keys
UPDATE categories SET translation_key = 'category.fruits' WHERE name = 'Fruits' AND translation_key IS NULL;
UPDATE categories SET translation_key = 'category.vegetables' WHERE name = 'Vegetables' AND translation_key IS NULL;
UPDATE categories SET translation_key = 'category.dairy' WHERE name = 'Dairy' AND translation_key IS NULL;
UPDATE categories SET translation_key = 'category.meat' WHERE (name = 'Meat & Poultry' OR name = 'Meat') AND translation_key IS NULL;
UPDATE categories SET translation_key = 'category.snacks' WHERE name = 'Snacks' AND translation_key IS NULL;
UPDATE categories SET translation_key = 'category.desserts' WHERE name = 'Desserts' AND translation_key IS NULL;
UPDATE categories SET translation_key = 'category.seafood' WHERE name = 'Seafood' AND translation_key IS NULL;
UPDATE categories SET translation_key = 'category.bread' WHERE (name = 'Bread & Bakery' OR name = 'Bread') AND translation_key IS NULL;

-- Update existing default locations to use translation keys (if they don't have them)
UPDATE locations SET translation_key = 'defaultLocation.fridge' WHERE (name = 'Refrigerator' OR name LIKE '%Fridge%') AND translation_key IS NULL;
UPDATE locations SET translation_key = 'defaultLocation.freezer' WHERE name = 'Freezer' AND translation_key IS NULL;
UPDATE locations SET translation_key = 'defaultLocation.pantry' WHERE name = 'Pantry' AND translation_key IS NULL;
UPDATE locations SET translation_key = 'defaultLocation.counter' WHERE name = 'Counter' AND translation_key IS NULL;
