# Skip Trace Quick Start Guide

Get started enriching your foreclosure leads in 3 steps.

## Step 1: Install Dependencies

```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/enrichment
pip install -r requirements.txt
```

## Step 2: Test the Script

Run a dry-run to verify everything works:

```bash
# Using convenience script
./run_skip_trace.sh test

# Or directly with Python
python3 skip_trace.py --batch-size 5 --delay 3 --dry-run
```

Expected output:
```
Starting skip trace enrichment...
Batch size: 5, Delay: 3.0s, Dry run: True

Processing batch of 5 leads...
Processing lead 1/5: Smith, John (Miami, FL)
Searching TruePeopleSearch: John Smith in Miami FL
DRY RUN: Would update lead 123 with: {'primary_phone': '555-123-4567', ...}
...
```

## Step 3: Run for Real

Once the test looks good, run the full enrichment:

```bash
# Standard mode (recommended)
./run_skip_trace.sh standard

# Or run in background (for long runs)
./run_skip_trace.sh background

# Monitor progress
tail -f skip_trace.log
```

## Common Commands

```bash
# Run different modes
./run_skip_trace.sh test       # Dry run test
./run_skip_trace.sh fast       # Fast processing
./run_skip_trace.sh slow       # Slow (safest)
./run_skip_trace.sh background # Background mode

# Check status
./run_skip_trace.sh status

# Stop all running instances
./run_skip_trace.sh stop
```

## What Gets Updated

For each lead, the script will populate:
- `primary_phone` - First phone number found
- `secondary_phone` - Second phone number (if available)
- `primary_email` - First email address found
- `secondary_email` - Second email (if available)
- `mailing_address` - Current address
- `skip_trace_source` - Which site provided the data
- `skip_trace_at` - Timestamp of enrichment

## Expected Results

- **Phone Success Rate**: 60-80%
- **Email Success Rate**: 30-50%
- **Address Success Rate**: 70-85%
- **Processing Speed**: 10-15 leads/minute
- **Full Run Time**: 3-4 hours for 2,473 leads

## Troubleshooting

### Script not finding any data

1. Check Crawl4AI is running:
   ```bash
   curl https://crawl4ai.alwaysencrypted.com/health
   ```

2. Check Supabase connection:
   ```bash
   curl https://foreclosure-db.alwaysencrypted.com/rest/v1/
   ```

3. Check logs for errors:
   ```bash
   tail -50 skip_trace.log
   ```

### Getting rate limited

Increase the delay between requests:
```bash
python3 skip_trace.py --delay 10
```

### Script crashed mid-run

No problem! The script is resumable. Just run it again:
```bash
./run_skip_trace.sh standard
```

It will automatically skip leads that already have phone numbers.

## Full Documentation

For complete details, see `SKIP_TRACE_README.md`
