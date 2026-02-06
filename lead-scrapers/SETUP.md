# Trustee Sales Scraper - Setup Instructions

## Quick Start

### 1. Install Dependencies

The scraper requires these Python packages:
- requests
- beautifulsoup4
- lxml
- supabase

**Option A: System-wide (with --break-system-packages flag)**
```bash
pip3 install --break-system-packages requests beautifulsoup4 lxml supabase
```

**Option B: Virtual Environment (Recommended for production)**
```bash
# Install python3-venv if needed
sudo apt install python3-venv

# Create virtual environment
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install packages
pip install requests beautifulsoup4 lxml supabase
```

**Option C: User install (no sudo required)**
```bash
pip3 install --user requests beautifulsoup4 lxml supabase
```

### 2. Verify Installation

Run the utility test suite:
```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers
python3 test_utilities.py
```

Expected output: `Total: 5/5 test suites passed`

### 3. Test Scraper (Dry Run)

```bash
python3 trustee_sales_scraper.py --dry-run --verbose
```

This will:
- Test scraping logic WITHOUT writing to database
- Show what leads would be captured
- Verify connectivity to target sites

### 4. Production Run

Once dry run looks good:
```bash
python3 trustee_sales_scraper.py
```

Leads will be inserted into Supabase database.

## Database Configuration

Currently configured for:
- **URL**: https://foreclosure-db.alwaysencrypted.com
- **Table**: foreclosure_leads
- **Service Key**: Already embedded in script

### Verify Database Connectivity

```bash
python3 -c "
from supabase import create_client
client = create_client(
    'https://foreclosure-db.alwaysencrypted.com',
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU'
)
result = client.table('foreclosure_leads').select('id').limit(1).execute()
print('✓ Database connection successful')
"
```

## Scheduling with Cron

### Daily Run (6 AM)

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your Python and script location)
0 6 * * * cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers && /usr/bin/python3 trustee_sales_scraper.py >> /var/log/trustee_scraper.log 2>&1
```

### Multiple Runs Per Day

For auction.com (which removes data daily), run more frequently:

```bash
# Every 6 hours (6 AM, 12 PM, 6 PM, 12 AM)
0 6,12,18,0 * * * cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers && /usr/bin/python3 trustee_sales_scraper.py >> /var/log/trustee_scraper.log 2>&1
```

## Monitoring

### Check Logs

```bash
# View scraper log
tail -f trustee_sales_scraper.log

# View cron log (if configured)
tail -f /var/log/trustee_scraper.log
```

### Check Database

Login to Supabase dashboard:
- **URL**: https://foreclosure-db.alwaysencrypted.com
- Navigate to `foreclosure_leads` table
- Filter by `foreclosure_type = 'trustee-sale-overage'`
- Sort by `created_at DESC` to see newest leads

## Troubleshooting

### "Module not found" errors

```bash
# Reinstall dependencies
pip3 install --user --force-reinstall requests beautifulsoup4 lxml supabase
```

### Connection timeouts

- Check internet connection
- Verify target websites are accessible
- Reduce scraping frequency if being rate-limited

### No leads found

- Run with `--verbose` to see parsing details
- Check if website structure changed (may need scraper updates)
- Verify there are actual completed sales in the time period

### Database insert failures

- Verify service key is correct
- Check Supabase dashboard for errors
- Ensure table schema matches lead structure

## Next Steps

After installation:

1. **Customize scrapers** - Update TJSC, Stox, Auction.com scrapers with actual site structure
2. **Test with real sites** - Use `--dry-run` first
3. **Schedule daily runs** - Set up cron jobs
4. **Monitor results** - Check database for new leads
5. **Integrate with skip tracer** - Run skip_tracer.py on new leads

## Site-Specific Implementation

### TJSC (Judicial Sales Corporation)

1. Visit: https://www.tjsc.com/completed-sales
2. Inspect HTML structure
3. Update `TJSCScraper._parse_sale_row()` with correct selectors
4. Test with `--dry-run`

### Stox Quickbase

1. Access Stox site (may require authentication)
2. Find "All Sales 60 Days Ago Forward" report
3. Implement `StoxScraper.scrape()` based on structure
4. Uncomment in `TrusteeSalesScraper.__init__`

### Auction.com

1. Visit: https://www.auction.com
2. Check if API exists (inspect network tab in browser)
3. If API available, use that instead of HTML scraping
4. Otherwise, consider Selenium for JS-rendered content
5. Uncomment in `TrusteeSalesScraper.__init__`

## Support Files

- **Main script**: `trustee_sales_scraper.py`
- **Usage guide**: `TRUSTEE_SALES_GUIDE.md`
- **Test suite**: `test_utilities.py`
- **Requirements**: `requirements.txt`
- **This file**: `SETUP.md`
