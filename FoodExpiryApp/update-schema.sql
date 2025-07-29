-- 1. Modify users table - remove timezone and avatar_url columns, add subscription_type
ALTER TABLE users 
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS avatar_url;

-- Add subscription_type field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_type plan_type DEFAULT 'free';

-- Update existing users to have 'free' subscription type
UPDATE users 
SET subscription_type = 'free' 
WHERE subscription_type IS NULL;

-- 2. Create wish_lists table
CREATE TABLE wish_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    notes TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    is_purchased BOOLEAN DEFAULT false,
    purchased_at TIMESTAMP WITH TIME ZONE,
    purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for wish_lists
CREATE INDEX idx_wish_lists_group_id ON wish_lists(group_id);
CREATE INDEX idx_wish_lists_created_by ON wish_lists(created_by);

-- Apply updated_at trigger to wish_lists
CREATE TRIGGER update_wish_lists_updated_at 
BEFORE UPDATE ON wish_lists 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for wish_lists (same pattern as other tables)
ALTER TABLE wish_lists ENABLE ROW LEVEL SECURITY;

-- Users can read wish_lists for groups they belong to
CREATE POLICY wish_lists_select_policy ON wish_lists 
FOR SELECT USING (
    group_id IN (
        SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
);

-- Users can insert wish_lists for groups they belong to
CREATE POLICY wish_lists_insert_policy ON wish_lists 
FOR INSERT WITH CHECK (
    group_id IN (
        SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
);

-- Users can update wish_lists for groups they belong to
CREATE POLICY wish_lists_update_policy ON wish_lists 
FOR UPDATE USING (
    group_id IN (
        SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
);

-- Users can delete wish_lists for groups they belong to
CREATE POLICY wish_lists_delete_policy ON wish_lists 
FOR DELETE USING (
    group_id IN (
        SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
);

-- 3. Create function to update user subscription type
CREATE OR REPLACE FUNCTION update_user_subscription_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's subscription_type based on their active subscription
    UPDATE users 
    SET subscription_type = (
        SELECT plan_type 
        FROM subscriptions 
        WHERE user_id = NEW.user_id 
        AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT 1
    )
    WHERE id = NEW.user_id;
    
    -- If no active subscription found, set to 'free'
    IF NOT FOUND THEN
        UPDATE users 
        SET subscription_type = 'free'
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically update user subscription type
DROP TRIGGER IF EXISTS update_user_subscription_trigger ON subscriptions;
CREATE TRIGGER update_user_subscription_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_subscription_type();

-- 5. Update existing users with their current subscription status
UPDATE users 
SET subscription_type = (
    SELECT plan_type 
    FROM subscriptions 
    WHERE user_id = users.id 
    AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = users.id 
    AND status = 'active'
);

-- Set remaining users to 'free' if they don't have active subscriptions
UPDATE users 
SET subscription_type = 'free'
WHERE subscription_type IS NULL; 