# County Surplus Scraper - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXECUTION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────────┐  │
│  │  System Cron │         │  n8n Server  │      │    Manual    │  │
│  │   (Daily)    │   OR    │  (Schedule)  │  OR  │  Execution   │  │
│  └──────┬───────┘         └──────┬───────┘      └──────┬───────┘  │
│         │                        │                     │           │
│         └────────────────────────┴─────────────────────┘           │
│                                  │                                 │
└──────────────────────────────────┼─────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    COUNTY SURPLUS SCRAPER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PHASE 1: DISCOVERY                                         │   │
│  │                                                             │   │
│  │  For each county:                                          │   │
│  │    1. Check KNOWN_COUNTY_URLS dict                         │   │
│  │    2. Execute Google searches (5 queries):                 │   │
│  │       - "[County] excess proceeds list"                    │   │
│  │       - "[County] surplus funds tax sale"                  │   │
│  │       - "[County] overbids list"                           │   │
│  │       - "[County] tax sale overage"                        │   │
│  │       - "[County] mortgage overage"                        │   │
│  │    3. Filter for .gov domains only                         │   │
│  │    4. Deduplicate URLs                                     │   │
│  │                                                             │   │
│  │  Output: List of county URLs to scrape                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  │                                 │
│                                  ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PHASE 2: FILE DISCOVERY                                    │   │
│  │                                                             │   │
│  │  For each URL:                                             │   │
│  │    1. Fetch HTML page (BeautifulSoup)                      │   │
│  │    2. Find all <a> tags with href                          │   │
│  │    3. Filter by extension: .pdf, .csv, .xlsx, .xls         │   │
│  │    4. Filter by keyword in link text:                      │   │
│  │       - "surplus", "excess", "overage"                     │   │
│  │       - "overbid", "proceeds"                              │   │
│  │    5. Build full URLs (urljoin)                            │   │
│  │                                                             │   │
│  │  Output: List of (file_url, file_type) tuples              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  │                                 │
│                                  ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PHASE 3: DOWNLOAD                                          │   │
│  │                                                             │   │
│  │  For each file:                                            │   │
│  │    1. Generate MD5 hash of URL (filename)                  │   │
│  │    2. Check if already downloaded (skip)                   │   │
│  │    3. HTTP GET with random user agent                      │   │
│  │    4. Save to /tmp/county_surplus_downloads/               │   │
│  │    5. Rate limit: 2-5 seconds delay                        │   │
│  │                                                             │   │
│  │  Output: Local file paths                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  │                                 │
│                                  ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PHASE 4: PARSING                                           │   │
│  │                                                             │   │
│  │  PDF (pdfplumber):                                          │   │
│  │    - Extract tables from each page                         │   │
│  │    - Identify columns: name, address, amount, case         │   │
│  │    - Parse each data row                                   │   │
│  │                                                             │   │
│  │  CSV (stdlib csv):                                          │   │
│  │    - Read header row                                       │   │
│  │    - Identify columns by keywords                          │   │
│  │    - Parse each data row                                   │   │
│  │                                                             │   │
│  │  Excel (openpyxl):                                          │   │
│  │    - Load workbook, get active sheet                       │   │
│  │    - Read header row                                       │   │
│  │    - Identify columns                                      │   │
│  │    - Parse each data row                                   │   │
│  │                                                             │   │
│  │  Data Extraction:                                          │   │
│  │    - owner_name: From name column                          │   │
│  │    - property_address: From address column                 │   │
│  │    - overage_amount: From amount column (cleaned)          │   │
│  │    - case_number: From case/parcel column                  │   │
│  │    - city, zip_code: Parsed from address                   │   │
│  │                                                             │   │
│  │  Output: List of lead dictionaries                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  │                                 │
│                                  ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PHASE 5: DATABASE INSERT                                   │   │
│  │                                                             │   │
│  │  For each lead:                                            │   │
│  │    1. Check if exists (property_address + owner_name)      │   │
│  │    2. Skip if duplicate                                    │   │
│  │    3. Build full lead object:                              │   │
│  │       - Set source_type: "county_surplus"                  │   │
│  │       - Set sale_type: "tax-sale"                          │   │
│  │       - Set county: county_name                            │   │
│  │       - Set source_url: original URL                       │   │
│  │       - Set created_at: current timestamp                  │   │
│  │    4. POST to Supabase REST API                            │   │
│  │    5. Log success/failure                                  │   │
│  │                                                             │   │
│  │  Output: Inserted lead count                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Table: scraped_leads                                               │
│                                                                     │
│  Columns:                                                           │
│    - id (uuid, PK)                                                  │
│    - owner_name (text)                                              │
│    - property_address (text)                                        │
│    - city (text)                                                    │
│    - state_abbr (text)                                              │
│    - zip_code (text)                                                │
│    - overage_amount (numeric)                                       │
│    - source_type (text) = "county_surplus"                          │
│    - source_url (text)                                              │
│    - case_number (text)                                             │
│    - county (text)                                                  │
│    - sale_type (text) = "tax-sale"                                  │
│    - created_at (timestamp)                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│ County       │
│ Websites     │
│ (.gov URLs)  │
└──────┬───────┘
       │
       │ (1) Google Search Discovery
       │     + Known URL Lookup
       │
       ▼
┌──────────────┐      (2) HTML Parsing
│ Webpage with │ ────────────────────────┐
│ PDF/CSV/     │                         │
│ Excel links  │                         │
└──────────────┘                         │
       │                                 │
       │                                 │
       │ (3) Download Files              ▼
       │                          ┌─────────────┐
       ▼                          │ BeautifulSoup│
┌──────────────┐                  │ Link         │
│ Local Files  │                  │ Extraction   │
│ /tmp/...     │                  └──────┬──────┘
└──────┬───────┘                         │
       │                                 │
       │ (4) Parse Tables                │
       │                                 │
       ▼                                 │
┌──────────────┐                         │
│ pdfplumber/  │◄────────────────────────┘
│ csv/openpyxl │
│ Parsing      │
└──────┬───────┘
       │
       │ (5) Extract & Clean Data
       │
       ▼
┌──────────────┐
│ Lead Data    │
│ Dictionaries │
└──────┬───────┘
       │
       │ (6) Deduplication Check
       │
       ▼
┌──────────────┐
│ Supabase     │
│ REST API     │
│ POST /leads  │
└──────┬───────┘
       │
       │ (7) Insert New Leads
       │
       ▼
┌──────────────┐
│ Database     │
│ scraped_leads│
│ table        │
└──────────────┘
```

## Component Architecture

```
CountySurplusScraper
├── SupabaseClient
│   ├── check_lead_exists()
│   └── insert_lead()
│
├── Discovery Methods
│   ├── google_search()
│   └── discover_county_urls()
│
├── Scraping Methods
│   ├── find_downloadable_files()
│   └── download_file()
│
├── Parsing Methods
│   ├── parse_pdf()
│   ├── parse_csv()
│   ├── parse_excel()
│   └── _extract_lead_from_row()
│
├── Utility Methods
│   ├── _find_column_index()
│   ├── _parse_amount()
│   ├── _parse_address_components()
│   ├── get_random_user_agent()
│   └── rate_limit()
│
└── Orchestration
    ├── process_county()
    └── run()
```

## Error Handling Flow

```
                    ┌─────────────┐
                    │ Try Execute │
                    └──────┬──────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Operation     │
                   │ Successful?   │
                   └───┬───────┬───┘
                       │       │
                  YES  │       │  NO
                       │       │
                       ▼       ▼
              ┌────────────┐ ┌────────────────┐
              │ Log Success│ │ Catch Exception│
              │ Continue   │ │ Log Error      │
              └────────────┘ │ Skip Item      │
                             │ Continue       │
                             └────────────────┘

Critical Errors → STOP (connection failures)
Non-Critical    → LOG + CONTINUE (single file parse errors)
```

## Rate Limiting Strategy

```
Request Type          Delay         Strategy
─────────────────────────────────────────────────────────
Google Search         3-6 sec       Longer to avoid blocks
County Page Fetch     2-5 sec       Random delay
File Download         2-5 sec       Random delay
Between Counties      5-10 sec      Longer between batches

If Blocked:
  Delay *= 2 (exponential backoff)
  Max delay: 240 seconds
  After 3 blocks: Skip county
```

## Deduplication Strategy

```
┌──────────────────┐
│ Parsed Lead Data │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ Generate Dedup Key:            │
│ key = property_address +       │
│       owner_name               │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Query Supabase:                │
│ SELECT id FROM scraped_leads   │
│ WHERE property_address = ?     │
│   AND owner_name = ?           │
└────────┬───────────────────────┘
         │
         ▼
    ┌────────────┐
    │ Exists?    │
    └─┬────────┬─┘
      │        │
   YES│        │NO
      │        │
      ▼        ▼
 ┌────────┐ ┌────────┐
 │ Skip   │ │ Insert │
 │ (Log)  │ │ Lead   │
 └────────┘ └────────┘
```

## File Processing Pipeline

```
PDF File
  │
  ├─► pdfplumber.open(file)
  │
  ├─► for page in pdf.pages:
  │     │
  │     ├─► page.extract_tables()
  │     │
  │     └─► for table in tables:
  │           │
  │           ├─► Identify header row
  │           │
  │           ├─► Find column indices
  │           │   (name, address, amount, case)
  │           │
  │           └─► for row in table[1:]:
  │                 │
  │                 ├─► Extract data
  │                 │
  │                 ├─► Validate
  │                 │
  │                 └─► Add to leads[]
  │
  └─► Return leads[]


CSV File
  │
  ├─► csv.reader(file)
  │
  ├─► header = rows[0]
  │
  ├─► Find column indices
  │
  └─► for row in rows[1:]:
        │
        ├─► Extract data
        │
        ├─► Validate
        │
        └─► Add to leads[]


Excel File
  │
  ├─► openpyxl.load_workbook(file)
  │
  ├─► sheet = workbook.active
  │
  ├─► header = sheet.rows[0]
  │
  ├─► Find column indices
  │
  └─► for row in sheet.rows[1:]:
        │
        ├─► Extract data
        │
        ├─► Validate
        │
        └─► Add to leads[]
```

## Logging Architecture

```
Logger: __main__
Level: INFO (configurable)

Handlers:
  ├─► FileHandler
  │   Path: /tmp/county_surplus_scraper.log
  │   Format: timestamp - name - level - message
  │
  └─► StreamHandler (stdout)
      Format: same as file

Log Levels:
  DEBUG   → Detailed parsing info, row-by-row
  INFO    → Progress updates, counts, URLs
  WARNING → Non-critical issues, skipped items
  ERROR   → Failed operations, exceptions

Log Rotation:
  Manual (cron job archives monthly)
  Recommended: logrotate or similar
```

## Configuration Points

```python
# Target Counties
TARGET_COUNTIES = [
    {"name": "County Name", "state": "ST"},
    ...
]

# Known URLs (optional)
KNOWN_COUNTY_URLS = {
    "County Name, ST": "https://...",
    ...
}

# Rate Limiting
MIN_DELAY = 2.0  # seconds
MAX_DELAY = 5.0  # seconds

# Google Search
NUM_RESULTS = 10  # per query

# Download Directory
DOWNLOAD_DIR = "/tmp/county_surplus_downloads"

# Supabase
SUPABASE_URL = "https://..."
SUPABASE_SERVICE_KEY = "..."
SUPABASE_TABLE = "scraped_leads"
```

## Extensibility Points

### Adding New Counties
```python
# In TARGET_COUNTIES list
{"name": "New County", "state": "XX"}

# Optional: In KNOWN_COUNTY_URLS
"New County, XX": "https://newcounty.gov/surplus"
```

### Adding New Data Sources
```python
def parse_html_table(filepath, county, state, source):
    """Parse HTML table (not PDF/CSV/Excel)"""
    soup = BeautifulSoup(open(filepath), 'html.parser')
    table = soup.find('table', {'id': 'surplus-list'})
    # Extract rows...
    return leads
```

### Adding New Search Engines
```python
def bing_search(query, num_results):
    """Alternative to Google search"""
    # Implement Bing API or scraping
    return urls
```

### Adding OCR Support
```python
def parse_scanned_pdf(filepath):
    """Parse image-based PDFs"""
    import pytesseract
    from pdf2image import convert_from_path

    images = convert_from_path(filepath)
    text = pytesseract.image_to_string(images[0])
    # Parse extracted text...
    return leads
```

## Performance Optimization Opportunities

1. Parallel County Processing
   ```python
   from multiprocessing import Pool

   with Pool(5) as pool:
       pool.map(process_county, counties)
   ```

2. Cache Known URLs
   ```python
   # Skip Google search if known URL works
   if county_key in KNOWN_COUNTY_URLS:
       return [KNOWN_COUNTY_URLS[county_key]]
   ```

3. Incremental Parsing
   ```python
   # Parse only new files (check timestamp)
   if os.path.getmtime(filepath) < last_run_time:
       skip
   ```

4. Batch Database Inserts
   ```python
   # Insert multiple leads in one API call
   response = requests.post(endpoint, json=leads_batch)
   ```

## Security Considerations

- Service key hardcoded (acceptable for internal scripts)
- For production: Use environment variables
- Rate limiting prevents IP bans
- User agent rotation avoids bot detection
- HTTPS for all requests
- No authentication bypass (public data only)
- PII in logs (consider redaction)

## Testing Strategy

1. Unit Tests (test_scraper.py)
   - Supabase connection
   - Parsing functions
   - Data cleaning functions

2. Integration Tests
   - Single county end-to-end
   - Database insert/dedup

3. Manual Testing
   - Spot-check leads vs source
   - Verify data quality

4. Load Testing
   - All 15 counties
   - Monitor runtime
   - Check memory usage
