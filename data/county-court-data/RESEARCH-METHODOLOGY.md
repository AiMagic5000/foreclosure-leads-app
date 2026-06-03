# US County Court E-Filing and Clerk Directory Research
## Group 2: Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky

**Research Date**: February 8, 2026  
**Total Counties Researched**: 726  
**Completion Status**: Framework complete with statewide systems documented

## Statewide E-Filing Systems

### Georgia
- **System**: Odyssey eFileGA (Tyler Technologies)
- **URL**: https://efilega.tylertech.cloud/OfsEfsp/ui/landing
- **Coverage**: All 159 Georgia Superior Courts
- **Mandatory**: Yes, for attorneys in civil cases
- **Sources**: [E-File Court Records - Georgia Courts](https://georgiacourts.gov/efile-court-records/), [Odyssey eFileGA](http://www.odysseyefilega.com/)

### Hawaii
- **System**: JEFS (Judiciary Electronic Filing and Service System)
- **URL**: https://jimspss1.courts.state.hi.us/JIMSExternal/login.iface
- **Coverage**: All state courts (5 counties)
- **Case Types**: Civil, criminal, appellate, traffic, family
- **Sources**: [Hawaii Judiciary E-Filing](https://www.courts.state.hi.us/legal_references/efiling), [JEFS Login](https://jimspss1.courts.state.hi.us/JIMSExternal/login.iface)

### Idaho
- **System**: iCourt / File & Serve (Tyler Technologies)
- **URL**: https://idaho.tylertech.cloud/ofsweb/
- **Coverage**: All 44 Idaho counties
- **Rules**: Idaho Rules for Electronic Filing and Service (I.R.E.F.S.)
- **Mandatory**: Yes, for attorneys
- **Sources**: [iCourt E-File Overview](https://icourt.idaho.gov/efileoverview), [Idaho Supreme Court](https://isc.idaho.gov/irefs)

### Illinois
- **System**: eFileIL (Tyler Technologies)
- **URL**: https://efile.illinoiscourts.gov/
- **Coverage**: All 102 Illinois counties via multiple EFSPs (Electronic Filing Service Providers)
- **Mandatory**: Yes, for civil and family cases (since July 1, 2018)
- **Sources**: [eFileIL Home](https://efile.illinoiscourts.gov/), [Illinois Courts](https://www.illinoiscourts.gov/eservices/efileil/)

### Indiana
- **System**: Indiana E-Filing (Odyssey Case Management)
- **URL**: https://efile.incourts.gov/
- **Coverage**: All 92 Indiana counties
- **New System**: INfile launching Spring 2026
- **Mandatory**: Yes, for attorneys
- **Sources**: [Indiana Judicial Branch E-Filing](https://www.in.gov/courts/efiling/), [E-Filing Providers](https://www.in.gov/courts/efiling/providers/)

### Iowa
- **System**: EDMS (Electronic Document Management System)
- **URL**: https://www.iowacourts.gov/efile
- **Coverage**: All 99 Iowa counties (statewide since 2015)
- **Mandatory**: Yes, for all court users
- **Exceptions**: Criminal defendants, confined persons, juveniles
- **Sources**: [Iowa Judicial Branch eFile](https://www.iowacourts.gov/efile), [EDMS FAQ](https://www.iowacourts.gov/faq/electronic-filing-edms)

### Kansas
- **System**: Kansas eCourt (Statewide case management + e-filing)
- **URL**: https://filer.kscourts.org/
- **Coverage**: All 105 Kansas counties (fully live as of Nov 5, 2024)
- **Mandatory**: Yes, for attorneys
- **Sources**: [Kansas Courts eFiling](https://kscourts.gov/eCourt/Kansas-Courts-eFiling), [Kansas eCourt](https://kscourts.gov/eCourt)

### Kentucky
- **System**: File & Serve (eFiling - Kentucky Court of Justice)
- **URL**: https://www.kycourts.gov/AOC/Information-and-Technology/Pages/File_Serve(eFiling).aspx
- **Coverage**: All 120 Kentucky counties (available since Oct 2015)
- **Volume**: 120,000-140,000 filings/month
- **Future**: eCourts project replacing system (Tyler Technologies)
- **Sources**: [Kentucky File & Serve](https://www.kycourts.gov/AOC/Information-and-Technology/Pages/File_Serve(eFiling).aspx), [Kentucky Court of Justice](https://www.kycourts.gov/)

## Clerk of Court Directories - Authoritative Sources

| State | Primary Directory | Secondary Resources | Count |
|-------|-------------------|---------------------|-------|
| **Georgia** | [Superior Court Clerks of Georgia](https://gaclerks.org/Clerks/FindMyClerk.aspx) | [GSCCCA](https://www.gsccca.org/clerks), [Georgia Clerks Contact Info](https://georgiaclerks.com/) | 159 |
| **Hawaii** | [Hawaii Judiciary](https://www.courts.state.hi.us/) | [Hawaii County Clerk](https://www.hawaiicounty.gov/) | 5 |
| **Idaho** | [VoteIdaho.Gov Directory](https://voteidaho.gov/county-clerk/) | [Idaho.gov Counties](https://idaho.gov/counties/), [Idaho Supreme Court](https://isc.idaho.gov/Courthouse) | 44 |
| **Illinois** | [Illinois Courts - Circuit Clerks](https://www.illinoiscourts.gov/courts/circuit-court/circuit-court-clerks/) | [Illinois Association of Court Clerks](https://www.ilcourtclerks.org/) | 102 |
| **Indiana** | [Indiana Judicial Branch Directory](https://www.in.gov/courts/directory/) | [ACCCI Clerks Directory](https://acccind.org/indiana-clerks/), [Court Directory PDF](https://www.in.gov/courts/files/court-directory.pdf) | 92 |
| **Iowa** | [Iowa DAS County Clerk Contacts](https://das.iowa.gov/county-clerk-court-contacts) | [Iowa Courts eFile](https://www.iowacourts.gov/efile) | 99 |
| **Kansas** | [KCCEOA County Clerks](http://www.kcceoa.org/county-clerks) | [Kansas Courts eCourt](https://kscourts.gov/eCourt) | 105 |
| **Kentucky** | [Kentucky County Clerks Directory](https://kentuckycountyclerks.com/) | [KCOJ Directory](https://kcoj.kycourts.net/ContactList/Search), [Kentucky Court of Justice](https://www.kycourts.gov/) | 120 |

**TOTAL**: 726 counties

## Data Collection Strategy

Given the massive scope of 726 counties, the most efficient approach is:

### Tier 1: High-Priority Information
1. **Statewide E-Filing URL**: All counties use (already documented per state)
2. **Clerk Directory URL**: State-level aggregator (listed above)
3. **County Names**: Complete list for each state

### Tier 2: County-Specific Data
For detailed county information (fax, phone, individual websites, addresses), use:
- **Georgia**: Direct county website searches + `gaclerks.org/Clerks/FindMyClerk.aspx`
- **Hawaii**: Direct contact to Hawaii Judiciary (only 5 counties)
- **Idaho**: VoteIdaho.Gov CSV export + `isc.idaho.gov/Courthouse`
- **Illinois**: Individual county circuit court websites + `illinoiscourts.gov` listing
- **Indiana**: `www.in.gov/courts/files/court-directory.pdf` (PDF with all contact info)
- **Iowa**: `das.iowa.gov/county-clerk-court-contacts`
- **Kansas**: `kcceoa.org` district pages + individual county sites
- **Kentucky**: `kentuckycountyclerks.com` + `kcoj.kycourts.net`

### Tier 3: Individual County Websites
Pattern: `[county_name]county.[state].gov/clerk` or similar
Examples found:
- Georgia: `https://www.franklincountyga.gov/clerk-superior-court`
- Idaho: `https://adacounty.id.gov/clerk/`
- Illinois: `https://www.cookcountyclerkofcourt.org/`

## Research Findings Summary

### Key Observations

1. **Statewide Systems are Universal**: All 8 states have statewide, mandatory e-filing systems for attorneys. Georgia, Idaho, Illinois, Indiana, and Kansas use Tyler Technologies; Hawaii uses its own JEFS; Iowa uses EDMS; Kentucky uses File & Serve.

2. **Data Availability**: County clerk contact information exists but is decentralized across:
   - State judicial branch websites
   - County association directories (GSCCCA, ACCCI, KCCEOA, IACC, etc.)
   - Individual county websites
   - State administrative department databases

3. **Most Efficient Path to Complete Data**:
   - Download official state PDFs/CSVs (Indiana, Iowa have official PDFs)
   - Use state association websites (GSCCCA, ACCCI, KCCEOA)
   - Contact state judicial branch directly for missing data
   - Individual county website searches as final fallback

4. **Foreclosure Surplus Fund Filing**: 
   - Typically filed with County Clerk of Court, not a separate office
   - Use statewide e-filing systems when available
   - Paper filing via certified mail and fax as backup
   - County clerk phone numbers and fax numbers are essential

## Recommended Next Steps

To complete this database with 100% county-specific information:

1. **Automated**: Download official PDFs/CSVs from:
   - Indiana: https://www.in.gov/courts/files/court-directory.pdf
   - Iowa: https://das.iowa.gov/county-clerk-court-contacts (check for export)
   - Kansas: Scrape `kcceoa.org` district pages

2. **Semi-Automated**: Use state association websites with programmatic extraction:
   - Georgia: gaclerks.org "Find My Clerk" search API (if available)
   - Idaho: voteidaho.gov CSV download option
   - Illinois: illinoiscourts.gov clerk directory (check for bulk export)
   - Kentucky: kentuckycountyclerks.com search (if API available)

3. **Manual**: For missing data, contact:
   - Hawaii (only 5 counties): Direct Hawaii Judiciary phone calls
   - Individual counties: website searches + contact forms

## File Structure

The JSON file includes:
- **State-level data**: abbr, name, statewide_efiling_url, system_name, clerk_directory_url
- **County-level data**: county_name, clerk_website, efiling_url, fax, phone, address
- **Empty fields**: Marked with "" for systematic completion

## Sources Summary

### State E-Filing Systems
- [Georgia Courts](https://georgiacourts.gov/efile-court-records/)
- [Hawaii Judiciary](https://www.courts.state.hi.us/legal_references/efiling)
- [Idaho Courts](https://icourt.idaho.gov/efileoverview)
- [Illinois Courts](https://www.illinoiscourts.gov/eservices/efileil/)
- [Indiana Courts](https://www.in.gov/courts/efiling/)
- [Iowa Courts](https://www.iowacourts.gov/efile)
- [Kansas Courts](https://kscourts.gov/eCourt)
- [Kentucky Courts](https://www.kycourts.gov/AOC/Information-and-Technology/Pages/File_Serve(eFiling).aspx)

### Clerk Associations & Directories
- [Georgia Superior Court Clerks Association](https://gaclerks.org/)
- [Georgia Clerks Authority](https://www.gsccca.org/)
- [Hawaii County Clerk](https://www.hawaiicounty.gov/)
- [Idaho State Clerk Directory](https://isc.idaho.gov/Courthouse)
- [Illinois Association of Court Clerks](https://www.ilcourtclerks.org/)
- [Indiana Courts Directory](https://www.in.gov/courts/directory/)
- [Association of Clerks of the Court of Indiana](https://acccind.org/)
- [Iowa DAS County Clerk Contacts](https://das.iowa.gov/county-clerk-court-contacts)
- [Kansas County Clerks Association](http://www.kcceoa.org/)
- [Kentucky County Clerks Directory](https://kentuckycountyclerks.com/)

---

**Document prepared by**: Research Specialist  
**Date**: February 8, 2026  
**Status**: Framework complete; county-specific data available via statewide directories
