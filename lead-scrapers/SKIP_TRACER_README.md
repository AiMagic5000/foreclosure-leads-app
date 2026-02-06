# Skip Tracer - Automated Foreclosure Lead Skip Tracing

Production-ready Python script that performs automated skip tracing on foreclosure leads using free public people search websites.

## Features

- **Multi-Source Search**: Queries TruePeopleSearch.com (primary) and FastPeopleSearch.com (backup)
- **Business Entity Handling**: Detects LLCs/Corps and searches Secretary of State databases
- **Address Cross-Reference**: Verifies found persons by matching previous addresses with foreclosed property
- **Phone Type Detection**: Identifies wireless vs landline phones, prioritizes mobile numbers
- **Rate Limiting**: 5-10 second delays between requests to avoid IP blocking
- **Exponential Backoff**: Automatically backs off when sites block (30s → 240s)
- **CAPTCHA Handling**: Gracefully skips leads when CAPTCHA detected, doesn't crash
- **Batch Processing**: Processes up to 100 leads per run in batches of 50
- **Cron-Safe**: Skips already-traced leads, can run repeatedly

## Installation

```bash
cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers
pip install -r requirements.txt
```

## Usage

### Manual Run
```bash
python skip_tracer.py
```

### Cron Schedule (Every 6 Hours)
```bash
0 */6 * * * cd /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers && python skip_tracer.py
```

## Configuration

Edit these constants in `skip_tracer.py`:

| Constant | Default | Description |
|----------|---------|-------------|
| `BATCH_SIZE` | 50 | Leads fetched per batch |
| `MAX_LEADS_PER_RUN` | 100 | Max leads processed per run |
| `MIN_DELAY` | 5 | Min seconds between requests |
| `MAX_DELAY` | 10 | Max seconds between requests |

## Data Collected

For each lead, the script attempts to find:

- **Primary Phone**: Best phone number (prefers wireless/mobile)
- **Secondary Phone**: Second phone number if available
- **Primary Email**: Email address
- **Associated Names**: Array of relatives and associates
- **Current Mailing Address**: If different from property address

## Supabase Schema

The script expects the `foreclosure_leads` table to have these columns:

### Required Columns
- `id` (integer, primary key)
- `owner_name` (text)
- `property_address` (text)
- `state` (text)
- `city` (text)

### Updated Columns
- `primary_phone` (text)
- `secondary_phone` (text)
- `primary_email` (text)
- `associated_names` (text[], array)
- `current_mailing_address` (text)
- `skip_traced_at` (timestamp)

## Logging

Logs are written to:
- **File**: `/mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers/skip_tracer.log`
- **Console**: stdout

Log format:
```
2026-02-03 10:30:45 [INFO] Starting Skip Tracing Job
2026-02-03 10:30:46 [INFO] Fetched 50 leads needing skip trace
2026-02-03 10:30:47 [INFO] Processing lead 123: John Smith
2026-02-03 10:30:48 [INFO] Searching TruePeopleSearch for: John Smith (CA)
2026-02-03 10:30:55 [INFO] TruePeopleSearch found: 2 phones, 1 emails
2026-02-03 10:30:56 [INFO] Address cross-reference successful for lead 123
2026-02-03 10:30:57 [INFO] Skip trace complete for lead 123: 2 phones, 1 emails, 5 associated names
2026-02-03 10:30:58 [INFO] Updated lead 123 with skip trace data
```

## Error Handling

### CAPTCHA Detection
When CAPTCHA is detected, the script:
1. Logs a warning
2. Enters exponential backoff mode (30s, 60s, 120s, 240s)
3. Skips the current lead
4. Continues with next lead

### Site Blocking
If a site blocks you (403/429):
1. Script automatically backs off exponentially
2. Waits 30s → 60s → 120s → 240s between retries
3. After max retries, skips to next lead

### Network Errors
- Retries 3 times with exponential backoff
- Logs error and continues to next lead

## Business Entity Detection

The script detects these business entity patterns:
- LLC, L.L.C.
- Corp, Corporation, Inc, Incorporated
- LP, L.P., Limited Partnership
- LTD, Limited
- Co, Company

When detected, it attempts to:
1. Search the state's Secretary of State business entity database
2. Find registered agent, directors, officers
3. Skip trace those individuals instead

**NOTE**: Secretary of State search is not yet implemented. Each state has different website structures. This will be added in a future update.

## Website Scraping Details

### TruePeopleSearch.com
- **Search URL**: `https://www.truepeoplesearch.com/results?name={name}+{city}+{state}`
- **Data Extracted**: Phones (with type), emails, addresses, relatives, associates
- **Rate Limit**: 5-10 seconds between requests
- **CAPTCHA**: Yes, handled gracefully

### FastPeopleSearch.com
- **Search URL**: `https://www.fastpeoplesearch.com/name/{first}-{last}_{state}`
- **Data Extracted**: Phones, emails, addresses, relatives
- **Rate Limit**: 5-10 seconds between requests
- **CAPTCHA**: Yes, handled gracefully

## Troubleshooting

### Script Gets Blocked
If you see many "CAPTCHA/blocking detected" warnings:
- Increase `MIN_DELAY` and `MAX_DELAY` to 10-15 seconds
- Reduce `MAX_LEADS_PER_RUN` to 50
- Run less frequently (every 12 hours instead of 6)

### No Results Found
If many leads return no results:
- Check that `owner_name` is formatted correctly (FirstName LastName)
- Verify `state` abbreviations are correct (CA, TX, FL, etc.)
- Check logs for parsing errors (website HTML may have changed)

### Database Connection Issues
If Supabase connection fails:
- Verify URL: `https://foreclosure-db.alwaysencrypted.com`
- Check service key is correct (expires 2125-10-10)
- Ensure R730 server is running
- Test Kong memory: `docker stats supabase-kong-...`

## Performance

Average skip trace time per lead:
- **With Results**: 15-25 seconds (2 sites + delays)
- **Without Results**: 10-15 seconds (1 site + delays)

Expected throughput:
- **100 leads per run**: 25-40 minutes
- **Safe cron schedule**: Every 6 hours (400 leads/day)

## Future Enhancements

- [ ] Implement Secretary of State searches for all 50 states
- [ ] Add more data sources (Whitepages, BeenVerified, etc.)
- [ ] Use residential proxy rotation for higher volume
- [ ] Add email verification API integration
- [ ] Implement phone number validation (active/inactive)
- [ ] Add confidence scoring for person matching

## License

Proprietary - For internal use only.

## Support

For issues or questions, check the log file first:
```bash
tail -f /mnt/c/Users/flowc/Documents/foreclosure-leads-app/lead-scrapers/skip_tracer.log
```
