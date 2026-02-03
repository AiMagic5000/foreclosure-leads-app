-- Migration: PIN System + Lead Enrichment
-- Run this on the foreclosure-leads-db Supabase instance

-- 1. Create user_pins table
CREATE TABLE IF NOT EXISTS user_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  pin TEXT NOT NULL, -- bcrypt hashed
  states_access TEXT[] NOT NULL DEFAULT '{}',
  package_type TEXT NOT NULL DEFAULT 'five_state', -- five_state, additional_state
  gumroad_sale_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT 'admin'
);

-- Index for fast PIN lookups by email
CREATE INDEX IF NOT EXISTS idx_user_pins_email ON user_pins(email);
CREATE INDEX IF NOT EXISTS idx_user_pins_active ON user_pins(is_active) WHERE is_active = true;

-- 2. Add enrichment columns to foreclosure_leads
ALTER TABLE foreclosure_leads
  ADD COLUMN IF NOT EXISTS apn_number TEXT,
  ADD COLUMN IF NOT EXISTS assessed_value NUMERIC,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS lot_size TEXT,
  ADD COLUMN IF NOT EXISTS year_built INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_market_value NUMERIC,
  ADD COLUMN IF NOT EXISTS property_type TEXT,
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
  ADD COLUMN IF NOT EXISTS bathrooms NUMERIC,
  ADD COLUMN IF NOT EXISTS square_footage INTEGER,
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

-- Index for unenriched leads (for the enrichment pipeline)
CREATE INDEX IF NOT EXISTS idx_leads_unenriched
  ON foreclosure_leads(created_at)
  WHERE enriched_at IS NULL;
