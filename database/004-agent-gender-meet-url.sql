-- Migration 004: Agent gender + Meet Your Agents URL
-- Adds per-operator gender (selects the male/female owner GIF in video emails)
-- and an override URL for the shared "Meet Your Agents" landing page.
-- Additive + nullable: existing rows inherit admin defaults via operator-config.ts.

ALTER TABLE user_pins
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS meet_agent_url TEXT;

COMMENT ON COLUMN user_pins.gender IS 'male | female -- picks the gender-matched owner avatar GIF in the Video Email comm option';
COMMENT ON COLUMN user_pins.meet_agent_url IS 'Override URL for the shared Meet Your Agents landing page (defaults to usforeclosurerecovery.com/meet-your-agents)';

-- Seed known principals (safe no-ops if rows absent)
UPDATE user_pins SET gender = 'male'   WHERE lower(sender_email) = 'joshua@usforeclosurerecovery.com'  AND gender IS NULL;
UPDATE user_pins SET gender = 'female' WHERE lower(sender_email) = 'rebecca@usforeclosurerecovery.com' AND gender IS NULL;
