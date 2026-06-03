-- Migration 005: Category and location ordering fields
-- Adds fields already used by backend category/location services.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS section VARCHAR(100) NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NULL;

ALTER TABLE locations ADD COLUMN IF NOT EXISTS section VARCHAR(100) NULL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS sort_order INTEGER NULL;

CREATE INDEX IF NOT EXISTS idx_categories_section_sort_order
  ON categories(section, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_locations_section_sort_order
  ON locations(section, sort_order)
  WHERE deleted_at IS NULL;
