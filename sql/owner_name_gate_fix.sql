-- =====================================================================
-- Fix: owner_name gate must not freeze existing rows      2026-07-31
-- =====================================================================
-- chk_owner_name_valid was added as a CHECK constraint. A CHECK is evaluated
-- on EVERY update to the row, so once a lead carried a garbage owner_name it
-- became completely unmaintainable — we could not clear a stale voicemail flag,
-- fix a phone, or quarantine it further without the constraint rejecting the
-- write. That blocked the voice-drop reconciliation backfill.
--
-- Replace it with a BEFORE INSERT OR UPDATE trigger that only rejects when the
-- name is being SET to garbage. Pre-existing bad rows stay editable so they can
-- be cleaned up, but nothing new can introduce garbage.
-- =====================================================================

ALTER TABLE foreclosure_leads DROP CONSTRAINT IF EXISTS chk_owner_name_valid;

CREATE OR REPLACE FUNCTION usfl_reject_garbage_owner_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  bad boolean;
BEGIN
  -- Only judge the name when it is actually being introduced or changed.
  IF TG_OP = 'UPDATE' AND NEW.owner_name IS NOT DISTINCT FROM OLD.owner_name THEN
    RETURN NEW;
  END IF;

  bad := NEW.owner_name IS NOT NULL AND (
       NEW.owner_name ~* 'not\s*found'
    OR NEW.owner_name ~* '^\s*unknown\b'   -- keeps '...HEIRS KNOWN AND UNKNOWN'
    OR NEW.owner_name ~* 'error-'
  );

  IF bad THEN
    RAISE EXCEPTION
      'BLOCKED: owner_name "%" is a scraper placeholder, not a person. Fix the name or leave it NULL.',
      NEW.owner_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_garbage_owner_name ON foreclosure_leads;
CREATE TRIGGER trg_reject_garbage_owner_name
  BEFORE INSERT OR UPDATE ON foreclosure_leads
  FOR EACH ROW EXECUTE FUNCTION usfl_reject_garbage_owner_name();

-- Now the voice-drop backfill can run.
UPDATE foreclosure_leads l
   SET voicemail_sent = false,
       voicemail_sent_at = NULL,
       voicemail_error = left(coalesce(q.last_error, 'voice drop failed'), 500)
  FROM voice_drop_queue q
 WHERE q.lead_id = l.id
   AND q.status IN ('failed', 'error')
   AND l.voicemail_sent IS TRUE;
