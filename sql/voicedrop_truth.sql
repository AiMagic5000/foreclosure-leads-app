-- =====================================================================
-- Voice drop: stop the dashboard lying                     2026-07-31
-- =====================================================================
-- /api/voice-drop marks foreclosure_leads.voicemail_sent = true the moment
-- a job is ENQUEUED, before the R740xd worker has tried anything. When the
-- worker then fails -- overwhelmingly "slybroadcast: API access not allowed",
-- because each agent must enable API access on their OWN SlyBroadcast account
-- -- the lead keeps showing "Sent" forever.
--
-- Result: 259 drops across five working agents silently never happened, and
-- their dashboards told them those claimants had been called. They moved on.
--
-- The worker runs off-box, so fix it where both sides meet: when a queue job
-- lands in a failed state, undo the optimistic flag and surface the real error.
-- The agent then sees the truth and can retry.
-- =====================================================================

CREATE OR REPLACE FUNCTION usfl_voicedrop_reconcile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('failed', 'error') AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE foreclosure_leads
       SET voicemail_sent = false,
           voicemail_sent_at = NULL,
           voicemail_error = left(coalesce(NEW.last_error, 'voice drop failed'), 500)
     WHERE id = NEW.lead_id;
  END IF;

  -- Worker confirmed delivery: make the optimistic flag real.
  IF NEW.status IN ('sent', 'delivered', 'completed') AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE foreclosure_leads
       SET voicemail_sent = true,
           voicemail_error = NULL,
           voicemail_sent_at = coalesce(voicemail_sent_at, now())
     WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_voicedrop_reconcile ON voice_drop_queue;
CREATE TRIGGER trg_voicedrop_reconcile
  AFTER UPDATE ON voice_drop_queue
  FOR EACH ROW EXECUTE FUNCTION usfl_voicedrop_reconcile();

-- ---------------------------------------------------------------------
-- Backfill: unstick every lead already lying about a drop that failed.
-- ---------------------------------------------------------------------
UPDATE foreclosure_leads l
   SET voicemail_sent = false,
       voicemail_sent_at = NULL,
       voicemail_error = left(coalesce(q.last_error, 'voice drop failed'), 500)
  FROM voice_drop_queue q
 WHERE q.lead_id = l.id
   AND q.status IN ('failed', 'error')
   AND l.voicemail_sent IS TRUE;
