-- Migration: Add property_image_url column
-- Run this on the foreclosure-leads-db Supabase instance

-- Add property image URL column to foreclosure_leads
ALTER TABLE foreclosure_leads
  ADD COLUMN IF NOT EXISTS property_image_url TEXT;

-- Create index for quick image filtering
CREATE INDEX IF NOT EXISTS idx_leads_has_image
  ON foreclosure_leads(id)
  WHERE property_image_url IS NOT NULL;
