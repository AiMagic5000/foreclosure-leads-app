# Skip Trace Enrichment System

Enriches foreclosure leads with phone numbers, emails, and mailing addresses by scraping free public people search sites using Crawl4AI.

## Overview

This script processes 2,473 foreclosure leads in the Supabase database, enriching them with contact information from multiple free public search sources:

1. **TruePeopleSearch** - Primary source for phones, emails, addresses
2. **FastPeopleSearch** - Backup source with similar data
3. **WhitePages** - Secondary backup for phone numbers
4. **Addresses.com** - Additional backup source

## Features

- **Resumable**: Only processes leads where `primary_phone IS NULL`
- **Multi-source strategy**: Falls back through 4 sources if initial search fails
- **Rate limiting**: 3-7 second random delays between requests
- **User agent rotation**: Reduces blocking risk
- **Batch processing**: Processes 50 leads at a time by default
- **Detailed logging**: Console and file logging with statistics
- **Dry run mode**: Test without updating database
- **Name parsing**: Handles "Last, First" and "First Last" formats
- **Phone normalization**: Formats all phones as XXX-XXX-XXXX

## Installation

```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/enrichment

# Install dependencies
pip install -r requirements.txt
```

## Configuration

The script uses environment variables with sensible defaults:

```bash
# Optional - defaults are already configured
export SUPABASE_URL="https://foreclosure-db.alwaysencrypted.com"
export SUPABASE_SERVICE_KEY="your-service-key-here"
export CRAWL4AI_URL="https://crawl4ai.alwaysencrypted.com"
```

## Usage

### Basic Usage

```bash
# Process all leads (50 per batch, 5 second delay)
python skip_trace.py

# Custom batch size and delay
python skip_trace.py --batch-size 25 --delay 7

# Dry run (test without updating database)
python skip_trace.py --dry-run

# See all options
python skip_trace.py --help
```

### Run on R730 Server

```bash
# SSH to server
ssh admin1@10.28.28.95

# Navigate to directory
cd /path/to/foreclosure-leads-app/enrichment

# Run in background with nohup
nohup python skip_trace.py --batch-size 50 --delay 5 > skip_trace_output.log 2>&1 &

# Monitor progress
tail -f skip_trace.log

# Check if still running
ps aux | grep skip_trace.py
```

## Command Line Options

```
--batch-size INT    Number of leads to process per batch (default: 50)
--delay FLOAT       Seconds between requests (default: 5.0)
--dry-run          Run without updating database (for testing)
```

## How It Works

### 1. Name Parsing
- Splits `owner_name` into first and last name
- Handles "Last, First" format (e.g., "Smith, John")
- Handles "First Last" format (e.g., "John Smith")
- Handles "First Middle Last" (uses first and last only)

### 2. Multi-Source Search Strategy

For each lead:
1. Try **TruePeopleSearch** first (most complete data)
2. If no phone found, try **FastPeopleSearch**
3. If still no phone, try **WhitePages**
4. If still no phone, try **Addresses.com**
5. Merge results from all sources

### 3. Data Extraction

Uses regex patterns to extract:
- **Phone numbers**: `(\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4})`
- **Emails**: Standard email pattern + partial emails (e.g., j***n@gmail.com)
- **Addresses**: Looks for "Current Address:", "Lives in:", etc.

### 4. Database Update

Updates the following fields in `foreclosure_leads` table:
- `primary_phone` - First phone number found
- `secondary_phone` - Second phone number found (if available)
- `primary_email` - First email found
- `secondary_email` - Second email found (if available)
- `mailing_address` - Current address
- `skip_trace_source` - Which source provided the data
- `skip_trace_at` - ISO timestamp of enrichment

### 5. Rate Limiting

- Random delay between 5-7 seconds (configurable)
- User agent rotation on each request
- Respects rate limits to avoid blocks

## Output

### Console Output

```
2026-02-04 10:46:15 - INFO - Starting skip trace enrichment...
2026-02-04 10:46:15 - INFO - Batch size: 50, Delay: 5.0s, Dry run: False

2026-02-04 10:46:16 - INFO - Processing batch of 50 leads...
2026-02-04 10:46:16 - INFO - Processing lead 1/50: Smith, John (Miami, FL)
2026-02-04 10:46:16 - INFO - Searching TruePeopleSearch: John Smith in Miami FL
2026-02-04 10:46:22 - INFO - Successfully updated lead 123
...
```

### Statistics Output

```
============================================================
FINAL STATS
============================================================
Total Processed: 2473
Phones Found: 1847
Emails Found: 1234
Addresses Found: 1956
Failed: 626

Success by Source:
  TruePeopleSearch: 1456
  FastPeopleSearch: 312
  WhitePages: 67
  Addresses.com: 12

Success Rate (Phone): 74.7%
============================================================
```

## Log Files

- **Location**: `/mnt/c/Users/flowc/Documents/foreclosure-leads-app/enrichment/skip_trace.log`
- **Format**: `YYYY-MM-DD HH:MM:SS - LEVEL - MESSAGE`
- **Retention**: Manual rotation (check size periodically)

## Troubleshooting

### No data found for leads

**Cause**: Source site may be blocking or rate limiting

**Solution**:
- Increase `--delay` to 7-10 seconds
- Check if Crawl4AI is running: `curl https://crawl4ai.alwaysencrypted.com/health`
- Check log file for specific errors

### Script stops mid-batch

**Cause**: Network issue or source site blocking

**Solution**:
- Script is resumable - just restart it
- It will automatically skip already-enriched leads
- Consider using nohup on server for unattended runs

### Low success rate

**Cause**: Incorrect name format or common names

**Solution**:
- Check `owner_name` format in database
- Common names (e.g., "John Smith") may have too many results
- Consider adding property address to search query

### Rate limiting / 429 errors

**Cause**: Too many requests too quickly

**Solution**:
- Increase `--delay` to 10+ seconds
- Run smaller batches: `--batch-size 25`
- Wait 1 hour and retry

## Database Schema

The script expects these fields in `foreclosure_leads` table:

**Input fields (must exist):**
- `id` (int) - Primary key
- `owner_name` (text) - Full name of property owner
- `property_address` (text) - Property street address
- `city` (text) - City name
- `state_abbr` (text) - 2-letter state code
- `zip_code` (text) - ZIP code

**Output fields (will be populated):**
- `primary_phone` (text)
- `secondary_phone` (text)
- `primary_email` (text)
- `secondary_email` (text)
- `mailing_address` (text)
- `skip_trace_source` (text)
- `skip_trace_at` (timestamp)

## Performance

- **Speed**: ~10-15 leads per minute (with 5s delay)
- **Full run time**: ~3-4 hours for 2,473 leads
- **Expected success rate**: 60-80% for phone numbers
- **Expected success rate**: 30-50% for emails

## Best Practices

1. **Start with dry run**: Test with `--dry-run` first
2. **Small batches initially**: Use `--batch-size 10` to verify
3. **Monitor logs**: Watch `tail -f skip_trace.log` during run
4. **Run during off-hours**: Less competition for scraping
5. **Use server deployment**: R730 has better uptime than local machine

## Future Enhancements

Potential improvements:
- Add more data sources (BeenVerified, Spokeo if paid)
- Implement proxy rotation for higher volume
- Add machine learning to predict best source per lead
- Implement parallel processing for faster enrichment
- Add validation for phone numbers (check if still active)
- Store negative results to avoid re-scraping

## Support

For issues or questions:
- Check log file first: `skip_trace.log`
- Review this README
- Test Crawl4AI manually: `curl https://crawl4ai.alwaysencrypted.com/health`
- Verify Supabase connection: Check credentials in script

## License

Internal use only. Respects public data source terms of service.
