-- Minimal database setup for Herding - Run this in Supabase SQL Editor

-- Events table - Core scheduling events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_name VARCHAR(100) NOT NULL,
    organizer_email VARCHAR(255),

    -- Scheduling parameters
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    duration_minutes INTEGER DEFAULT 60,

    -- Event settings
    is_finalized BOOLEAN DEFAULT FALSE,
    allow_anonymous BOOLEAN DEFAULT TRUE,

    -- LLM context
    meeting_importance VARCHAR(20) DEFAULT 'medium',
    meeting_type VARCHAR(50),

    -- Sharing
    share_token VARCHAR(32) UNIQUE NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'active'
);

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to generate share token before insert
CREATE OR REPLACE FUNCTION set_share_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_token IS NULL OR NEW.share_token = '' THEN
        NEW.share_token = generate_share_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share tokens
CREATE TRIGGER set_events_share_token
    BEFORE INSERT ON events
    FOR EACH ROW EXECUTE FUNCTION set_share_token();

-- Basic RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by anyone" ON events
    FOR SELECT USING (TRUE);

CREATE POLICY "Events can be created by anyone" ON events
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Events can be updated by anyone" ON events
    FOR UPDATE USING (TRUE);