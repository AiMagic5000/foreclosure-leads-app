# Batch D - County Court Data Enrichment Index

## Quick Navigation

### Main Data File
- **enriched-batch-D.json** (84 KB)
  - All 459 counties with template structure
  - ~20% data fill (121 counties with phone/fax)
  - Ready for continuation

### Documentation Files

1. **README-BATCH-D.md** (9.1 KB) - START HERE
   - Quick overview
   - State summary table
   - Data fields explanation
   - Primary resources by state
   - Quality assurance rules

2. **ENRICHMENT-GUIDE.md** (11 KB) - RESEARCH GUIDE
   - Detailed state-by-state strategy
   - Search patterns and queries
   - Data collection methods
   - County-specific e-filing URLs
   - Completion checklist
   - Second-tier resources

3. **BATCH-D-RESEARCH-SUMMARY.txt** (7.9 KB) - TECHNICAL SUMMARY
   - Deliverables summary
   - Research findings
   - Challenges and solutions
   - Completion sequence
   - Time/effort estimates
   - File maintenance guide

## States & Coverage

```
MICHIGAN (83 counties)
├─ Current: 14/83 (17% phone/fax)
├─ Primary: https://www.courts.michigan.gov/trial-court-directory/
└─ Estimated completion: 12 hours

MINNESOTA (87 counties)
├─ Current: 5/87 (6% phone/fax)
├─ Primary: https://mncourts.gov/find-courts/
└─ Estimated completion: 14 hours

MISSOURI (115 + St. Louis City)
├─ Current: 25/115 (22% phone/fax)
├─ Primary: https://www.courts.mo.gov/page.jsp?id=321
└─ Estimated completion: 10 hours

MISSISSIPPI (82 counties)
├─ Current: 25/82 (30% phone/fax)
├─ Primary: https://www.mschca.org/directory/ ⭐ BEST
└─ Estimated completion: 4 hours

INDIANA (92 counties)
├─ Current: 32/92 (35% phone/fax)
├─ Primary: https://acccind.org/indiana-clerks/ ⭐ BEST
└─ Estimated completion: 6 hours

TOTAL: 121/459 (26%) with phone/fax numbers
Target: 437/459 (95%) phone, 390/459 (85%) fax
```

## Recommended Reading Order

### For Quick Start (5 minutes)
1. This file (BATCH-D-INDEX.md)
2. README-BATCH-D.md (Overview section)

### For Research (30 minutes)
1. README-BATCH-D.md (full)
2. ENRICHMENT-GUIDE.md (Sections for your assigned state)

### For Full Context (1 hour)
1. README-BATCH-D.md
2. ENRICHMENT-GUIDE.md
3. BATCH-D-RESEARCH-SUMMARY.txt

## Key Statistics

| Metric | Status |
|--------|--------|
| Total Counties | 459 |
| With Phone Numbers | 121 (26%) |
| With Fax Numbers | 89 (19%) |
| With Websites | 45 (10%) |
| With E-filing URLs | 15 (3%) |
| Completion Target | 95%+ |

## Best Starting Points (by state)

### Mississippi ⭐ Easiest
- Resource: https://www.mschca.org/directory/
- Time: 4 hours
- Goal: 100% (82/82 counties)
- Why: Official directory has all counties listed

### Indiana ⭐⭐ Very Easy
- Resource: https://acccind.org/indiana-clerks/
- Time: 6 hours
- Goal: 95%+ (87/92 counties)
- Why: Association directory is comprehensive

### Missouri ⭐⭐⭐ Medium
- Resource: https://www.courts.mo.gov/page.jsp?id=321
- Time: 10 hours
- Goal: 80%+ (92/115 counties)
- Why: 115 counties across 46 circuits

### Michigan ⭐⭐⭐⭐ Harder
- Resource: https://www.courts.michigan.gov/trial-court-directory/
- Time: 12 hours
- Goal: 75%+ (62/83 counties)
- Why: Requires county-by-county research

### Minnesota ⭐⭐⭐⭐⭐ Hardest
- Resource: https://mncourts.gov/find-courts/
- Time: 14 hours
- Goal: 70%+ (61/87 counties)
- Why: Most decentralized system

## Data Structure Example

```json
{
  "state_abbr": "MI",
  "state_name": "Michigan",
  "statewide_efiling_system": "MiFILE",
  "statewide_efiling_url": "https://mifile.courts.michigan.gov/",
  "counties": [
    {
      "county_name": "Alcona",
      "clerk_website": "https://alconacountymi.com/home/23rd-circuit-court/",
      "efiling_url": "",
      "phone": "(989) 724-9410",
      "fax": "(989) 724-9411",
      "address": "106 Fifth Street, Harrisville, MI 48740"
    }
  ]
}
```

## Critical Rules

1. **Phone format:** `(XXX) XXX-XXXX` or empty string
2. **Fax format:** `(XXX) XXX-XXXX` or empty string
3. **URLs:** Start with `http://` or `https://`
4. **Empty fields:** Use `""` never `null`
5. **E-filing:** County-specific only (not statewide system)
6. **All counties:** Must be listed (459 total)
7. **No duplicates:** One entry per county

## Quick Links

### State Resources
| State | Directory | E-Filing | Court System |
|-------|-----------|----------|--------------|
| MI | [Trial Court](https://www.courts.michigan.gov/trial-court-directory/) | [MiFILE](https://mifile.courts.michigan.gov/) | https://www.courts.michigan.gov/ |
| MN | [Find Courts](https://mncourts.gov/find-courts/) | [eFS](https://efilemn.tylertech.cloud/OfsEfsp) | https://mncourts.gov/ |
| MO | [Circuits](https://www.courts.mo.gov/page.jsp?id=321) | [eFiling](https://www.courts.mo.gov/ecf/logon.do) | https://www.courts.mo.gov/ |
| MS | [MSCHCA](https://www.mschca.org/directory/) | [MEC](https://www.pamecapps.mec.ms.gov/onlinereg/) | https://courts.ms.gov/ |
| IN | [ACCCIND](https://acccind.org/indiana-clerks/) | [Odyssey](https://efile.incourts.gov/) | https://www.in.gov/courts/ |

### Aggregators
- CourtReference.com - https://www.courtreference.com/
- The Court Direct - https://thecourtdirect.com/
- Claims Pages - https://www.claimspages.com/tools/courthouses/

## File Locations

```
/mnt/c/Users/flowc/Documents/foreclosure-leads-app/data/county-court-data/
├── enriched-batch-D.json (Main data file - 459 counties)
├── BATCH-D-INDEX.md (This file)
├── README-BATCH-D.md (Quick start guide)
├── ENRICHMENT-GUIDE.md (Detailed research methodology)
└── BATCH-D-RESEARCH-SUMMARY.txt (Technical summary)
```

## Validation Checklist

Before publishing updates:

- [ ] All 459 counties listed
- [ ] No duplicate county names
- [ ] Phone numbers in (XXX) XXX-XXXX format (or empty)
- [ ] Fax numbers in (XXX) XXX-XXXX format (or empty)
- [ ] URLs start with http/https (or empty)
- [ ] No statewide URLs as county e-filing URLs
- [ ] JSON validates (use jsonlint.com or python -m json.tool)
- [ ] Spot-check 5-10 entries against original sources
- [ ] Document data sources for audit trail

## Progress Tracking

### Completion Percentages

Current State:
- Michigan: 17% complete
- Minnesota: 6% complete
- Missouri: 22% complete
- Mississippi: 30% complete
- Indiana: 35% complete
- **Average: 22% complete**

Target Progress (Recommended):
- Week 1: Mississippi 100%, Indiana 95% (87/459 = 19%)
- Week 2: Missouri 80% (180/459 = 39%)
- Week 3: Michigan 75% (242/459 = 53%)
- Week 4: Minnesota 70% (303/459 = 66%)

## Integration Instructions

### For foreclosure-leads-app

1. **Replace existing data:**
   ```bash
   cp enriched-batch-D.json /path/to/app/data/counties.json
   ```

2. **Validate import:**
   ```python
   import json
   with open('enriched-batch-D.json') as f:
       data = json.load(f)
   print(f"Loaded {sum(len(s['counties']) for s in data)} counties")
   ```

3. **Create county lookup service:**
   ```python
   class CountyLookup:
       def __init__(self, data):
           self.data = data

       def get(self, state, county):
           for s in self.data:
               if s['state_abbr'] == state:
                   for c in s['counties']:
                       if c['county_name'].lower() == county.lower():
                           return c
           return None
   ```

4. **Build search indexes:**
   - Phone number search (for reverse lookup)
   - County name autocomplete
   - State filtering

## Maintenance Schedule

- **Weekly:** Review submissions for new data
- **Monthly:** Validate 10% sample of entries
- **Quarterly:** Verify all phone/fax numbers
- **Semi-annually:** Update websites and e-filing URLs
- **Annually:** Full comprehensive audit

## Support Resources

### If Data Not Found
1. Check ENRICHMENT-GUIDE.md (has search patterns)
2. Try primary resource for your state (see table above)
3. Use backup resources section
4. Contact county clerk directly (phone/email)

### If Data Validation Fails
1. Check phone/fax format matches (XXX) XXX-XXXX
2. Verify URLs start with http:// or https://
3. Use jsonlint.com to validate JSON structure
4. Review quality assurance rules above

### If Unsure About E-filing URL
1. Check if it's county-specific (not statewide system)
2. If doubt, leave empty string ""
3. Statewide systems should NOT be entered as county URLs
4. Document reason for empty field

## Questions?

See documentation files:
1. **Quick answers:** README-BATCH-D.md
2. **Research methodology:** ENRICHMENT-GUIDE.md
3. **Technical details:** BATCH-D-RESEARCH-SUMMARY.txt

---

**Created:** 2026-02-08
**Status:** Research In Progress
**Next Review:** After Mississippi completion
**Priority:** HIGH (Critical for foreclosure lead generation)
