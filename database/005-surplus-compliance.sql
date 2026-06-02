-- Migration 005: Surplus Recovery Compliance Gate
-- Adds the fail-closed (shadow-capable) document-merge + send compliance system.
-- Tables: surplus_state_rules, generated_documents, send_events, send_blocks, outreach_copy_reviews
--
-- Reconciliation notes:
--   * "leads" in the handoff  -> existing foreclosure_leads (id TEXT)
--   * "agents" in the handoff -> existing user_pins (id UUID)
--   * Existing state_data table is left intact (used by current UI). surplus_state_rules is the
--     richer, authoritative compliance source consumed by the validation gate. Where both exist,
--     surplus_state_rules wins for gate/merge decisions.
--   * legal_status seeds as 'unverified' for ALL jurisdictions. The gate runs in SHADOW mode
--     (logs, never blocks) until each state is reviewed by counsel and flipped to 'verified'.

-- =====================================================================
-- 4.1  surplus_state_rules  (seed below; counsel flips legal_status)
-- =====================================================================
CREATE TABLE IF NOT EXISTS surplus_state_rules (
  state                        CHAR(2) PRIMARY KEY,
  state_name                   TEXT NOT NULL,
  foreclosure_type             TEXT,            -- judicial | non_judicial | both
  covers                       TEXT,            -- mortgage_surplus | tax_sale_excess | both
  claim_deadline_text          TEXT,            -- merge-ready, jurisdiction-specific sentence
  claim_deadline_months        INT,             -- window from sale date; NULL/0 if none/unknown
  fund_holder                  TEXT,
  venue_text                   TEXT,
  nonattorney_recovery_allowed TEXT,            -- yes | no | restricted
  fee_cap_pct                  NUMERIC,         -- statutory max %, NULL if no % cap
  fee_cap_text                 TEXT,
  solicitation_restrictions    TEXT,
  statute_refs                 TEXT,
  legal_status                 TEXT NOT NULL DEFAULT 'unverified',  -- verified | unverified
  research_confidence          TEXT DEFAULT 'low',                  -- high | medium | low
  verified_date                DATE,
  verified_by                  TEXT,
  source                       TEXT,
  notes                        TEXT,
  updated_at                   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4.4  generated_documents  (gate result lives here)
-- =====================================================================
CREATE TABLE IF NOT EXISTS generated_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      TEXT REFERENCES foreclosure_leads(id),
  doc_type     TEXT NOT NULL,                   -- email | agreement
  gate_mode    TEXT NOT NULL DEFAULT 'shadow',  -- shadow | soft | enforce
  gate_passed  BOOLEAN,                         -- would-pass (shadow) or did-pass (enforce)
  gate_blocked BOOLEAN DEFAULT FALSE,           -- actually blocked the action
  gate_fails   JSONB,                           -- [{ check, severity, message }]
  state        CHAR(2),
  estimated_surplus NUMERIC,
  artifact_ref TEXT,                            -- storage path / draft id
  created_by   TEXT,                            -- house | agent:<pin_uuid> | clerk_email
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gendocs_lead ON generated_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_gendocs_created ON generated_documents(created_at DESC);

-- =====================================================================
-- 4.5  send_events
-- =====================================================================
CREATE TABLE IF NOT EXISTS send_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    TEXT REFERENCES foreclosure_leads(id),
  doc_id     UUID REFERENCES generated_documents(id),
  channel    TEXT,                              -- email | sms | rvm | certified_mail | phone
  recipient  TEXT,
  provider   TEXT,                              -- mxroute | hostinger_imap | textbee | slybroadcast | lob
  status     TEXT,                              -- queued | sent | delivered | failed | bounced | blocked
  detail     JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sendevents_lead ON send_events(lead_id);

-- =====================================================================
-- 4.6  send_blocks  (audit: what the gate stopped and why)
-- =====================================================================
CREATE TABLE IF NOT EXISTS send_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       TEXT REFERENCES foreclosure_leads(id),
  state         CHAR(2),
  doc_type      TEXT,
  channel       TEXT,
  gate_mode     TEXT,                            -- shadow | soft | enforce
  would_block   BOOLEAN DEFAULT TRUE,            -- TRUE always; shadow rows are "would have blocked"
  failed_checks JSONB NOT NULL,
  actor         TEXT,                            -- house | agent:<pin_uuid> | clerk_email
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sendblocks_created ON send_blocks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sendblocks_state ON send_blocks(state);

-- =====================================================================
-- 4.7  outreach_copy_reviews  (agent custom-copy banned-language linter)
-- =====================================================================
CREATE TABLE IF NOT EXISTS outreach_copy_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   UUID REFERENCES user_pins(id),
  raw_copy   TEXT,
  violations JSONB,
  passed     BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- SEED surplus_state_rules (51 jurisdictions)
-- Sources: app CLAUDE.md tier/fee research, existing state_data seed, FRI handoff (2026-06-01),
--          email-draft STATE_CLAIM_WINDOWS. ALL legal_status='unverified' pending counsel.
-- fee_cap_pct: NULL = no statutory % cap found.  nonattorney_recovery_allowed: conservative.
-- claim_deadline_text is merge-ready; {months}->years rendered for the email deadline clause.
-- =====================================================================
INSERT INTO surplus_state_rules
  (state, state_name, foreclosure_type, covers, claim_deadline_months, claim_deadline_text,
   fund_holder, venue_text, nonattorney_recovery_allowed, fee_cap_pct, fee_cap_text,
   solicitation_restrictions, statute_refs, research_confidence, source, notes)
VALUES
  ('AL','Alabama','non_judicial','both',12,'Under Alabama law, former owners generally have one year from the foreclosure sale to claim surplus proceeds.','Clerk of court / foreclosing trustee','Claimant''s county of property, Alabama','yes',NULL,'No statutory percent cap identified.','Standard consumer-protection rules apply.','Ala. Code 35-10','medium','CLAUDE.md tier1','Tier 1 non-judicial. Confirm trustee surplus distribution procedure.'),
  ('AK','Alaska','non_judicial','both',12,'Under Alaska law, surplus claims are generally subject to a one-year window from the sale.','Trustee / state','Claimant''s judicial district, Alaska','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','AS 34.20','low','CLAUDE.md tier2','Confirm window + holder with counsel.'),
  ('AZ','Arizona','non_judicial','both',12,'Under Arizona law, surplus from a trustee''s sale must generally be claimed within the statutory period after the sale.','Trustee / county','Claimant''s county, Arizona','restricted',NULL,'Approx. $2,500 cap referenced in prior research; confirm.','Confirm assignment/solicitation rules.','A.R.S. 33-812','medium','state_data','Prior research notes $2,500 cap. Counsel confirm.'),
  ('AR','Arkansas','non_judicial','both',24,'Under Arkansas law, surplus claims are generally subject to a two-year window from the sale.','Commissioner / clerk','Claimant''s county, Arkansas','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Ark. Code 18-50','low','STATE_CLAIM_WINDOWS','Confirm with counsel.'),
  ('CA','California','non_judicial','both',12,'Under California law, claims to trustee-sale surplus are made through the trustee, generally within one year.','Trustee','Claimant''s county, California','no',NULL,'California restricts mortgage-foreclosure-consulting fee arrangements; treat non-attorney fee recovery as prohibited pending review.','Foreclosure-consultant statute restrictions; no cold solicitation of distressed owners.','Cal. Civ. Code 2924k; 2945 et seq.','medium','CLAUDE.md AVOID','AVOID list. Foreclosure-consultant rules. Route to attorney/declined.'),
  ('CO','Colorado','non_judicial','both',30,'Under Colorado law, overbid/surplus funds are held by the public trustee and subject to the statutory claim period (approx. 30 months).','Public trustee','Claimant''s county, Colorado','restricted',20,'Approx. 20% cap; prior research also notes a blackout period before solicitation.','Blackout period before contacting owners; confirm.','C.R.S. 38-38','medium','state_data','AVOID-tier per CLAUDE.md (20% + 2yr blackout). Counsel confirm.'),
  ('CT','Connecticut','judicial','mortgage_surplus',12,'Under Connecticut law, surplus from a strict foreclosure or sale is distributed by court order; deadlines are set by the court.','Clerk of court','Claimant''s judicial district, Connecticut','restricted',NULL,'Confirm; strict-foreclosure state often yields no surplus.','Standard rules apply.','Conn. Gen. Stat. 49','low','CLAUDE.md AVOID','Strict foreclosure -- surplus often absent. Low priority.'),
  ('DE','Delaware','judicial','mortgage_surplus',24,'Under Delaware law, surplus from a sheriff''s sale is paid into court and claimed by petition.','Clerk / sheriff','Claimant''s county, Delaware','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','10 Del. C.','low','STATE_CLAIM_WINDOWS','Confirm window + procedure.'),
  ('DC','District of Columbia','non_judicial','both',24,'Under District of Columbia law, surplus claims are generally subject to a two-year window.','Trustee / DC','Superior Court of the District of Columbia','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','D.C. Code 42','low','STATE_CLAIM_WINDOWS','Confirm with counsel.'),
  ('FL','Florida','judicial','both',12,'Under Florida law, surplus funds from a foreclosure sale are held by the clerk and former owners must file a claim before the funds escheat; act promptly.','Clerk of court','Claimant''s county, Florida','restricted',12,'Mortgage-surplus recovery agents capped at 12%; tax-deed surplus rules differ (approx. 20%). Pre-escheat fee limits apply.','Restrictions on contacting owners after the surplus is reported; confirm pre/post-escheat timing.','Fla. Stat. 45.031-45.035; 197.582','high','handoff+state_data','Handoff: research-grounded draft. Confirm pre-escheat fee position + judicial venue.'),
  ('GA','Georgia','non_judicial','both',12,'Under Georgia law, excess foreclosure-sale funds are held by the foreclosing party/court and claimed by the former owner.','Foreclosing party / clerk','Claimant''s county, Georgia','yes',NULL,'No statutory percent cap identified.','County resistance noted; attorney partnership often required.','O.C.G.A. 44-14-190; 48-4','medium','CLAUDE.md tier6','High avg surplus, attorney-assisted. Counsel confirm.'),
  ('HI','Hawaii','both','both',12,'Under Hawaii law, surplus is distributed by the court/commissioner following sale confirmation.','Commissioner / court','Claimant''s circuit, Hawaii','restricted',NULL,'Confirm.','Standard rules apply.','HRS 667','low','STATE_CLAIM_WINDOWS','Confirm with counsel.'),
  ('ID','Idaho','non_judicial','both',12,'Under Idaho law, trustee-sale surplus is generally claimed within the statutory period after the sale.','Trustee','Claimant''s county, Idaho','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Idaho Code 45-1507','medium','CLAUDE.md tier1','Tier 1 non-judicial.'),
  ('IL','Illinois','judicial','mortgage_surplus',12,'Under Illinois law, surplus from a judicial sale is held by the clerk and claimed by motion.','Clerk of court','Claimant''s county, Illinois','restricted',NULL,'Attorney-assisted; confirm.','Standard rules apply.','735 ILCS 5/15-1512','low','CLAUDE.md tier6','Hard/attorney-only.'),
  ('IN','Indiana','judicial','both',12,'Under Indiana law, tax-sale surplus and sheriff-sale surplus are held by the county and claimed by petition.','County auditor / clerk','Claimant''s county, Indiana','yes',NULL,'Confirm tax-sale surplus fee rules.','Standard rules apply.','Ind. Code 6-1.1-24; 32-29','medium','CLAUDE.md tier4','Easy judicial, attorney for filings.'),
  ('IA','Iowa','judicial','mortgage_surplus',24,'Under Iowa law, surplus from an execution sale is held by the clerk and claimed within the statutory window.','Clerk of court','Claimant''s county, Iowa','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Iowa Code 654','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('KS','Kansas','judicial','mortgage_surplus',24,'Under Kansas law, surplus from a sheriff''s sale is paid into court and claimed by the former owner.','Clerk of court','Claimant''s county, Kansas','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','K.S.A. 60-2414','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('KY','Kentucky','judicial','mortgage_surplus',12,'Under Kentucky law, surplus from a judicial sale is held by the master commissioner and claimed by the former owner.','Master commissioner','Claimant''s county, Kentucky','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','KRS 426','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('LA','Louisiana','judicial','mortgage_surplus',12,'Under Louisiana law, surplus from a sheriff''s sale is distributed per the court''s ranking of claims.','Clerk / sheriff','Claimant''s parish, Louisiana','restricted',NULL,'Confirm.','Standard rules apply.','La. C.C.P. 2373','low','STATE_CLAIM_WINDOWS','Parish (not county) terminology internally only.'),
  ('ME','Maine','judicial','mortgage_surplus',12,'Under Maine law, surplus from a foreclosure sale is paid to the former owner after the sale accounting.','Clerk of court','Claimant''s county, Maine','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','14 M.R.S. 6324','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('MD','Maryland','judicial','mortgage_surplus',36,'Under Maryland law, surplus from a foreclosure sale is held by the court auditor and claimed within the statutory period.','Clerk / court auditor','Claimant''s county, Maryland','no',NULL,'Maryland foreclosure-consultant statute restricts non-attorney fee arrangements; treat as prohibited pending review.','Foreclosure-consultant protections; restrictions on solicitation.','Md. Real Prop. 7-301 et seq.','medium','CLAUDE.md AVOID','AVOID -- foreclosure-consultant statute.'),
  ('MA','Massachusetts','non_judicial','mortgage_surplus',36,'Under Massachusetts law, surplus from a foreclosure sale is held by the mortgagee/court and claimed by the former owner.','Mortgagee / court','Claimant''s county, Massachusetts','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','M.G.L. c.244','low','CLAUDE.md tier3','Moderate non-judicial.'),
  ('MI','Michigan','non_judicial','both',12,'Under Michigan law, surplus from a sheriff''s sale and tax-sale surplus are claimed through the foreclosing officer/county.','Sheriff / county treasurer','Claimant''s county, Michigan','yes',NULL,'No statutory percent cap identified; post-Rafaeli tax-surplus rights apply.','Standard rules apply.','MCL 600.3252; 211.78t','medium','CLAUDE.md tier3','Rafaeli tax-surplus framework. Counsel confirm.'),
  ('MN','Minnesota','non_judicial','mortgage_surplus',12,'Under Minnesota law, surplus from a foreclosure sale is held and claimed within the statutory redemption framework.','Sheriff / court','Claimant''s county, Minnesota','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Minn. Stat. 580','low','CLAUDE.md tier3','Moderate non-judicial.'),
  ('MS','Mississippi','non_judicial','both',12,'Under Mississippi law, surplus from a trustee''s sale is paid to the former owner after the sale.','Trustee / chancery clerk','Claimant''s county, Mississippi','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Miss. Code 89-1','medium','CLAUDE.md tier1','Tier 1 non-judicial.'),
  ('MO','Missouri','non_judicial','mortgage_surplus',24,'Under Missouri law, surplus from a trustee''s sale is paid to the former owner per the deed of trust accounting.','Trustee','Claimant''s county, Missouri','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Mo. Rev. Stat. 443','medium','CLAUDE.md tier2','Tier 2 non-judicial.'),
  ('MT','Montana','non_judicial','both',12,'Under Montana law, trustee-sale surplus is claimed within the statutory period after the sale.','Trustee','Claimant''s county, Montana','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Mont. Code 71-1','medium','CLAUDE.md tier1','Tier 1 non-judicial.'),
  ('NE','Nebraska','both','mortgage_surplus',24,'Under Nebraska law, surplus from a trustee or judicial sale is held and claimed by the former owner.','Trustee / clerk','Claimant''s county, Nebraska','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Neb. Rev. Stat. 76','low','CLAUDE.md tier2','Tier 2.'),
  ('NV','Nevada','non_judicial','both',12,'Under Nevada law, trustee-sale surplus and tax-sale excess are claimed within one year of the sale.','Trustee / county treasurer','Claimant''s county, Nevada','restricted',10,'Approx. 10% on tax overage; mortgage surplus approx. $2,500 cap per prior research.','Confirm assignment/solicitation rules.','NRS 40.462-463; 361.610','medium','state_data','Tier 5 capped. Counsel confirm caps.'),
  ('NH','New Hampshire','non_judicial','mortgage_surplus',12,'Under New Hampshire law, surplus from a foreclosure sale is held by the mortgagee/court and claimed by the former owner.','Mortgagee / court','Claimant''s county, New Hampshire','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','RSA 479','low','CLAUDE.md tier3','Moderate non-judicial.'),
  ('NJ','New Jersey','judicial','mortgage_surplus',24,'Under New Jersey law, surplus from a sheriff''s sale is deposited with the Superior Court and claimed by motion.','Superior Court / sheriff','Claimant''s county, New Jersey','restricted',NULL,'Confirm surplus-funds finder restrictions.','Restrictions on surplus-funds finders; confirm.','N.J.S.A. 2A:50','low','STATE_CLAIM_WINDOWS','Confirm finder statute.'),
  ('NM','New Mexico','judicial','mortgage_surplus',12,'Under New Mexico law, surplus from a judicial sale is held by the court and claimed by the former owner.','Clerk of court','Claimant''s county, New Mexico','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','NMSA 39-5','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('NY','New York','judicial','mortgage_surplus',60,'Under New York law, surplus money proceedings determine claims to foreclosure surplus; act within the statutory period.','Clerk of court / referee','Claimant''s county, New York','restricted',NULL,'Attorney-assisted; confirm surplus-money-proceeding rules.','Restrictions on solicitation; confirm.','N.Y. RPAPL 1361-1362','low','CLAUDE.md tier6','Hard/attorney-only.'),
  ('NC','North Carolina','non_judicial','both',12,'Under North Carolina law, surplus from a power-of-sale foreclosure is paid to the clerk of superior court and claimed by the former owner.','Clerk of superior court','Claimant''s county, North Carolina','restricted',NULL,'North Carolina caps recovery-agent compensation (approx. $1,000); treat as restricted.','Fee cap by statute; confirm.','N.C.G.S. 45-21.31; 116B','medium','CLAUDE.md AVOID','AVOID -- $1,000 cap.'),
  ('ND','North Dakota','both','mortgage_surplus',24,'Under North Dakota law, surplus from a foreclosure sale is held and claimed by the former owner.','Sheriff / clerk','Claimant''s county, North Dakota','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','N.D.C.C. 32-19','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('OH','Ohio','judicial','mortgage_surplus',24,'Under Ohio law, surplus from a sheriff''s sale is held by the clerk and claimed by the former owner within the statutory period.','Clerk of court','Claimant''s county, Ohio','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','O.R.C. 2329.44','high','CLAUDE.md tier4','Largest current inventory. Easy judicial; attorney for filings.'),
  ('OK','Oklahoma','both','mortgage_surplus',24,'Under Oklahoma law, surplus from a sheriff''s sale is held by the court clerk and claimed by the former owner.','Court clerk','Claimant''s county, Oklahoma','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','12 O.S. 686','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('OR','Oregon','both','both',24,'Under Oregon law, surplus from a trustee or judicial sale is claimed by the former owner per the sale accounting.','Trustee / clerk','Claimant''s county, Oregon','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','ORS 86.794','medium','CLAUDE.md tier2','Tier 2.'),
  ('PA','Pennsylvania','judicial','mortgage_surplus',24,'Under Pennsylvania law, surplus from a sheriff''s sale is distributed per the proposed schedule of distribution; object/claim within the period.','Sheriff / prothonotary','Claimant''s county, Pennsylvania','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Pa. R.C.P. 3136','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('RI','Rhode Island','non_judicial','mortgage_surplus',12,'Under Rhode Island law, surplus from a foreclosure sale is paid to the former owner after the sale.','Mortgagee / court','Claimant''s county, Rhode Island','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','R.I.G.L. 34-27','low','CLAUDE.md tier3','Moderate non-judicial.'),
  ('SC','South Carolina','judicial','mortgage_surplus',12,'Under South Carolina law, surplus from a foreclosure sale is held by the master-in-equity/clerk and claimed by the former owner.','Master-in-equity / clerk','Claimant''s county, South Carolina','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','S.C. Code 15-39','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('SD','South Dakota','both','mortgage_surplus',12,'Under South Dakota law, surplus from a foreclosure sale is held and claimed by the former owner.','Sheriff / clerk','Claimant''s county, South Dakota','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','SDCL 21-48','low','CLAUDE.md tier3','Moderate.'),
  ('TN','Tennessee','non_judicial','both',12,'Under Tennessee law, trustee-sale surplus is paid to the former owner after the sale.','Trustee / clerk','Claimant''s county, Tennessee','restricted',10,'Approx. 10% cap if licensed; prior research notes a PI-license requirement for recovery work.','Confirm PI-license requirement before solicitation.','Tenn. Code 35-5','medium','CLAUDE.md tier5','Capped + PI license. Counsel confirm.'),
  ('TX','Texas','non_judicial','both',24,'Under Texas law, excess proceeds from a tax sale are held by the officer/court and must be claimed within two years; trustee-sale surplus rules differ.','Officer of the court / county','Claimant''s county, Texas','no',25,'A NON-ATTORNEY may not charge a fee to obtain tax-sale excess proceeds for an owner. Attorney fee capped at the lesser of 25% or $1,000. Assignment route only >=36 days after deposit, >=80% paid up front, no phone/in-person solicitation.','No phone, SMS, RVM, or in-person solicitation. Assignment-only route with strict conditions.','Tex. Tax Code 34.04; 34.21','high','handoff','HARD CASE. nonattorney=no -> route to attorney workflow. Distinguish tax-sale excess vs trustee-sale surplus.'),
  ('UT','Utah','non_judicial','mortgage_surplus',12,'Under Utah law, trustee-sale surplus is claimed by the former owner per the sale accounting.','Trustee','Claimant''s county, Utah','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Utah Code 57-1','low','CLAUDE.md tier3','Moderate non-judicial.'),
  ('VT','Vermont','judicial','mortgage_surplus',12,'Under Vermont law, surplus from a foreclosure is distributed by the court; strict foreclosure often yields no surplus.','Clerk of court','Claimant''s county, Vermont','restricted',NULL,'Confirm.','Standard rules apply.','12 V.S.A. 4531','low','CLAUDE.md AVOID','Strict foreclosure -- surplus often absent.'),
  ('VA','Virginia','non_judicial','both',12,'Under Virginia law, trustee-sale surplus is paid to the former owner after the sale accounting.','Trustee','Claimant''s county/city, Virginia','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Va. Code 55.1-321','medium','CLAUDE.md tier1','Tier 1 non-judicial, highest priority.'),
  ('WA','Washington','non_judicial','both',12,'Under Washington law, trustee-sale surplus and tax-sale excess are deposited with the court/treasurer and claimed by the former owner.','Clerk / county treasurer','Claimant''s county, Washington','restricted',5,'Washington caps recovery-agent compensation at approximately 5%.','Fee cap by statute (RCW 63.29.350); confirm.','RCW 61.24.080; 84.64.080; 63.29.350','medium','CLAUDE.md AVOID','AVOID -- 5% cap.'),
  ('WV','West Virginia','non_judicial','both',24,'Under West Virginia law, trustee-sale surplus is paid to the former owner after the sale.','Trustee / clerk','Claimant''s county, West Virginia','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','W. Va. Code 38-1','low','CLAUDE.md tier2','Tier 2.'),
  ('WI','Wisconsin','judicial','mortgage_surplus',12,'Under Wisconsin law, surplus from a foreclosure sale is held by the clerk and claimed by the former owner.','Clerk of court','Claimant''s county, Wisconsin','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Wis. Stat. 846','low','STATE_CLAIM_WINDOWS','Confirm.'),
  ('WY','Wyoming','non_judicial','mortgage_surplus',12,'Under Wyoming law, trustee/sheriff-sale surplus is paid to the former owner after the sale accounting.','Sheriff / clerk','Claimant''s county, Wyoming','yes',NULL,'No statutory percent cap identified.','Standard rules apply.','Wyo. Stat. 34-4','medium','CLAUDE.md tier1','Tier 1 non-judicial. (FRI is WY-registered but venue still = property state.)')
ON CONFLICT (state) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  foreclosure_type = EXCLUDED.foreclosure_type,
  covers = EXCLUDED.covers,
  claim_deadline_months = EXCLUDED.claim_deadline_months,
  claim_deadline_text = EXCLUDED.claim_deadline_text,
  fund_holder = EXCLUDED.fund_holder,
  venue_text = EXCLUDED.venue_text,
  nonattorney_recovery_allowed = EXCLUDED.nonattorney_recovery_allowed,
  fee_cap_pct = EXCLUDED.fee_cap_pct,
  fee_cap_text = EXCLUDED.fee_cap_text,
  solicitation_restrictions = EXCLUDED.solicitation_restrictions,
  statute_refs = EXCLUDED.statute_refs,
  research_confidence = EXCLUDED.research_confidence,
  source = EXCLUDED.source,
  notes = EXCLUDED.notes,
  updated_at = NOW();
