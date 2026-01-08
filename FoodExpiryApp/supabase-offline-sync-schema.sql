-- Food Expiry App - Supabase Offline-First Sync Schema
-- Based on DATABASE_SYNC.md requirements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop all existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS deleted_items CASCADE;
DROP TABLE IF EXISTS wish_items CASCADE;
DROP TABLE IF EXISTS shopping_items CASCADE;
DROP TABLE IF EXISTS food_items CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS group_memberships CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS sync_status_type CASCADE;

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE plan_type AS ENUM ('free', 'family');
CREATE TYPE sync_status_type AS ENUM ('pending', 'synced', 'conflict');

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_time TIMESTAMP WITH TIME ZONE
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

-- Categories table (adapted for offline-first sync)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    translation_key TEXT,
    cloud_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status_type DEFAULT 'synced',
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT false,
    
    UNIQUE(name, group_id)
);

-- Locations table (adapted for offline-first sync)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    translation_key TEXT,
    cloud_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status_type DEFAULT 'synced',
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT false,
    
    UNIQUE(name, group_id)
);

-- Food items table (main data to sync)
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    cloud_id TEXT UNIQUE,
    expiry_date DATE,
    reminder_days INTEGER,
    notes TEXT,
    image_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status_type DEFAULT 'pending',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Shopping list items (adapted for offline-first sync)
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    image_uri TEXT,
    done BOOLEAN DEFAULT false,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    cloud_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status_type DEFAULT 'pending',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Wish items (adapted for offline-first sync)
CREATE TABLE wish_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    notes TEXT,
    price TEXT,
    rating INTEGER,
    image_uri TEXT,
    done BOOLEAN DEFAULT false,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    cloud_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status_type DEFAULT 'pending',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Table to track deleted items (for sync)
CREATE TABLE deleted_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    item_id UUID NOT NULL,
    cloud_id TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE
);

-- Sync log table
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sync_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
    items_uploaded INTEGER DEFAULT 0,
    items_downloaded INTEGER DEFAULT 0,
    images_uploaded INTEGER DEFAULT 0,
    images_downloaded INTEGER DEFAULT 0,
    error TEXT
);

-- Create indexes for performance and sync
CREATE INDEX idx_food_items_cloud_id ON food_items(cloud_id);
CREATE INDEX idx_food_items_updated_at ON food_items(updated_at);
CREATE INDEX idx_food_items_sync_status ON food_items(sync_status);
CREATE INDEX idx_food_items_group_id ON food_items(group_id);

CREATE INDEX idx_categories_cloud_id ON categories(cloud_id);
CREATE INDEX idx_categories_updated_at ON categories(updated_at);
CREATE INDEX idx_categories_sync_status ON categories(sync_status);
CREATE INDEX idx_categories_group_id ON categories(group_id);

CREATE INDEX idx_locations_cloud_id ON locations(cloud_id);
CREATE INDEX idx_locations_updated_at ON locations(updated_at);
CREATE INDEX idx_locations_sync_status ON locations(sync_status);
CREATE INDEX idx_locations_group_id ON locations(group_id);

CREATE INDEX idx_shopping_items_cloud_id ON shopping_items(cloud_id);
CREATE INDEX idx_shopping_items_updated_at ON shopping_items(updated_at);
CREATE INDEX idx_shopping_items_sync_status ON shopping_items(sync_status);
CREATE INDEX idx_shopping_items_group_id ON shopping_items(group_id);

CREATE INDEX idx_wish_items_cloud_id ON wish_items(cloud_id);
CREATE INDEX idx_wish_items_updated_at ON wish_items(updated_at);
CREATE INDEX idx_wish_items_sync_status ON wish_items(sync_status);
CREATE INDEX idx_wish_items_group_id ON wish_items(group_id);

CREATE INDEX idx_deleted_items_table_name ON deleted_items(table_name);
CREATE INDEX idx_deleted_items_cloud_id ON deleted_items(cloud_id);
CREATE INDEX idx_deleted_items_group_id ON deleted_items(group_id);

CREATE INDEX idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX idx_sync_log_group_id ON sync_log(group_id);

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
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wish_items_updated_at BEFORE UPDATE ON wish_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for secure access
-- Users can only access their own data and data from groups they belong to
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users policy - users can only read/update their own records
CREATE POLICY users_policy ON users 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Group membership policy - users can read groups they belong to
CREATE POLICY group_membership_read ON group_memberships
    FOR SELECT USING (user_id = auth.uid());

-- Group read policy - users can read groups they belong to
CREATE POLICY group_read_policy ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = groups.id AND group_memberships.user_id = auth.uid()
        )
    );

-- Group modify policy - only owners/admins can modify their groups
CREATE POLICY group_modify_policy ON groups
    USING (
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = groups.id 
            AND group_memberships.user_id = auth.uid()
            AND group_memberships.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = groups.id 
            AND group_memberships.user_id = auth.uid()
            AND group_memberships.role IN ('owner', 'admin')
        )
    );

-- Food items policy - users can read/write items for their groups
CREATE POLICY food_items_policy ON food_items
    USING (
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = food_items.group_id 
            AND group_memberships.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = food_items.group_id 
            AND group_memberships.user_id = auth.uid()
        )
    );

-- Similar policies for other tables
CREATE POLICY categories_policy ON categories
    USING (
        group_id IS NULL OR
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = categories.group_id 
            AND group_memberships.user_id = auth.uid()
        )
    )
    WITH CHECK (
        group_id IS NULL OR
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = categories.group_id 
            AND group_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY locations_policy ON locations
    USING (
        group_id IS NULL OR
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = locations.group_id 
            AND group_memberships.user_id = auth.uid()
        )
    )
    WITH CHECK (
        group_id IS NULL OR
        EXISTS (
            SELECT 1 FROM group_memberships 
            WHERE group_memberships.group_id = locations.group_id 
            AND group_memberships.user_id = auth.uid()
        )
    );

-- Insert default categories
INSERT INTO categories (name, icon, translation_key, is_default) VALUES
('Fruits', 'fruit', 'category_fruits', true),
('Vegetables', 'vegetable', 'category_vegetables', true),
('Dairy', 'dairy', 'category_dairy', true),
('Meat', 'meat', 'category_meat', true),
('Seafood', 'fish', 'category_seafood', true),
('Beverages', 'beverage', 'category_beverages', true),
('Snacks', 'snack', 'category_snacks', true),
('Canned Goods', 'canned', 'category_canned', true),
('Frozen Foods', 'frozen', 'category_frozen', true),
('Other', 'misc', 'category_other', true);

-- Insert default locations
INSERT INTO locations (name, icon, translation_key, is_default) VALUES
('Refrigerator', 'fridge', 'location_refrigerator', true),
('Freezer', 'freezer', 'location_freezer', true),
('Pantry', 'pantry', 'location_pantry', true),
('Counter', 'counter', 'location_counter', true),
('Cabinet', 'cabinet', 'location_cabinet', true),
('Other', 'misc', 'location_other', true);

-- Create sync-related functions
-- Function to track deleted items
CREATE OR REPLACE FUNCTION track_deleted_item()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deleted_items (table_name, item_id, cloud_id, group_id)
    VALUES (TG_TABLE_NAME, OLD.id, OLD.cloud_id, OLD.group_id);
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Create delete triggers for sync-enabled tables
CREATE TRIGGER track_food_items_delete BEFORE DELETE ON food_items 
    FOR EACH ROW EXECUTE FUNCTION track_deleted_item();

CREATE TRIGGER track_categories_delete BEFORE DELETE ON categories 
    FOR EACH ROW EXECUTE FUNCTION track_deleted_item();

CREATE TRIGGER track_locations_delete BEFORE DELETE ON locations 
    FOR EACH ROW EXECUTE FUNCTION track_deleted_item();

CREATE TRIGGER track_shopping_items_delete BEFORE DELETE ON shopping_items 
    FOR EACH ROW EXECUTE FUNCTION track_deleted_item();

CREATE TRIGGER track_wish_items_delete BEFORE DELETE ON wish_items 
    FOR EACH ROW EXECUTE FUNCTION track_deleted_item();

-- Create function to get items for sync
CREATE OR REPLACE FUNCTION get_items_for_sync(
    p_group_id UUID,
    p_last_sync_time TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
    table_name TEXT,
    item_id UUID,
    cloud_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    item_data JSONB
) AS $$
BEGIN
    -- Food items
    RETURN QUERY
    SELECT 
        'food_items'::TEXT AS table_name,
        f.id AS item_id,
        f.cloud_id,
        f.updated_at,
        row_to_json(f)::JSONB AS item_data
    FROM 
        food_items f
    WHERE 
        f.group_id = p_group_id AND
        (f.updated_at > p_last_sync_time OR f.sync_status = 'pending'::sync_status_type);

    -- Categories
    RETURN QUERY
    SELECT 
        'categories'::TEXT AS table_name,
        c.id AS item_id,
        c.cloud_id,
        c.updated_at,
        row_to_json(c)::JSONB AS item_data
    FROM 
        categories c
    WHERE 
        c.group_id = p_group_id AND
        (c.updated_at > p_last_sync_time OR c.sync_status = 'pending'::sync_status_type);

    -- Locations
    RETURN QUERY
    SELECT 
        'locations'::TEXT AS table_name,
        l.id AS item_id,
        l.cloud_id,
        l.updated_at,
        row_to_json(l)::JSONB AS item_data
    FROM 
        locations l
    WHERE 
        l.group_id = p_group_id AND
        (l.updated_at > p_last_sync_time OR l.sync_status = 'pending'::sync_status_type);

    -- Shopping items
    RETURN QUERY
    SELECT 
        'shopping_items'::TEXT AS table_name,
        s.id AS item_id,
        s.cloud_id,
        s.updated_at,
        row_to_json(s)::JSONB AS item_data
    FROM 
        shopping_items s
    WHERE 
        s.group_id = p_group_id AND
        (s.updated_at > p_last_sync_time OR s.sync_status = 'pending'::sync_status_type);

    -- Wish items
    RETURN QUERY
    SELECT 
        'wish_items'::TEXT AS table_name,
        w.id AS item_id,
        w.cloud_id,
        w.updated_at,
        row_to_json(w)::JSONB AS item_data
    FROM 
        wish_items w
    WHERE 
        w.group_id = p_group_id AND
        (w.updated_at > p_last_sync_time OR w.sync_status = 'pending'::sync_status_type);

    -- Deleted items
    RETURN QUERY
    SELECT 
        'deleted_items'::TEXT AS table_name,
        d.id AS item_id,
        d.cloud_id,
        d.deleted_at AS updated_at,
        row_to_json(d)::JSONB AS item_data
    FROM 
        deleted_items d
    WHERE 
        d.group_id = p_group_id AND
        d.deleted_at > p_last_sync_time;
END;
$$ LANGUAGE plpgsql;

-- Create API for sync operations
CREATE OR REPLACE FUNCTION sync_data(
    p_group_id UUID,
    p_user_id UUID,
    p_last_sync_time TIMESTAMP WITH TIME ZONE,
    p_client_changes JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_server_changes JSONB;
    v_result JSONB;
    v_items_uploaded INTEGER := 0;
    v_items_downloaded INTEGER := 0;
    v_sync_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get changes from server side
    SELECT json_agg(data)::JSONB INTO v_server_changes
    FROM (
        SELECT * FROM get_items_for_sync(p_group_id, p_last_sync_time)
    ) AS data;
    
    -- Count items to download
    v_items_downloaded := jsonb_array_length(v_server_changes);
    
    -- Process client changes (would need more complex logic in a real implementation)
    -- This is simplified - in a real app, you'd handle conflicts, validate data, etc.
    v_items_uploaded := jsonb_array_length(p_client_changes);
    
    -- Log sync operation
    INSERT INTO sync_log (
        user_id, 
        group_id, 
        sync_time, 
        status, 
        items_uploaded, 
        items_downloaded
    ) VALUES (
        p_user_id,
        p_group_id,
        v_sync_time,
        'success',
        v_items_uploaded,
        v_items_downloaded
    );
    
    -- Update user's last sync time
    UPDATE users
    SET last_sync_time = v_sync_time
    WHERE id = p_user_id;
    
    -- Return results
    v_result := jsonb_build_object(
        'success', true,
        'sync_time', v_sync_time,
        'items_uploaded', v_items_uploaded,
        'items_downloaded', v_items_downloaded,
        'server_changes', v_server_changes
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
