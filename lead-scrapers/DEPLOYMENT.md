# County Surplus Scraper - Deployment Guide

Complete deployment checklist for production use.

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Python 3.8+ installed
- [ ] pip installed
- [ ] Internet connectivity verified
- [ ] Supabase database accessible

### 2. Dependencies Installation
```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers
pip3 install -r requirements.txt
```

Verify:
```bash
python3 -c "import requests, bs4, pdfplumber, openpyxl; print('All dependencies installed')"
```

### 3. Database Schema Verification

Connect to Supabase:
```bash
psql "postgresql://postgres:SyntaxSeamlessPersist2026@foreclosure-db.alwaysencrypted.com:5432/postgres"
```

Verify table exists:
```sql
\d foreclosure_leads
```

Required columns:
- `owner_name` (text)
- `property_address` (text)
- `city` (text, nullable)
- `state_abbr` (text)
- `zip_code` (text, nullable)
- `sale_amount` (numeric)
- `foreclosure_type` (text)
- `source` (text)
- `case_number` (text, nullable)
- `status` (text)
- `created_at` (timestamp)

### 4. API Connectivity Test
```bash
curl -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU" \
  "https://foreclosure-db.alwaysencrypted.com/rest/v1/foreclosure_leads?limit=1"
```

Expected: JSON response (empty array or lead data)

## Deployment Options

### Option A: Cron Job (Linux/WSL)

**1. Run test suite:**
```bash
python3 test_scraper.py
```

**2. Single county test:**
Edit `county_surplus_scraper.py` to test one county first:
```python
TARGET_COUNTIES = [{"name": "Gwinnett County", "state": "GA"}]
```

Run:
```bash
python3 county_surplus_scraper.py
```

**3. Setup cron:**
```bash
./setup_cron.sh
```

Choose schedule (recommend: daily at 2 AM)

**4. Verify cron:**
```bash
crontab -l | grep county_surplus
```

### Option B: n8n Workflow

**1. Import workflow:**
- Open n8n: https://n8n.alwaysencrypted.com
- Click "Import from File"
- Select `n8n-workflow.json`

**2. Configure credentials:**

**Supabase API Key (Header Auth):**
- Name: `Supabase API Key`
- Header Name: `apikey`
- Header Value: `eyJ0eXAi...` (service key)
- Also add Authorization header: `Bearer eyJ0eXAi...`

**Hostinger SMTP:**
- Name: `Hostinger SMTP`
- Host: `smtp.hostinger.com`
- Port: `465`
- SSL: Yes
- User: `info@tradelinejet.com`
- Password: `Thepassword%123`

**3. Test workflow:**
- Click "Execute Workflow"
- Monitor execution
- Check email for success/error notification

**4. Activate workflow:**
- Toggle "Active" in top right
- Workflow runs daily at 2 AM

### Option C: Manual Execution

For testing or one-off runs:
```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers
python3 county_surplus_scraper.py 2>&1 | tee /tmp/scraper_run_$(date +%Y%m%d_%H%M%S).log
```

## Post-Deployment Verification

### 1. Wait for First Run
After first scheduled run (or manual execution), verify:

**Check logs:**
```bash
tail -100 /tmp/county_surplus_scraper.log
```

Look for:
- "Starting County Surplus Scraper"
- "Processing [County Name]"
- "Inserted X new leads"
- No ERROR messages

**Check database:**
```sql
SELECT
    foreclosure_type,
    COUNT(*) as count,
    MIN(created_at) as first_lead,
    MAX(created_at) as last_lead
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
GROUP BY foreclosure_type;
```

**Check downloads:**
```bash
ls -lh /tmp/county_surplus_downloads/
```

### 2. Validate Data Quality

**Random sample check:**
```sql
SELECT
    owner_name,
    property_address,
    city,
    state_abbr,
    sale_amount,
    source,
    case_number
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
ORDER BY RANDOM()
LIMIT 10;
```

Verify:
- [ ] Owner names are readable (not garbled)
- [ ] Addresses are complete
- [ ] Sale amounts are reasonable (> $0)
- [ ] Source URLs are valid
- [ ] No duplicate entries

**Cross-check with county website:**
Pick 2-3 leads and manually verify against source URL.

### 3. Performance Metrics

**Leads per county:**
```sql
SELECT
    SUBSTRING(source FROM 'https?://([^/]+)') as county_domain,
    COUNT(*) as lead_count,
    AVG(sale_amount) as avg_overage,
    SUM(sale_amount) as total_overage
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
GROUP BY county_domain
ORDER BY lead_count DESC;
```

**Expected ranges:**
- Gwinnett County, GA: 50-200 leads per run
- Harris County, TX: 100-500 leads per run
- Smaller counties: 10-50 leads per run

### 4. Monitor for 7 Days

**Daily checks:**
```bash
# Check if cron is running
grep county_surplus /var/log/syslog | tail -20

# Check for new leads
psql "postgresql://..." -c "SELECT COUNT(*) FROM foreclosure_leads WHERE created_at > NOW() - INTERVAL '24 hours';"

# Check for errors
grep ERROR /tmp/county_surplus_scraper.log | tail -20
```

## Ongoing Maintenance

### Weekly Tasks

**1. Review logs for errors:**
```bash
grep -E "(ERROR|WARN)" /tmp/county_surplus_scraper.log | tail -50
```

**2. Check duplicate rate:**
```sql
SELECT
    COUNT(*) as total_attempts,
    COUNT(DISTINCT (property_address, owner_name)) as unique_leads,
    COUNT(*) - COUNT(DISTINCT (property_address, owner_name)) as duplicates
FROM foreclosure_leads
WHERE foreclosure_type = 'tax-sale-overage'
  AND created_at > NOW() - INTERVAL '7 days';
```

High duplicate rate (>50%) indicates scraper is re-processing same data.

**3. Verify county websites still available:**
```bash
# Test known URLs
for url in \
  "https://www.gwinnettcounty.com/web/gwinnett/departments/taxcommissioner/taxsales" \
  "https://www.fultoncountyga.gov/services/tax-and-revenue/real-property/tax-sales" \
  "https://www.hctax.net/Property/PropertyTax"; do
  echo "Testing $url"
  curl -I -s -o /dev/null -w "%{http_code}\n" "$url"
done
```

All should return 200 or 301/302 (redirect).

### Monthly Tasks

**1. Add new counties:**
Review which states/counties are generating most revenue. Add high-value counties to `TARGET_COUNTIES`.

**2. Cleanup old logs:**
```bash
# Archive logs older than 30 days
cd /tmp
tar -czf county_scraper_logs_$(date +%Y%m).tar.gz county_surplus_scraper.log
truncate -s 0 county_surplus_scraper.log
```

**3. Update dependencies:**
```bash
pip3 install --upgrade requests beautifulsoup4 pdfplumber openpyxl
```

## Troubleshooting

### No New Leads Found

**Possible causes:**
1. County websites changed structure
2. No new surplus funds published
3. Google search not finding pages

**Debug steps:**
```bash
# Test Google search manually
python3 -c "
from county_surplus_scraper import CountySurplusScraper
scraper = CountySurplusScraper()
urls = scraper.google_search('Gwinnett County GA excess proceeds list', 10)
print(urls)
"

# Test known URL
python3 -c "
from county_surplus_scraper import CountySurplusScraper
scraper = CountySurplusScraper()
files = scraper.find_downloadable_files('https://www.gwinnettcounty.com/web/gwinnett/departments/taxcommissioner/taxsales')
print(files)
"
```

### Parsing Errors

**Symptoms:**
Logs show "Error parsing PDF/CSV"

**Debug:**
```bash
# Check downloaded files
ls -lh /tmp/county_surplus_downloads/

# Try parsing manually
python3 -c "
import pdfplumber
pdf = pdfplumber.open('/tmp/county_surplus_downloads/abc123.pdf')
print(pdf.pages[0].extract_text())
"
```

If PDF is scanned images (no text extracted), add OCR support:
```bash
pip3 install pytesseract
sudo apt-get install tesseract-ocr
```

### Database Connection Failures

**Symptoms:**
"Error checking lead existence" or "Error inserting lead"

**Debug:**
```bash
# Test connection
curl -H "apikey: ..." \
  "https://foreclosure-db.alwaysencrypted.com/health"

# Check Kong status
ssh admin1@10.28.28.95 "docker ps --filter 'name=supabase-kong'"
```

If Kong down, restart:
```bash
ssh admin1@10.28.28.95 "docker restart supabase-kong-<instance-id>"
```

## Security Notes

- Service key is exposed in script (acceptable for internal server use)
- If deploying to untrusted environment, use environment variables:
  ```python
  SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
  ```
- Rotate service key quarterly
- Logs may contain PII (owner names) - handle according to privacy policy

## Performance Tuning

### Reduce Runtime

**Parallel processing:**
Modify script to process counties in parallel using `multiprocessing`:
```python
from multiprocessing import Pool

def process_county_wrapper(county):
    scraper = CountySurplusScraper()
    scraper.process_county(county['name'], county['state'])

with Pool(5) as pool:
    pool.map(process_county_wrapper, TARGET_COUNTIES)
```

**Reduce rate limiting:**
Only if counties are not blocking:
```python
self.rate_limit(1, 2)  # 1-2 seconds instead of 2-5
```

### Increase Lead Volume

**More counties:**
Add all 50+ counties that publish excess funds online.

**More search queries:**
Add queries for mortgage overages, foreclosure surpluses, sheriff sales proceeds.

**More file types:**
Add support for HTML tables (not just PDFs/CSVs).

## Success Metrics

After 30 days, evaluate:

| Metric | Target |
|--------|--------|
| Total leads scraped | 500+ |
| Counties with data | 10+ |
| Average run time | < 20 minutes |
| Error rate | < 5% |
| Duplicate rate | < 20% |
| Data quality (manual spot check) | 95%+ accurate |

## Support

- Logs: `/tmp/county_surplus_scraper.log`
- Downloads: `/tmp/county_surplus_downloads/`
- Database: https://foreclosure-studio.alwaysencrypted.com
- Documentation: `README.md`, `QUICKSTART.md`
