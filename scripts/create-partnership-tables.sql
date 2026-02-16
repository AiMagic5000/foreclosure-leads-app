-- ============================================================
-- Partnership Lead Pipeline Tables
-- Three separate tables for title companies, real estate
-- investors, and attorneys. Used for outreach and partnership
-- development.
-- ============================================================

-- ============================================================
-- 1. title_company_leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.title_company_leads (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name    TEXT        NOT NULL,
    contact_name    TEXT,
    email           TEXT,
    phone           TEXT,
    website         TEXT,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    state_abbr      TEXT,
    county          TEXT,
    specialty       TEXT,
    monthly_volume  INT,
    status          TEXT        NOT NULL DEFAULT 'new',
    source          TEXT        DEFAULT 'crawl4ai',
    email_sent      BOOLEAN     DEFAULT false,
    email_sent_at   TIMESTAMPTZ,
    sms_sent        BOOLEAN     DEFAULT false,
    sms_sent_at     TIMESTAMPTZ,
    voicemail_sent  BOOLEAN     DEFAULT false,
    voicemail_sent_at TIMESTAMPTZ,
    voicemail_error TEXT,
    notes           TEXT,
    scraped_at      TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_title_leads_status ON public.title_company_leads (status);
CREATE INDEX IF NOT EXISTS idx_title_leads_state ON public.title_company_leads (state_abbr);
CREATE INDEX IF NOT EXISTS idx_title_leads_city ON public.title_company_leads (city);
CREATE INDEX IF NOT EXISTS idx_title_leads_email ON public.title_company_leads (email);

ALTER TABLE public.title_company_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_title"
    ON public.title_company_leads FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_title"
    ON public.title_company_leads FOR SELECT TO anon
    USING (true);

CREATE POLICY "authenticated_read_title"
    ON public.title_company_leads FOR SELECT TO authenticated
    USING (true);

-- ============================================================
-- 2. real_estate_investor_leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.real_estate_investor_leads (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_name   TEXT        NOT NULL,
    company_name    TEXT,
    email           TEXT,
    phone           TEXT,
    website         TEXT,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    state_abbr      TEXT,
    county          TEXT,
    investor_type   TEXT,
    monthly_purchases INT,
    status          TEXT        NOT NULL DEFAULT 'new',
    source          TEXT        DEFAULT 'crawl4ai',
    email_sent      BOOLEAN     DEFAULT false,
    email_sent_at   TIMESTAMPTZ,
    sms_sent        BOOLEAN     DEFAULT false,
    sms_sent_at     TIMESTAMPTZ,
    voicemail_sent  BOOLEAN     DEFAULT false,
    voicemail_sent_at TIMESTAMPTZ,
    voicemail_error TEXT,
    notes           TEXT,
    scraped_at      TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investor_leads_status ON public.real_estate_investor_leads (status);
CREATE INDEX IF NOT EXISTS idx_investor_leads_state ON public.real_estate_investor_leads (state_abbr);
CREATE INDEX IF NOT EXISTS idx_investor_leads_city ON public.real_estate_investor_leads (city);
CREATE INDEX IF NOT EXISTS idx_investor_leads_email ON public.real_estate_investor_leads (email);

ALTER TABLE public.real_estate_investor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_investor"
    ON public.real_estate_investor_leads FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_investor"
    ON public.real_estate_investor_leads FOR SELECT TO anon
    USING (true);

CREATE POLICY "authenticated_read_investor"
    ON public.real_estate_investor_leads FOR SELECT TO authenticated
    USING (true);

-- ============================================================
-- 3. attorney_leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attorney_leads (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attorney_name   TEXT        NOT NULL,
    firm_name       TEXT,
    email           TEXT,
    phone           TEXT,
    website         TEXT,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    state_abbr      TEXT,
    county          TEXT,
    bar_number      TEXT,
    practice_areas  TEXT,
    status          TEXT        NOT NULL DEFAULT 'new',
    source          TEXT        DEFAULT 'crawl4ai',
    email_sent      BOOLEAN     DEFAULT false,
    email_sent_at   TIMESTAMPTZ,
    sms_sent        BOOLEAN     DEFAULT false,
    sms_sent_at     TIMESTAMPTZ,
    voicemail_sent  BOOLEAN     DEFAULT false,
    voicemail_sent_at TIMESTAMPTZ,
    voicemail_error TEXT,
    notes           TEXT,
    scraped_at      TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attorney_leads_status ON public.attorney_leads (status);
CREATE INDEX IF NOT EXISTS idx_attorney_leads_state ON public.attorney_leads (state_abbr);
CREATE INDEX IF NOT EXISTS idx_attorney_leads_city ON public.attorney_leads (city);
CREATE INDEX IF NOT EXISTS idx_attorney_leads_email ON public.attorney_leads (email);
CREATE INDEX IF NOT EXISTS idx_attorney_leads_bar ON public.attorney_leads (bar_number);

ALTER TABLE public.attorney_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_attorney"
    ON public.attorney_leads FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_attorney"
    ON public.attorney_leads FOR SELECT TO anon
    USING (true);

CREATE POLICY "authenticated_read_attorney"
    ON public.attorney_leads FOR SELECT TO authenticated
    USING (true);
