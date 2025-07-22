-- Enhanced Food Expiry App Schema with Analytics
-- Tracks usage patterns, waste, and disposal reasons for better insights

-- Additional custom types for analytics
CREATE TYPE disposal_reason AS ENUM ('expired', 'spoiled', 'too_much', 'dislike', 'forgotten', 'other');
CREATE TYPE consumption_type AS ENUM ('used_completely', 'used_partially', 'thrown_away', 'gifted', 'expired_unused');

-- Food item events table (tracks all actions on food items)
CREATE TABLE food_item_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type consumption_type NOT NULL,
    quantity_affected INTEGER DEFAULT 1,
    disposal_reason disposal_reason,
    disposal_notes TEXT,
    days_since_purchase INTEGER, -- Auto-calculated
    days_before_expiry INTEGER, -- Auto-calculated (negative if expired)
    location_at_disposal UUID REFERENCES locations(id),
    category_at_disposal UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics aggregation table (for faster queries)
CREATE TABLE group_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    -- Financial estimates (optional)
    estimated_waste_value DECIMAL(10,2) DEFAULT 0,
    estimated_savings DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, analysis_date)
);

-- User behavior patterns
CREATE TABLE user_waste_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    location_id UUID REFERENCES locations(id),
    
    -- Pattern metrics
    total_added INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    total_wasted INTEGER DEFAULT 0,
    avg_usage_days DECIMAL(5,2) DEFAULT 0,
    waste_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Recommendations
    recommended_quantity INTEGER,
    recommended_purchase_frequency INTEGER, -- days
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, group_id, category_id, location_id)
);

-- Waste reduction goals and tracking
CREATE TABLE waste_reduction_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    set_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    goal_type TEXT NOT NULL, -- 'reduce_waste_percentage', 'increase_usage_days', etc.
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced food_items table (add analytics fields)
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS 
    purchase_price DECIMAL(10,2),
    estimated_value DECIMAL(10,2),
    original_quantity INTEGER DEFAULT 1,
    remaining_quantity INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_frequency INTEGER DEFAULT 0; -- How many times item was partially used

-- Function to auto-calculate analytics when food item event occurs
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

-- Function to update group analytics daily
CREATE OR REPLACE FUNCTION update_group_analytics()
RETURNS void AS $$
DECLARE
    group_rec RECORD;
    analytics_data RECORD;
BEGIN
    FOR group_rec IN SELECT id FROM groups LOOP
        -- Calculate analytics for the group
        SELECT 
            COUNT(*) FILTER (WHERE event_type IN ('used_completely', 'used_partially')) as items_used,
            COUNT(*) FILTER (WHERE event_type = 'thrown_away') as items_thrown,
            COUNT(*) FILTER (WHERE event_type = 'expired_unused') as items_expired,
            AVG(days_before_expiry) FILTER (WHERE event_type = 'thrown_away') as avg_days_before_expiry,
            ROUND(
                (COUNT(*) FILTER (WHERE event_type IN ('thrown_away', 'expired_unused'))::decimal / 
                 NULLIF(COUNT(*), 0) * 100), 2
            ) as waste_percentage
        INTO analytics_data
        FROM food_item_events 
        WHERE group_id = group_rec.id 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days';
        
        -- Insert or update group analytics
        INSERT INTO group_analytics (
            group_id, 
            analysis_date,
            total_items_used,
            total_items_thrown_away,
            total_items_expired,
            waste_percentage,
            avg_days_before_expiry
        ) VALUES (
            group_rec.id,
            CURRENT_DATE,
            COALESCE(analytics_data.items_used, 0),
            COALESCE(analytics_data.items_thrown, 0),
            COALESCE(analytics_data.items_expired, 0),
            COALESCE(analytics_data.waste_percentage, 0),
            COALESCE(analytics_data.avg_days_before_expiry, 0)
        )
        ON CONFLICT (group_id, analysis_date) 
        DO UPDATE SET
            total_items_used = EXCLUDED.total_items_used,
            total_items_thrown_away = EXCLUDED.total_items_thrown_away,
            total_items_expired = EXCLUDED.total_items_expired,
            waste_percentage = EXCLUDED.waste_percentage,
            avg_days_before_expiry = EXCLUDED.avg_days_before_expiry,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Indexes for analytics performance
CREATE INDEX idx_food_item_events_group_id ON food_item_events(group_id);
CREATE INDEX idx_food_item_events_user_id ON food_item_events(user_id);
CREATE INDEX idx_food_item_events_food_item_id ON food_item_events(food_item_id);
CREATE INDEX idx_food_item_events_created_at ON food_item_events(created_at);
CREATE INDEX idx_food_item_events_event_type ON food_item_events(event_type);
CREATE INDEX idx_group_analytics_group_date ON group_analytics(group_id, analysis_date);

-- Sample analytics views for easier querying
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

CREATE VIEW monthly_waste_trends AS
SELECT 
    group_id,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) FILTER (WHERE event_type = 'thrown_away') as items_thrown,
    COUNT(*) FILTER (WHERE event_type = 'expired_unused') as items_expired,
    COUNT(*) FILTER (WHERE event_type IN ('used_completely', 'used_partially')) as items_used,
    ROUND(AVG(days_before_expiry) FILTER (WHERE event_type = 'thrown_away'), 2) as avg_days_before_expiry
FROM food_item_events
GROUP BY group_id, DATE_TRUNC('month', created_at)
ORDER BY group_id, month; 