# Claude Code Handoff — FRI Surplus Recovery: Dashboard + Database Endpoints

**From:** Claude (chat)  **To:** Claude Code  **Date:** 2026-06-01
**Goal:** Finish the agent dashboard + Supabase database/endpoints for the Foreclosure Recovery Inc. surplus-recovery operation, with a fail-closed compliance gate baked in so no document can ship with mismatched, wrong-state, or non-compliant data.

---

## 0. TL;DR

We have two claimant-facing documents (an HTML outreach email and a Word contingency agreement) that were being rendered from a broken data merge — wrong state, contradictory dollar amounts, Wyoming venue on out-of-state consumers, missing consumer disclosures. We rebuilt both as merge-safe templates, built a 50-state legal-rules table (2 states verified, 48+DC fail-safe), and specced a pre-send validation gate. Your job: stand up the database, wire the merge + gate + send pipeline behind real endpoints, and finish the dashboard that drives it. **The gate is fail-closed: unknown/unverified data = block.**

---

## 1. System map

- **Foreclosure Recovery Inc. (FRI)** — client brand. `usforeclosurerecovery.com`. WY address: 30 N Gould St, Ste R, Sheridan, WY 82801. (888) 545-8007. claim@usforeclosurerecovery.com. Client success fee 30%, no upfront, FRI pays court costs.
- **US Foreclosure Leads** — agent platform. `usforeclosureleads.com`. $995 agent partnership: 50 exclusive DNC-scrubbed leads/week, certified letters mailed on the agent's behalf, RVM/SMS/email automation loaded with agent name, dedicated landing page on the FRI site, shared 800 ext + name@usforeclosurerecovery.com, **50/50 split of up to the 30% fee** (state caps apply).
- **MyStateFunds.com** — claim processing platform (signed contingencies run through it).
- **Start My Business Inc. (SMB)** — parent; handles payment processing for all entities.
- **Stack:** Coolify, n8n, Supabase ("Cognabase"), MXroute (email), TextBee (SMS), RVM provider, certified-mail provider (e.g., Lob). Dashboard is Next.js.

---

## 2. Inputs already produced (drop these in the repo)

| File | Put in | Role |
|------|--------|------|
| `FRI-Surplus-Outreach-Email-Template.html` | `/templates/` | Outreach email, all `[[TOKENS]]`, self-documented merge fields + 6 validation rules in the header comment |
| `FRI-Contingency-Fee-Agreement-TEMPLATE.docx` | `/templates/` | Rebuilt contingency agreement, merge tokens, consumer disclosures, right-to-cancel, venue = claimant state |
| `surplus_state_rules.csv` | `/data/` → seed Supabase | 50 states + DC; FL/TX `verified`, rest `unverified` |
| `Surplus-Send-Validation-Gate-SPEC.md` | `/docs/` | Full gate spec + n8n Function-node reference implementation (15 checks) |

The email and agreement share token names; **`estimated_surplus` must be a single source value merged into BOTH**.

---

## 3. Findings that drive the build (don't regress these)

1. **The root bug was the merge, not the copy.** One claimant got an email saying *State: NH / $768,521 / New Hampshire law* for a *Fort Lauderdale, FL* property, and an agreement saying *$104,226 / Wyoming venue / "Fort Lauderdale, NH"* with a NYC phone. Fields were stitched from mismatched sources. Every endpoint below exists to make that impossible.
2. **Venue must equal the claimant's state.** The old agreement forced WY law/venue on out-of-state consumers — unenforceable. Governing law/venue now = `property_state`.
3. **Amounts are estimates.** Any surplus figure is "preliminary, public records, subject to verification" and must be identical across documents.
4. **Consumer disclosures are mandatory.** Both documents must state the owner can claim the funds themselves (possibly free) and the agreement must include a 5-business-day right to cancel.
5. **TX (and states like it) break the model.** Texas tax-sale excess proceeds: a **non-attorney may not charge a fee** to obtain proceeds for an owner; attorney fee capped at lesser of 25%/$1,000; 2-yr deadline; assignment route only ≥36 days after deposit, no phone/in-person solicitation, ≥80% paid up front, court payout ≤125% of that. The dashboard's "20%" assumption for TX is wrong. → `nonattorney_recovery_allowed = 'no'` must route to an attorney workflow, not a normal send.
6. **Agents must stay on-program.** No self-branded/Gmail outreach. Same gate fires for agent-generated documents.

---

## 4. Database schema (Supabase / Postgres)

```sql
-- 4.1 Legal rules table (seed from surplus_state_rules.csv)
create table surplus_state_rules (
  state                        char(2) primary key,
  state_name                   text not null,
  foreclosure_type             text,
  covers                       text,            -- mortgage_surplus | tax_sale_excess | both
  claim_deadline_text          text,            -- merge-ready, jurisdiction-specific
  claim_deadline_months        int,
  fund_holder                  text,
  venue_text                   text,
  nonattorney_recovery_allowed text,            -- yes | no | restricted
  fee_cap_pct                  numeric,
  fee_cap_text                 text,
  solicitation_restrictions    text,
  statute_refs                 text,
  legal_status                 text not null default 'unverified',  -- verified | unverified
  verified_date                date,
  source                       text,
  notes                        text,
  updated_at                   timestamptz default now()
);

-- 4.2 Agents
create table agents (
  id                  uuid primary key default gen_random_uuid(),
  display_name        text not null,
  legal_name          text,                     -- VERIFY before payout (had a name-mismatch case)
  program_email       text unique,              -- name@usforeclosurerecovery.com
  phone_ext           text,
  landing_page_slug   text unique,
  status              text default 'pending',   -- pending | active | suspended
  onboarding_verified bool default false,
  program_paid        bool default false,
  payout_method       text,                     -- 1099_sub | business_ach
  business_legal_name text,
  created_at          timestamptz default now()
);

-- 4.3 Leads / claims  (the merge record — ONE estimated_surplus)
create table leads (
  id                uuid primary key default gen_random_uuid(),
  claimant_name     text not null,
  claimant_phone    text,
  claimant_email    text,
  property_address  text not null,              -- must end ", ST ZIP"
  property_state    char(2) not null references surplus_state_rules(state),
  property_type     text,
  sale_date         date,
  fund_type         text,                       -- mortgage_surplus | tax_sale_excess
  estimated_surplus numeric,                    -- SINGLE SOURCE OF TRUTH
  estimate_basis    text default 'preliminary, public records, unverified',
  lead_source       text,
  skip_traced       bool default false,
  dnc_status        text default 'unknown',     -- clear | restricted | unknown
  assigned_agent_id uuid references agents(id),
  status            text default 'new',         -- new|contacted|signed|filed|recovered|closed|dead
  created_at        timestamptz default now()
);

-- 4.4 Rendered documents (gate result lives here)
create table generated_documents (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references leads(id),
  doc_type     text not null,                   -- email | agreement
  gate_passed  bool,
  gate_fails   jsonb,
  artifact_ref text,                            -- storage path/url
  created_by   text,                            -- house | agent:<uuid>
  created_at   timestamptz default now()
);

-- 4.5 Sends
create table send_events (
  id        uuid primary key default gen_random_uuid(),
  lead_id   uuid references leads(id),
  doc_id    uuid references generated_documents(id),
  channel   text,                               -- email|sms|rvm|certified_mail|phone
  recipient text,
  provider  text,                               -- mxroute|textbee|rvm|lob
  status    text,                               -- queued|sent|delivered|failed|bounced
  created_at timestamptz default now()
);

-- 4.6 Block log (audit — what the gate stopped and why)
create table send_blocks (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references leads(id),
  state         char(2),
  doc_type      text,
  failed_checks jsonb not null,
  actor         text,                           -- house | agent:<uuid>
  created_at    timestamptz default now()
);

-- 4.7 Agent custom-copy compliance reviews (banned-language linter)
create table outreach_copy_reviews (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid references agents(id),
  raw_copy   text,
  violations jsonb,
  passed     bool,
  created_at timestamptz default now()
);
```

**RLS:** house/admin role = full access. Agent role = read/write only `leads` where `assigned_agent_id = auth.uid()` mapping, read-only their own `agents` row and their `generated_documents`/`send_events`. `surplus_state_rules` is admin-write only.

---

## 5. Endpoints

PostgREST gives auto CRUD on the tables above (gated by RLS). The logic lives in three Edge Functions:

### 5.1 `POST /functions/v1/generate-documents`  ← the heart of it
```
body: { lead_id, doc_type: "email"|"agreement"|"both", actor }
steps:
  1. load lead + surplus_state_rules[lead.property_state]
  2. build merge context: pull estimated_surplus ONCE; pull
     claim_deadline_text, venue_text, fee_cap_pct, fund_holder from the rule row;
     set governing_law_state = lead.property_state
  3. render template(s) from /templates
  4. run the validation gate (Section 7 / SPEC) over the merged context + rendered output
  5. insert generated_documents row with {gate_passed, gate_fails, artifact_ref}
  6. if blocked: also insert send_blocks row
returns: { passed, fails[], artifacts? }   // 200 on pass; 422 + fails[] on block
```

### 5.2 `POST /functions/v1/send`
```
body: { lead_id, doc_id, channel }
guards:
  - generated_documents.gate_passed === true  (else 409)
  - re-check channel vs surplus_state_rules.solicitation_restrictions  (TX: no phone/sms/rvm/in-person)
  - re-check leads.dnc_status != 'restricted' for phone/sms/rvm
dispatch via provider (mxroute|textbee|rvm|lob); insert send_events
```

### 5.3 `POST /functions/v1/review-copy`  (agent custom copy linter)
```
body: { agent_id, raw_copy }
runs banned-language ruleset (Section 8); inserts outreach_copy_reviews; returns { passed, violations[] }
```

### 5.4 Admin (PostgREST, admin role)
- `PATCH /surplus_state_rules?state=eq.XX` — fill a state's rule row and flip `legal_status='verified'`.
- standard CRUD on `leads`, `agents`, `generated_documents`, `send_events`, `send_blocks`.

---

## 6. Merge pipeline rules

- **One value, two documents.** `leads.estimated_surplus` → both email and agreement. Never two sources.
- **State-derived fields come from `surplus_state_rules` only**, never hand-typed: deadline clause, venue, fee cap, fund holder.
- **`governing_law_state = property_state`** always.
- Money formatting normalized (`$xxx,xxx`) identically in both outputs.
- Reject the render if `property_state` ≠ the state parsed from the tail of `property_address`.

---

## 7. Validation gate (full spec: `/docs/Surplus-Send-Validation-Gate-SPEC.md`)

Run inside `generate-documents` (and re-checked in `send`). **Any hard fail = block + log.** Summary of the 15 checks:

1 state in table · 2 `legal_status==verified` · 3 address↔state match · 4 amount parity email==agreement · 5 venue==property_state · 6 deadline clause==state's text · 7 within claim window (WARN) · 8 if `nonattorney_recovery_allowed=='no'` → block unless attorney channel · 9 `fee_pct<=fee_cap_pct` · 10 channel allowed for state · 11 no deceptive `Re:`/`Fwd:` · 12 no false prior-contact claim · 13 required disclosures present (self-claim + right-to-cancel) · 14 working https unsubscribe · 15 no leftover `[[tokens]]`.

The SPEC has a drop-in JavaScript implementation for the n8n Function node — reuse it verbatim in the Edge Function.

---

## 8. Agent compliance guardrails

- Onboarding provisions `program_email` + `landing_page_slug`; `onboarding_verified` must be true before leads assign. Verify `legal_name` before any payout.
- Agents generate documents **through `generate-documents` only** — same gate, no bypass.
- `review-copy` banned-language ruleset (block/flag):
  - specific dollar amounts in cold copy (flag),
  - "guaranteed" / "confirmed yours" / "belongs to you" (block),
  - "no risk whatsoever" / absolute risk claims (block),
  - "lose it forever" / "permanent property of the government" unless tied to a verified state deadline (block),
  - personal/off-program contact info — gmail, personal cell (block),
  - generic-unclaimed-property framing ("we audit government records") when product is foreclosure surplus (flag),
  - missing "you may claim these funds yourself" disclosure (block).
- Use the company registration inbox / lead-tracking back office to detect agents running a shadow brand or going off-channel.

---

## 9. Dashboard surfaces (consume the endpoints)

- **Leads pipeline:** list/detail of `leads` (RLS-scoped), status board.
- **Generate documents:** button → `generate-documents`; show gate result; if blocked, render the `fails[]` plainly so the operator fixes the data, not the gate.
- **Send:** enabled only when `gate_passed`; channel picker respects state/DNC.
- **State rules admin:** editable grid over `surplus_state_rules` with a clear `verified/unverified` badge; flipping to verified is an explicit action.
- **Agent admin:** onboarding, email/landing-page provisioning, verification, payout method.
- **Compliance monitor:** `send_blocks` feed + `outreach_copy_reviews`.

---

## 10. Brand & hard rules (do NOT violate)

- Company name is **"Foreclosure Recovery Inc."** — **never "US Foreclosure Recovery Inc."** Domain is **usforeclosurerecovery.com** — never ForeclosureRecoveryInc.com.
- FRI palette: navy `#09274C`, red `#D82221`, gold `#C8A84B`.
- FRI claimant emails close with the **"ANY QUESTIONS ALWAYS ASK"** black box w/ gold accent, then **"Regards,"** then the signature.
- FRI signatory is **Corey Pearson / `[[REP_NAME]]`, Director** — NOT Chad Siegel (that signature belongs to other brands).
- Contacts: (888) 545-8007 · claim@usforeclosurerecovery.com · WY address above.

---

## 11. Build order

1. Create tables (Section 4) + RLS; seed `surplus_state_rules` from the CSV.
2. Storage bucket for rendered artifacts; load the two templates into `/templates`.
3. `generate-documents` Edge Function (merge + gate + logging) — port the gate JS from the SPEC.
4. `send` Edge Function (guards + provider dispatch + `send_events`).
5. `review-copy` Edge Function + ruleset.
6. Dashboard surfaces (Section 9).
7. Agent onboarding/provisioning flow.

## 12. Definition of done

- Render is impossible when state≠address, amounts differ, venue≠state, or any `[[token]]` remains.
- Sending is impossible unless `gate_passed` and channel/DNC allowed.
- An `unverified` state cannot send (returns a clear block).
- A `nonattorney_recovery_allowed='no'` state routes to the attorney workflow, never a normal send.
- Every block is logged to `send_blocks`; agent sends pass through the identical gate.

## 13. Open items for human / counsel (not Claude Code)

- Verify additional states into `surplus_state_rules` (next: GA, CA, NV, AZ) — fill row, confirm with counsel, flip `legal_status`.
- Legal review of the base contract + per-state disclosure language and the TX attorney-partner workflow.
- Confirm FL pre-escheat fee position and TX mortgage trustee-sale (vs tax-sale) surplus rules.
- FL/TX rows are research-grounded drafts, not legal advice.
