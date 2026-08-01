-- =====================================================================
-- Agent cross-contamination guard                        2026-07-30
-- =====================================================================
-- Problem this solves: leads that one agent already worked were handed
-- to a different agent as "fresh" inventory. Two agents then call the
-- same homeowner, and the second agent redials numbers the first had
-- already recorded as disconnected. Notes are private per pin, so the
-- receiving agent cannot see the prior work and never notices.
--
-- Why a TRIGGER and not application code: every contamination event to
-- date came from a script writing straight to PostgREST with the service
-- role key, bypassing the API routes entirely. Only a database-level
-- guard sits underneath both paths.
--
-- Escape hatch for deliberate reassignment:
--     SET LOCAL usfl.allow_reassign = 'on';
-- inside the same transaction as the INSERT.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Block assigning a lead that a DIFFERENT agent has already worked
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION usfl_block_contaminated_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prior_pin   uuid;
  prior_name  text;
  prior_note  text;
  lead_status text;
BEGIN
  IF current_setting('usfl.allow_reassign', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- (a) another agent has notes on this lead = they worked it
  -- NOTE: lead_notes.lead_id is uuid while operator_lead_assignments.lead_id
  -- and foreclosure_leads.id are text. Compare as text — casting text->uuid
  -- would throw on any non-uuid id.
  SELECT n.operator_pin_id, left(n.notes, 120)
    INTO prior_pin, prior_note
  FROM lead_notes n
  WHERE n.lead_id::text = NEW.lead_id
    AND n.operator_pin_id IS DISTINCT FROM NEW.operator_pin_id
    AND coalesce(btrim(n.notes), '') <> ''
  ORDER BY n.updated_at DESC
  LIMIT 1;

  IF prior_pin IS NOT NULL THEN
    SELECT p.full_name INTO prior_name FROM user_pins p WHERE p.id = prior_pin;
    RAISE EXCEPTION
      'CONTAMINATION BLOCKED: lead % was already worked by % (pin %). Their note: "%". Assigning it to another agent would double-contact the homeowner. To override deliberately: SET LOCAL usfl.allow_reassign = ''on'';',
      NEW.lead_id, coalesce(prior_name, '?'), prior_pin, coalesce(prior_note, '');
  END IF;

  -- (b) lead status proves prior outreach, even with no surviving note
  SELECT l.status INTO lead_status FROM foreclosure_leads l WHERE l.id = NEW.lead_id;

  IF lead_status IN ('contacted', 'callback', 'converted') THEN
    RAISE EXCEPTION
      'CONTAMINATION BLOCKED: lead % has status "%" meaning it was already worked. Fresh assignments must come from status new/skip_traced. Override: SET LOCAL usfl.allow_reassign = ''on'';',
      NEW.lead_id, lead_status;
  END IF;

  -- (c) never hand out a quarantined / dead / duplicate record
  IF lead_status IN ('quarantined', 'dead', 'duplicate', 'business_entity', 'archived_garbage') THEN
    RAISE EXCEPTION
      'BLOCKED: lead % has status "%" and is not assignable.',
      NEW.lead_id, lead_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_contaminated_assignment ON operator_lead_assignments;
CREATE TRIGGER trg_block_contaminated_assignment
  BEFORE INSERT ON operator_lead_assignments
  FOR EACH ROW EXECUTE FUNCTION usfl_block_contaminated_assignment();

-- ---------------------------------------------------------------------
-- 2. Block assigning a lead with an unusable owner name
-- ---------------------------------------------------------------------
-- A CHECK constraint cannot do this: the garbage row is already in the
-- table by the time we try to assign it. Gating at assignment protects
-- the agent without destroying inventory (single-token surnames are
-- incomplete but real, so they are allowed through).
CREATE OR REPLACE FUNCTION usfl_block_garbage_name_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  nm text;
BEGIN
  IF current_setting('usfl.allow_reassign', true) = 'on' THEN
    RETURN NEW;
  END IF;

  SELECT owner_name INTO nm FROM foreclosure_leads WHERE id = NEW.lead_id;

  IF nm IS NULL
     OR btrim(nm) = ''
     OR nm ~* 'not\s*found'
     OR nm ~* '^\s*unknown'
     OR nm ~* 'error-'
     OR nm ~* '^\s*(current|record|former)\s+owner'
     OR nm ~* 'clerk of'
     OR nm ~* '^owners?:'
     OR nm ~* 'https?://'
     OR nm !~ '[A-Za-z]{2,}'
  THEN
    RAISE EXCEPTION
      'BLOCKED: lead % has an unusable owner_name (%). An agent cannot call this record. Fix the name first, then assign.',
      NEW.lead_id, coalesce(nm, '(null)');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_garbage_name_assignment ON operator_lead_assignments;
CREATE TRIGGER trg_block_garbage_name_assignment
  BEFORE INSERT ON operator_lead_assignments
  FOR EACH ROW EXECUTE FUNCTION usfl_block_garbage_name_assignment();

-- ---------------------------------------------------------------------
-- 3. Keep foreclosure_leads.assigned_agent in sync automatically
-- ---------------------------------------------------------------------
-- This TEXT column is denormalized and drifted badly (phantom owners,
-- NULLs on assigned leads, and rows naming a different agent than the
-- assignment table). Maintain it from the assignment table so it can
-- never disagree again.
CREATE OR REPLACE FUNCTION usfl_sync_assigned_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE foreclosure_leads
       SET assigned_agent = NULL, assigned_date = NULL
     WHERE id = OLD.lead_id
       AND NOT EXISTS (SELECT 1 FROM operator_lead_assignments a
                        WHERE a.lead_id = OLD.lead_id AND a.status = 'active');
    RETURN OLD;
  END IF;

  UPDATE foreclosure_leads
     SET assigned_agent = (SELECT full_name FROM user_pins WHERE id = NEW.operator_pin_id),
         assigned_date  = coalesce(NEW.assigned_at, now())
   WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_assigned_agent ON operator_lead_assignments;
CREATE TRIGGER trg_sync_assigned_agent
  AFTER INSERT OR UPDATE OR DELETE ON operator_lead_assignments
  FOR EACH ROW EXECUTE FUNCTION usfl_sync_assigned_agent();

-- ---------------------------------------------------------------------
-- 4. Corrected owner-name quality gate on the leads table itself
-- ---------------------------------------------------------------------
-- The old constraint hardcoded the word "person": NOT ILIKE '%person not
-- found%'. It therefore accepted 'not found not found', 'unknown',
-- 'Unknown - Tax Sale' and even ''. Must be added NOT VALID because the
-- already-quarantined rows still carry their garbage names.
ALTER TABLE foreclosure_leads DROP CONSTRAINT IF EXISTS chk_owner_name_valid;
ALTER TABLE foreclosure_leads
  ADD CONSTRAINT chk_owner_name_valid CHECK (
    owner_name IS NULL
    OR (
      owner_name !~* 'not\s*found'
      AND owner_name !~* '^\s*unknown\b'   -- keeps '...HEIRS KNOWN AND UNKNOWN'
      AND owner_name !~* 'error-'
    )
  ) NOT VALID;
