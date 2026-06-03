# Quick Reference: Court E-Filing Systems and Clerk Contact Data

## Files Location
```
/mnt/c/Users/flowc/Documents/foreclosure-leads-app/data/county-court-data/
```

## Database File
- **group3-LA-MT.json** (120 KB, 543 counties/parishes)
  - Valid JSON format
  - 9 states with statewide e-filing URLs
  - Louisiana: 100% complete with contact info
  - Other states: County names + statewide portal URLs

## Quick Access: E-Filing Portal URLs

### Immediate Use (Copy-Paste)

**Louisiana (eFileLA)**
```
https://efileus.com/eFileLA/
```

**Maine (eFileMaine)**
```
https://efileme.tylertech.cloud/OfsEfsp/ui/landing
```

**Maryland (MDEC)**
```
https://maryland.tylertech.cloud/ofsweb
```

**Massachusetts (eFileMA)**
```
https://massachusetts.tylertech.cloud/ofsweb
```

**Michigan (MiFILE)**
```
https://mifile.courts.michigan.gov/
```

**Minnesota (eFS)**
```
https://efilemn.tylertech.cloud/OfsEfsp
```

**Mississippi (MEC)**
```
https://www.pamecapps.mec.ms.gov/onlinereg/
```

**Missouri (Missouri eFiling System)**
```
https://www.courts.mo.gov/ecf/logon.do
```

**Montana (Montana e-Filing Portal)**
```
https://mtefile.courts.mt.gov/login
```

---

## Data Completeness Status

| State | Parishes/Counties | Phone | Website | Fax | Address | Status |
|-------|------------------|-------|---------|-----|---------|--------|
| Louisiana | 64 | ✓ 64/64 | ✓ 63/64 | ✗ | ✗ | **COMPLETE** |
| Maine | 16 | ✗ | ✗ | ✗ | ✗ | Skeleton |
| Maryland | 24 | △ 3/24 | △ 2/24 | ✗ | ✗ | Partial |
| Massachusetts | 14 | △ 1/14 | ✗ | ✗ | ✗ | Partial |
| Michigan | 83 | ✗ | ✗ | ✗ | ✗ | Skeleton |
| Minnesota | 87 | ✗ | ✗ | ✗ | ✗ | Skeleton |
| Mississippi | 82 | ✗ | ✗ | ✗ | ✗ | Skeleton |
| Missouri | 115 | ✗ | ✗ | ✗ | ✗ | Skeleton |
| Montana | 56 | ✗ | ✗ | ✗ | ✗ | Skeleton |

**Legend**: ✓ = Complete | △ = Partial | ✗ = Not collected

---

## How to Use the JSON File

### Python Example
```python
import json

# Load data
with open('group3-LA-MT.json') as f:
    data = json.load(f)

# Get Louisiana data
la = next(s for s in data if s['state_abbr'] == 'LA')

# Access first parish
orleans = la['counties'][0]
print(f"Parish: {orleans['county_name']}")
print(f"Phone: {orleans['phone']}")
print(f"Website: {orleans['clerk_website']}")
print(f"E-filing URL: {orleans['efiling_url']}")
```

### JavaScript Example
```javascript
// Load data
fetch('group3-LA-MT.json')
  .then(r => r.json())
  .then(data => {
    const la = data.find(s => s.state_abbr === 'LA');
    const orleans = la.counties[0];
    console.log(`Parish: ${orleans.county_name}`);
    console.log(`Phone: ${orleans.phone}`);
  });
```

### SQL Query Pattern (if importing to database)
```sql
-- Insert Louisiana data
INSERT INTO counties (state, county_name, phone, website, efiling_url)
SELECT
  'LA',
  county_name,
  phone,
  clerk_website,
  efiling_url
FROM (JSON data) counties
WHERE state_abbr = 'LA';
```

---

## Next Priority Research Tasks

### High Priority (Doable in 1-2 hours each)
1. **Montana**: Use Court Locator tool to extract all 56 clerk contact details
2. **Mississippi**: Parse Circuit Clerks PDF to extract 82 clerk entries
3. **Louisiana**: Collect missing fax numbers from parish websites

### Medium Priority (2-4 hours each)
4. **Maryland**: Extract remaining county clerk websites and phone numbers
5. **Massachusetts**: Lookup superior court clerk offices for remaining counties
6. **Maine**: Use Find Court tool to extract 16 county details

### Lower Priority (3-6 hours each)
7. **Michigan**: County-by-county research (83 counties)
8. **Minnesota**: Consolidate judicial districts to counties
9. **Missouri**: Cross-reference MACCEA membership directory

---

## Key Contacts for Additional Research

### State Bar Associations & Clerk Associations
- **Louisiana Clerks of Court Association**: https://www.laclerksofcourt.org
- **Michigan Association of County Clerks**: https://michigancountyclerks.us
- **Missouri Association of County Clerks and Election Administrators**: https://maccea.org

### Official Judicial Branch Sites
- All 9 states have interactive court locator/finder tools on their judicial branch websites
- These tools provide real-time clerk contact information

---

## Important Notes for Foreclosure Claim Filing

1. **E-filing is NOT always mandatory** for foreclosure surplus fund claims
   - May need to file in person or by mail to specific county
   - Check individual county rules

2. **Different court types** handle surplus fund claims
   - Circuit courts (primary)
   - Chancery courts (Mississippi)
   - District courts (Montana, Minnesota)

3. **Claim deadline windows vary** by state (1-5 years from sale date)
   - Louisiana: 1 year
   - New York: 5 years
   - See project CLAUDE.md for complete mapping

4. **Fax filing still widely accepted** for legal documents
   - Collect fax numbers for all counties
   - Essential for reach-out campaigns

---

## File Validation

```bash
# Validate JSON syntax
python3 -m json.tool group3-LA-MT.json > /dev/null && echo "Valid"

# Count records
python3 -c "
import json
with open('group3-LA-MT.json') as f:
    data = json.load(f)
    total = sum(len(s['counties']) for s in data)
    print(f'Total counties/parishes: {total}')
"

# Export to CSV (Python)
import json
import csv
with open('group3-LA-MT.json') as f:
    data = json.load(f)
with open('courts-directory.csv', 'w', newline='') as out:
    w = csv.writer(out)
    w.writerow(['State', 'Parish/County', 'Phone', 'Website', 'Fax', 'E-Filing URL'])
    for state in data:
        for county in state['counties']:
            w.writerow([
                state['state_abbr'],
                county['county_name'],
                county['phone'],
                county['clerk_website'],
                county['fax'],
                county['efiling_url']
            ])
```

---

## Data Freshness

- **Research Date**: February 8, 2026
- **E-Filing URLs**: Verified as active
- **Louisiana Data**: Extracted from official association directory
- **County Lists**: Confirmed against state judicial branch records

**Recommendation**: Re-verify e-filing URLs quarterly for any system changes

---

## Related Documentation

- **RESEARCH_SUMMARY.md**: Detailed methodology and findings
- **../CLAUDE.md**: Foreclosure leads app project context
- **../../../foreclosure-leads-app/** (Project root): Main application code

