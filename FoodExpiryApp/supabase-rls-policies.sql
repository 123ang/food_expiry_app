-- Row Level Security Policies for Food Expiry App
-- Ensures users can only access data they have permission to see

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is in a group
CREATE OR REPLACE FUNCTION user_in_group(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_memberships 
        WHERE group_id = group_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's groups
CREATE OR REPLACE FUNCTION get_user_groups(user_uuid UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT group_id FROM group_memberships WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS table policies
CREATE POLICY "Users can read their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to read profiles of group members
CREATE POLICY "Users can read group member profiles" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_memberships gm1
            JOIN group_memberships gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = auth.uid() AND gm2.user_id = users.id
        )
    );

-- GROUPS table policies
CREATE POLICY "Users can read groups they belong to" ON groups
    FOR SELECT USING (user_in_group(id, auth.uid()));

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners can update their groups" ON groups
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group owners can delete their groups" ON groups
    FOR DELETE USING (auth.uid() = created_by);

-- Business rule: Users can only create one group
CREATE OR REPLACE FUNCTION check_user_group_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM groups WHERE created_by = NEW.created_by) >= 1 THEN
        RAISE EXCEPTION 'Users can only create one group';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_group_per_user
    BEFORE INSERT ON groups
    FOR EACH ROW EXECUTE FUNCTION check_user_group_limit();

-- GROUP_MEMBERSHIPS table policies
CREATE POLICY "Users can read memberships of their groups" ON group_memberships
    FOR SELECT USING (user_in_group(group_id, auth.uid()));

CREATE POLICY "Group owners can manage memberships" ON group_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can leave groups" ON group_memberships
    FOR DELETE USING (auth.uid() = user_id);

-- Business rule: Check family package member limits
CREATE OR REPLACE FUNCTION check_group_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    has_family_plan BOOLEAN;
BEGIN
    -- Get current member count
    SELECT COUNT(*) INTO current_count 
    FROM group_memberships 
    WHERE group_id = NEW.group_id;
    
    -- Check if group owner has family plan
    SELECT EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN groups g ON g.created_by = s.user_id
        WHERE g.id = NEW.group_id 
        AND s.plan_type = 'family' 
        AND s.status = 'active'
    ) INTO has_family_plan;
    
    -- Set max members based on plan
    max_allowed := CASE WHEN has_family_plan THEN 4 ELSE 1 END;
    
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Group has reached maximum member limit for current plan';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_group_member_limit
    BEFORE INSERT ON group_memberships
    FOR EACH ROW EXECUTE FUNCTION check_group_member_limit();

-- SUBSCRIPTIONS table policies
CREATE POLICY "Users can read their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- INVITATIONS table policies
CREATE POLICY "Users can read invitations for their groups" ON invitations
    FOR SELECT USING (
        user_in_group(group_id, auth.uid()) OR 
        invited_user_id = auth.uid() OR
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Group members can create invitations" ON invitations
    FOR INSERT WITH CHECK (user_in_group(group_id, auth.uid()));

CREATE POLICY "Invited users can update invitation status" ON invitations
    FOR UPDATE USING (
        invited_user_id = auth.uid() OR
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        user_in_group(group_id, auth.uid())
    );

-- CATEGORIES table policies
CREATE POLICY "Users can read default categories" ON categories
    FOR SELECT USING (is_default = true);

CREATE POLICY "Users can read categories from their groups" ON categories
    FOR SELECT USING (group_id IN (SELECT get_user_groups(auth.uid())));

CREATE POLICY "Group members can manage group categories" ON categories
    FOR ALL USING (
        group_id IN (SELECT get_user_groups(auth.uid())) AND
        created_by = auth.uid()
    );

CREATE POLICY "Users can create group categories" ON categories
    FOR INSERT WITH CHECK (
        group_id IN (SELECT get_user_groups(auth.uid())) AND
        created_by = auth.uid()
    );

-- LOCATIONS table policies
CREATE POLICY "Users can read default locations" ON locations
    FOR SELECT USING (is_default = true);

CREATE POLICY "Users can read locations from their groups" ON locations
    FOR SELECT USING (group_id IN (SELECT get_user_groups(auth.uid())));

CREATE POLICY "Group members can manage group locations" ON locations
    FOR ALL USING (
        group_id IN (SELECT get_user_groups(auth.uid())) AND
        created_by = auth.uid()
    );

CREATE POLICY "Users can create group locations" ON locations
    FOR INSERT WITH CHECK (
        group_id IN (SELECT get_user_groups(auth.uid())) AND
        created_by = auth.uid()
    );

-- FOOD_ITEMS table policies
CREATE POLICY "Users can read food items from their groups" ON food_items
    FOR SELECT USING (group_id IN (SELECT get_user_groups(auth.uid())));

CREATE POLICY "Group members can create food items" ON food_items
    FOR INSERT WITH CHECK (
        group_id IN (SELECT get_user_groups(auth.uid())) AND
        created_by = auth.uid()
    );

CREATE POLICY "Food item creators can update their items" ON food_items
    FOR UPDATE USING (
        created_by = auth.uid() AND
        group_id IN (SELECT get_user_groups(auth.uid()))
    );

CREATE POLICY "Food item creators can delete their items" ON food_items
    FOR DELETE USING (
        created_by = auth.uid() AND
        group_id IN (SELECT get_user_groups(auth.uid()))
    );

-- SHOPPING_ITEMS table policies
CREATE POLICY "Users can read shopping items from their groups" ON shopping_items
    FOR SELECT USING (group_id IN (SELECT get_user_groups(auth.uid())));

CREATE POLICY "Group members can create shopping items" ON shopping_items
    FOR INSERT WITH CHECK (
        group_id IN (SELECT get_user_groups(auth.uid())) AND
        created_by = auth.uid()
    );

CREATE POLICY "Shopping item creators can update their items" ON shopping_items
    FOR UPDATE USING (
        created_by = auth.uid() AND
        group_id IN (SELECT get_user_groups(auth.uid()))
    );

CREATE POLICY "Shopping item creators can delete their items" ON shopping_items
    FOR DELETE USING (
        created_by = auth.uid() AND
        group_id IN (SELECT get_user_groups(auth.uid()))
    );

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

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_group_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
    inv_record invitations%ROWTYPE;
BEGIN
    -- Get invitation details
    SELECT * INTO inv_record 
    FROM invitations 
    WHERE id = invitation_id 
    AND (invited_user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Add user to group
    INSERT INTO group_memberships (group_id, user_id, role)
    VALUES (inv_record.group_id, auth.uid(), 'member');
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted', responded_at = NOW(), invited_user_id = auth.uid()
    WHERE id = invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 