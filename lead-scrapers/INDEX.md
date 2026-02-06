# Foreclosure Lead Scrapers - Project Index

Complete automation suite for discovering and extracting foreclosure leads from county websites.

## Project Overview

Three production-ready Python scrapers that automatically discover, download, parse, and insert leads into Supabase:

1. **County Surplus Scraper** - Tax sale overage/excess funds
2. **Trustee Sales Scraper** - Foreclosure auction notices (future)
3. **Skip Tracer** - Contact information enrichment (future)

## Current Status: County Surplus Scraper (READY FOR DEPLOYMENT)

### Files Created

| File | Size | Purpose |
|------|------|---------|
| `county_surplus_scraper.py` | 21 KB | Main scraper (production-ready) |
| `test_scraper.py` | 6.1 KB | Test suite (no DB writes) |
| `setup_cron.sh` | 2.5 KB | Cron job installer |
| `n8n-workflow.json` | 4.8 KB | n8n automation workflow |
| `requirements.txt` | 103 B | Python dependencies |
| `README.md` | 4.6 KB | Full documentation |
| `QUICKSTART.md` | 4.3 KB | 5-minute setup guide |
| `DEPLOYMENT.md` | 9.6 KB | Production deployment guide |

## Quick Start (5 Minutes)

```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers

# Install dependencies
pip3 install -r requirements.txt

# Run tests
python3 test_scraper.py

# First run (single county)
# Edit county_surplus_scraper.py: TARGET_COUNTIES = [{"name": "Gwinnett County", "state": "GA"}]
python3 county_surplus_scraper.py

# Setup daily cron
./setup_cron.sh
```

## Features

### 1. Automatic URL Discovery
- Uses Google search to find county surplus funds pages
- Searches multiple query patterns per county
- Filters for .gov domains only
- Augments with known county URLs

### 2. Multi-Format Parsing
- PDF files (via pdfplumber)
- CSV files (stdlib csv module)
- Excel files (via openpyxl)
- Extracts: owner name, address, overage amount, case number

### 3. Smart Data Handling
- Deduplication (checks property_address + owner_name before insert)
- Address parsing (extracts city, state, zip)
- Amount parsing (handles currency symbols, commas)
- Error recovery (continues on single-file failures)

### 4. Production-Grade Reliability
- Rate limiting (2-5 second delays between requests)
- User agent rotation (5 different UAs)
- Comprehensive logging (timestamped, multi-level)
- Cron-safe (repeated execution without duplicates)
- Graceful error handling

### 5. Database Integration
- Direct Supabase REST API integration
- No external libraries needed (just requests)
- Bulk insert with validation
- Automatic timestamp tracking

## Target Counties (15)

### Georgia (3)
- Gwinnett County
- Fulton County
- DeKalb County

### Texas (3)
- Harris County
- Dallas County
- Tarrant County

### Arizona (2)
- Maricopa County
- Pinal County

### California (3)
- Orange County
- Los Angeles County
- San Bernardino County

### Florida (4)
- Miami-Dade County
- Broward County
- Hillsborough County
- Palm Beach County

## Architecture

```
┌─────────────────┐
│  Cron Schedule  │
│  (Daily 2 AM)   │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────────┐
│  County Surplus Scraper                     │
│  ┌─────────────────────────────────────┐   │
│  │ 1. URL Discovery                     │   │
│  │    - Known URLs                      │   │
│  │    - Google search                   │   │
│  │    - .gov domain filter              │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 2. File Discovery                    │   │
│  │    - Scan pages for PDFs/CSVs/Excel  │   │
│  │    - Filter by keywords              │   │
│  │    - Download to /tmp/               │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 3. Parsing                           │   │
│  │    - Extract tables                  │   │
│  │    - Identify columns                │   │
│  │    - Clean & validate data           │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 4. Database Insert                   │   │
│  │    - Check for duplicates            │   │
│  │    - Insert new leads                │   │
│  │    - Set status = 'new'              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────┐
│  Supabase Database                          │
│  Table: foreclosure_leads                   │
│  Type: tax-sale-overage                     │
└─────────────────────────────────────────────┘
```

## Data Flow

```
County Website
    ↓
[Download PDF/CSV/Excel]
    ↓
[Parse Tables → Extract Data]
    ↓
[Clean & Validate]
    ↓
[Check Duplicates]
    ↓
[Insert to Supabase]
    ↓
Foreclosure Leads Database
```

## Database Schema

Table: `foreclosure_leads`

| Column | Type | Example |
|--------|------|---------|
| owner_name | text | "John Smith" |
| property_address | text | "123 Main St, Atlanta, GA 30301" |
| city | text | "Atlanta" |
| state_abbr | text | "GA" |
| zip_code | text | "30301" |
| sale_amount | numeric | 12500.00 |
| foreclosure_type | text | "tax-sale-overage" |
| source | text | "https://www.gwinnettcounty.com/..." |
| case_number | text | "2024-FC-12345" |
| status | text | "new" |
| created_at | timestamp | "2026-02-03T14:30:15Z" |

## Configuration

### Supabase Connection
```python
SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_SERVICE_KEY = "eyJ0eXAi..."
SUPABASE_TABLE = "foreclosure_leads"
```

### Rate Limiting
```python
self.rate_limit(min_delay=2.0, max_delay=5.0)  # 2-5 seconds
```

### Google Search
```python
self.google_search(query, num_results=10)  # Top 10 results
```

### Download Directory
```python
self.download_dir = "/tmp/county_surplus_downloads"
```

## Deployment Options

### Option 1: System Cron (Recommended)
```bash
./setup_cron.sh
# Choose: Daily at 2:00 AM
```

**Pros:**
- Simple, reliable
- No dependencies
- Runs even if n8n is down

**Cons:**
- Manual monitoring required

### Option 2: n8n Workflow
```bash
# Import n8n-workflow.json
# Configure credentials
# Activate workflow
```

**Pros:**
- Email notifications (success/failure)
- Visual monitoring
- Easy to pause/resume

**Cons:**
- Requires n8n running

### Option 3: Manual Execution
```bash
python3 county_surplus_scraper.py
```

**Pros:**
- Full control
- Immediate results

**Cons:**
- No automation

## Monitoring

### Logs
```bash
# Live tail
tail -f /tmp/county_surplus_scraper.log

# View errors only
grep ERROR /tmp/county_surplus_scraper.log

# Last 100 lines
tail -100 /tmp/county_surplus_scraper.log
```

### Database Stats
```sql
-- Total leads by type
SELECT foreclosure_type, COUNT(*)
FROM foreclosure_leads
GROUP BY foreclosure_type;

-- Leads per county
SELECT
    SUBSTRING(source FROM 'https?://([^/]+)') as county,
    COUNT(*) as leads,
    SUM(sale_amount) as total_overage
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
GROUP BY county
ORDER BY leads DESC;

-- Recent leads
SELECT owner_name, property_address, sale_amount, created_at
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
ORDER BY created_at DESC
LIMIT 20;
```

### Downloaded Files
```bash
ls -lh /tmp/county_surplus_downloads/
du -sh /tmp/county_surplus_downloads/
```

## Performance

### Expected Metrics
- **Runtime**: 5-15 minutes for all 15 counties
- **Leads per run**: 500-2000 (varies by county publish schedule)
- **File downloads**: 30-100 files per run
- **Success rate**: 90%+ (some counties may be offline/changed)

### Bottlenecks
- Google search rate limits (3-6 second delays)
- PDF parsing (compute-intensive)
- Network latency (county websites)

### Optimization Ideas
- Parallel county processing (multiprocessing)
- Cache known URLs (skip Google search)
- OCR for scanned PDFs (pytesseract)
- Proxy rotation (if Google blocks IP)

## Testing

### Unit Tests
```bash
python3 test_scraper.py
```

Tests:
- Supabase connection
- Google search
- URL discovery
- File discovery
- Amount parsing
- Address parsing

### Integration Test (Single County)
```bash
# Edit county_surplus_scraper.py
TARGET_COUNTIES = [{"name": "Gwinnett County", "state": "GA"}]

# Run
python3 county_surplus_scraper.py

# Verify
psql "..." -c "SELECT COUNT(*) FROM foreclosure_leads WHERE foreclosure_type='tax-sale-overage'"
```

### End-to-End Test
```bash
# Full run with all counties
python3 county_surplus_scraper.py

# Monitor
tail -f /tmp/county_surplus_scraper.log
```

## Troubleshooting

### Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| No leads found | Logs show 0 files downloaded | Check county websites manually, verify URLs |
| Parsing errors | "Error parsing PDF" in logs | Check if PDF is scanned image (needs OCR) |
| Duplicate leads | Same leads inserted every run | Check deduplication logic, verify property_address format |
| Database errors | "Error inserting lead" in logs | Verify Supabase connection, check Kong status |
| Rate limiting | Google blocking requests | Increase delays, use proxy rotation |

### Debug Commands

```bash
# Test Google search
python3 -c "from county_surplus_scraper import CountySurplusScraper; s = CountySurplusScraper(); print(s.google_search('Gwinnett County GA excess proceeds', 5))"

# Test file discovery
python3 -c "from county_surplus_scraper import CountySurplusScraper; s = CountySurplusScraper(); print(s.find_downloadable_files('https://www.gwinnettcounty.com/web/gwinnett/departments/taxcommissioner/taxsales'))"

# Test PDF parsing
python3 -c "import pdfplumber; pdf = pdfplumber.open('/tmp/county_surplus_downloads/abc123.pdf'); print(pdf.pages[0].extract_text())"

# Test Supabase connection
curl -H "apikey: ..." "https://foreclosure-db.alwaysencrypted.com/rest/v1/foreclosure_leads?limit=1"
```

## Maintenance

### Weekly
- Review logs for errors
- Check duplicate rate
- Verify county websites still available

### Monthly
- Add new high-value counties
- Cleanup old logs
- Update dependencies
- Review lead quality

### Quarterly
- Rotate Supabase service key
- Update user agent strings
- Review and optimize rate limits
- Audit data quality (manual spot checks)

## Security

### Credentials
- Service key hardcoded (acceptable for internal use)
- For production: use environment variables
- Rotate keys quarterly

### Data Privacy
- Logs contain PII (owner names)
- Downloaded files contain PII
- Handle per privacy policy
- Consider log rotation/cleanup

### Network Security
- Uses HTTPS for all requests
- User agent rotation prevents basic bot detection
- Rate limiting prevents abuse flags
- No authentication bypass (public data only)

## Roadmap

### Phase 1: Current (County Surplus)
- [x] Google search discovery
- [x] PDF/CSV/Excel parsing
- [x] Supabase integration
- [x] Deduplication
- [x] Cron automation
- [x] n8n workflow

### Phase 2: Trustee Sales (Future)
- [ ] Foreclosure auction notices
- [ ] Pre-foreclosure filings
- [ ] Sheriff sale calendars
- [ ] Real-time alerts

### Phase 3: Skip Tracing (Future)
- [ ] Phone number lookup
- [ ] Email discovery
- [ ] Mailing address verification
- [ ] Social media profiles

### Phase 4: Enrichment (Future)
- [ ] Property value estimates (Zillow API)
- [ ] Mortgage balance data
- [ ] Equity calculations
- [ ] Lead scoring (ML model)

## Success Metrics (30 Days)

| Metric | Target | Current |
|--------|--------|---------|
| Total leads | 5,000+ | TBD |
| Counties with data | 12+ / 15 | TBD |
| Avg run time | < 20 min | TBD |
| Error rate | < 5% | TBD |
| Duplicate rate | < 20% | TBD |
| Data accuracy | 95%+ | TBD |

## Support & Resources

### Documentation
- `README.md` - Full technical documentation
- `QUICKSTART.md` - 5-minute setup guide
- `DEPLOYMENT.md` - Production deployment checklist

### Scripts
- `county_surplus_scraper.py` - Main scraper
- `test_scraper.py` - Test suite
- `setup_cron.sh` - Cron installer

### Workflows
- `n8n-workflow.json` - n8n automation with email alerts

### Logs
- `/tmp/county_surplus_scraper.log` - Main log
- `/tmp/county_surplus_scraper_cron.log` - Cron execution log

### Database
- Supabase: https://foreclosure-db.alwaysencrypted.com
- Studio: https://foreclosure-studio.alwaysencrypted.com
- Table: `foreclosure_leads`

### Contact
- Email: support@startmybusiness.us
- Logs location: `/tmp/county_surplus_scraper.log`

---

**Project Status**: Production-ready for deployment
**Last Updated**: 2026-02-03
**Version**: 1.0.0
