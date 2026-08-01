-- ============================================================================
-- owner_name quality gate for foreclosure_leads
-- Replaces chk_owner_name_valid, which only blocked '%person not found%' and
-- therefore let bare 'not found not found' (213 rows), 'Unknown - Tax Sale'
-- (751 rows), raw county ledger rows, addresses and '' straight through.
--
-- Validated 2026-07-29 against all 29,352 live owner_name values:
--   blocks 1,229 / 1,229 known-garbage values  (100% recall)
--   blocks 0 legitimate person / business / trust / estate names
--   preserves 'ESTATE AND ALL HEIRS KNOWN AND UNKNOWN' (~383 rows),
--             'estate of ...' (71 rows), entity names with leading street
--             numbers ('2004 Lagoon Llc', '11747 Management Llc'),
--             and real names carrying parcel ids ('Rodney Crews 0038 074 001').
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1. Normalize on the way in (strip spreadsheet/CRLF artifacts and
--         collapse whitespace) so good names are FIXED, not rejected.
--         Without this, 16 rows like 'FIVEASH SHARBER & WANDA H_x000D_'
--         would be refused even though the name itself is real.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_owner_name() RETURNS trigger AS $$
BEGIN
  IF NEW.owner_name IS NOT NULL THEN
    NEW.owner_name := regexp_replace(NEW.owner_name, '_x00[0-9A-Fa-f]{2}_', '', 'g');
    NEW.owner_name := regexp_replace(NEW.owner_name, '[\r\n\t]+', ' ', 'g');
    NEW.owner_name := btrim(regexp_replace(NEW.owner_name, '\s{2,}', ' ', 'g'));
    IF NEW.owner_name = '' THEN
      NEW.owner_name := NULL;      -- empty string must never masquerade as a name
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_owner_name ON foreclosure_leads;
CREATE TRIGGER trg_normalize_owner_name
  BEFORE INSERT OR UPDATE OF owner_name ON foreclosure_leads
  FOR EACH ROW EXECUTE FUNCTION normalize_owner_name();


-- ---------------------------------------------------------------------------
-- STEP 2. The corrected CHECK constraint.
--
-- IMPORTANT: add it NOT VALID. The 1,229 quarantined rows still carry their
-- garbage owner_name (only status was changed), so a validating ADD CONSTRAINT
-- would abort. NOT VALID enforces on every future INSERT/UPDATE while leaving
-- the quarantined history readable.
-- ---------------------------------------------------------------------------
ALTER TABLE foreclosure_leads DROP CONSTRAINT IF EXISTS chk_owner_name_valid;

ALTER TABLE foreclosure_leads
  ADD CONSTRAINT chk_owner_name_valid CHECK (
    owner_name IS NULL OR (

      -- must have some substance
      length(btrim(owner_name)) >= 3

      -- (A) whole-value placeholders / bare labels / column headers
      AND btrim(owner_name) !~* ('^('
            || 'n/?a|none|null|tbd|test|unavailable|no\s+data|blank|unknown|'
            || 'owner|owners|name|names|current\s+owner|record\s+owner|'
            || 'owner\s+of\s+record|no\s+name|heirs\s+of|all\s+heirs|unknown\s+heirs|'
            || 'et\s+al|trust|estate|llc|inc|corp|company|'
            || 'board\s+of\s+elections|juvenile\s+center|treasurer|sheriff|auditor|probate'
          || ')\s*:?$')

      -- (B) 'not found' anywhere. THIS is the rule the old constraint missed:
      --     it required the literal word 'person' first.
      AND owner_name !~* 'not\s*found'

      -- (C) leading 'unknown ...' ('Unknown - Tax Sale', 'UNKNOWN OWNER - ...')
      --     Anchored so legitimate '... ALL HEIRS KNOWN AND UNKNOWN' survives.
      AND owner_name !~* '^\s*unknown\b'

      -- (D) other scraper placeholders
      AND owner_name !~* '^\s*former\s+owner'
      AND owner_name !~* '\berror\s*[-:]'

      -- (E) URLs, instructional / statute / report boilerplate, govt offices
      AND owner_name !~* ('(https?://|www\.|\.com|\.gov|\.org|\.net'
            || '|more information|you entered|see below|must be made payable'
            || '|must be submitted|request to claim|actual revenue|resale return'
            || '|oklahoma statute|purchaser within|misc\s+post\s+.*surplus'
            || '|clerk\s+of\s+courts)')
      AND owner_name !~* '^\s*section\s+\d'

      -- (F) numeric / date / punctuation only, and leading-comma fragments
      AND btrim(owner_name) !~ '^[0-9[:space:].,\-/:#&]+$'
      AND owner_name !~ '^\s*,'

      -- (G) raw scraped ledger rows: 'MM/DD/YY <Dept> <Name> ... <amount> <id>'
      AND owner_name !~ '^\s*[0-9]{1,2}/[0-9]{1,2}/[0-9]{2,4}\s'

      -- (H) address-only values (owner_name is not an address field)
      AND btrim(owner_name) !~* ',\s*[A-Za-z]{2}\.?,?\s*[0-9]{5}(-[0-9]{4})?$'
      AND btrim(owner_name) !~ '^[A-Za-z][A-Za-z .''\-]*\s+[A-Za-z]{2}\s+[0-9]{5}(-[0-9]{4})?$'
      AND btrim(owner_name) !~* '^p\.?\s?o\.?\s+box\s+[0-9]+$'
      AND NOT (
            btrim(owner_name) ~ '^[0-9]+\s'
        AND btrim(owner_name) ~* ('\y(st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|'
              || 'blvd|way|pl|place|cir|circle|ter|terrace|hwy|pkwy|trl|trail|loop|run|pike|row|le)\.?$')
      )
    )
  ) NOT VALID;


-- ---------------------------------------------------------------------------
-- STEP 3. Assignment-time quality gate.
--
-- Deliberately NOT a CHECK constraint: single-token names ('ANDERSON',
-- 'William') are incomplete but genuine, so rejecting them at insert would
-- destroy inventory. Gate them at ASSIGNMENT instead.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION owner_name_is_assignable(n text) RETURNS boolean AS $$
  SELECT n IS NOT NULL
     AND length(btrim(n)) >= 5
     -- at least two alphabetic runs => first + last name, or two entity words
     AND btrim(n) ~ '[A-Za-z]{2,}[^A-Za-z]+[A-Za-z]{2,}';
$$ LANGUAGE sql IMMUTABLE;

-- Block assignment of a non-assignable owner_name at the DB layer.
CREATE OR REPLACE FUNCTION guard_assignment_quality() RETURNS trigger AS $$
DECLARE
  nm text;
  st text;
BEGIN
  SELECT owner_name, status INTO nm, st
    FROM foreclosure_leads WHERE id = NEW.lead_id;
  IF st = 'quarantined' THEN
    RAISE EXCEPTION 'lead % is quarantined and cannot be assigned', NEW.lead_id;
  END IF;
  IF NOT owner_name_is_assignable(nm) THEN
    RAISE EXCEPTION 'lead % has an unassignable owner_name (%): needs a first and last name',
      NEW.lead_id, nm;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_assignment_quality ON operator_lead_assignments;
CREATE TRIGGER trg_guard_assignment_quality
  BEFORE INSERT ON operator_lead_assignments
  FOR EACH ROW EXECUTE FUNCTION guard_assignment_quality();


-- ---------------------------------------------------------------------------
-- STEP 4. Verification queries
-- ---------------------------------------------------------------------------
-- Should return 0: garbage that is still assigned to an agent.
-- SELECT count(*) FROM operator_lead_assignments a
--   JOIN foreclosure_leads l ON l.id = a.lead_id
--  WHERE a.status = 'active'
--    AND (l.owner_name ~* 'not\s*found' OR l.owner_name ~* '^\s*unknown\b');

-- Rows that would fail the new constraint (all should be status='quarantined'):
-- SELECT status, count(*) FROM foreclosure_leads
--  WHERE NOT owner_name_is_assignable(owner_name) GROUP BY status;
