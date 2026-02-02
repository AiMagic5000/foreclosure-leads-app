-- Foreclosure Leads Application Database Schema
-- For Cognabase (Self-hosted Supabase) on Coolify

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'single_state', 'multi_state')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    selected_states TEXT[] DEFAULT '{}',
    automation_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreclosure leads table (main data)
CREATE TABLE IF NOT EXISTS foreclosure_leads (
    id TEXT PRIMARY KEY,
    property_address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    state_abbr TEXT,
    zip_code TEXT,
    parcel_id TEXT,
    owner_name TEXT NOT NULL,
    case_number TEXT,
    sale_date TEXT,
    sale_amount DECIMAL(12, 2),
    mortgage_amount DECIMAL(12, 2),
    lender_name TEXT,
    trustee_name TEXT,
    foreclosure_type TEXT CHECK (foreclosure_type IN ('judicial', 'non-judicial', 'tax')),
    source TEXT,
    source_type TEXT,
    batch_id TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),

    -- Skip trace data
    primary_phone TEXT,
    secondary_phone TEXT,
    phone_numbers TEXT[],
    primary_email TEXT,
    email_addresses TEXT[],
    associated_names TEXT[],
    mailing_address TEXT,
    skip_trace_source TEXT,
    skip_traced_at TIMESTAMPTZ,

    -- DNC compliance
    dnc_checked BOOLEAN DEFAULT FALSE,
    on_dnc BOOLEAN DEFAULT FALSE,
    dnc_type TEXT,
    can_contact BOOLEAN DEFAULT TRUE,
    dnc_checked_at TIMESTAMPTZ,

    -- Voicemail automation
    voicemail_script TEXT,
    voicemail_audio_url TEXT,
    voicemail_generated_at TIMESTAMPTZ,
    voicemail_sent BOOLEAN DEFAULT FALSE,
    voicemail_delivery_id TEXT,
    voicemail_sent_at TIMESTAMPTZ,
    voicemail_error TEXT,

    -- Lead management
    callback_received BOOLEAN DEFAULT FALSE,
    callback_at TIMESTAMPTZ,
    callback_notes TEXT,
    assigned_to UUID REFERENCES users(id),
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMPTZ,
    contract_amount DECIMAL(12, 2),

    -- Status tracking
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'skip_traced', 'dnc_blocked', 'contacted', 'callback', 'converted', 'dead')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- State data reference table
CREATE TABLE IF NOT EXISTS state_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_name TEXT NOT NULL,
    state_abbr TEXT NOT NULL UNIQUE,
    foreclosure_type TEXT CHECK (foreclosure_type IN ('judicial', 'non-judicial', 'both')),
    tax_overage_statute TEXT,
    mortgage_overage_statute TEXT,
    timeline_notes TEXT,
    fee_limits TEXT,
    claim_window TEXT,
    lead_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape runs tracking
CREATE TABLE IF NOT EXISTS scrape_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    states_scraped TEXT[] DEFAULT '{}',
    sources_scraped TEXT[] DEFAULT '{}',
    leads_found INTEGER DEFAULT 0,
    leads_skip_traced INTEGER DEFAULT 0,
    leads_dnc_blocked INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- DNC cache for reducing API calls
CREATE TABLE IF NOT EXISTS dnc_cache (
    phone_number TEXT PRIMARY KEY,
    on_dnc BOOLEAN NOT NULL,
    dnc_type TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '31 days')
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    lead_id TEXT REFERENCES foreclosure_leads(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON foreclosure_leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_leads_state ON foreclosure_leads(state_abbr);
CREATE INDEX IF NOT EXISTS idx_leads_status ON foreclosure_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_sale_date ON foreclosure_leads(sale_date);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON foreclosure_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON foreclosure_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_dnc_cache_expires ON dnc_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON foreclosure_leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON foreclosure_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE foreclosure_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (clerk_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims')::json->>'sub');

-- Leads visibility based on subscription
-- This is a simplified policy; in production you'd check subscription status and selected states
CREATE POLICY "Active users can view leads" ON foreclosure_leads
    FOR SELECT USING (true);

-- Activity log for own actions
CREATE POLICY "Users can view own activity" ON user_activity
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims')::json->>'sub'
    ));

-- Views for common queries
CREATE OR REPLACE VIEW leads_ready_for_voicemail AS
SELECT * FROM foreclosure_leads
WHERE status = 'skip_traced'
  AND can_contact = TRUE
  AND voicemail_sent = FALSE
  AND primary_phone IS NOT NULL;

CREATE OR REPLACE VIEW pipeline_stats AS
SELECT
    date_trunc('day', created_at)::date as date,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'skip_traced') as skip_traced,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
    COUNT(*) FILTER (WHERE status = 'callback') as callbacks,
    COUNT(*) FILTER (WHERE status = 'converted') as converted
FROM foreclosure_leads
GROUP BY date_trunc('day', created_at)::date
ORDER BY date DESC;

-- Function to check DNC cache
CREATE OR REPLACE FUNCTION check_dnc_cache(p_phone TEXT)
RETURNS TABLE(on_dnc BOOLEAN, dnc_type TEXT, cached BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.on_dnc,
        dc.dnc_type,
        TRUE as cached
    FROM dnc_cache dc
    WHERE dc.phone_number = p_phone
      AND dc.expires_at > NOW();

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::BOOLEAN, NULL::TEXT, FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert initial state data
INSERT INTO state_data (state_name, state_abbr, foreclosure_type, tax_overage_statute, mortgage_overage_statute, claim_window, fee_limits)
VALUES
    ('Georgia', 'GA', 'non-judicial', '48-4-5 & 48-4-81', '44-14-190', NULL, NULL),
    ('Arizona', 'AZ', 'non-judicial', NULL, '33-812', NULL, '$2,500 cap'),
    ('Colorado', 'CO', 'non-judicial', NULL, '2016 Bill', '30 months', '20-30% cap'),
    ('Oregon', 'OR', 'both', NULL, '86.794', NULL, NULL),
    ('Washington', 'WA', 'non-judicial', 'RCW 84.64.080(10)', 'RCW 61.24.080', NULL, '5% max'),
    ('Tennessee', 'TN', 'non-judicial', 'Title 67', 'Title 35', NULL, '10% if licensed'),
    ('Nevada', 'NV', 'non-judicial', 'NRS 361.610', 'NRS 40.462-463', '1 year', '10% tax, $2,500 mortgage'),
    ('Texas', 'TX', 'non-judicial', '34.02-04', '70.007', '2 years', '20% assignment limit'),
    ('Florida', 'FL', 'judicial', '197.582', '45.032 & 45.033', NULL, '20% tax, 12% mortgage'),
    ('California', 'CA', 'non-judicial', '4675', '2924k', '12 months', 'Consultant restrictions')
ON CONFLICT (state_abbr) DO NOTHING;
