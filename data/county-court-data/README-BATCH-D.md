# County Court Data Enrichment - Batch D

## Overview

This batch enriches county clerk contact information for **459 counties** across **5 states** with fax numbers, phone numbers, websites, and e-filing URLs.

**Files Included:**
- `enriched-batch-D.json` - Main data file with all counties
- `ENRICHMENT-GUIDE.md` - Detailed research methodology and resources
- `BATCH-D-RESEARCH-SUMMARY.txt` - Executive summary
- `README-BATCH-D.md` - This file

## States Included

| State | Counties | Completed |
|-------|----------|-----------|
| Michigan | 83 | 17% |
| Minnesota | 87 | 6% |
| Missouri | 115 + St. Louis City | 22% |
| Mississippi | 82 | 30% |
| Indiana | 92 | 35% |
| **TOTAL** | **459** | **~20%** |

## Data Fields

Each county record contains:

```json
{
  "county_name": "String - Full county name",
  "clerk_website": "String - URL to clerk of court office website",
  "efiling_url": "String - County-specific e-filing access URL",
  "phone": "String - Phone in (XXX) XXX-XXXX format",
  "fax": "String - Fax in (XXX) XXX-XXXX format",
  "address": "String - Full courthouse address"
}
```

**Note:** Empty string `""` used when data not found (never `null`)

## State E-Filing Systems

| State | System | URL |
|-------|--------|-----|
| **Michigan** | MiFILE | https://mifile.courts.michigan.gov/ |
| **Minnesota** | eFS Minnesota | https://efilemn.tylertech.cloud/OfsEfsp |
| **Missouri** | Missouri eFiling | https://www.courts.mo.gov/ecf/logon.do |
| **Mississippi** | MEC | https://www.pamecapps.mec.ms.gov/onlinereg/ |
| **Indiana** | Odyssey/INfile | https://efile.incourts.gov/ |

## Key Data Points Found

### Michigan
- Alcona: (989) 724-9410 | Fax: (989) 724-9411
- Antrim: (231) 533-6353 | Fax: (231) 533-6935
- Berrien: (269) 982-0392 | Fax: (269) 982-8643
- Montcalm: (989) 831-3520 | Fax: (989) 831-7428

### Minnesota
- Aitkin: (218) 927-7350 | Fax: (218) 927-4535
- Anoka: (763) 760-6700 | Fax: (763) 712-3247
- Becker: (218) 846-5040 | Fax: (218) 847-7620
- Beltrami: (218) 333-4120 | Fax: (218) 333-4209

### Missouri
- Adair: (660) 665-2552 | Fax: (660) 665-3420
- Andrew: (816) 324-3921 | Fax: (816) 324-3191
- Audrain: (573) 473-5840 | Fax: (573) 581-3237
- Callaway: (573) 642-0780 | Fax: (573) 642-0700

### Mississippi
- Amite: (601) 657-8022 | Fax: (601) 657-8288
- Bolivar: (662) 759-3762 | Fax: (662) 759-3467
- Calhoun: (662) 412-3117 | Fax: (662) 412-3128
- Carroll: (662) 237-9274 | Fax: (662) 237-9642

### Indiana
- Adams: (260) 724-2600 | Fax: (260) 724-3848
- Allen: (260) 449-7424 | Fax: (260) 428-7929
- Bartholomew: (812) 379-1600 | Fax: (812) 379-1675
- Dearborn: (812) 537-8867 | Fax: (812) 532-2021

## Primary Resources by State

### Michigan
- **Trial Court Directory:** https://www.courts.michigan.gov/trial-court-directory/
- **Association:** https://michigancountyclerks.us/contact/
- **Aggregator:** https://www.courtreference.com/ (search Michigan)

### Minnesota
- **Judicial Branch:** https://mncourts.gov/find-courts/
- **District Finder:** https://mncourts.gov/find-courts/district-finder
- **Resource:** https://libguides.mnhs.org/courtrecords/district

### Missouri
- **Courts Website:** https://www.courts.mo.gov/page.jsp?id=321
- **Circuit Courts:** https://www.courts.mo.gov/page.jsp?id=321 (46 circuits)
- **Aggregator:** https://www.courtreference.com/ (search Missouri)

### Mississippi
- **MSCHCA Directory:** https://www.mschca.org/directory/ ⭐ BEST
- **State Courts:** https://courts.ms.gov/trialcourts/chancerycourt/
- **Secretary of State:** https://www.sos.ms.gov/

### Indiana
- **ACCCIND:** https://acccind.org/indiana-clerks/ ⭐ BEST
- **Judicial Branch:** https://www.in.gov/courts/directory/
- **State Archives:** https://www.in.gov/iara/divisions/state-archives/collections/clerks-of-the-circuit-court-address-list/

## Completion Strategy

### Priority Order (by ease of completion)

1. **Mississippi (4 hours)** - MSCHCA directory has all 82 counties
2. **Indiana (6 hours)** - ACCCIND directory comprehensive
3. **Missouri (10 hours)** - 115 counties across 46 circuits
4. **Michigan (12 hours)** - 83 counties across 57 circuits
5. **Minnesota (14 hours)** - Most decentralized, county-by-county

**Total: 46-60 hours for ~95% completion**

## Research Methodology

### Quick Search Pattern
```
"[County Name] County [State]" circuit/chancery clerk phone fax
```

### Comprehensive Pattern
```
"[County Name] County [State]" clerk office contact directory site:.gov
```

### Fallback Approach
1. Find county government website
2. Navigate to Court Clerk or Circuit Court office
3. Look for "Contact Us" or "Staff Directory" page
4. Extract phone, fax, address

## Quality Assurance Rules

**MUST BE TRUE for each entry:**
1. ✓ County name spelled correctly
2. ✓ Phone in format (XXX) XXX-XXXX (or empty string)
3. ✓ Fax in format (XXX) XXX-XXXX (or empty string)
4. ✓ URLs start with http:// or https://
5. ✓ No statewide e-filing URL as county URL
6. ✓ All 459 counties listed (even with empty fields)
7. ✓ No duplicate county names
8. ✓ Never use null (always use empty string)

## JSON Validation

Validate before updating:

```bash
# Using Python
python3 -m json.tool enriched-batch-D.json

# Using Node.js
node -c enriched-batch-D.json

# Online: https://jsonlint.com/
```

## Integration Guide

### For foreclosure-leads-app

1. **Import the data:**
   ```python
   import json
   with open('enriched-batch-D.json', 'r') as f:
       data = json.load(f)
   ```

2. **Validate phone/fax format:**
   ```python
   import re
   pattern = r'^\(\d{3}\) \d{3}-\d{4}$'
   is_valid = bool(re.match(pattern, phone_number))
   ```

3. **Build county lookup service:**
   ```python
   def get_county(state, county_name):
       for state_data in data:
           if state_data['state_abbr'] == state:
               for county in state_data['counties']:
                   if county['county_name'].lower() == county_name.lower():
                       return county
       return None
   ```

## Maintenance

### Regular Updates
- Quarterly: Re-validate all phone/fax numbers
- Semi-annually: Check websites for changes
- Annually: Update e-filing URLs with new access portals

### Version Control
- Branch: `data/enriched-batch-D-progress`
- Commit after each state completion
- Tag: `batch-d-v1.0`, `batch-d-v2.0`, etc.

### Audit Trail
- Document source for each entry
- Note any conflicts between sources
- Record verification date

## Known Issues

### Minnesota
- Court administration is highly decentralized
- Some counties may not have dedicated fax lines
- Requires county-by-county website research

### Fax Numbers
- Many counties no longer maintain fax
- Some fax numbers may be outdated
- Consider phone as primary contact method

### E-Filing URLs
- Most counties direct to statewide systems
- County-specific URLs are rare
- Only populate if genuinely different from statewide

## Performance Tips

### For Manual Research
- Use spreadsheet to track progress
- Set 1-2 hour blocks per county batch
- Cross-reference minimum 2 sources per entry
- Use browser tabs for comparison research

### For Automated Approaches
- Web scraper tools: Playwright, BeautifulSoup, Selenium
- Target sites: CourtReference.com, county .gov sites
- Rate limiting: 1 request per 2 seconds to respect servers
- Error handling: Log failed extractions for manual review

## Troubleshooting

### Phone/Fax Not Found
1. Check county court website directly
2. Search county government main page
3. Contact county clerk office by mail or email
4. Check archived documents or forms

### Invalid URLs
1. Verify URL starts with http:// or https://
2. Test in browser before saving
3. Check for typos or encoded characters
4. Use URL validator: https://urlchecker.org/

### Duplicate Entries
1. Run: `grep "county_name" enriched-batch-D.json | sort | uniq -d`
2. Remove duplicate, keep most recent data
3. Verify correct county count per state

## License & Attribution

**Data Source Attribution:**
- Michigan Courts, Minnesota Judicial Branch, Missouri Courts, Mississippi Judiciary, Indiana Judicial Branch
- MSCHCA (Mississippi Chancery Clerks Association)
- ACCCIND (Association of Clerks of Circuit Courts of Indiana)
- County government websites

**Usage:** Internal foreclosure recovery lead generation business

## Contact & Support

For questions or data corrections:
1. Check ENRICHMENT-GUIDE.md for research methodology
2. Verify original source before updating
3. Document changes with date and source
4. Create issue/PR for tracking

## Summary Statistics

| Metric | Current | Target |
|--------|---------|--------|
| Phone Coverage | 121/459 (26%) | 437/459 (95%) |
| Fax Coverage | 89/459 (19%) | 390/459 (85%) |
| Website URLs | 45/459 (10%) | 367/459 (80%) |
| E-Filing URLs | 15/459 (3%) | 321/459 (70%) |

## Next Steps

1. **Start with Mississippi** - Use MSCHCA directory
2. **Follow completion sequence** - Indiana → Missouri → Michigan → Minnesota
3. **Document sources** - Maintain audit trail for QA
4. **Validate data** - Cross-check with 2+ sources minimum
5. **Commit regularly** - Create version history

---

**Last Updated:** 2026-02-08
**Status:** In Progress
**Completion Est:** 2-3 weeks (following recommended sequence)
**Priority:** HIGH (Critical for foreclosure lead generation)
