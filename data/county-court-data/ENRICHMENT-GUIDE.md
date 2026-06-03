# County Court Data Enrichment Guide - Batch D

## Project Status

**File Location:** `/mnt/c/Users/flowc/Documents/foreclosure-leads-app/data/county-court-data/enriched-batch-D.json`

**Progress:**
- Michigan: ~15% complete (14 of 83 counties with fax/phone data)
- Minnesota: ~8% complete (5 of 87 counties with fax/phone data)
- Missouri: ~20% complete (25 of 115 counties with fax/phone data)
- Mississippi: ~30% complete (25 of 82 counties with fax/phone data)
- Indiana: ~35% complete (32 of 92 counties with fax/phone data)

**Total: ~20% complete (121 of 459 counties)**

## Research Strategy by State

### Michigan (83 counties, 57 circuits)
**Primary Resources:**
1. **Michigan Court Directory** - https://www.courts.michigan.gov/trial-court-directory/
2. **Michigan Association of County Clerks** - https://michigancountyclerks.us/contact/
3. **CourtReference.com** - https://www.courtreference.com/ (search Michigan courts by county)
4. **MiFILE** - https://mifile.courts.michigan.gov/ (e-filing system)
5. **Individual County Websites** - Each county has a government website with circuit court contact info

**Search Pattern:**
```
"[County Name] County Michigan circuit court clerk" phone fax
OR
"[County Name] Michigan courthouse" contact directory
```

**Known Data Points:**
- Alcona: (989) 724-9410, fax (989) 724-9411
- Antrim: (231) 533-6353, fax (231) 533-6935
- Berrien: (269) 982-0392, fax (269) 982-8643

### Minnesota (87 counties)
**Primary Resources:**
1. **Minnesota Judicial Branch** - https://mncourts.gov/find-courts/district-courts
2. **Minnesota Court Finder** - https://mncourts.gov/find-courts/district-finder
3. **eFS Minnesota** - https://efilemn.tylertech.cloud/OfsEfsp (e-filing system)
4. **Minnesota Historical Society** - https://libguides.mnhs.org/courtrecords/district
5. **Individual County Court Administration Offices**

**Search Pattern:**
```
"[County Name] County Minnesota" district court administration phone fax
OR
"[County Name] Minnesota courthouse clerk" contact
```

**Known Data Points:**
- Aitkin: (218) 927-7350, fax (218) 927-4535
- Anoka: (763) 760-6700, fax (763) 712-3247
- Becker: (218) 846-5040, fax (218) 847-7620
- Beltrami: (218) 333-4120, fax (218) 333-4209

### Missouri (115 counties + St. Louis City)
**Primary Resources:**
1. **Missouri Courts** - https://www.courts.mo.gov/page.jsp?id=321
2. **Missouri Judicial Circuit Websites** - 46 judicial circuits organized by region
3. **Missouri eFiling** - https://www.courts.mo.gov/ecf/logon.do
4. **Missouri Secretary of State** - https://sos.mo.gov/ (maintains clerk directory)
5. **Individual County Websites** - Each county clerk office has web presence

**Search Pattern:**
```
"[County Name] County Missouri circuit clerk" phone fax
OR
"[County Name] Missouri courthouse" circuit court contact
OR
site:courts.mo.gov "[County Name]"
```

**Known Data Points:**
- Adair: (660) 665-2552, fax (660) 665-3420
- Andrew: (816) 324-3921, fax (816) 324-3191
- Audrain: (573) 473-5840, fax (573) 581-3237
- Callaway: (573) 642-0780, fax (573) 642-0700

### Mississippi (82 counties)
**Primary Resources:**
1. **Mississippi Chancery Clerks Association** - https://www.mschca.org/directory/ (BEST RESOURCE)
2. **Mississippi Courts** - https://courts.ms.gov/trialcourts/chancerycourt/chancerycourt.php
3. **MEC (Mississippi Electronic Courts)** - https://www.pamecapps.mec.ms.gov/onlinereg/
4. **Mississippi Secretary of State** - https://www.sos.ms.gov/
5. **Individual County Websites** - Most counties have online chancery clerk info

**Search Pattern:**
```
"[County Name] County Mississippi chancery clerk" phone fax
OR
site:mschca.org "[County Name]"
```

**BEST APPROACH:** Visit https://www.mschca.org/directory/ directly - this is the official statewide directory with all 82 counties.

**Known Data Points:**
- Amite: (601) 657-8022, fax (601) 657-8288
- Bolivar: (662) 759-3762, fax (662) 759-3467
- Calhoun: (662) 412-3117, fax (662) 412-3128
- Carroll: (662) 237-9274, fax (662) 237-9642

### Indiana (92 counties)
**Primary Resources:**
1. **Indiana Judicial Branch** - https://www.in.gov/courts/directory/
2. **ACCCIND** - https://acccind.org/indiana-clerks/ (Association of Clerks of Circuit Courts)
3. **Indiana Court Directory PDF** - https://www.in.gov/courts/files/court-directory.pdf
4. **Odyssey/INfile** - https://efile.incourts.gov/ (e-filing system)
5. **Indiana State Archives** - https://www.in.gov/iara/divisions/state-archives/collections/clerks-of-the-circuit-court-address-list/

**Search Pattern:**
```
"[County Name] County Indiana clerk" circuit court phone fax
OR
site:acccind.org "[County Name]"
```

**Known Data Points:**
- Adams: (260) 724-2600, fax (260) 724-3848
- Allen: (260) 449-7424, fax (260) 428-7929
- Bartholomew: (812) 379-1600, fax (812) 379-1675
- Dearborn: (812) 537-8867, fax (812) 532-2021

## Data Collection Methods

### Method 1: Direct Website Search (Fastest for 1-2 counties)
1. Go to state court directory
2. Search or browse for county
3. Click through to county court website
4. Find clerk office contact page
5. Copy phone, fax, website, e-filing URL

### Method 2: Google Search (Medium Speed, 5-10 counties)
```
"[County Name] County" "[State]" circuit/chancery clerk phone fax site:.gov
```

### Method 3: County Government Websites (Medium Speed)
1. Search "[County Name] County [State] government"
2. Navigate to Circuit Court or Clerk's Office
3. Extract contact information
4. Look for e-filing procedures page

### Method 4: State Court Administrator (Slowest, Best for Missing Data)
Call or email state judicial administration office:
- **Michigan:** State Court Administrative Office
- **Minnesota:** Minnesota Judicial Branch Administration
- **Missouri:** Missouri Court Administration
- **Mississippi:** Mississippi Chancery Clerks Association (MSCHCA)
- **Indiana:** Office of Judicial Administration

## County-Specific E-Filing URLs

**Important Note:** E-filing URLs are often county-specific, even though states have statewide systems. Look for:
- County-specific access portals
- Links on county courthouse websites
- County-specific rules pages on state court sites

### Michigan (MiFILE)
- Statewide: https://mifile.courts.michigan.gov/
- Some counties may have local implementation guides

### Minnesota (eFS Minnesota)
- Statewide: https://efilemn.tylertech.cloud/OfsEfsp
- District-specific access via: https://mncourts.gov/find-courts/

### Missouri (Missouri eFiling)
- Statewide: https://www.courts.mo.gov/ecf/logon.do
- Circuit-specific details at: https://www.courts.mo.gov/

### Mississippi (MEC)
- Statewide: https://www.pamecapps.mec.ms.gov/onlinereg/
- See MEC directory for county-specific guidance

### Indiana (Odyssey/INfile)
- Statewide: https://efile.incourts.gov/
- County-specific info at: https://www.in.gov/courts/directory/

## Critical Data Fields

### 1. Fax Number (HIGHEST PRIORITY)
- This is the most challenging data to find
- Check:
  - County websites (often in "Contact Us" sections)
  - State court directories
  - Bar association resources
  - Yellow Pages archives
  - Court forms headers (often have fax numbers)

### 2. Phone Number (HIGH PRIORITY)
- Easier to find than fax
- Usually on county government websites
- State court directories often have this

### 3. Clerk Website URL (MEDIUM PRIORITY)
- Link to dedicated clerk office page
- Not the general courthouse info page
- Usually at: county[name].gov/clerk or county[name].gov/circuit-court

### 4. E-filing URL (MEDIUM PRIORITY)
- County-specific or district-specific access
- Often on clerk's office website
- May be in local rules documents

### 5. Physical Address (LOW PRIORITY)
- Courthouse address
- Clerk office mailing address
- Usually available but less critical

## Completion Checklist

For EACH county, verify:
- [ ] County name matches (no duplicates, correct spelling)
- [ ] Phone number (format: (XXX) XXX-XXXX)
- [ ] Fax number (format: (XXX) XXX-XXXX)
- [ ] Clerk website URL (starts with http/https)
- [ ] E-filing URL (empty string if not found, not statewide URL)
- [ ] Physical address (full street address, city, state, ZIP)

## Sources for Additional Research

### Second-Tier Resources:
1. **CourtReference.com** - Aggregates court info by county
   - Format: https://www.courtreference.com/[County]-County-[State]-Courts.htm

2. **TheCourts.net** - Court directory aggregator
   - Search by state and county

3. **The Court Direct** - Specific county court information

4. **Claims Pages** - Courthouse directories
   - Format: https://www.claimspages.com/tools/courthouses/[state]/[county]/

5. **County Legal Forms Sites**
   - Example: https://www.indiana-legalforms.com/indiana-courts

### Contact Methods for Missing Data:
1. Call county clerk's office directly
2. Email county government general inbox
3. File public records requests
4. Contact state judicial administration
5. Ask bar associations (county bar associations)

## Estimated Completion Time

- **Full manual research:** 40-60 hours (460 counties @ 5 min average)
- **Using automated approaches:** Could be reduced to 15-20 hours
- **Semi-automated (scripted web scraping):** Recommended for next phase

## JSON Structure Reference

```json
{
  "county_name": "String",
  "clerk_website": "URL string or empty string",
  "efiling_url": "URL string or empty string (NOT statewide URL)",
  "phone": "(XXX) XXX-XXXX or empty string",
  "fax": "(XXX) XXX-XXXX or empty string",
  "address": "Full street address or empty string"
}
```

## Quality Assurance Rules

1. **Never make up data** - Empty string only if not found
2. **No statewide URLs as county e-filing** - Each county should have specific access
3. **All 459 counties must be listed** - Even if all fields empty
4. **Consistent formatting** - Phone/fax in (XXX) XXX-XXXX format
5. **Verify one source minimum** - Don't copy from other incomplete databases

## Next Steps

1. **Pick one state to complete first** - Recommend Mississippi (smallest, MSCHCA has complete directory)
2. **Use the ACCCIND/MSCHCA associations** - These have the most complete data
3. **Cross-reference with state court websites** - Verify data accuracy
4. **Create county-specific search log** - Track which counties researched
5. **Build automated scraper** (optional) - For remaining states after manual sample

## Helpful Tools

- **Google Sheets** - Create a working copy for tracking progress
- **Notion/Obsidian** - Document research by county
- **Web scraper tools** - Playwright, BeautifulSoup, Selenium
- **Phone/Fax validators** - Verify format before saving
- **URL validators** - Check that URLs are active/valid

---

**File Location:** `/mnt/c/Users/flowc/Documents/foreclosure-leads-app/data/county-court-data/enriched-batch-D.json`

Last Updated: 2026-02-08
Research Status: In Progress
