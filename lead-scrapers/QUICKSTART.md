# County Surplus Scraper - Quick Start Guide

Get up and running in 5 minutes.

## Installation

```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers

# Install dependencies
pip3 install -r requirements.txt
```

## Test Before Running

```bash
# Run test suite (no DB writes)
python3 test_scraper.py
```

Expected output:
```
✓ PASS: Supabase Connection
✓ PASS: Google Search
✓ PASS: URL Discovery
✓ PASS: File Discovery
✓ PASS: Amount Parsing
✓ PASS: Address Parsing

Passed: 6/6
```

## First Run (Single County Test)

Test with just Gwinnett County, GA before running all 15 counties:

1. Edit `county_surplus_scraper.py`
2. Find line 42: `TARGET_COUNTIES = [`
3. Replace with:
   ```python
   TARGET_COUNTIES = [
       {"name": "Gwinnett County", "state": "GA"}
   ]
   ```
4. Run:
   ```bash
   python3 county_surplus_scraper.py
   ```

5. Watch the logs:
   ```bash
   tail -f /tmp/county_surplus_scraper.log
   ```

Expected output:
```
2026-02-03 14:30:15 - INFO - Starting County Surplus Scraper
2026-02-03 14:30:18 - INFO - Processing Gwinnett County, GA
2026-02-03 14:30:25 - INFO - Discovered 8 URLs for Gwinnett County, GA
2026-02-03 14:30:32 - INFO - Found 3 downloadable files at https://...
2026-02-03 14:30:40 - INFO - Downloaded https://... to /tmp/...
2026-02-03 14:30:55 - INFO - Parsed 127 leads from PDF
2026-02-03 14:31:10 - INFO - Inserted 94 new leads for Gwinnett County, GA
```

## Full Run (All Counties)

After successful single-county test:

1. Restore `TARGET_COUNTIES` in `county_surplus_scraper.py` to full list (all 15 counties)
2. Run:
   ```bash
   python3 county_surplus_scraper.py
   ```

Estimated runtime: 5-15 minutes

## Setup Daily Cron Job

```bash
./setup_cron.sh
```

Follow prompts:
- Choose schedule (e.g., "1" for daily at 2 AM)
- Confirm

Verify:
```bash
crontab -l | grep county_surplus
```

## View Results in Database

```bash
# Install psql client if needed
sudo apt-get install postgresql-client

# Connect to Supabase
psql "postgresql://postgres:SyntaxSeamlessPersist2026@foreclosure-db.alwaysencrypted.com:5432/postgres"

# Query leads
SELECT owner_name, property_address, sale_amount, foreclosure_type, source
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
ORDER BY created_at DESC
LIMIT 20;
```

Or use Supabase Studio:
- URL: https://foreclosure-studio.alwaysencrypted.com
- Table: foreclosure_leads
- Filter: foreclosure_type = 'tax-sale-overage'

## Monitoring

### View Logs (Live)
```bash
tail -f /tmp/county_surplus_scraper.log
```

### View Cron Logs
```bash
tail -f /tmp/county_surplus_scraper_cron.log
```

### Check Downloaded Files
```bash
ls -lh /tmp/county_surplus_downloads/
```

### Database Stats
```sql
-- Total leads by county
SELECT
    source,
    COUNT(*) as count,
    SUM(sale_amount) as total_overage
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
GROUP BY source
ORDER BY count DESC;

-- Newest leads
SELECT
    owner_name,
    property_address,
    city,
    state_abbr,
    sale_amount,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### No leads found
- Check internet connection
- Verify county website URLs haven't changed
- Check logs: `cat /tmp/county_surplus_scraper.log | grep ERROR`

### PDF parsing errors
Some counties use scanned PDFs (images, not text). Solutions:
- Add OCR library (pytesseract)
- Skip those counties
- Manual download and parsing

### Rate limiting issues
Edit `county_surplus_scraper.py`:
```python
# Increase delays (line ~140)
self.rate_limit(5, 10)  # 5-10 seconds instead of 2-5
```

### Database connection errors
Test connection:
```bash
curl -H "apikey: eyJ0eXAi..." \
  https://foreclosure-db.alwaysencrypted.com/rest/v1/foreclosure_leads?limit=1
```

Expected: JSON response with lead data or empty array

## Next Steps

After successful scraping:

1. **Verify data quality**: Check a few leads manually against county website
2. **Set up alerts**: Use n8n to email you when new leads are found
3. **Add more counties**: Edit `TARGET_COUNTIES` and `KNOWN_COUNTY_URLS`
4. **Export leads**: Use Supabase export or psql COPY command

## Support

- Logs: `/tmp/county_surplus_scraper.log`
- Downloads: `/tmp/county_surplus_downloads/`
- Full docs: `README.md`
