-- Expiry Alert - Complete Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE USER & DEVICE TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Devices table (for device-bound refresh tokens)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_uuid VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'mobile', 'web', 'tablet'
    platform VARCHAR(50), -- 'ios', 'android', 'web'
    refresh_token_hash VARCHAR(255),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_uuid)
);

-- User settings table
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    price_tracking_enabled BOOLEAN DEFAULT false,
    notification_time TIME DEFAULT '09:00',
    expiring_soon_days INTEGER DEFAULT 3,
    expiring_today_alerts BOOLEAN DEFAULT true,
    expired_alerts BOOLEAN DEFAULT true,
    theme VARCHAR(50) DEFAULT 'original',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GROUP & MEMBERSHIP TABLES
-- =====================================================

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(12) UNIQUE,
    max_members INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Group memberships
CREATE TABLE group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, invited_email)
);

-- =====================================================
-- FOOD DATA TABLES
-- =====================================================

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INTEGER DEFAULT 1
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    temperature_zone VARCHAR(20), -- 'room', 'cold', 'frozen'
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INTEGER DEFAULT 1
);

-- Food items table
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(50),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    purchase_date DATE,
    expiry_date DATE,
    notes TEXT,
    image_url TEXT,
    barcode VARCHAR(255),
    purchase_price DECIMAL(10,2),
    estimated_value DECIMAL(10,2),
    original_quantity INTEGER DEFAULT 1,
    remaining_quantity INTEGER DEFAULT 1,
    is_consumed BOOLEAN DEFAULT false,
    consumed_at TIMESTAMPTZ,
    consumed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_used_at TIMESTAMPTZ,
    usage_frequency INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INTEGER DEFAULT 1,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

-- =====================================================
-- FOOD WASTE INTELLIGENCE TABLES
-- =====================================================

-- Food item events (consumption/disposal tracking)
CREATE TABLE food_item_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('used_completely', 'used_partially', 'thrown_away', 'gifted', 'expired_unused')),
    quantity_affected INTEGER DEFAULT 1,
    disposal_reason VARCHAR(20) CHECK (disposal_reason IN ('expired', 'spoiled', 'too_much', 'dislike', 'forgotten', 'other')),
    price_at_disposal DECIMAL(10,2),
    days_since_purchase INTEGER,
    days_before_expiry INTEGER,
    location_at_disposal UUID REFERENCES locations(id),
    category_at_disposal UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group analytics (aggregated stats cache)
CREATE TABLE group_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Usage metrics
    total_items_added INTEGER DEFAULT 0,
    total_items_used INTEGER DEFAULT 0,
    total_items_thrown_away INTEGER DEFAULT 0,
    total_items_expired INTEGER DEFAULT 0,
    
    -- Waste metrics
    waste_percentage DECIMAL(5,2) DEFAULT 0,
    avg_days_before_expiry DECIMAL(5,2) DEFAULT 0,
    most_wasted_category UUID REFERENCES categories(id),
    most_wasted_location UUID REFERENCES locations(id),
    
    -- Financial estimates
    estimated_waste_value DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, analysis_date)
);

-- =====================================================
-- SHOPPING & WISH LISTS
-- =====================================================

-- Shopping items
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(50),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_purchased BOOLEAN DEFAULT false,
    purchased_at TIMESTAMPTZ,
    purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INTEGER DEFAULT 1
);

-- Wish items
CREATE TABLE wish_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    version INTEGER DEFAULT 1
);

-- =====================================================
-- SYNC TRACKING
-- =====================================================

-- Sync log (track last sync per device)
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    items_pushed INTEGER DEFAULT 0,
    items_pulled INTEGER DEFAULT 0,
    sync_status VARCHAR(20) DEFAULT 'success' CHECK (sync_status IN ('success', 'partial', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Device indexes
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_last_active ON devices(last_active_at);

-- Group indexes
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);

-- Membership indexes
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);

-- Invitation indexes
CREATE INDEX idx_invitations_invited_email ON invitations(invited_email);
CREATE INDEX idx_invitations_group_id ON invitations(group_id);
CREATE INDEX idx_invitations_invite_code ON invitations(invite_code);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Food item indexes
CREATE INDEX idx_food_items_group_id ON food_items(group_id);
CREATE INDEX idx_food_items_created_by ON food_items(created_by);
CREATE INDEX idx_food_items_expiry_date ON food_items(expiry_date);
CREATE INDEX idx_food_items_category_id ON food_items(category_id);
CREATE INDEX idx_food_items_location_id ON food_items(location_id);
CREATE INDEX idx_food_items_deleted_at ON food_items(deleted_at) WHERE deleted_at IS NULL;

-- Event indexes
CREATE INDEX idx_food_item_events_food_item_id ON food_item_events(food_item_id);
CREATE INDEX idx_food_item_events_group_id ON food_item_events(group_id);
CREATE INDEX idx_food_item_events_user_id ON food_item_events(user_id);
CREATE INDEX idx_food_item_events_created_at ON food_item_events(created_at);
CREATE INDEX idx_food_item_events_event_type ON food_item_events(event_type);

-- Analytics indexes
CREATE INDEX idx_group_analytics_group_date ON group_analytics(group_id, analysis_date);

-- Sync log indexes
CREATE INDEX idx_sync_log_device_id ON sync_log(device_id);
CREATE INDEX idx_sync_log_user_id ON sync_log(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wish_items_updated_at BEFORE UPDATE ON wish_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_analytics_updated_at BEFORE UPDATE ON group_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate analytics on food item events
CREATE OR REPLACE FUNCTION calculate_food_item_event_analytics()
RETURNS TRIGGER AS $$
DECLARE
    purchase_date_val DATE;
    expiry_date_val DATE;
BEGIN
    -- Get food item dates
    SELECT purchase_date, expiry_date INTO purchase_date_val, expiry_date_val
    FROM food_items WHERE id = NEW.food_item_id;
    
    -- Calculate days since purchase
    IF purchase_date_val IS NOT NULL THEN
        NEW.days_since_purchase := EXTRACT(DAY FROM (NEW.created_at::date - purchase_date_val));
    END IF;
    
    -- Calculate days before expiry (negative if expired)
    IF expiry_date_val IS NOT NULL THEN
        NEW.days_before_expiry := expiry_date_val - NEW.created_at::date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER food_item_event_analytics
    BEFORE INSERT ON food_item_events
    FOR EACH ROW EXECUTE FUNCTION calculate_food_item_event_analytics();

-- Generate invite code on invitation creation
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitation_generate_code
    BEFORE INSERT ON invitations
    FOR EACH ROW EXECUTE FUNCTION generate_invite_code();

-- Generate invite code for groups
CREATE OR REPLACE FUNCTION generate_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_generate_invite_code
    BEFORE INSERT ON groups
    FOR EACH ROW EXECUTE FUNCTION generate_group_invite_code();

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default categories (no group_id = available to all)
INSERT INTO categories (name, icon, color, is_default) VALUES
('Fruits', '🍎', '#FF6B6B', true),
('Vegetables', '🥕', '#4ECDC4', true),
('Dairy', '🥛', '#45B7D1', true),
('Meat & Poultry', '🍖', '#96CEB4', true),
('Beverages', '🥤', '#FFEAA7', true),
('Snacks', '🍪', '#DDA0DD', true),
('Canned Goods', '🥫', '#98D8C8', true),
('Frozen Foods', '❄️', '#74B9FF', true),
('Bread & Bakery', '🍞', '#FDCB6E', true),
('Other', '📦', '#A29BFE', true);

-- Insert default locations (no group_id = available to all)
INSERT INTO locations (name, icon, temperature_zone, is_default) VALUES
('Refrigerator', '🧊', 'cold', true),
('Freezer', '❄️', 'frozen', true),
('Pantry', '🗄️', 'room', true),
('Counter', '🏠', 'room', true),
('Cabinet', '🚪', 'room', true),
('Basement', '🏚️', 'room', true),
('Garage', '🚗', 'room', true),
('Office', '💼', 'room', true);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- Waste summary by category
CREATE VIEW waste_summary_by_category AS
SELECT 
    g.id as group_id,
    g.name as group_name,
    c.name as category_name,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE fie.event_type = 'thrown_away') as thrown_away_count,
    COUNT(*) FILTER (WHERE fie.event_type = 'expired_unused') as expired_count,
    COUNT(*) FILTER (WHERE fie.event_type IN ('used_completely', 'used_partially')) as used_count,
    ROUND(
        (COUNT(*) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused'))::decimal / 
         NULLIF(COUNT(*), 0) * 100), 2
    ) as waste_percentage
FROM food_item_events fie
JOIN food_items fi ON fie.food_item_id = fi.id
JOIN groups g ON fie.group_id = g.id
LEFT JOIN categories c ON fi.category_id = c.id
WHERE fie.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY g.id, g.name, c.id, c.name
ORDER BY waste_percentage DESC;

-- Monthly waste trends
CREATE VIEW monthly_waste_trends AS
SELECT 
    group_id,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) FILTER (WHERE event_type = 'thrown_away') as items_thrown,
    COUNT(*) FILTER (WHERE event_type = 'expired_unused') as items_expired,
    COUNT(*) FILTER (WHERE event_type IN ('used_completely', 'used_partially')) as items_used,
    ROUND(AVG(days_before_expiry) FILTER (WHERE event_type = 'thrown_away'), 2) as avg_days_before_expiry,
    SUM(price_at_disposal) FILTER (WHERE event_type IN ('thrown_away', 'expired_unused')) as total_waste_value
FROM food_item_events
GROUP BY group_id, DATE_TRUNC('month', created_at)
ORDER BY group_id, month;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Grant permissions (adjust as needed for your user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO expiry_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO expiry_user;

