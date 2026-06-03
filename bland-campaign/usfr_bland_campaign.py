#!/usr/bin/env python3
"""
USFR Bland.ai Outbound Campaign
================================
Foreclosure Recovery Inc. - Warm Lead Outreach via AI Phone Agent

Usage:
  python3 usfr_bland_campaign.py leads.csv              # Launch batch (all leads)
  python3 usfr_bland_campaign.py leads.csv --test        # Test mode (first call only)
  python3 usfr_bland_campaign.py leads.csv --dry-run     # Preview without calling
  python3 usfr_bland_campaign.py --status BATCH_ID       # Check batch status
  python3 usfr_bland_campaign.py --calls BATCH_ID        # Get call details

CSV columns (required): phone_number, first_name
CSV columns (optional): last_name, property_address, overage_amount, state, sale_date
"""

import csv
import json
import sys
import os
import re
import requests
from datetime import datetime

BLAND_API_KEY = "org_1b3369a241dcc27e92be2ef818734624cc628c275454c1df17ea53c955dd32d164084beaf56e8fd8bcd769"
BLAND_BASE_URL = "https://api.bland.ai"
TRANSFER_NUMBER = "+18885458007"
CALLER_ID = "+17022271822"  # USFR agent outbound CID

# ============================================================
# HARD-LOCKED: Non-Judicial States ONLY (Easiest to Process)
# ============================================================
# Tier 1 (Very Easy, 30%): VA, AL, MS, ID, MT, WY
# Tier 2 (Easy, 30%):      AK, MO, OR, NE, WV
# ALL other states are BLOCKED -- no exceptions.
APPROVED_STATES = {'VA', 'AL', 'MS', 'ID', 'MT', 'WY', 'AK', 'MO', 'OR', 'NE', 'WV'}

SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# ============================================================
# AI AGENT TASK PROMPT
# ============================================================
# This is the complete instruction set for the Bland.ai agent.
# It incorporates the USFR telemarketing scripts, fee agreement,
# claimant call guide, and website knowledge.

AGENT_TASK = """You are a professional recovery specialist calling on behalf of Foreclosure Recovery Incorporated. You are warm, empathetic, and confident. You speak naturally like a real person -- not robotic or scripted.

## YOUR IDENTITY
- Company: Foreclosure Recovery Incorporated
- Phone: (888) 545-8007
- Email: claim@usforeclosurerecovery.com
- Address: 30 N Gould St, Ste R, Sheridan, Wyoming 82801
- You are NOT a law firm. You do NOT provide legal advice.

## CRITICAL RULES (NEVER BREAK THESE)
1. NEVER say the word "county" -- always say "state" instead. Say "the state holds the funds" not "the county holds the funds". Say "state records" not "county records".
2. NEVER explain how to file a claim or recover funds themselves. If asked, say: "The process involves several legal steps that our recovery team handles. I can connect you with a recovery agent who can walk you through everything and get you started."
3. ALWAYS say "we" not "I" -- you speak for the company, not as an individual.
4. NEVER pressure or rush the prospect. Be patient and understanding.
5. If they ask about fees: "There are zero upfront costs. We only get paid when you get paid -- we take a percentage of what we recover for you, and we handle all the paperwork and filing costs."
6. Do NOT mention the exact percentage (30%) unless they specifically ask "what percentage" -- then say "Our standard fee is 30 percent of the recovered amount, and there are absolutely no upfront costs to you."

## OPENING (adapt naturally based on {{first_name}})
"Hi, may I speak with {{first_name}}?"

Wait for confirmation, then:

"Hey {{first_name}}, my name is Sarah and I'm calling from Foreclosure Recovery Incorporated. How are you doing today?"

Wait for response, then:

"Great. The reason for my call -- we've been reviewing state records and identified that there may be surplus funds from a foreclosure sale connected to your name. These are funds that rightfully belong to you, and we want to help you recover them."

## IF THEY HAVE A PROPERTY ADDRESS
"Specifically, this is related to the property at {{property_address}}."

## IF THERE'S AN OVERAGE AMOUNT
"Based on our records, the estimated surplus amount is around {{overage_amount}} dollars."

## QUALIFICATION QUESTIONS (ask naturally, not like a checklist)
1. "Are you aware of any foreclosure activity related to a property you previously owned?"
2. "Do you recall approximately when the foreclosure took place?"
3. "Have you already been contacted by anyone else about recovering these funds?"

## HANDLING RESPONSES

### If interested / wants to know more:
"That's great to hear. What happens next is really simple -- I can connect you with one of our recovery agents who will verify your eligibility, explain exactly how the process works, and if everything checks out, we can get started right away. There's no cost to you upfront. Would you like me to transfer you now, or would you prefer we schedule a callback at a time that works better for you?"

### If skeptical / "Is this a scam?":
"I completely understand your concern, {{first_name}}. We're a legitimate asset recovery company based in Sheridan, Wyoming. You can look us up at usforeclosurerecovery.com. We've helped over 3,400 families recover funds they didn't even know existed. We don't ask for any money upfront -- we only get paid if we successfully recover funds for you. Would you like me to send you some information by email so you can review it at your own pace?"

### If they say they already filed / working with someone:
"No problem at all. Just to make sure you're covered -- do you know if your claim has been fully processed? Sometimes these things take a while and deadlines can pass. If you'd like, we can have a recovery agent do a quick check to make sure nothing falls through the cracks. No obligation."

### If they ask "How did you get my number?":
"Your information came up during our review of state foreclosure records. When a property sells at auction for more than what was owed, the surplus is held by the state. We help connect former homeowners with those funds."

### If they ask "How does this work?" or "What do I need to do?":
"The short version is -- we handle everything. Our recovery team files the necessary paperwork with the state, tracks down all the documentation, and makes sure the funds get to you. All you need to do is verify your identity and sign an authorization so we can act on your behalf. A recovery agent can explain the full process. Would you like me to connect you?"

### If they want to think about it:
"Absolutely, take your time. Just keep in mind that the state does have deadlines for claiming these funds, and after that window closes the money could be forfeited. I can send you our information by email -- what's the best email address for you? And you can always call us directly at (888) 545-8007."

### If they say no / not interested:
"No problem, {{first_name}}. I appreciate your time. If you change your mind, you can always reach us at (888) 545-8007 or visit usforeclosurerecovery.com. Have a great day."

### If they get angry or hostile:
"I apologize for any inconvenience, {{first_name}}. We certainly don't mean to bother you. I'll make a note to remove you from our list. Have a good day."

## VOICEMAIL (if you reach voicemail)
"Hi {{first_name}}, this is Sarah calling from Foreclosure Recovery Incorporated. We've identified surplus funds from a foreclosure sale that may belong to you. These are funds the state is currently holding in your name. Please give us a call back at (888) 545-8007 -- that's (888) 545-8007. You can also visit usforeclosurerecovery.com. Have a great day."

## TRANSFER INSTRUCTIONS
When the prospect agrees to speak with a recovery agent, say:
"Perfect, I'm going to transfer you now to one of our recovery specialists. They'll be able to pull up your file and get you started. One moment please."
Then transfer the call.

## KEY FACTS YOU KNOW
- 84% of foreclosures generate recoverable surplus funds
- Over $17 billion in unclaimed funds held by states nationwide
- Typical recovery range: $10,000 to $100,000+
- Average recovery: $35,000-$45,000 after fees
- Most claims resolve in 60-90 days
- The state never contacts former homeowners about surplus funds -- they have to be claimed
- Eligibility: property foreclosed within 1-5 years depending on the state
- Required docs: government ID, Social Security number, original deed/mortgage docs
- No upfront costs, no hidden fees
- Company has helped 3,486+ families recover their funds

## WHAT YOU DO NOT KNOW / CANNOT ANSWER
- Specific legal advice (refer to recovery agent)
- Exact claim filing procedures (refer to recovery agent)
- Details about specific state laws or deadlines (refer to recovery agent)
- Anything about the internal recovery process steps (refer to recovery agent)
For ANY question you're unsure about: "That's a great question. A recovery agent would be the best person to answer that in detail. Would you like me to connect you?"
"""

FIRST_SENTENCE = "Hi, may I speak with {{first_name}}?"

# ============================================================
# COMPLIANCE GATES (Run before ANY call is placed)
# ============================================================

def verify_dnc_status(phones: list) -> dict:
    """
    Verify every phone against the database DNC flags.
    Returns {phone: True/False} where True = SAFE to call.
    Requires: on_dnc=false, can_contact=true, dnc_checked=true.
    Rejects any phone with stale DNC check (>7 days old).
    """
    from datetime import timezone, timedelta
    safe = {}
    blocked_dnc = []
    blocked_stale = []
    blocked_missing = []

    # Batch query Supabase for DNC status of all phones
    for phone in phones:
        digits = re.sub(r'\D', '', phone)
        if len(digits) == 11 and digits.startswith('1'):
            digits = digits[1:]  # Strip country code for DB lookup

        # Query DB for this phone's DNC status
        params = {
            "select": "primary_phone,on_dnc,can_contact,dnc_checked,dnc_checked_at",
            "or": f"(primary_phone.eq.{phone},primary_phone.eq.+1{digits},primary_phone.eq.{digits})",
            "limit": "1",
        }
        try:
            resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/foreclosure_leads",
                headers=SUPABASE_HEADERS,
                params=params,
                timeout=10,
            )
            resp.raise_for_status()
            rows = resp.json()
        except Exception:
            # If DB check fails, BLOCK the call (err on the side of caution)
            blocked_missing.append(phone)
            safe[phone] = False
            continue

        if not rows:
            blocked_missing.append(phone)
            safe[phone] = False
            continue

        row = rows[0]

        # Gate 1: Must be DNC-checked
        if not row.get('dnc_checked'):
            blocked_missing.append(phone)
            safe[phone] = False
            continue

        # Gate 2: Must NOT be on DNC
        if row.get('on_dnc'):
            blocked_dnc.append(phone)
            safe[phone] = False
            continue

        # Gate 3: Must be contactable
        if not row.get('can_contact'):
            blocked_dnc.append(phone)
            safe[phone] = False
            continue

        # Gate 4: DNC check must be fresh (<7 days)
        checked_at = row.get('dnc_checked_at', '')
        if checked_at:
            try:
                check_str = str(checked_at).replace('Z', '+00:00')
                if '+' not in check_str[10:] and '-' not in check_str[10:]:
                    check_str += '+00:00'
                check_dt = datetime.fromisoformat(check_str)
                now = datetime.now(timezone.utc)
                if (now - check_dt) > timedelta(days=7):
                    blocked_stale.append(phone)
                    safe[phone] = False
                    continue
            except (ValueError, TypeError):
                blocked_stale.append(phone)
                safe[phone] = False
                continue
        else:
            blocked_stale.append(phone)
            safe[phone] = False
            continue

        # All gates passed
        safe[phone] = True

    return safe, blocked_dnc, blocked_stale, blocked_missing


def enforce_state_filter(leads: list) -> tuple:
    """Hard-reject any lead not from approved non-judicial states."""
    approved = []
    rejected = []
    for lead in leads:
        state = lead.get('state', '').upper()
        if state in APPROVED_STATES:
            approved.append(lead)
        else:
            rejected.append(lead)
    return approved, rejected


# ============================================================
# FUNCTIONS
# ============================================================

def normalize_phone(phone: str) -> str:
    """Convert phone to E.164 format (+1XXXXXXXXXX)."""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        digits = '1' + digits
    if len(digits) == 11 and digits.startswith('1'):
        return '+' + digits
    return '+' + digits


def load_csv(filepath: str) -> list:
    """Load leads from CSV file."""
    leads = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        # Normalize column headers
        reader.fieldnames = [h.strip().lower().replace(' ', '_') for h in reader.fieldnames]
        for row in reader:
            phone = row.get('phone_number') or row.get('phone') or row.get('primary_phone', '')
            first_name = row.get('first_name') or row.get('name', 'there')
            if not phone:
                continue
            lead = {
                'phone_number': normalize_phone(phone),
                'first_name': first_name.strip().title(),
                'last_name': (row.get('last_name', '') or '').strip().title(),
                'property_address': (row.get('property_address', '') or '').strip(),
                'overage_amount': (row.get('overage_amount', '') or '').strip().replace('$', '').replace(',', ''),
                'state': (row.get('state', '') or row.get('state_abbr', '') or '').strip().upper(),
                'sale_date': (row.get('sale_date', '') or '').strip(),
            }
            leads.append(lead)
    return leads


def build_call_objects(leads: list) -> list:
    """Build Bland.ai call objects from lead data."""
    call_objects = []
    for lead in leads:
        obj = {
            'phone_number': lead['phone_number'],
            'request_data': {
                'first_name': lead['first_name'],
                'last_name': lead['last_name'],
                'property_address': lead['property_address'] or 'a property in your name',
                'overage_amount': lead['overage_amount'] or '',
                'state': lead['state'],
                'sale_date': lead['sale_date'],
            }
        }
        call_objects.append(obj)
    return call_objects


def create_batch(call_objects: list, test_mode: bool = False) -> dict:
    """Send batch call request to Bland.ai API."""
    payload = {
        'call_objects': call_objects,
        'global': {
            'task': AGENT_TASK,
            'first_sentence': FIRST_SENTENCE,
            'voice': 'June',
            'model': 'base',
            'language': 'babel-en',
            'max_duration': 8,
            'record': True,
            'wait_for_greeting': True,
            'temperature': 0.6,
            'transfer_phone_number': TRANSFER_NUMBER,
            'from': CALLER_ID,
            'voicemail': {
                'action': 'leave_message',
                'message': (
                    "Hi {{first_name}}, this is Sarah calling from Foreclosure Recovery Incorporated. "
                    "We've identified surplus funds from a foreclosure sale that may belong to you. "
                    "These are funds the state is currently holding. "
                    "Please give us a call back at (888) 545-8007. "
                    "You can also visit usforeclosurerecovery.com. Have a great day."
                ),
            },
            'background_track': 'office',
            'noise_cancellation': True,
            'keywords': [
                'Foreclosure Recovery Incorporated',
                'surplus funds',
                'foreclosure',
                'overage',
                'usforeclosurerecovery',
            ],
            'pronunciation_guide': [
                {
                    'word': 'USFR',
                    'pronunciation': 'U-S-F-R',
                },
            ],
            'summary_prompt': (
                'Summarize: Did the prospect show interest? Were they eligible? '
                'Did they agree to transfer? Any objections raised? '
                'Capture their email if provided. Note callback time if scheduled.'
            ),
            'dispositions': [
                'Transferred to Agent',
                'Interested - Callback Scheduled',
                'Interested - Email Sent',
                'Already Filed Claim',
                'Not Interested',
                'Wrong Number',
                'Do Not Call',
                'Voicemail Left',
                'No Answer',
                'Hostile - Remove from List',
            ],
            'guard_rails': [
                {
                    'id': 'tcpa_disclosure',
                    'description': 'TCPA compliance - if prospect asks to be removed or says do not call, immediately comply',
                },
            ],
            'metadata': {
                'campaign': 'usfr-warm-outreach',
                'version': '2.0',
                'date': datetime.now().strftime('%Y-%m-%d'),
                'state_filter': 'non-judicial-tier1-tier2-only',
                'dnc_verified': True,
            },
        },
        'label': f"USFR Warm Outreach - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
    }

    if test_mode:
        # Only call the first lead
        payload['call_objects'] = [call_objects[0]]
        payload['label'] = f"USFR TEST - {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    headers = {
        'Authorization': BLAND_API_KEY,
        'Content-Type': 'application/json',
    }

    resp = requests.post(
        f'{BLAND_BASE_URL}/v1/calls/batch',
        headers=headers,
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def check_batch_status(batch_id: str) -> dict:
    """Check status of a batch."""
    headers = {'Authorization': BLAND_API_KEY}
    resp = requests.get(
        f'{BLAND_BASE_URL}/v1/batches/{batch_id}',
        headers=headers,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_batch_calls(batch_id: str) -> dict:
    """Get call details for a batch."""
    headers = {'Authorization': BLAND_API_KEY}
    resp = requests.get(
        f'{BLAND_BASE_URL}/v1/batches/{batch_id}/calls',
        headers=headers,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def print_dry_run(leads: list) -> None:
    """Preview what would be called."""
    print(f"\n{'='*60}")
    print(f"  DRY RUN - {len(leads)} leads loaded")
    print(f"{'='*60}\n")
    for i, lead in enumerate(leads[:20], 1):
        amt = f"${float(lead['overage_amount']):,.0f}" if lead['overage_amount'] else 'Unknown'
        print(f"  {i:3}. {lead['first_name']} {lead['last_name']}")
        print(f"       Phone: {lead['phone_number']}")
        print(f"       Property: {lead['property_address'] or 'N/A'}")
        print(f"       Amount: {amt}")
        print(f"       State: {lead['state'] or 'N/A'}")
        print()
    if len(leads) > 20:
        print(f"  ... and {len(leads) - 20} more leads\n")
    print(f"  Voice: June | Model: base | Max Duration: 8 min")
    print(f"  Transfer: {TRANSFER_NUMBER}")
    print(f"  Caller ID: {CALLER_ID}")
    print(f"  Voicemail: Leave message")
    print(f"  Recording: Enabled")
    print(f"{'='*60}\n")


# ============================================================
# MAIN
# ============================================================

def main():
    args = sys.argv[1:]

    if not args:
        print(__doc__)
        sys.exit(0)

    # Check batch status
    if args[0] == '--status' and len(args) > 1:
        result = check_batch_status(args[1])
        print(json.dumps(result, indent=2))
        sys.exit(0)

    # Get batch call details
    if args[0] == '--calls' and len(args) > 1:
        result = get_batch_calls(args[1])
        print(json.dumps(result, indent=2))
        sys.exit(0)

    # Load CSV
    csv_path = args[0]
    if not os.path.isfile(csv_path):
        print(f"Error: File not found: {csv_path}")
        sys.exit(1)

    leads = load_csv(csv_path)
    if not leads:
        print("Error: No valid leads found in CSV. Need at least 'phone_number' and 'first_name' columns.")
        sys.exit(1)

    test_mode = '--test' in args
    dry_run = '--dry-run' in args
    skip_dnc = '--skip-dnc' in args

    print(f"\n{'='*60}")
    print(f"  USFR Bland.ai Campaign - Compliance Gates")
    print(f"{'='*60}")
    print(f"\n  Loaded: {len(leads)} leads from CSV")

    # ── GATE 1: State Filter (Non-Judicial Easy States ONLY) ──
    print(f"\n  GATE 1: State Filter (Non-Judicial Easy States)")
    print(f"    Approved: {', '.join(sorted(APPROVED_STATES))}")
    leads, state_rejected = enforce_state_filter(leads)
    if state_rejected:
        rejected_states = set(l['state'] for l in state_rejected)
        print(f"    BLOCKED: {len(state_rejected)} leads from: {', '.join(sorted(rejected_states))}")
    print(f"    Passed: {len(leads)} leads")

    if not leads:
        print("\n  ERROR: No leads from approved states. Aborting.")
        sys.exit(1)

    # ── GATE 2: DNC Verification (Database + Freshness) ──
    if not skip_dnc:
        print(f"\n  GATE 2: DNC Registry Verification")
        phones = [l['phone_number'] for l in leads]
        dnc_safe, blocked_dnc, blocked_stale, blocked_missing = verify_dnc_status(phones)

        if blocked_dnc:
            print(f"    BLOCKED (on DNC): {len(blocked_dnc)} phones")
        if blocked_stale:
            print(f"    BLOCKED (stale DNC check >7d): {len(blocked_stale)} phones")
            print(f"    -> Run tracerfy_dnc_scrub.py on R730 to refresh")
        if blocked_missing:
            print(f"    BLOCKED (no DNC record): {len(blocked_missing)} phones")

        # Filter to only DNC-safe leads
        leads = [l for l in leads if dnc_safe.get(l['phone_number'], False)]
        print(f"    DNC CLEARED: {len(leads)} leads")
    else:
        print(f"\n  GATE 2: DNC Check SKIPPED (--skip-dnc flag)")
        print(f"    WARNING: Calling without DNC verification!")

    if not leads:
        print("\n  ERROR: No leads passed DNC verification. Aborting.")
        print("  Run: ssh admin1@10.28.28.95 'cd /opt/foreclosure-scrapers && python3 tracerfy_dnc_scrub.py'")
        sys.exit(1)

    # ── Summary ──
    print(f"\n  FINAL: {len(leads)} leads ready to call")
    state_summary = {}
    for l in leads:
        st = l.get('state', 'UNK')
        state_summary[st] = state_summary.get(st, 0) + 1
    for st in sorted(state_summary.keys()):
        print(f"    {st}: {state_summary[st]} leads")

    if dry_run:
        print_dry_run(leads)
        sys.exit(0)

    call_objects = build_call_objects(leads)

    mode_label = "TEST (1 call)" if test_mode else f"BATCH ({len(call_objects)} calls)"
    print(f"\n  Launching {mode_label}...")
    print(f"  Voice: June | Transfer: {TRANSFER_NUMBER}")
    print(f"  Recording: ON | Background: Office")

    result = create_batch(call_objects, test_mode=test_mode)

    batch_id = result.get('data', {}).get('batch_id', result.get('batch_id', 'unknown'))
    print(f"\n  Batch ID: {batch_id}")
    print(f"  Calls: {1 if test_mode else len(call_objects)}")
    print(f"\n  Check status: python3 {sys.argv[0]} --status {batch_id}")
    print(f"  Call details: python3 {sys.argv[0]} --calls {batch_id}")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
