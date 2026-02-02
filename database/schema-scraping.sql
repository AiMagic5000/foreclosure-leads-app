-- Scraping Infrastructure Database Schema Extension
-- For continuous multi-state, multi-county foreclosure lead scraping

-- Counties table (3,100+ US counties)
CREATE TABLE IF NOT EXISTS counties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    state_abbr TEXT NOT NULL REFERENCES state_data(state_abbr),
    fips_code TEXT UNIQUE,

    -- Scraping metadata
    has_online_records BOOLEAN DEFAULT FALSE,
    records_url TEXT,
    records_type TEXT CHECK (records_type IN ('auction_site', 'recorder', 'treasurer', 'public_trustee', 'clerk', 'sheriff')),
    requires_email_request BOOLEAN DEFAULT FALSE,
    email_contact TEXT,
    foia_template_id TEXT,

    -- Scraping status
    last_scraped_at TIMESTAMPTZ,
    last_successful_scrape TIMESTAMPTZ,
    scrape_frequency_hours INTEGER DEFAULT 24,
    next_scheduled_scrape TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Stats
    total_leads_found INTEGER DEFAULT 0,
    leads_this_month INTEGER DEFAULT 0,
    avg_leads_per_scrape DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(name, state_abbr)
);

-- Scrape sources registry (auction sites, recorders, etc.)
CREATE TABLE IF NOT EXISTS scrape_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'county_auction',
        'county_recorder',
        'public_trustee',
        'tax_deed_auction',
        'sheriff_sale',
        'aggregator',
        'mls_foreclosure',
        'court_records'
    )),
    base_url TEXT,
    states_covered TEXT[] DEFAULT '{}',
    counties_covered UUID[] DEFAULT '{}',

    -- Scraper configuration
    scraper_class TEXT, -- e.g., 'RealauauctionScraper', 'ZillowForeclosureScraper'
    requires_login BOOLEAN DEFAULT FALSE,
    login_url TEXT,
    rate_limit_requests INTEGER DEFAULT 10, -- requests per minute
    uses_javascript BOOLEAN DEFAULT FALSE, -- needs Playwright vs requests
    custom_headers JSONB,
    cookies JSONB,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_check_at TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape jobs queue
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES scrape_sources(id),
    county_id UUID REFERENCES counties(id),
    state_abbr TEXT,

    -- Job configuration
    job_type TEXT NOT NULL CHECK (job_type IN ('scheduled', 'manual', 'retry', 'backfill')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest

    -- Parameters
    params JSONB DEFAULT '{}', -- date range, filters, etc.

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    worker_id TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Results
    leads_found INTEGER DEFAULT 0,
    leads_new INTEGER DEFAULT 0,
    leads_updated INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB,

    -- Retry logic
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email request tracking (for counties requiring FOIA/email requests)
CREATE TABLE IF NOT EXISTS email_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    county_id UUID REFERENCES counties(id),

    -- Request details
    email_to TEXT NOT NULL,
    email_from TEXT DEFAULT 'data@foreclosure-leads.com',
    subject TEXT NOT NULL,
    body TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'replied', 'data_received')),
    sent_at TIMESTAMPTZ,
    response_received_at TIMESTAMPTZ,
    response_notes TEXT,

    -- Data tracking
    data_file_path TEXT,
    leads_extracted INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proxy pool for avoiding blocks
CREATE TABLE IF NOT EXISTS proxy_pool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proxy_url TEXT NOT NULL UNIQUE,
    proxy_type TEXT DEFAULT 'http' CHECK (proxy_type IN ('http', 'https', 'socks5')),

    -- Performance metrics
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    last_used_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_residential BOOLEAN DEFAULT FALSE,
    location_country TEXT DEFAULT 'US',
    location_state TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw scraped data (before normalization)
CREATE TABLE IF NOT EXISTS raw_scraped_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES scrape_jobs(id),
    source_id UUID REFERENCES scrape_sources(id),

    -- Raw data
    raw_html TEXT,
    raw_json JSONB,
    page_url TEXT,

    -- Extracted data (pre-normalization)
    extracted_data JSONB,

    -- Processing status
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    lead_id TEXT REFERENCES foreclosure_leads(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counties_state ON counties(state_abbr);
CREATE INDEX IF NOT EXISTS idx_counties_next_scrape ON counties(next_scheduled_scrape) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_priority ON scrape_jobs(priority, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source ON scrape_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_data_unprocessed ON raw_scraped_data(created_at) WHERE is_processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_email_requests_status ON email_requests(status);

-- Function to get next scrape job
CREATE OR REPLACE FUNCTION get_next_scrape_job(p_worker_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Lock and claim the next pending job
    UPDATE scrape_jobs
    SET status = 'running',
        worker_id = p_worker_id,
        started_at = NOW()
    WHERE id = (
        SELECT id FROM scrape_jobs
        WHERE status = 'pending'
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY priority ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    RETURNING id INTO v_job_id;

    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule next scrape for a county
CREATE OR REPLACE FUNCTION schedule_county_scrape(p_county_id UUID)
RETURNS UUID AS $$
DECLARE
    v_county RECORD;
    v_job_id UUID;
BEGIN
    SELECT * INTO v_county FROM counties WHERE id = p_county_id;

    IF v_county.is_active AND v_county.has_online_records THEN
        INSERT INTO scrape_jobs (county_id, state_abbr, job_type, priority)
        VALUES (
            p_county_id,
            v_county.state_abbr,
            'scheduled',
            CASE WHEN v_county.consecutive_failures > 0 THEN 8 ELSE 5 END
        )
        RETURNING id INTO v_job_id;

        UPDATE counties
        SET next_scheduled_scrape = NOW() + (scrape_frequency_hours || ' hours')::INTERVAL
        WHERE id = p_county_id;
    END IF;

    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- View for scraping dashboard
CREATE OR REPLACE VIEW scraping_dashboard AS
SELECT
    s.state_abbr,
    s.state_name,
    COUNT(c.id) as total_counties,
    COUNT(c.id) FILTER (WHERE c.has_online_records) as counties_with_records,
    COUNT(c.id) FILTER (WHERE c.requires_email_request) as counties_requiring_email,
    SUM(c.total_leads_found) as total_leads,
    SUM(c.leads_this_month) as leads_this_month,
    COUNT(j.id) FILTER (WHERE j.status = 'pending') as pending_jobs,
    COUNT(j.id) FILTER (WHERE j.status = 'running') as running_jobs,
    COUNT(j.id) FILTER (WHERE j.status = 'failed' AND j.created_at > NOW() - INTERVAL '24 hours') as recent_failures
FROM state_data s
LEFT JOIN counties c ON s.state_abbr = c.state_abbr
LEFT JOIN scrape_jobs j ON c.id = j.county_id
GROUP BY s.state_abbr, s.state_name
ORDER BY s.state_name;
