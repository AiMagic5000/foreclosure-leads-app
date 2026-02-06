# Trustee Sales Scraper - Usage Guide

## Overview

The Trustee Sales Scraper identifies foreclosure **overages** (surplus funds) by scraping completed trustee sales from auction websites. When a foreclosed property sells for MORE than the opening bid, the difference belongs to the previous homeowner - these are high-value leads.

## What Are Overages?

- **Opening Bid**: Amount owed on mortgage + fees
- **Sale Amount**: What property sold for at auction
- **Overage/Surplus**: Sale Amount - Opening Bid (when positive)

Example:
```
Opening Bid: $150,000 (mortgage owed)
Sale Amount: $200,000 (auction price)
Overage:     $50,000 (owed to homeowner)
```

The previous homeowner is entitled to this $50,000 but often doesn't know about it. These are our leads.

## Target Websites

### 1. Judicial Sales Corporation (tjsc.com)
- **Coverage**: Illinois
- **URL**: https://www.tjsc.com
- **Data**: Sale date, case number, address, opening bid, sale amount
- **Status**: Implemented (base template)

### 2. Stox Quickbase
- **Coverage**: West Coast (CA, NV, OR, WA)
- **URL**: https://stox.quickbase.com
- **Data**: 60 days of completed sales
- **Status**: Template only (needs site-specific implementation)

### 3. Auction.com
- **Coverage**: National (GA, TX, FL, CA, AZ)
- **URL**: https://www.auction.com
- **Data**: File number, address, opening bid, trustee contact
- **CRITICAL**: Data removed day after sale - must scrape DAILY
- **Status**: Template only (likely needs Selenium for JS content)

## Installation

```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers

# Install dependencies
pip install -r requirements.txt

# Or install individually
pip install requests beautifulsoup4 lxml supabase
```

## Usage

### Basic Run (Production)
```bash
python trustee_sales_scraper.py
```

### Dry Run (Test Mode - No Database Writes)
```bash
python trustee_sales_scraper.py --dry-run
```

### Verbose Logging
```bash
python trustee_sales_scraper.py --verbose
```

### Combined
```bash
python trustee_sales_scraper.py --dry-run --verbose
```

## Output

### Console Output
```
2026-02-03 23:45:12 [INFO] Starting scrape: Judicial Sales Corporation
2026-02-03 23:45:15 [INFO] Valid lead: 2023-CH-12345 - Overage: $25,000.00
2026-02-03 23:45:16 [INFO] ✓ Inserted lead: 2023-CH-12345
2026-02-03 23:45:20 [INFO] Found 12 valid leads from Judicial Sales Corporation
```

### Log File
All activity logged to: `trustee_sales_scraper.log`

### Database Records
Inserted into: `foreclosure_leads` table on Supabase

Fields:
- `foreclosure_type`: "trustee-sale-overage"
- `property_address`: Full address
- `case_number`: Court case number
- `sale_date`: Date of sale (YYYY-MM-DD)
- `mortgage_amount`: Opening bid amount
- `sale_amount`: Final sale price
- `estimated_equity`: Calculated overage
- `trustee_name`: Name of trustee company
- `source`: URL of data source
- `status`: "new"
- `state`: Two-letter state code

## Lead Filtering

The scraper ONLY captures leads that meet ALL criteria:

1. **Overage >= $5,000** - Minimum worthwhile amount
2. **Third-party sale** - NOT sold back to bank/plaintiff
3. **Valid data** - Has case number, address, amounts
4. **Not duplicate** - Checks existing database records

## Third-Party Sale Detection

The scraper automatically filters out sales back to the bank/plaintiff by checking buyer name for keywords:

- bank
- mortgage
- plaintiff
- beneficiary
- lender
- trust
- servicer
- federal/national
- credit union

Only sales to actual third-party buyers are captured.

## Scheduling (Cron)

### Daily Run (Recommended for Auction.com)
```bash
# Edit crontab
crontab -e

# Add daily 6 AM run
0 6 * * * cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers && /usr/bin/python3 trustee_sales_scraper.py >> /var/log/trustee_scraper.log 2>&1
```

### Alternative: Run every 6 hours
```bash
# 6 AM, 12 PM, 6 PM, 12 AM
0 6,12,18,0 * * * cd /path/to/scraper && python3 trustee_sales_scraper.py
```

## Database Configuration

Currently configured for:
- **URL**: https://foreclosure-db.alwaysencrypted.com
- **Table**: foreclosure_leads
- **Auth**: Service role key (already configured)

To change database, edit these constants in the script:
```python
SUPABASE_URL = "your-url-here"
SUPABASE_SERVICE_KEY = "your-service-key-here"
```

## Customization

### Adjust Minimum Overage
Edit `MINIMUM_OVERAGE` constant:
```python
MINIMUM_OVERAGE = 5000  # Change to 10000 for $10k minimum
```

### Add More States (Auction.com)
Edit `target_states` in `AuctionComScraper`:
```python
self.target_states = ["GA", "TX", "FL", "CA", "AZ", "NY", "IL"]
```

### Adjust Rate Limiting
Edit delay constants:
```python
REQUEST_DELAY_MIN = 3  # Minimum seconds between requests
REQUEST_DELAY_MAX = 5  # Maximum seconds between requests
```

## Troubleshooting

### No Leads Found
- Check if website structure changed (scrapers may need updates)
- Run with `--verbose` to see detailed parsing
- Verify website is accessible
- Check if sales exist for the time period

### Connection Errors
- Check internet connection
- Verify website URLs are correct
- Check if IP is blocked (reduce scraping frequency)

### Database Insert Failures
- Verify Supabase URL and service key
- Check table schema matches lead structure
- Review error logs for specific issues

### Duplicate Lead Warnings
- Normal behavior - prevents re-inserting existing leads
- Duplicate check by case_number or property_address

## Site-Specific Implementation Notes

### TJSC (Judicial Sales Corporation)
- **Current Status**: Base template implemented
- **Next Steps**: Verify actual HTML structure and adjust selectors
- **Test URL**: https://www.tjsc.com/completed-sales
- **Note**: May need to handle pagination for multiple pages

### Stox Quickbase
- **Current Status**: Placeholder only
- **Challenge**: Quickbase sites often require authentication
- **Next Steps**:
  1. Inspect actual site structure
  2. Check if login required
  3. Implement authentication if needed
  4. Parse Quickbase-specific HTML/table structure

### Auction.com
- **Current Status**: Placeholder only
- **Challenge**: Heavy JavaScript rendering - may need Selenium
- **Alternative**: Reverse-engineer their API (inspect network tab)
- **Next Steps**:
  1. Use browser DevTools to find API endpoints
  2. Implement API scraping (faster than Selenium)
  3. OR use Selenium with headless Chrome
  4. Handle authentication/cookies if required

## Performance

- **Rate Limiting**: 3-5 seconds between requests (respectful scraping)
- **Retries**: Automatic retry on 429/500 errors (max 3 attempts)
- **User Agents**: Rotates 5 different user agents
- **Deduplication**: Database checks prevent duplicate inserts
- **Memory**: Low memory footprint (processes row-by-row)

## Data Quality

The scraper includes extensive validation:

- Currency parsing handles: $1,234.56, 1234, $1,234
- Date parsing handles: MM/DD/YYYY, YYYY-MM-DD, Month DD, YYYY
- Address cleaning and normalization
- Case number validation
- Overage calculation with safety checks

## Integration with Other Scripts

Works alongside:
- **county_surplus_scraper.py** - Scrapes county websites for unclaimed funds
- **skip_tracer.py** - Finds contact info for homeowners

Workflow:
1. Run trustee_sales_scraper.py daily
2. Run county_surplus_scraper.py weekly
3. Run skip_tracer.py on new leads
4. Leads ready for outreach

## Support

For issues or questions:
- Check logs: `trustee_sales_scraper.log`
- Review Supabase dashboard for inserted records
- Test with `--dry-run` to see what would be scraped
- Use `--verbose` for detailed debugging

## Future Enhancements

Potential improvements:
- [ ] Implement Stox Quickbase scraper
- [ ] Implement Auction.com scraper (Selenium or API)
- [ ] Add more trustee websites
- [ ] Email alerts for high-value overages (>$50k)
- [ ] Integration with skip tracer for immediate contact lookup
- [ ] Dashboard showing daily scrape statistics
- [ ] Automatic retry on network failures
- [ ] Parallel scraping for faster execution
