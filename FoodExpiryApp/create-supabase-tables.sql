-- Food Expiry App - Supabase Database Creation Script
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE plan_type AS ENUM ('free', 'family');
CREATE TYPE disposal_reason AS ENUM ('expired', 'spoiled', 'too_much', 'dislike', 'forgotten', 'other');
CREATE TYPE consumption_type AS ENUM ('used_completely', 'used_partially', 'thrown_away', 'gifted', 'expired_unused');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    language_preference TEXT DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"expiry_alerts": true, "group_invites": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'base64'),
    max_members INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group memberships (many-to-many)
CREATE TABLE group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    plan_type plan_type NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'trial',
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    annual_price DECIMAL(10,2) DEFAULT 120.00,
    paid_price DECIMAL(10,2) DEFAULT 40.00,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, invited_email)
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, group_id)
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    temperature_zone TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, group_id)
);

-- Food items table
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    purchase_date DATE,
    expiry_date DATE,
    notes TEXT,
    image_url TEXT,
    barcode TEXT,
    is_consumed BOOLEAN DEFAULT false,
    consumed_at TIMESTAMP WITH TIME ZONE,
    consumed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    purchase_price DECIMAL(10,2),
    estimated_value DECIMAL(10,2),
    original_quantity INTEGER DEFAULT 1,
    remaining_quantity INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_frequency INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food item events table (analytics)
CREATE TABLE food_item_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type consumption_type NOT NULL,
    quantity_affected INTEGER DEFAULT 1,
    disposal_reason disposal_reason,
    disposal_notes TEXT,
    days_since_purchase INTEGER,
    days_before_expiry INTEGER,
    location_at_disposal UUID REFERENCES locations(id),
    category_at_disposal UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping list items
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_purchased BOOLEAN DEFAULT false,
    purchased_at TIMESTAMP WITH TIME ZONE,
    purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_food_items_group_id ON food_items(group_id);
CREATE INDEX idx_food_items_expiry_date ON food_items(expiry_date);
CREATE INDEX idx_food_items_created_by ON food_items(created_by);
CREATE INDEX idx_food_item_events_group_id ON food_item_events(group_id);
CREATE INDEX idx_food_item_events_user_id ON food_item_events(user_id);
CREATE INDEX idx_food_item_events_food_item_id ON food_item_events(food_item_id);
CREATE INDEX idx_invitations_invited_email ON invitations(invited_email);
CREATE INDEX idx_invitations_group_id ON invitations(group_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Insert default categories
INSERT INTO categories (name, icon, color, is_default) VALUES
('Fruits', 'apple', '#FF6B6B', true),
('Vegetables', 'carrot', '#4ECDC4', true),
('Dairy', 'milk', '#45B7D1', true),
('Meat & Poultry', 'meat', '#96CEB4', true),
('Beverages', 'wine-glass', '#FFEAA7', true),
('Snacks', 'cookie', '#DDA0DD', true),
('Canned Goods', 'can', '#98D8C8', true),
('Frozen Foods', 'snowflake', '#74B9FF', true),
('Bread & Bakery', 'bread-slice', '#FDCB6E', true),
('Other', 'box', '#A29BFE', true);

-- Insert default locations
INSERT INTO locations (name, icon, temperature_zone, is_default) VALUES
('Refrigerator', 'fridge', 'cold', true),
('Freezer', 'snowflake', 'frozen', true),
('Pantry', 'cabinet', 'room', true),
('Counter', 'home', 'room', true),
('Cabinet', 'cabinet', 'room', true),
('Basement', 'basement', 'room', true),
('Garage', 'garage', 'room', true),
('Office', 'briefcase', 'room', true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate analytics when food item event occurs
CREATE OR REPLACE FUNCTION calculate_food_item_analytics()
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
        NEW.days_since_purchase := NEW.created_at::date - purchase_date_val;
    END IF;
    
    -- Calculate days before expiry (negative if expired)
    IF expiry_date_val IS NOT NULL THEN
        NEW.days_before_expiry := expiry_date_val - NEW.created_at::date;
    END IF;
    
    -- Update food item analytics fields
    UPDATE food_items 
    SET 
        last_used_at = NEW.created_at,
        usage_frequency = usage_frequency + 1,
        remaining_quantity = CASE 
            WHEN NEW.event_type IN ('used_completely', 'thrown_away', 'expired_unused') THEN 0
            ELSE GREATEST(0, remaining_quantity - NEW.quantity_affected)
        END,
        is_consumed = CASE 
            WHEN NEW.event_type IN ('used_completely', 'thrown_away', 'expired_unused') THEN true
            ELSE false
        END,
        consumed_at = CASE 
            WHEN NEW.event_type IN ('used_completely', 'thrown_away', 'expired_unused') THEN NEW.created_at
            ELSE consumed_at
        END,
        consumed_by = NEW.user_id
    WHERE id = NEW.food_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for analytics calculation
CREATE TRIGGER food_item_event_analytics
    BEFORE INSERT ON food_item_events
    FOR EACH ROW EXECUTE FUNCTION calculate_food_item_analytics(); 