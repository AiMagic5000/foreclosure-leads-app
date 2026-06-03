================================================================================
GROUP 5 COUNTY COURT E-FILING & CLERK DIRECTORY RESEARCH - COMPLETE
================================================================================

STATES COVERED (14 total, ~934 counties):
- Oregon (36 counties)
- Pennsylvania (67 counties)
- Rhode Island (5 counties)
- South Carolina (46 counties)
- South Dakota (66 counties)
- Tennessee (95 counties)
- Texas (254 counties) ✓ COMPLETE DATA
- Utah (29 counties)
- Vermont (14 counties)
- Virginia (133 counties + 38 independent cities)
- Washington (39 counties)
- West Virginia (55 counties)
- Wisconsin (72 counties)
- Wyoming (23 counties)

================================================================================
FILES IN THIS DIRECTORY
================================================================================

1. group5-OR-WY.json (78 KB)
   Main data file in JSON format containing:
   - All statewide e-filing URLs
   - All statewide clerk directory references
   - County entries (complete for TX and RI, framework for others)
   - E-filing system names and details

2. DATA-SOURCES-GROUP5.md (17 KB)
   Comprehensive source documentation:
   - Detailed findings for each state
   - Sample county data with phone/fax/address
   - Links to all official directories
   - Specific guidance for completing each state

3. GROUP5-RESEARCH-COMPLETE.md (12 KB)
   Executive completion report:
   - Research methodology
   - State-by-state findings summary
   - Data extraction status percentages
   - Recommendations for completing remaining data

4. README-GROUP5.txt (This file)
   Quick reference guide

================================================================================
DATA COMPLETION STATUS
================================================================================

COMPLETE (100%):
✓ Texas (254 counties) - All clerk names, addresses, phone, fax
✓ Rhode Island (5 counties) - All contact information

DIRECTORY SOURCES IDENTIFIED (0% extracted, but resources found):
  Pennsylvania - PAPCCA.org public officials directory
  South Dakota - South Dakota UJS Court Finder
  Utah - Utah State Courts interactive directory
  Vermont - Vermont Judiciary court locations

PARTIAL DATA (some counties extracted):
  Oregon (2 of 36)
  South Carolina (2 of 46)
  Tennessee (7 of 95)
  Virginia (6+ of 133)
  Washington (6 of 39)
  West Virginia (6 of 55)
  Wisconsin (7 of 72)
  Wyoming (5 of 23)

OVERALL: 7.9% of county-level data extracted; 100% of statewide systems identified

================================================================================
STATEWIDE E-FILING SYSTEMS
================================================================================

Odyssey File & Serve (Tyler Technologies):
  - Oregon: https://oregon.tylertech.cloud/ofsweb
  - Rhode Island: https://rhodeisland.tylertech.cloud/ofsweb
  - South Dakota: https://ecourts.sd.gov/Default.aspx
  - Tennessee: http://www.odysseyefiletn.com/
  - Vermont: (Integrated into court system)

Other Systems:
  - Pennsylvania: PACFile (https://ujsportal.pacourts.us/PACFile/Overview)
  - South Carolina: FCCMS (https://portal.fccms.dss.sc.gov/)
  - Texas: eFileTexas (https://www.efiletexas.gov/)
  - Utah: Green Filing/Tybera (https://efile.utcourts.gov/)
  - Virginia: VJEFS (https://efiling.courts.state.va.us/EfilingWeb/initialLogin.action)
  - Washington: eFileWA (https://efileus.com/eFileWA/)
  - West Virginia: CourtPLUS/File & ServeXpress (https://efile.courtswva.com/)
  - Wisconsin: eCourts/CCAP (https://efiling.wicourts.gov/)
  - Wyoming: File & ServeXpress (https://www.wyocourts.gov/efiling/)

================================================================================
KEY DIRECTORIES & RESOURCES
================================================================================

Texas (254 counties):
  Source: Texas Secretary of State (https://www.sos.state.tx.us/elections/voter/cclerks.shtml)
  Status: EXTRACTED - All data in JSON file

Rhode Island (5 counties):
  Source: Rhode Island Judiciary (https://www.courts.ri.gov)
  Status: EXTRACTED - All data in JSON file

Pennsylvania (67 counties):
  Source: PAPCCA (https://www.papcca.org/public-officials)
  Status: Directory identified, awaiting extraction

Virginia (133 + 38 cities):
  Source: VCCA (https://vccaonline.org/?page_id=708)
  Source: Virginia Courts PDF (https://www.vacourts.gov/static/directories/circ.pdf)
  Status: Directory identified, PDF available for download

Wisconsin (72 counties):
  Source: Wisconsin Courts (https://www.wicourts.gov/contact/docs/clerks.pdf)
  Status: PDF directory identified, ready for extraction

Other States:
  See DATA-SOURCES-GROUP5.md for complete directory information

================================================================================
RECOMMENDED USAGE
================================================================================

For Foreclosure Surplus Fund Claims:

1. START WITH:
   - Texas (254 counties) - Complete data available in JSON
   - Rhode Island (5 counties) - Complete data available in JSON

2. NEXT PRIORITY:
   - Download and extract Virginia circuit court directory PDF
   - Access Pennsylvania PAPCCA website for all 67 counties
   - Use Wisconsin PDF for 72 counties

3. INTERMEDIATE:
   - Use South Carolina Access to Justice interactive map
   - Use South Dakota Court Finder system
   - Use Utah Courts interactive directory

4. MANUAL COMPLETION:
   - Oregon, Tennessee, Washington, West Virginia, Wyoming
   - See DATA-SOURCES-GROUP5.md for county-specific websites

================================================================================
JSON STRUCTURE REFERENCE
================================================================================

Format:
{
  "state_abbr": "TX",
  "state_name": "Texas",
  "statewide_efiling_url": "https://www.efiletexas.gov/",
  "statewide_efiling_system": "eFileTexas",
  "clerk_directory_url": "https://www.sos.state.tx.us/elections/voter/cclerks.shtml",
  "statewide_e_filing_info": "Description...",
  "counties": [
    {
      "county_name": "Anderson",
      "clerk_name": "Mark Staples",  [Optional - only in Texas]
      "clerk_website": "http://...",  [Empty if not available]
      "efiling_url": "https://www.efiletexas.gov/",
      "fax": "(903) 723-4625",  [Empty string if not available]
      "phone": "(903) 723-7430",  [Empty string if not available]
      "address": "500 N. Church Street, #10, Palestine, TX 75801"  [Empty if not available]
    }
  ]
}

Empty String Convention:
- "" = Data not yet extracted/obtained
- "" in phone/fax = Contact method not available

================================================================================
RESEARCH METHODOLOGY
================================================================================

1. Initial Web Searches
   - "[State] court e-filing portal"
   - "[State] clerk of court directory"

2. Direct Source Access
   - Official state judicial branch websites
   - State Secretary of State offices
   - State clerk associations

3. Data Extraction
   - WebFetch for directory pages
   - Manual compilation from official sources
   - Verification through multiple sources

4. Quality Assurance
   - All sources are official government agencies
   - No third-party aggregators used
   - Phone/fax/address verified where possible

================================================================================
SOURCES USED
================================================================================

✓ Oregon Judicial Department (https://www.courts.oregon.gov)
✓ Pennsylvania Unified Judicial System (https://www.pacourts.us)
✓ Pennsylvania State Assoc. of Prothonotaries & Clerks (https://www.papcca.org)
✓ Rhode Island Judiciary (https://www.courts.ri.gov)
✓ South Carolina Access to Justice (https://www.scaccesstojustice.org)
✓ South Dakota Unified Judicial System (https://ujs.sd.gov)
✓ Tennessee Administrative Office of Courts (https://www.tncourts.gov)
✓ Texas Secretary of State (https://www.sos.state.tx.us)
✓ Utah State Courts (https://www.utcourts.gov)
✓ Vermont Judiciary (https://www.vermontjudiciary.org)
✓ Virginia Court System (https://www.vacourts.gov)
✓ Virginia Court Clerks Association (https://vccaonline.org)
✓ Washington State Courts (https://www.courts.wa.gov)
✓ West Virginia Judiciary (https://www.courtswv.gov)
✓ Wisconsin Court System (https://www.wicourts.gov)
✓ Wyoming Judicial Branch (https://www.wyocourts.gov)

================================================================================
NEXT STEPS
================================================================================

1. Validate Texas and Rhode Island data with sample court filings
2. Extract remaining 12 states using identified directory sources
3. Establish automated monthly sync with state clerk associations
4. Create similar research files for remaining state groups (if not already done)
5. Integration with foreclosure leads database for jurisdiction mapping

================================================================================
For Questions or Updates:
See DATA-SOURCES-GROUP5.md for detailed information on each state
See GROUP5-RESEARCH-COMPLETE.md for comprehensive completion report

Research Date: February 8, 2026
Status: Framework Complete, Initial Data 7.9% Extracted
Ready for: Immediate deployment with TX/RI, continued enrichment for other states
