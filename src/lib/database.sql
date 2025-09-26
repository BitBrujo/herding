-- Herding Katz Scheduling App - Supabase Schema

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
    is_locked BOOLEAN DEFAULT FALSE,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    max_participants INTEGER DEFAULT 50,

    -- LLM context
    meeting_importance VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    meeting_type VARCHAR(50), -- team_meeting, social, interview, etc.
    relationship_context JSONB, -- {formal: true, cross_team: false, etc.}

    -- Sharing
    share_token VARCHAR(32) UNIQUE NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'active' -- active, finalized, cancelled
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),

    -- Participant metadata
    timezone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'required', -- organizer, required, optional
    priority_weight DECIMAL(3,2) DEFAULT 1.0, -- for weighted scheduling

    -- Status
    has_responded BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(event_id, name)
);

-- Availability table - Time slot availability for each participant
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,

    -- Time slot
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Availability type
    status VARCHAR(20) DEFAULT 'available', -- available, unavailable, preferred, maybe
    preference_score INTEGER DEFAULT 3, -- 1-5 scale (1=hate it, 5=love it)

    -- Context
    notes TEXT,

    UNIQUE(participant_id, date, start_time, end_time)
);

-- Messages table - LLM conversation history
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id),

    -- Message content
    message_type VARCHAR(20) NOT NULL, -- user_input, llm_response, system_notification
    content TEXT NOT NULL,

    -- LLM processing
    intent VARCHAR(50), -- schedule_conflict, preference_change, question, etc.
    extracted_data JSONB, -- structured data extracted from message
    confidence_score DECIMAL(3,2), -- 0.0-1.0

    -- Context
    conversation_thread_id UUID,
    is_visible_to_all BOOLEAN DEFAULT TRUE,

    -- Response metadata
    llm_model VARCHAR(50),
    processing_time_ms INTEGER
);

-- Meeting slots table - Finalized meeting times
CREATE TABLE IF NOT EXISTS meeting_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    event_id UUID REFERENCES events(id) ON DELETE CASCADE,

    -- Meeting time
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50),

    -- Scheduling metadata
    total_participants INTEGER,
    available_participants INTEGER,
    attendance_score DECIMAL(5,2), -- calculated optimal score

    -- Status
    is_final BOOLEAN DEFAULT FALSE,
    selected_by UUID REFERENCES participants(id),

    -- LLM reasoning
    selection_reasoning TEXT, -- LLM explanation of why this time was chosen
    alternative_suggestions JSONB -- backup options with reasoning
);

-- LLM context table - Stores conversation context and learning
CREATE TABLE IF NOT EXISTS llm_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    event_id UUID REFERENCES events(id) ON DELETE CASCADE,

    -- Context tracking
    conversation_state JSONB, -- current conversation state
    participant_preferences JSONB, -- learned participant preferences
    group_dynamics JSONB, -- relationship patterns, communication style

    -- Scheduling intelligence
    scheduling_constraints JSONB, -- extracted constraints and requirements
    negotiation_history JSONB, -- past negotiation attempts and outcomes

    -- Learning data
    successful_strategies JSONB, -- what messaging worked
    pain_points JSONB, -- recurring conflicts or issues

    -- Performance tracking
    response_effectiveness DECIMAL(3,2), -- how helpful LLM responses were
    user_satisfaction_score INTEGER -- 1-5 rating from participants
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,

    -- Notification settings
    email_updates BOOLEAN DEFAULT TRUE,
    schedule_changes BOOLEAN DEFAULT TRUE,
    meeting_finalized BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT FALSE,

    -- LLM interaction preferences
    llm_assistance_level VARCHAR(20) DEFAULT 'moderate', -- minimal, moderate, aggressive
    auto_respond_to_simple_queries BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_share_token ON events(share_token);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_availability_event_date ON availability(event_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_participant ON availability(participant_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_thread ON messages(event_id, conversation_thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_context_event ON llm_context(event_id);

-- Row Level Security (RLS) policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_context ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (expand based on auth requirements)
CREATE POLICY "Events are viewable by anyone with share token" ON events
    FOR SELECT USING (TRUE);

CREATE POLICY "Participants can view their event data" ON participants
    FOR ALL USING (TRUE);

CREATE POLICY "Availability is viewable by event participants" ON availability
    FOR ALL USING (TRUE);

CREATE POLICY "Messages are viewable by event participants" ON messages
    FOR ALL USING (TRUE);

CREATE POLICY "Meeting slots are viewable by event participants" ON meeting_slots
    FOR ALL USING (TRUE);

CREATE POLICY "LLM context is viewable by event participants" ON llm_context
    FOR ALL USING (TRUE);

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_llm_context_updated_at
    BEFORE UPDATE ON llm_context
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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