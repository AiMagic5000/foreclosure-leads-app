# Foreclosure Lead Scrapers

Automated lead generation and skip tracing system for foreclosure properties.

## Directory Structure

```
lead-scrapers/
├── skip_tracer.py                # Main skip tracing script
├── test_skip_tracer.py           # Test Supabase connection & schema
├── skip_trace_stats.py           # Generate statistics report
├── run_skip_tracer.sh            # Bash wrapper for cron jobs
├── county_surplus_scraper.py     # County surplus funds scraper
├── requirements.txt              # Python dependencies
├── crontab.example               # Example cron schedules
├── SKIP_TRACER_README.md         # Detailed skip tracer docs
└── README.md                     # This file
```

## Quick Start

### 1. Install Dependencies

```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers
pip install -r requirements.txt
```

### 2. Test Connection

```bash
python3 test_skip_tracer.py
```

Expected output:
```
✓ Connected to Supabase
✓ Table has 64 columns
✓ Found X leads needing skip trace
```

### 3. Check Statistics

```bash
python3 skip_trace_stats.py
```

Shows current progress, success rates, and estimated completion time.

### 4. Run Skip Tracer

```bash
python3 skip_tracer.py
```

Processes up to 100 leads per run with rate limiting and error handling.

## Components

### Skip Tracer (`skip_tracer.py`)

Automated skip tracing using free public people search websites.

**Features:**
- Searches TruePeopleSearch.com and FastPeopleSearch.com
- Detects business entities (LLC, Corp, LP, etc.)
- Cross-references addresses to verify correct person
- Identifies phone types (wireless vs landline)
- Rate limiting: 5-10 seconds between requests
- Exponential backoff on blocking (30s → 240s)
- CAPTCHA handling (skips gracefully)
- Processes 100 leads per run

**Data Collected:**
- Primary phone (prefers mobile)
- Secondary phone
- Primary email
- Associated names (relatives, associates)
- Current mailing address

**Usage:**
```bash
python3 skip_tracer.py                    # Manual run
./run_skip_tracer.sh                      # Via bash wrapper
```

See `SKIP_TRACER_README.md` for detailed documentation.

### Test Suite (`test_skip_tracer.py`)

Verifies Supabase connection and database schema.

**Tests:**
- Connection to Supabase
- Table schema validation
- Query for leads needing skip trace
- Sample lead data

**Usage:**
```bash
python3 test_skip_tracer.py
```

### Statistics Report (`skip_trace_stats.py`)

Generates comprehensive skip trace statistics.

**Metrics:**
- Total leads
- Skip traced count & percentage
- Pending skip trace count
- Success rates (phone, email)
- Recent activity (today, last 7 days)
- Estimated completion date

**Usage:**
```bash
python3 skip_trace_stats.py
```

**Example Output:**
```
SKIP TRACE STATISTICS REPORT
======================================================================
Generated: 2026-02-03 10:30:00 UTC

OVERALL PROGRESS
----------------------------------------------------------------------
  Total Leads:              2,473
  Skip Traced:              0 (0.0%)
  Pending Skip Trace:       2,449

SUCCESS RATES
----------------------------------------------------------------------
  Leads with Phone:         0 (0.0% of traced)
  Leads with Email:         0 (0.0% of traced)

RECENT ACTIVITY
----------------------------------------------------------------------
  Traced Today:             0
  Traced Last 7 Days:       0
```

### County Surplus Scraper (`county_surplus_scraper.py`)

Discovers and extracts excess funds/overage data from 15 major county websites.

**Features:**
- Automatic URL discovery via Google search
- Multi-format parsing (PDF, CSV, Excel)
- Smart deduplication
- Rate limiting with user agent rotation
- Cron-safe for repeated execution

**Target Counties:**
- Georgia: Gwinnett, Fulton, DeKalb
- Texas: Harris, Dallas, Tarrant
- Arizona: Maricopa, Pinal
- California: Orange, Los Angeles, San Bernardino
- Florida: Miami-Dade, Broward, Hillsborough, Palm Beach

**Usage:**
```bash
python3 county_surplus_scraper.py
```

## Automation

### Cron Setup

```bash
# Edit crontab
crontab -e

# Skip tracer (every 6 hours)
0 */6 * * * /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers/run_skip_tracer.sh >> /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers/cron.log 2>&1

# County scraper (daily at 2 AM)
0 2 * * * python3 /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers/county_surplus_scraper.py
```

**Recommended Schedules:**

| Script | Schedule | Throughput |
|--------|----------|------------|
| Skip Tracer | Every 6 hours | 400 leads/day |
| Skip Tracer | Every 12 hours | 200 leads/day |
| Skip Tracer | Once daily | 100 leads/day |
| County Scraper | Daily at 2 AM | ~500 leads/day |

### Monitoring

Check logs:
```bash
# Skip tracer log
tail -f skip_tracer.log

# County scraper log
tail -f /tmp/county_surplus_scraper.log

# Cron log
tail -f cron.log

# Generate stats
python3 skip_trace_stats.py
```

## Database Schema

### Table: `foreclosure_leads`

**Required Columns:**
- `id` (uuid, primary key)
- `owner_name` (text)
- `property_address` (text)
- `state` (text)
- `city` (text)

**Skip Trace Columns:**
- `primary_phone` (text) - Best phone number
- `secondary_phone` (text) - Second phone
- `primary_email` (text) - Email address
- `associated_names` (text[]) - Array of relatives/associates
- `current_mailing_address` (text) - Current address if different
- `skip_traced_at` (timestamp) - When skip traced

**County Scraper Columns:**
- `sale_amount` (numeric) - Overage amount
- `foreclosure_type` (text) - tax-sale-overage or mortgage-overage
- `source` (text) - County website URL
- `case_number` (text) - Case/parcel/APN number
- `status` (text) - new, contacted, qualified, etc.

## Configuration

### Skip Tracer

Edit constants in `skip_tracer.py`:

```python
BATCH_SIZE = 50              # Leads per batch
MAX_LEADS_PER_RUN = 100      # Max per run
MIN_DELAY = 5                # Min seconds between requests
MAX_DELAY = 10               # Max seconds between requests
```

**Adjust if getting blocked:**
- Increase delays to 10-15 seconds
- Reduce MAX_LEADS_PER_RUN to 50
- Run less frequently (every 12 hours)

### County Scraper

Edit constants in `county_surplus_scraper.py`:

```python
self.rate_limit(min_delay=2.0, max_delay=5.0)
self.google_search(query, num_results=10)
self.download_dir = "/tmp/county_surplus_downloads"
```

## Troubleshooting

### Skip Tracer Issues

**CAPTCHA/Blocking:**
- Increase delays (MIN_DELAY=10, MAX_DELAY=15)
- Reduce leads per run (MAX_LEADS_PER_RUN=50)
- Run less frequently (every 12-24 hours)

**No Results:**
- Check owner name format (need FirstName LastName)
- Verify state abbreviations (CA, TX, FL)
- Review logs for parsing errors

**Database Connection:**
1. Test connection: `python3 test_skip_tracer.py`
2. Check R730 server is running
3. Verify Kong memory: `ssh admin1@10.28.28.95 "docker stats --no-stream supabase-kong-..."`

### County Scraper Issues

**No Leads Found:**
- Check logs for HTTP errors
- Verify county website hasn't changed
- Try manual Google search for new URLs

**PDF Parsing Errors:**
- Some PDFs use images (OCR needed)
- Test manually: `pdfplumber.open(file).pages[0].extract_text()`

**Duplicates:**
- Script checks property_address + owner_name
- County address format changes may cause dupes

## Performance

### Skip Tracer

| Schedule | Leads/Day | Completion Time (2,449 leads) |
|----------|-----------|-------------------------------|
| Every 6 hours | ~400 | 6-7 days |
| Every 12 hours | ~200 | 12-14 days |
| Once daily | ~100 | 24-25 days |

**Average Time:**
- With results: 15-25 seconds per lead
- Without results: 10-15 seconds per lead
- 100 leads: 25-40 minutes total

### County Scraper

- Average: 15-45 seconds per county
- Total runtime: 5-15 minutes for all 15 counties
- Depends on file count and sizes

## Future Enhancements

### Skip Tracer
- [ ] Secretary of State searches for all 50 states
- [ ] Additional data sources (Whitepages, BeenVerified)
- [ ] Residential proxy rotation for higher volume
- [ ] Email verification API integration
- [ ] Phone number validation (active/inactive)
- [ ] Confidence scoring for person matching

### County Scraper
- [ ] Add 35+ more counties (total 50 target)
- [ ] OCR support for image-based PDFs
- [ ] Proxy rotation for higher volume
- [ ] Notification system for new leads

### System
- [ ] Batch email/SMS campaign integration
- [ ] CRM export (CSV, Excel)
- [ ] Lead scoring algorithm
- [ ] Automated follow-up sequences

## Support

For detailed skip tracer documentation, see `SKIP_TRACER_README.md`.

For issues:
1. Check logs: `tail -f skip_tracer.log` or `tail -f /tmp/county_surplus_scraper.log`
2. Run test suite: `python3 test_skip_tracer.py`
3. Generate stats: `python3 skip_trace_stats.py`

## License

Proprietary - For internal use only.
