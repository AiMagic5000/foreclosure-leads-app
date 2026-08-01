-- =====================================================================
-- Per-agent lead flags — isolation                        2026-07-31
-- =====================================================================
-- bad_phone / bad_email / agent_status / bad_phones / bad_emails all lived as
-- columns on foreclosure_leads, so they belonged to the LEAD, not to the agent
-- working it. Consequences:
--   * a lead reassigned to a new agent arrived pre-marked with the previous
--     holder's judgements — Karen Campbell inherited "bad" on leads she had
--     never dialled
--   * one agent's opinion of a contact silently became every future agent's
--   * nothing stopped a caller flagging a lead they do not hold
--
-- Flags are an AGENT'S OWN working notes about a lead. They move with the agent,
-- never with the lead. Same shape as lead_notes: PK (lead_id, operator_pin_id).
-- =====================================================================

CREATE TABLE IF NOT EXISTS lead_agent_flags (
  lead_id         text NOT NULL,
  operator_pin_id uuid NOT NULL REFERENCES user_pins(id) ON DELETE CASCADE,
  bad_phone       boolean NOT NULL DEFAULT false,
  bad_email       boolean NOT NULL DEFAULT false,
  agent_status    text,                       -- null = active | 'bad' | 'dead'
  bad_phones      text[] NOT NULL DEFAULT '{}'::text[],
  bad_emails      text[] NOT NULL DEFAULT '{}'::text[],
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, operator_pin_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_agent_flags_pin ON lead_agent_flags (operator_pin_id);

ALTER TABLE lead_agent_flags
  DROP CONSTRAINT IF EXISTS chk_lead_agent_flags_status;
ALTER TABLE lead_agent_flags
  ADD CONSTRAINT chk_lead_agent_flags_status
  CHECK (agent_status IS NULL OR agent_status IN ('bad','dead'));

-- ---------------------------------------------------------------------
-- Migrate existing flags to whoever currently holds the lead. Anything set on
-- a lead nobody holds is dropped rather than inherited by the next agent.
-- ---------------------------------------------------------------------
INSERT INTO lead_agent_flags (lead_id, operator_pin_id, bad_phone, bad_email, agent_status, bad_phones, bad_emails)
SELECT f.id,
       a.operator_pin_id,
       coalesce(f.bad_phone, false),
       coalesce(f.bad_email, false),
       f.agent_status,
       coalesce(f.bad_phones, '{}'::text[]),
       coalesce(f.bad_emails, '{}'::text[])
  FROM foreclosure_leads f
  JOIN operator_lead_assignments a
    ON a.lead_id = f.id AND a.status = 'active'
 WHERE coalesce(f.bad_phone,false)
    OR coalesce(f.bad_email,false)
    OR f.agent_status IS NOT NULL
    OR coalesce(array_length(f.bad_phones,1),0) > 0
    OR coalesce(array_length(f.bad_emails,1),0) > 0
ON CONFLICT (lead_id, operator_pin_id) DO NOTHING;

SELECT 'migrated' AS step, count(*) AS rows FROM lead_agent_flags;
