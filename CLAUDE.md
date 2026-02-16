# Foreclosure Leads App - Project Context

## Overview
SaaS platform for foreclosure surplus fund recovery. Scrapes county foreclosure records, skip-traces homeowners, and enables outreach (email drafts, SMS, voice drops) to connect them with their unclaimed funds.

**Live URL**: https://usforeclosureleads.com
**Deployed on**: Vercel
**Admin email**: coreypearsonemail@gmail.com

## Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Self-hosted Supabase (Cognabase) at `https://foreclosure-db.alwaysencrypted.com`
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Maps**: react-simple-maps + TopoJSON for US/county maps, Google Maps API for property images
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Project Structure

```
src/
  app/
    (auth)/                    # Sign-in/sign-up pages
    (marketing)/               # Public marketing pages
    api/
      checkout/route.ts        # Stripe payment flow
      cron/scrape/             # Scheduled county scraping
      email-draft/route.ts     # Email draft via IMAP APPEND (Hostinger)
      export/route.ts          # CSV/data export
      leads/route.ts           # Lead CRUD operations
      pin/verify/              # PIN verification for data reveal
      send-sms/route.ts        # SMS via TextBee.dev API
      skip-trace/route.ts      # Skip tracing via Tracerfy API
      training/                # Training modules/resources
      voice-drop/route.ts      # ElevenLabs TTS + SlyBroadcast ringless voicemail
      webhook/
        clerk/                 # Clerk auth webhooks
        stripe/                # Stripe payment webhooks
    blog/                      # Blog/content pages
    compliance/                # Legal compliance info
    dashboard/
      admin/                   # Admin panel
      automation/              # Automation workflows
      closing-training/        # Training for closers
      contract-admin/          # Contract management
      export/                  # Data export UI
      hire-closer/             # Closer recruitment
      leads/page.tsx           # MAIN LEADS PAGE (~2800 lines)
      select-counties/         # County selection for scraping
      settings/                # User settings
      states/                  # State-level data views
    pricing/                   # Pricing page
    states-guide/              # State foreclosure guides
  components/
    dashboard/                 # Dashboard-specific components
    landing/                   # Landing page components
    layout/                    # Layout wrappers
    ui/                        # shadcn/ui primitives
    recovery-countdown.tsx     # Deadline countdown component
    us-map.tsx                 # Interactive US map
    county-map.tsx             # County-level map (shows court filing + assessor contacts)
  data/
    county-directory.ts        # Assessor/revenue office contacts (514 KB)
    county-directory.json      # Raw assessor data
    county-court-directory.ts  # Court clerk e-filing/fax/phone (1 MB, auto-generated)
  lib/
    pin-context.tsx            # PIN auth context for data reveal
    supabase.ts                # Supabase client (anon + admin)
    utils.ts                   # Utility functions (cn, etc.)
data/
  county-court-data/             # Raw county court research data
    consolidated-all-counties.json  # Master merged file (3,271 counties)
    US-County-Court-EFiling-Directory-v2.xlsx  # Excel spreadsheet
    group[1-7]*.json             # Original research files (7 groups)
    enriched-batch-[A-E].json    # Enriched data (5 batches)
    enriched-followup-*.json     # Follow-up enrichment files
documents/
  SOP_Surplus_Fund_Recovery_1Month_URGENT.docx
  SOP_Surplus_Fund_Recovery_3Month.docx
  Surplus_Fund_Recovery_Forms_Package.docx
  Foreclosure-Recovery-Contingency-Fee-Agreement.docx
scripts/
  merge-county-data.py           # Merges all JSON -> consolidated file
  generate-county-court-directory.py  # Generates TypeScript from consolidated JSON
```

## Database Schema (foreclosure_leads table)

### Core Lead Data
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| owner_name | TEXT | Property owner full name |
| property_address | TEXT | Street address only |
| mailing_address | TEXT | Full mailing address (includes city/state/zip) |
| city | TEXT | City name |
| state | TEXT | Full state name |
| state_abbr | TEXT | 2-letter state abbreviation |
| zip_code | TEXT | ZIP code |
| county | TEXT | County name |
| parcel_id | TEXT | APN/parcel ID |
| apn_number | TEXT | Alternative APN column |
| sale_date | TIMESTAMPTZ | Foreclosure sale date |
| sale_amount | NUMERIC | Sale price |
| mortgage_amount | NUMERIC | Original mortgage amount |
| overage_amount | NUMERIC | Estimated surplus/overage (NOT estimated_surplus) |
| lender_name | TEXT | Foreclosing lender |
| foreclosure_type | TEXT | Type of foreclosure |
| case_number | TEXT | Court case number |
| source | TEXT | Data source identifier |
| status | TEXT | Lead status (new, skip_traced, contacted, etc.) |
| scraped_at | TIMESTAMPTZ | When lead was scraped |
| lat | NUMERIC | Latitude |
| lng | NUMERIC | Longitude |

### Skip Trace Data
| Column | Type | Description |
|--------|------|-------------|
| primary_phone | TEXT | Main phone number |
| secondary_phone | TEXT | Alt phone |
| primary_email | TEXT | Main email |
| secondary_email | TEXT | Alt email |
| skip_trace_data | JSONB | Full Tracerfy response (phones, emails, addresses, relatives, etc.) |

### DNC Compliance
| Column | Type | Description |
|--------|------|-------------|
| dnc_checked | BOOLEAN | Whether DNC check has been run |
| on_dnc | BOOLEAN | Whether number is on DNC registry |
| can_contact | BOOLEAN | DNC-cleared for outreach |
| dnc_type | TEXT | Type of DNC listing |
| dnc_checked_at | TIMESTAMPTZ | When DNC was last checked |

### Outreach Tracking
| Column | Type | Description |
|--------|------|-------------|
| voicemail_sent | BOOLEAN | Voice drop delivered |
| voicemail_sent_at | TIMESTAMPTZ | Voice drop timestamp |
| voicemail_error | TEXT | Voice drop error message |
| voicemail_delivery_id | TEXT | SlyBroadcast campaign ID |
| sms_sent | BOOLEAN | SMS delivered via TextBee |
| sms_sent_at | TIMESTAMPTZ | SMS timestamp |

### Property Data
| Column | Type | Description |
|--------|------|-------------|
| property_image_url | TEXT | Google Street View image |
| bedrooms | INT | Bedroom count |
| bathrooms | INT | Bathroom count |
| sq_ft | INT | Square footage |
| lot_size | TEXT | Lot size |
| year_built | INT | Construction year |
| property_type | TEXT | Residential, commercial, etc. |
| assessed_value | NUMERIC | Tax assessed value |

## API Routes

### POST /api/email-draft
- **Auth**: Clerk (admin only)
- **Actions**: `preview` | `create_draft`
- **How it works**: Generates personalized HTML email with lead data, then uses direct IMAP APPEND via TLS to `imap.hostinger.com:993` to save draft in `INBOX.Drafts` of `claim@usforeclosurerecovery.com`
- **IMAP credentials**: User `claim@usforeclosurerecovery.com`, password from `IMAP_CLAIM_PASSWORD` env var
- **Important**: n8n Code nodes CANNOT use `require()` - that's why IMAP is done directly in the API route, not via n8n webhook
- **IMAP folder**: Must be `INBOX.Drafts` (not `Drafts`) on Hostinger. State machine has fallback: tries `Drafts` first, falls back to `INBOX.Drafts` on NO response
- **Email template features**:
  - Bold text: Corey Pearson, Foreclosure Recovery Inc., Allie Pearson, excess equity proceeds, foreclosure sale
  - Conditional APN/county/case number rows (only shown if data exists)
  - Surplus amount from `overage_amount` column (primary) or `estimated_surplus` (fallback)
  - State-specific deadline with claim window years (50 states mapped)
  - Always shows red URGENT deadline box even without sale_date
  - Address logic: `property_address` + city/state, or `mailing_address` (already includes city/state/zip, no double-append)
  - "Ready to Get Started?" section: mentions contingency agreement, page 5 sign-and-photo instructions
  - TODO: Attach contingency agreement docx as MIME attachment (currently template mentions it but IMAP APPEND doesn't attach the file)

### POST /api/send-sms
- **Auth**: Clerk (admin only)
- **Actions**: `preview` | `send`
- **SMS gateway**: TextBee.dev (sends through physical Android phone)
- **API endpoint**: `POST https://api.textbee.dev/api/v1/gateway/devices/{DEVICE_ID}/send-sms`
- **Device**: Samsung Galaxy S21 Ultra
- **Template**: Personalized with first name, property address, state
- **DB update**: Sets `sms_sent=true`, `sms_sent_at` on successful delivery
- **UI flow**: Click phone number in lead row -> preview modal with editable message -> "Approve & Send" button

### POST /api/voice-drop
- **Auth**: Clerk (admin only)
- **Flow**: Generate personalized script -> ElevenLabs TTS -> SlyBroadcast ringless voicemail
- **ElevenLabs**: Voice Design V3 model, MP3 output
- **SlyBroadcast**: `POST https://www.mobile-sphere.com/gateway/vmb.php`
- **Voice drop button**: Active on all `skip_traced` leads with phone numbers (regardless of DNC status)
- **Default Voice ID**: `kPzsL2i3teMYv0FxEYQ6` (set in ELEVENLABS_VOICE_ID env var)

### POST /api/skip-trace
- **Skip trace provider**: Tracerfy API (`https://tracerfy.com/v1/api`)
- **Returns**: Phone numbers, emails, addresses, relatives, employment, social profiles

### GET/POST /api/leads
- **Standard CRUD** for foreclosure_leads table

### GET /api/export
- **CSV export** of filtered leads

## Leads Page (Dashboard) - Key Features

### Data Reveal System
- All PII (phone, email, names) blurred by default
- PIN verification required to reveal data (`BlurredText` component)
- PIN context managed via `pin-context.tsx`

### DNC Status Icons
- Green checkmark (CheckCircle2): `can_contact = true` (DNC cleared)
- Red X (XCircle): `on_dnc = true` (on DNC list)
- Yellow clock (Clock): `dnc_checked = false` (pending)

### Voice Drop Button
- Active (green) when: `status === "skip_traced" && primaryPhone exists`
- Grey/disabled otherwise
- Loading spinner while generating audio + sending
- "Sent" badge after successful delivery

### SMS via Phone Number Click
- Clicking a phone number opens SMS preview modal (not tel: link)
- Modal shows: editable textarea, character count, SMS segment count
- "Approve & Send" button sends via TextBee API
- Success/error feedback in modal

### Email Draft via Email Click
- Clicking an email opens email draft preview modal
- Shows HTML preview in sandboxed iframe
- "Create Draft in Mailbox" saves to IMAP Drafts folder

### Recovery Countdown
- State-specific claim windows (e.g., OH=2yr, NY=5yr, FL=1yr)
- URGENT threshold: < 60 days remaining
- Always shows red URGENT box with state name and window, even without sale_date

## Environment Variables

### Required (Vercel Production)
| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk auth (public) |
| CLERK_SECRET_KEY | Clerk auth (server) |
| NEXT_PUBLIC_SUPABASE_URL | Cognabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin key |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Google Maps/Street View |
| ELEVENLABS_API_KEY | ElevenLabs TTS |
| ELEVENLABS_VOICE_ID | Voice ID for TTS (kPzsL2i3teMYv0FxEYQ6) |
| SLYBROADCAST_EMAIL | SlyBroadcast account |
| SLYBROADCAST_PASSWORD | SlyBroadcast password |
| CALLBACK_NUMBER | 800 number (8885458007) |
| TRACERFY_API_KEY | Skip trace API |
| TRACERFY_API_URL | Skip trace endpoint |
| IMAP_CLAIM_PASSWORD | IMAP password for claim@usforeclosurerecovery.com (Thepassword#123) |
| TEXTBEE_API_KEY | TextBee SMS gateway key |
| TEXTBEE_DEVICE_ID | TextBee device (Samsung S21 Ultra) |

### Local Only
| Variable | Purpose |
|----------|---------|
| N8N_EMAIL_DRAFT_WEBHOOK | n8n webhook URL (no longer used by app - IMAP is direct) |

## State Claim Windows

Mapped in `email-draft/route.ts` as `STATE_CLAIM_WINDOWS`:

```
AL:1, AK:1, AZ:1, AR:2, CA:1, CO:1, CT:1, DE:2, FL:1, GA:1,
HI:1, ID:1, IL:1, IN:1, IA:2, KS:2, KY:1, LA:1, ME:1, MD:3,
MA:3, MI:1, MN:1, MS:1, MO:2, MT:1, NE:2, NV:1, NH:1, NJ:2,
NM:1, NY:5, NC:1, ND:2, OH:2, OK:2, OR:2, PA:2, RI:1, SC:1,
SD:1, TN:1, TX:2, UT:1, VT:1, VA:1, WA:1, WV:1, WI:1, WY:1, DC:2
```

## County Court Directory (E-Filing & Fax Data)

### Overview
Comprehensive directory of county clerk of court contact information for all 51 US jurisdictions (50 states + DC). Used for filing surplus fund recovery claims -- e-filing, fax, or mail to the correct clerk.

### Data Coverage (as of Feb 2026)
- **Total counties**: 3,271 across 51 jurisdictions
- **E-filing systems**: All 51 states have statewide e-filing system identified with URLs
- **Fax numbers**: 811 counties (25%) -- best coverage in TX, IL, PA, SC, AR, NY, CO, VT, NH, NJ
- **Phone numbers**: 1,712 counties (52%)
- **Consolidated file**: `data/county-court-data/consolidated-all-counties.json` (1.1 MB)

### Files

```
data/county-court-data/
  consolidated-all-counties.json    # Master merged file (3,271 counties)
  US-County-Court-EFiling-Directory-v2.xlsx  # Excel spreadsheet (2 sheets)
  group1-AL-FL.json                 # Original research: AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL
  group2-GA-KY.json                 # Original research: GA,HI
  group3-LA-MT.json                 # Original research: LA,ME,MD,MA,MI,MN,MS,MO,MT
  group4-NE-OK.json                 # Original research: NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK
  group5-OR-WY.json                 # Original research: OR,PA,RI,SC,SD,TN,TX
  group6-missing-A.json             # Supplementary: ID,IL,IN,IA,KS,KY,UT
  group7-missing-B.json             # Supplementary: VT,VA,WA,WV,WI,WY
  enriched-batch-A.json             # Enriched: NC,NY,OH (fax/phone added)
  enriched-batch-B.json             # Enriched: ND,TX (99% fax coverage)
  enriched-batch-C.json             # Enriched: GA,FL,AL,SC
  enriched-batch-D.json             # Enriched: MI,MN,MO,MS,IN
  enriched-batch-E.json             # Enriched: PA,CO (97% fax)
  enriched-followup-NC-GA.json      # Follow-up: NC (100 counties), GA (159 counties)
  enriched-followup-CA-TN.json      # Follow-up: CA (58), TN (95 with full phone)
  enriched-followup-VA-KY.json      # Follow-up: VA (133), KY (120) -- if completed

scripts/
  merge-county-data.py              # Merges all JSON files -> consolidated-all-counties.json
  generate-county-court-directory.py # Generates TypeScript module from consolidated JSON
```

### Data Modules (TypeScript)

**`src/data/county-court-directory.ts`** (1 MB, auto-generated)
- `CountyCourtInfo` interface: county, state, efilingSystem, efilingUrl, clerkWebsite, phone, fax, address
- `findCountyCourtInfo(stateAbbr, countyName)` -- fuzzy lookup with suffix stripping (County, Parish, Borough, etc.)
- `getStateCourtCounties(stateAbbr)` -- all counties for a state
- `countyCourtLookup` -- flat `Record<string, CountyCourtInfo>` for O(1) access

**`src/data/county-directory.ts`** (514 KB, separate assessor/revenue data)
- `findCountyContact(stateAbbr, countyName)` -- assessor/revenue office contacts (phone, email, website)
- Different from court directory -- this is property tax data, not court filing data

### County Map Integration

`src/components/county-map.tsx` popup shows two contact sections when a county is clicked:
1. **County Contact** -- assessor/revenue data from `county-directory.ts`
2. **Court Filing** -- e-filing link (green FileText icon), fax (Printer icon), clerk phone, clerk website from `county-court-directory.ts`

### Statewide E-Filing Systems (Key Systems)

| System | States |
|--------|--------|
| Tyler Odyssey | NC, GA, FL, MN, CA, VA, ND, and others |
| eFileTexas | TX |
| AlaFile | AL |
| NYSCEF | NY |
| eFileIL | IL |
| MiFILE | MI |
| PACFile | PA |
| File & Serve | KY, DE, WY |
| eFlex (Tybera) | AR, UT |
| JUSTICE | NE |
| MDEC | MD |

### Rebuilding the Data

```bash
# Step 1: Merge all JSON files into consolidated file
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app
python3 scripts/merge-county-data.py

# Step 2: Regenerate TypeScript module from consolidated data
python3 scripts/generate-county-court-directory.py

# Step 3: Build and deploy
npx next build && npx vercel --prod --yes
```

### Email Template - Contingency Agreement Section

The email draft template (`src/app/api/email-draft/route.ts`) includes a "Ready to Get Started?" section that:
- Mentions the Contingency Fee Agreement is attached for review
- Instructs leads to print page 5 (signature page), sign it, take a photo
- Send back via email or text to (888) 545-8007
- Warm amber background (#fef9f0) with clear CTA
- Agreement document: `documents/Foreclosure-Recovery-Contingency-Fee-Agreement.docx` (30% contingency, no upfront costs)

### SOP Documents (in `documents/` folder)

| Document | Purpose |
|----------|---------|
| SOP_Surplus_Fund_Recovery_1Month_URGENT.docx | Emergency 1-month filing protocol ("FILE FIRST, PERFECT LATER") |
| SOP_Surplus_Fund_Recovery_3Month.docx | Standard 90-day protocol with 3 phases |
| Surplus_Fund_Recovery_Forms_Package.docx | 7 forms: E-1 Emergency, Motion for Disbursement, Affidavit, Proposed Order, Non-Judicial Claim, State Unclaimed Property, POA + Master Checklist |
| Foreclosure-Recovery-Contingency-Fee-Agreement.docx | 30% contingency fee agreement, page 5 = signature page |

### Filing Method Priority (from SOPs)
1. **E-filing** (fastest) -- use county-specific or statewide portal
2. **Walk-in** -- file at courthouse clerk window
3. **Fax** -- fax to clerk of court
4. **Certified mail** -- last resort

## Known Issues & Lessons Learned

1. **n8n Code nodes have NO `require()` access** - Cannot import `tls`, `net`, `crypto`, `nodemailer`, etc. Any complex logic must be done in the Next.js API route, not n8n.

2. **Hostinger IMAP requires `INBOX.Drafts`** (not `Drafts`) as the folder path. State machine handles this with fallback.

3. **`mailing_address` already includes city/state/zip** - Don't double-append city and state when building full address strings. Only append city/state to `property_address`.

4. **DB column is `overage_amount`** not `estimated_surplus` - Always check `overage_amount` first, fallback to `estimated_surplus`.

5. **Leads page is ~2800 lines** - Main dashboard file. Contains all lead rendering, modals (email, SMS, voice drop), filters, pagination, map view, and data reveal logic. Consider splitting into components if it grows further.

6. **TextBee sends SMS through a physical phone** (Samsung Galaxy S21 Ultra) - Not a traditional SMS API. Messages come from the actual phone number.

## R730 Server Components

The foreclosure pipeline runs on the Dell R730 server:
- **Scraping scripts**: `/opt/foreclosure-scrapers/` on R730
- **Daily pipeline**: `/opt/foreclosure-scrapers/daily-foreclosure-pipeline.sh`
- **DNC checking**: `/opt/foreclosure-scrapers/dnc_check.py` (planned - uses FTC DNC registry data)
- **Database**: Cognabase instance on R730 (foreclosure-db)

## Deployment

```bash
# Deploy to Vercel production
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app
npx vercel --prod --yes

# Add env vars
echo "value" | npx vercel env add VAR_NAME production --force
```

## Business Context

- **Company**: Foreclosure Recovery Inc.
- **Service**: Connects foreclosed homeowners with their unclaimed surplus funds
- **Recovery Agent**: Allie Pearson, (888) 545-8007
- **Outreach Email**: claim@usforeclosurerecovery.com (Hostinger IMAP)
- **Sender**: Corey Pearson
- **Leads**: ~2,054 skip-traced leads with phone numbers as of Feb 2026
