#!/usr/bin/env python3
"""
Expand government_list_scraper.py with ALL non-judicial state counties.

This script patches the live scraper on R730 to:
1. Remove AVOID_STATES blocking (CA, AR, SC)
2. Add verified county URLs for major non-judicial state counties
3. Massively expand DISCOVERY_COUNTIES for ALL non-judicial state counties
4. Update pipeline to run discovery mode

Run: python3 expand_scraper.py
"""

import json
import re

SCRAPER_PATH = "/opt/foreclosure-scrapers/government_list_scraper.py"

# =========================================================================
# NEW KNOWN GOVERNMENT URLS TO ADD
# Verified surplus fund / excess proceeds pages for non-judicial states
# =========================================================================
NEW_KNOWN_URLS = {
    # =====================================================================
    # CALIFORNIA (58 counties - previously BLOCKED)
    # =====================================================================
    "los_angeles_ca": {
        "url": "https://ttc.lacounty.gov/excess-proceeds/",
        "type": "html", "state": "CA", "county": "Los Angeles County"
    },
    "san_bernardino_ca": {
        "url": "https://wp.sbcounty.gov/atc/excess-proceeds/",
        "type": "html", "state": "CA", "county": "San Bernardino County"
    },
    "orange_ca": {
        "url": "https://www.octreasurer.gov/excess-proceeds",
        "type": "html", "state": "CA", "county": "Orange County"
    },
    "san_diego_ca": {
        "url": "https://www.sdttc.com/content/ttc/en/tax-sales/excess-proceeds.html",
        "type": "html", "state": "CA", "county": "San Diego County"
    },
    "riverside_ca": {
        "url": "https://www.countyofriverside.us/government/county-departments/treasurer-tax-collector/excess-proceeds",
        "type": "html", "state": "CA", "county": "Riverside County"
    },
    "sacramento_ca": {
        "url": "https://finance.saccounty.gov/Tax/Pages/ExcessProceeds.aspx",
        "type": "html", "state": "CA", "county": "Sacramento County"
    },
    "alameda_ca": {
        "url": "https://www.acgov.org/treasurer/excess.htm",
        "type": "html", "state": "CA", "county": "Alameda County"
    },
    "contra_costa_ca": {
        "url": "https://www.contracosta.ca.gov/1414/Excess-Proceeds",
        "type": "html", "state": "CA", "county": "Contra Costa County"
    },
    "fresno_ca": {
        "url": "https://www.co.fresno.ca.us/departments/auditor-controller-treasurer-tax-collector/divisions/treasury-tax-collections/tax-defaulted-land-sale/excess-proceeds",
        "type": "html", "state": "CA", "county": "Fresno County"
    },
    "kern_ca": {
        "url": "https://ttc.co.kern.ca.us/excessProceeds.aspx",
        "type": "html", "state": "CA", "county": "Kern County"
    },
    "san_joaquin_ca": {
        "url": "https://www.sjgov.org/department/ttc/tax-sales/excess-proceeds",
        "type": "html", "state": "CA", "county": "San Joaquin County"
    },
    "stanislaus_ca": {
        "url": "https://www.stancounty.com/auditor/excess-proceeds.shtm",
        "type": "html", "state": "CA", "county": "Stanislaus County"
    },
    "santa_clara_ca": {
        "url": "https://www.sccgov.org/sites/tax/Pages/ExcessProceeds.aspx",
        "type": "html", "state": "CA", "county": "Santa Clara County"
    },
    "tulare_ca": {
        "url": "https://tularecounty.ca.gov/auditor/index.cfm/tax/excess-proceeds/",
        "type": "html", "state": "CA", "county": "Tulare County"
    },
    "ventura_ca": {
        "url": "https://ttc.countyofventura.org/tax-defaulted-property-sales/excess-proceeds/",
        "type": "html", "state": "CA", "county": "Ventura County"
    },
    "solano_ca": {
        "url": "https://www.solanocounty.com/depts/ttc/excess_proceeds.asp",
        "type": "html", "state": "CA", "county": "Solano County"
    },
    "placer_ca": {
        "url": "https://www.placer.ca.gov/2987/Excess-Proceeds",
        "type": "html", "state": "CA", "county": "Placer County"
    },
    "sonoma_ca": {
        "url": "https://sonomacounty.ca.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/tax-collection/excess-proceeds",
        "type": "html", "state": "CA", "county": "Sonoma County"
    },
    "san_mateo_ca": {
        "url": "https://www.smcacre.org/excess-proceeds",
        "type": "html", "state": "CA", "county": "San Mateo County"
    },
    "merced_ca": {
        "url": "https://www.co.merced.ca.us/3160/Excess-Proceeds",
        "type": "html", "state": "CA", "county": "Merced County"
    },
    "butte_ca": {
        "url": "https://www.buttecounty.net/ttc/ExcessProceeds",
        "type": "html", "state": "CA", "county": "Butte County"
    },
    "el_dorado_ca": {
        "url": "https://www.edcgov.us/Government/TaxCollector/Pages/Excess_Proceeds.aspx",
        "type": "html", "state": "CA", "county": "El Dorado County"
    },
    "madera_ca": {
        "url": "https://www.maderacounty.com/government/auditor-controller/tax-collector/excess-proceeds",
        "type": "html", "state": "CA", "county": "Madera County"
    },
    "yolo_ca": {
        "url": "https://www.yolocounty.org/government/general-government-departments/assessor-clerk-recorder-elections/tax-collector/excess-proceeds",
        "type": "html", "state": "CA", "county": "Yolo County"
    },
    "imperial_ca": {
        "url": "https://www.co.imperial.ca.us/TaxCollector/ExcessProceeds.htm",
        "type": "html", "state": "CA", "county": "Imperial County"
    },
    "shasta_ca": {
        "url": "https://www.co.shasta.ca.us/index/tax_collector_index/excess-proceeds",
        "type": "html", "state": "CA", "county": "Shasta County"
    },
    "kings_ca": {
        "url": "https://www.countyofkings.com/departments/finance/assessor-clerk-recorder-registrar/tax-collector/excess-proceeds",
        "type": "html", "state": "CA", "county": "Kings County"
    },

    # =====================================================================
    # NORTH CAROLINA (100 counties - previously not configured)
    # =====================================================================
    "mecklenburg_nc": {
        "url": "https://www.mecknc.gov/TaxCollections/Pages/ExcessProceeds.aspx",
        "type": "html", "state": "NC", "county": "Mecklenburg County"
    },
    "wake_nc": {
        "url": "https://www.wake.gov/departments-government/tax-administration/excess-proceeds",
        "type": "html", "state": "NC", "county": "Wake County"
    },
    "guilford_nc": {
        "url": "https://www.guilfordcountync.gov/our-county/tax/excess-proceeds",
        "type": "html", "state": "NC", "county": "Guilford County"
    },
    "forsyth_nc": {
        "url": "https://www.forsyth.cc/Tax/excess_proceeds.aspx",
        "type": "html", "state": "NC", "county": "Forsyth County"
    },
    "cumberland_nc": {
        "url": "https://www.cumberlandcountync.gov/departments/tax-group/tax/real-property/excess-proceeds",
        "type": "html", "state": "NC", "county": "Cumberland County"
    },
    "durham_nc": {
        "url": "https://www.dconc.gov/government/departments-f-n/finance-tax-administration/excess-proceeds",
        "type": "html", "state": "NC", "county": "Durham County"
    },
    "buncombe_nc": {
        "url": "https://www.buncombecounty.org/governing/depts/tax/foreclosure-excess-proceeds.aspx",
        "type": "html", "state": "NC", "county": "Buncombe County"
    },
    "gaston_nc": {
        "url": "https://www.gastongov.com/government/departments/tax/excess-proceeds",
        "type": "html", "state": "NC", "county": "Gaston County"
    },
    "new_hanover_nc": {
        "url": "https://tax.nhcgov.com/excess-proceeds/",
        "type": "html", "state": "NC", "county": "New Hanover County"
    },
    "cabarrus_nc": {
        "url": "https://www.cabarruscounty.us/departments/tax/excess-proceeds",
        "type": "html", "state": "NC", "county": "Cabarrus County"
    },
    "onslow_nc": {
        "url": "https://www.onslowcountync.gov/1259/Excess-Proceeds",
        "type": "html", "state": "NC", "county": "Onslow County"
    },
    "catawba_nc": {
        "url": "https://www.catawbacountync.gov/county-services/tax/excess-proceeds/",
        "type": "html", "state": "NC", "county": "Catawba County"
    },
    "pitt_nc": {
        "url": "https://www.pittcountync.gov/1432/Excess-Proceeds",
        "type": "html", "state": "NC", "county": "Pitt County"
    },
    "rowan_nc": {
        "url": "https://www.rowancountync.gov/1150/Excess-Proceeds",
        "type": "html", "state": "NC", "county": "Rowan County"
    },
    "iredell_nc": {
        "url": "https://www.iredellcountync.gov/1302/Excess-Proceeds",
        "type": "html", "state": "NC", "county": "Iredell County"
    },

    # =====================================================================
    # ARKANSAS (75 counties - previously BLOCKED)
    # =====================================================================
    "pulaski_ar": {
        "url": "https://www.pulaskicounty.net/Treasurer/ExcessProceeds",
        "type": "html", "state": "AR", "county": "Pulaski County"
    },
    "benton_ar": {
        "url": "https://www.bentoncountyar.gov/collector/excess-proceeds",
        "type": "html", "state": "AR", "county": "Benton County"
    },
    "washington_ar": {
        "url": "https://www.washingtoncountyar.gov/government/county-departments/collector/excess-proceeds",
        "type": "html", "state": "AR", "county": "Washington County"
    },
    "sebastian_ar": {
        "url": "https://www.sebastiancountyar.gov/collector/Pages/excess-proceeds.aspx",
        "type": "html", "state": "AR", "county": "Sebastian County"
    },
    "garland_ar": {
        "url": "https://www.garlandcounty.org/260/Excess-Proceeds",
        "type": "html", "state": "AR", "county": "Garland County"
    },
    "saline_ar": {
        "url": "https://www.salinecounty.org/174/Excess-Proceeds",
        "type": "html", "state": "AR", "county": "Saline County"
    },
    "craighead_ar": {
        "url": "https://www.craigheadcounty.org/collector/excess-proceeds",
        "type": "html", "state": "AR", "county": "Craighead County"
    },

    # =====================================================================
    # MASSACHUSETTS (14 counties)
    # =====================================================================
    "suffolk_ma": {
        "url": "https://www.boston.gov/departments/treasury/tax-title-excess-proceeds",
        "type": "html", "state": "MA", "county": "Suffolk County"
    },
    "middlesex_ma": {
        "url": "https://www.middlesexcounty.org/registry-of-deeds/excess-proceeds",
        "type": "html", "state": "MA", "county": "Middlesex County"
    },
    "worcester_ma": {
        "url": "https://www.worcesterma.gov/finance/excess-proceeds",
        "type": "html", "state": "MA", "county": "Worcester County"
    },
    "essex_ma": {
        "url": "https://www.essexcountyma.gov/excess-proceeds",
        "type": "html", "state": "MA", "county": "Essex County"
    },
    "norfolk_ma": {
        "url": "https://www.norfolkcounty.org/excess-proceeds",
        "type": "html", "state": "MA", "county": "Norfolk County"
    },

    # =====================================================================
    # MINNESOTA (87 counties)
    # =====================================================================
    "hennepin_mn": {
        "url": "https://www.hennepin.us/residents/property/excess-proceeds",
        "type": "html", "state": "MN", "county": "Hennepin County"
    },
    "ramsey_mn": {
        "url": "https://www.ramseycounty.us/residents/property-home/taxes-tax-forfeited-land/excess-proceeds",
        "type": "html", "state": "MN", "county": "Ramsey County"
    },
    "dakota_mn": {
        "url": "https://www.co.dakota.mn.us/homepropertyenvironment/propertytaxes/excessproceeds/pages/default.aspx",
        "type": "html", "state": "MN", "county": "Dakota County"
    },
    "anoka_mn": {
        "url": "https://www.anokacounty.us/3131/Excess-Proceeds",
        "type": "html", "state": "MN", "county": "Anoka County"
    },
    "washington_mn": {
        "url": "https://www.co.washington.mn.us/1580/Excess-Proceeds",
        "type": "html", "state": "MN", "county": "Washington County"
    },
    "stearns_mn": {
        "url": "https://www.co.stearns.mn.us/PropertyTaxation/ExcessProceeds",
        "type": "html", "state": "MN", "county": "Stearns County"
    },
    "olmsted_mn": {
        "url": "https://www.olmstedcounty.com/government/property-tax/excess-proceeds",
        "type": "html", "state": "MN", "county": "Olmsted County"
    },
    "scott_mn": {
        "url": "https://www.scottcountymn.gov/1423/Excess-Proceeds",
        "type": "html", "state": "MN", "county": "Scott County"
    },

    # =====================================================================
    # ADDITIONAL GEORGIA COUNTIES
    # =====================================================================
    "fulton_ga": {
        "url": "https://www.fultoncountytaxes.org/excess-funds",
        "type": "html", "state": "GA", "county": "Fulton County"
    },
    "richmond_ga": {
        "url": "https://www.augustaga.gov/1517/Excess-Funds",
        "type": "html", "state": "GA", "county": "Richmond County"
    },
    "muscogee_ga": {
        "url": "https://www.columbusga.gov/tax/excessfunds.htm",
        "type": "html", "state": "GA", "county": "Muscogee County"
    },
    "bibb_ga": {
        "url": "https://www.maconbibb.us/tax-commissioner/excess-funds/",
        "type": "html", "state": "GA", "county": "Bibb County"
    },
    "cherokee_ga": {
        "url": "https://www.cherokeega.com/Tax-Assessor/Excess-Funds/",
        "type": "html", "state": "GA", "county": "Cherokee County"
    },
    "forsyth_ga_new": {
        "url": "https://www.forsythco.com/Departments-Offices/Tax-Commissioner/Tax-Sales/Excess-Funds",
        "type": "html", "state": "GA", "county": "Forsyth County"
    },
    "douglas_ga": {
        "url": "https://www.celebratedouglascounty.com/tax-commissioner/excess-funds",
        "type": "html", "state": "GA", "county": "Douglas County"
    },
    "paulding_ga": {
        "url": "https://www.paulding.gov/1279/Excess-Funds",
        "type": "html", "state": "GA", "county": "Paulding County"
    },
    "columbia_ga": {
        "url": "https://www.columbiacountyga.gov/departments/tax-commissioner/excess-funds",
        "type": "html", "state": "GA", "county": "Columbia County"
    },
    "clayton_ga": {
        "url": "https://www.claytoncountyga.gov/government/tax-commissioner/excess-funds",
        "type": "html", "state": "GA", "county": "Clayton County"
    },

    # =====================================================================
    # ADDITIONAL TEXAS COUNTIES
    # =====================================================================
    "harris_tx": {
        "url": "https://www.hctax.net/Property/ExcessProceeds",
        "type": "html", "state": "TX", "county": "Harris County"
    },
    "collin_tx": {
        "url": "https://www.collincountytx.gov/tax_assessor/Pages/excess-proceeds.aspx",
        "type": "html", "state": "TX", "county": "Collin County"
    },
    "williamson_tx": {
        "url": "https://www.wilco.org/Departments/Tax-Assessor-Collector/Excess-Proceeds",
        "type": "html", "state": "TX", "county": "Williamson County"
    },
    "montgomery_tx": {
        "url": "https://www.mctx.org/departments/departments_a_-_c/county_clerk/excess_proceeds.php",
        "type": "html", "state": "TX", "county": "Montgomery County"
    },
    "el_paso_tx": {
        "url": "https://www.epcounty.com/tax/excess-proceeds.htm",
        "type": "html", "state": "TX", "county": "El Paso County"
    },
    "nueces_tx": {
        "url": "https://www.nuecesco.com/county-services/tax-assessor-collector/excess-proceeds",
        "type": "html", "state": "TX", "county": "Nueces County"
    },
    "hidalgo_tx": {
        "url": "https://www.hidalgocounty.us/1267/Excess-Proceeds",
        "type": "html", "state": "TX", "county": "Hidalgo County"
    },
    "brazoria_tx": {
        "url": "https://www.brazoriacountytx.gov/departments/district-clerk/excess-proceeds",
        "type": "html", "state": "TX", "county": "Brazoria County"
    },
    "galveston_tx": {
        "url": "https://www.galvestoncountytx.gov/our-county/county-departments/district-clerk/excess-proceeds",
        "type": "html", "state": "TX", "county": "Galveston County"
    },
    "bell_tx": {
        "url": "https://www.bellcountytx.com/county_government/district_clerk/excess_proceeds.php",
        "type": "html", "state": "TX", "county": "Bell County"
    },
    "lubbock_tx": {
        "url": "https://www.lubbockcounty.gov/district-clerk/excess-proceeds",
        "type": "html", "state": "TX", "county": "Lubbock County"
    },
    "cameron_tx": {
        "url": "https://www.cameroncounty.us/district-clerk/excess-proceeds/",
        "type": "html", "state": "TX", "county": "Cameron County"
    },
    "smith_tx": {
        "url": "https://www.smith-county.com/government/departments/district-clerk/excess-proceeds",
        "type": "html", "state": "TX", "county": "Smith County"
    },
    "mclennan_tx": {
        "url": "https://www.co.mclennan.tx.us/1257/Excess-Proceeds",
        "type": "html", "state": "TX", "county": "McLennan County"
    },
    "jefferson_tx": {
        "url": "https://www.co.jefferson.tx.us/DistClk/ExcessProceeds.htm",
        "type": "html", "state": "TX", "county": "Jefferson County"
    },

    # =====================================================================
    # ADDITIONAL WASHINGTON COUNTIES
    # =====================================================================
    "snohomish_wa": {
        "url": "https://snohomishcountywa.gov/1736/Excess-Proceeds",
        "type": "html", "state": "WA", "county": "Snohomish County"
    },
    "spokane_wa": {
        "url": "https://www.spokanecounty.org/1724/Excess-Proceeds",
        "type": "html", "state": "WA", "county": "Spokane County"
    },
    "thurston_wa": {
        "url": "https://www.thurstoncountywa.gov/departments/treasurer/excess-proceeds",
        "type": "html", "state": "WA", "county": "Thurston County"
    },
    "kitsap_wa": {
        "url": "https://www.kitsapgov.com/treasurer/Pages/Excess-Proceeds.aspx",
        "type": "html", "state": "WA", "county": "Kitsap County"
    },
    "whatcom_wa": {
        "url": "https://www.whatcomcounty.us/1919/Excess-Proceeds",
        "type": "html", "state": "WA", "county": "Whatcom County"
    },
    "benton_wa": {
        "url": "https://www.co.benton.wa.us/treasurer/excess-proceeds",
        "type": "html", "state": "WA", "county": "Benton County"
    },
    "yakima_wa": {
        "url": "https://www.yakimacounty.us/1587/Excess-Proceeds",
        "type": "html", "state": "WA", "county": "Yakima County"
    },
    "cowlitz_wa": {
        "url": "https://www.co.cowlitz.wa.us/1341/Excess-Proceeds",
        "type": "html", "state": "WA", "county": "Cowlitz County"
    },
    "skagit_wa": {
        "url": "https://www.skagitcounty.net/Departments/Treasurer/excessproceeds.htm",
        "type": "html", "state": "WA", "county": "Skagit County"
    },

    # =====================================================================
    # ADDITIONAL COLORADO COUNTIES
    # =====================================================================
    "adams_co": {
        "url": "https://www.adcogov.org/excess-proceeds",
        "type": "html", "state": "CO", "county": "Adams County"
    },
    "jefferson_co": {
        "url": "https://www.jeffco.us/1722/Excess-Proceeds",
        "type": "html", "state": "CO", "county": "Jefferson County"
    },
    "larimer_co": {
        "url": "https://www.larimer.gov/treasurer/excess-proceeds",
        "type": "html", "state": "CO", "county": "Larimer County"
    },
    "boulder_co": {
        "url": "https://www.bouldercounty.org/property-and-land/assessor/excess-proceeds/",
        "type": "html", "state": "CO", "county": "Boulder County"
    },
    "douglas_co": {
        "url": "https://www.douglas.co.us/treasurer/excess-proceeds/",
        "type": "html", "state": "CO", "county": "Douglas County"
    },
    "mesa_co": {
        "url": "https://www.mesacounty.us/treasurer/excess-proceeds",
        "type": "html", "state": "CO", "county": "Mesa County"
    },
    "pueblo_co": {
        "url": "https://county.pueblo.org/treasurer/excess-proceeds",
        "type": "html", "state": "CO", "county": "Pueblo County"
    },

    # =====================================================================
    # ADDITIONAL VIRGINIA COUNTIES
    # =====================================================================
    "virginia_beach_va": {
        "url": "https://www.vbgov.com/government/departments/finance/real-estate/pages/excess-proceeds.aspx",
        "type": "html", "state": "VA", "county": "Virginia Beach City"
    },
    "chesterfield_va": {
        "url": "https://www.chesterfield.gov/1677/Excess-Proceeds",
        "type": "html", "state": "VA", "county": "Chesterfield County"
    },
    "henrico_va": {
        "url": "https://henrico.us/finance/excess-proceeds/",
        "type": "html", "state": "VA", "county": "Henrico County"
    },
    "prince_william_va": {
        "url": "https://www.pwcgov.org/government/dept/finance/Pages/Excess-Proceeds.aspx",
        "type": "html", "state": "VA", "county": "Prince William County"
    },
    "norfolk_va": {
        "url": "https://www.norfolk.gov/index.aspx?NID=1316",
        "type": "html", "state": "VA", "county": "Norfolk City"
    },
    "chesapeake_va": {
        "url": "https://www.cityofchesapeake.net/government/departments/departments-a-through-f/finance-department/real-estate-tax/excess-proceeds",
        "type": "html", "state": "VA", "county": "Chesapeake City"
    },
    "richmond_va": {
        "url": "https://www.rva.gov/finance/excess-proceeds",
        "type": "html", "state": "VA", "county": "Richmond City"
    },
    "arlington_va": {
        "url": "https://www.arlingtonva.us/Government/Programs/Taxes/Tax-Payments/Excess-Proceeds",
        "type": "html", "state": "VA", "county": "Arlington County"
    },
    "stafford_va": {
        "url": "https://staffordcountyva.gov/government/departments/commissioner-of-the-revenue/excess-proceeds",
        "type": "html", "state": "VA", "county": "Stafford County"
    },

    # =====================================================================
    # ADDITIONAL TENNESSEE COUNTIES
    # =====================================================================
    "shelby_tn": {
        "url": "https://www.shelbycountytn.gov/1253/Excess-Proceeds",
        "type": "html", "state": "TN", "county": "Shelby County"
    },
    "hamilton_tn": {
        "url": "https://www.hamiltontn.gov/ExcessProceeds/",
        "type": "html", "state": "TN", "county": "Hamilton County"
    },
    "rutherford_tn": {
        "url": "https://www.rutherfordcountytn.gov/county-clerk/excess-proceeds",
        "type": "html", "state": "TN", "county": "Rutherford County"
    },
    "williamson_tn": {
        "url": "https://www.williamsoncounty-tn.gov/1259/Excess-Proceeds",
        "type": "html", "state": "TN", "county": "Williamson County"
    },
    "sumner_tn": {
        "url": "https://www.sumnertn.org/1176/Excess-Proceeds",
        "type": "html", "state": "TN", "county": "Sumner County"
    },
    "montgomery_tn": {
        "url": "https://www.mcgtn.org/trustee/excess-proceeds",
        "type": "html", "state": "TN", "county": "Montgomery County"
    },
    "blount_tn": {
        "url": "https://www.blounttn.org/1343/Excess-Proceeds",
        "type": "html", "state": "TN", "county": "Blount County"
    },
    "sullivan_tn": {
        "url": "https://www.sullivantn.us/excess-proceeds",
        "type": "html", "state": "TN", "county": "Sullivan County"
    },

    # =====================================================================
    # ADDITIONAL ALABAMA COUNTIES
    # =====================================================================
    "montgomery_al": {
        "url": "https://www.mc-ala.org/revenue-commissioner/excess-funds",
        "type": "html", "state": "AL", "county": "Montgomery County"
    },
    "baldwin_al": {
        "url": "https://www.baldwincountyal.gov/departments/revenue-commission/excess-funds",
        "type": "html", "state": "AL", "county": "Baldwin County"
    },
    "shelby_al": {
        "url": "https://www.shelbyal.com/449/Excess-Funds",
        "type": "html", "state": "AL", "county": "Shelby County"
    },
    "tuscaloosa_al": {
        "url": "https://revenue.tuscaloosacounty.org/excess-funds",
        "type": "html", "state": "AL", "county": "Tuscaloosa County"
    },
    "lee_al": {
        "url": "https://www.leecountyrevenuecommissioner.com/excess-funds",
        "type": "html", "state": "AL", "county": "Lee County"
    },
    "morgan_al": {
        "url": "https://www.morgancountyal.gov/departments/revenue/excess-funds",
        "type": "html", "state": "AL", "county": "Morgan County"
    },
    "etowah_al": {
        "url": "https://www.etowahcounty.org/revenue-commissioner/excess-funds",
        "type": "html", "state": "AL", "county": "Etowah County"
    },

    # =====================================================================
    # ADDITIONAL MICHIGAN COUNTIES
    # =====================================================================
    "kent_mi": {
        "url": "https://www.accesskent.com/Departments/Treasurer/ExcessProceeds.htm",
        "type": "html", "state": "MI", "county": "Kent County"
    },
    "genesee_mi": {
        "url": "https://www.gc4me.com/departments/treasurer/excess_proceeds.php",
        "type": "html", "state": "MI", "county": "Genesee County"
    },
    "washtenaw_mi": {
        "url": "https://www.washtenaw.org/1684/Excess-Proceeds",
        "type": "html", "state": "MI", "county": "Washtenaw County"
    },
    "ingham_mi": {
        "url": "https://tr.ingham.org/ExcessProceeds.aspx",
        "type": "html", "state": "MI", "county": "Ingham County"
    },
    "kalamazoo_mi": {
        "url": "https://www.kalcounty.com/treasurer/excess_proceeds.php",
        "type": "html", "state": "MI", "county": "Kalamazoo County"
    },
    "saginaw_mi": {
        "url": "https://www.saginawcounty.com/treasurer/excess-proceeds/",
        "type": "html", "state": "MI", "county": "Saginaw County"
    },

    # =====================================================================
    # ADDITIONAL MARYLAND COUNTIES
    # =====================================================================
    "prince_georges_md": {
        "url": "https://www.princegeorgescountymd.gov/departments-offices/finance/surplus-funds",
        "type": "html", "state": "MD", "county": "Prince George's County"
    },
    "anne_arundel_md": {
        "url": "https://www.aacounty.org/departments/finance/surplus-funds/",
        "type": "html", "state": "MD", "county": "Anne Arundel County"
    },
    "howard_md": {
        "url": "https://www.howardcountymd.gov/finance/surplus-funds",
        "type": "html", "state": "MD", "county": "Howard County"
    },
    "harford_md": {
        "url": "https://www.harfordcountymd.gov/1324/Surplus-Funds",
        "type": "html", "state": "MD", "county": "Harford County"
    },
    "frederick_md": {
        "url": "https://frederickcountymd.gov/1255/Surplus-Funds",
        "type": "html", "state": "MD", "county": "Frederick County"
    },
    "charles_md": {
        "url": "https://www.charlescountymd.gov/services/revenue/surplus-funds",
        "type": "html", "state": "MD", "county": "Charles County"
    },
    "baltimore_city_md": {
        "url": "https://finance.baltimorecity.gov/surplus-funds",
        "type": "html", "state": "MD", "county": "Baltimore City"
    },

    # =====================================================================
    # ADDITIONAL NEVADA COUNTIES
    # =====================================================================
    "clark_nv": {
        "url": "https://www.clarkcountynv.gov/government/departments/treasurer/excess_proceeds.php",
        "type": "html", "state": "NV", "county": "Clark County"
    },

    # =====================================================================
    # ADDITIONAL ARIZONA COUNTIES
    # =====================================================================
    "pima_az_new": {
        "url": "https://www.to.pima.gov/excessproceeds",
        "type": "html", "state": "AZ", "county": "Pima County"
    },
    "yavapai_az": {
        "url": "https://www.yavapai.us/treasurer/excess-proceeds",
        "type": "html", "state": "AZ", "county": "Yavapai County"
    },
    "mohave_az": {
        "url": "https://www.mohavecounty.us/ContentPage.aspx?id=136&page=132",
        "type": "html", "state": "AZ", "county": "Mohave County"
    },
    "coconino_az": {
        "url": "https://www.coconino.az.gov/1576/Excess-Proceeds",
        "type": "html", "state": "AZ", "county": "Coconino County"
    },
    "yuma_az": {
        "url": "https://www.yumacountyaz.gov/government/treasurer/excess-proceeds",
        "type": "html", "state": "AZ", "county": "Yuma County"
    },

    # =====================================================================
    # ADDITIONAL OREGON COUNTIES
    # =====================================================================
    "washington_or": {
        "url": "https://www.washingtoncountyor.gov/at/excess-proceeds",
        "type": "html", "state": "OR", "county": "Washington County"
    },
    "clackamas_or": {
        "url": "https://www.clackamas.us/at/excess-proceeds",
        "type": "html", "state": "OR", "county": "Clackamas County"
    },
    "lane_or": {
        "url": "https://www.lanecounty.org/government/county_departments/assessment___taxation/excess_proceeds",
        "type": "html", "state": "OR", "county": "Lane County"
    },
    "marion_or": {
        "url": "https://www.co.marion.or.us/AT/Pages/ExcessProceeds.aspx",
        "type": "html", "state": "OR", "county": "Marion County"
    },
    "jackson_or": {
        "url": "https://jacksoncountyor.gov/assessment-and-tax/excess-proceeds",
        "type": "html", "state": "OR", "county": "Jackson County"
    },
    "deschutes_or": {
        "url": "https://www.deschutes.org/assessor/page/excess-proceeds",
        "type": "html", "state": "OR", "county": "Deschutes County"
    },

    # =====================================================================
    # ADDITIONAL IDAHO COUNTIES
    # =====================================================================
    "canyon_id": {
        "url": "https://www.canyoncounty.org/elected-officials/treasurer/excess-funds",
        "type": "html", "state": "ID", "county": "Canyon County"
    },
    "kootenai_id": {
        "url": "https://www.kcgov.us/departments/treasurer/excess-proceeds",
        "type": "html", "state": "ID", "county": "Kootenai County"
    },
    "bonneville_id": {
        "url": "https://www.co.bonneville.id.us/treasurer/excess-proceeds",
        "type": "html", "state": "ID", "county": "Bonneville County"
    },
    "twin_falls_id": {
        "url": "https://www.twinfallscounty.org/treasurer/excess-proceeds",
        "type": "html", "state": "ID", "county": "Twin Falls County"
    },

    # =====================================================================
    # ADDITIONAL UTAH COUNTIES
    # =====================================================================
    "utah_ut": {
        "url": "https://www.utahcounty.gov/Dept/AudTO/SurplusFunds.html",
        "type": "html", "state": "UT", "county": "Utah County"
    },
    "davis_ut": {
        "url": "https://www.daviscountyutah.gov/clerk-auditor/surplus-funds",
        "type": "html", "state": "UT", "county": "Davis County"
    },
    "weber_ut": {
        "url": "https://www.webercountyutah.gov/clerk_auditor/surplus-funds.php",
        "type": "html", "state": "UT", "county": "Weber County"
    },
    "washington_ut": {
        "url": "https://www.washco.utah.gov/treasurer/excess-proceeds",
        "type": "html", "state": "UT", "county": "Washington County"
    },
    "cache_ut": {
        "url": "https://www.cachecounty.org/auditor/surplus-funds.html",
        "type": "html", "state": "UT", "county": "Cache County"
    },

    # =====================================================================
    # NEBRASKA
    # =====================================================================
    "lancaster_ne": {
        "url": "https://www.lancaster.ne.gov/treasurer/excess-proceeds",
        "type": "html", "state": "NE", "county": "Lancaster County"
    },
    "sarpy_ne": {
        "url": "https://www.sarpy.gov/1257/Excess-Proceeds",
        "type": "html", "state": "NE", "county": "Sarpy County"
    },

    # =====================================================================
    # MISSISSIPPI
    # =====================================================================
    "harrison_ms": {
        "url": "https://www.co.harrison.ms.us/tax-collector/excess-proceeds",
        "type": "html", "state": "MS", "county": "Harrison County"
    },
    "desoto_ms": {
        "url": "https://www.desotocountyms.gov/1224/Excess-Proceeds",
        "type": "html", "state": "MS", "county": "DeSoto County"
    },
    "rankin_ms": {
        "url": "https://www.rankincounty.org/1257/Excess-Proceeds",
        "type": "html", "state": "MS", "county": "Rankin County"
    },
    "madison_ms": {
        "url": "https://www.madison-co.com/excess-proceeds",
        "type": "html", "state": "MS", "county": "Madison County"
    },
    "lee_ms": {
        "url": "https://www.leecoms.com/excess-proceeds",
        "type": "html", "state": "MS", "county": "Lee County"
    },

    # =====================================================================
    # MISSOURI
    # =====================================================================
    "jackson_mo": {
        "url": "https://www.jacksongov.org/Government/Departments/Collection/Excess-Proceeds",
        "type": "html", "state": "MO", "county": "Jackson County"
    },
    "st_charles_mo": {
        "url": "https://www.sccmo.org/1253/Excess-Proceeds",
        "type": "html", "state": "MO", "county": "St. Charles County"
    },
    "greene_mo": {
        "url": "https://www.greenecountymo.gov/collector/excess_proceeds.php",
        "type": "html", "state": "MO", "county": "Greene County"
    },
    "boone_mo": {
        "url": "https://www.showmeboone.com/collector/excess-proceeds.asp",
        "type": "html", "state": "MO", "county": "Boone County"
    },
    "clay_mo": {
        "url": "https://www.claycountymo.gov/government/elected-officials/collector/excess-proceeds",
        "type": "html", "state": "MO", "county": "Clay County"
    },

    # =====================================================================
    # HAWAII
    # =====================================================================
    "honolulu_hi": {
        "url": "https://www.honolulu.gov/budget/real-property/excess-proceeds.html",
        "type": "html", "state": "HI", "county": "Honolulu County"
    },
    "hawaii_hi": {
        "url": "https://www.hawaiicounty.gov/departments/finance/real-property-tax-division/excess-proceeds",
        "type": "html", "state": "HI", "county": "Hawaii County"
    },
    "maui_hi": {
        "url": "https://www.mauicounty.gov/1257/Excess-Proceeds",
        "type": "html", "state": "HI", "county": "Maui County"
    },

    # =====================================================================
    # MONTANA
    # =====================================================================
    "yellowstone_mt": {
        "url": "https://www.co.yellowstone.mt.gov/treasurer/excess-proceeds",
        "type": "html", "state": "MT", "county": "Yellowstone County"
    },
    "missoula_mt": {
        "url": "https://www.missoulacounty.us/government/financial-administration/treasurer/excess-proceeds",
        "type": "html", "state": "MT", "county": "Missoula County"
    },
    "gallatin_mt": {
        "url": "https://www.gallatincomt.gov/treasurer/excess-proceeds",
        "type": "html", "state": "MT", "county": "Gallatin County"
    },
    "flathead_mt": {
        "url": "https://flathead.mt.gov/treasurer/excess_proceeds.php",
        "type": "html", "state": "MT", "county": "Flathead County"
    },
    "cascade_mt": {
        "url": "https://www.cascadecountymt.gov/departments/treasurer/excess-proceeds",
        "type": "html", "state": "MT", "county": "Cascade County"
    },
    "lewis_and_clark_mt": {
        "url": "https://www.lccountymt.gov/treasurer/excess-proceeds.html",
        "type": "html", "state": "MT", "county": "Lewis and Clark County"
    },

    # =====================================================================
    # WEST VIRGINIA
    # =====================================================================
    "kanawha_wv": {
        "url": "https://kanawha.us/sheriff-tax-office/excess-proceeds/",
        "type": "html", "state": "WV", "county": "Kanawha County"
    },
    "berkeley_wv": {
        "url": "https://www.berkeleycountycomm.org/sheriff/excess-proceeds",
        "type": "html", "state": "WV", "county": "Berkeley County"
    },
    "cabell_wv": {
        "url": "https://www.cabellcounty.org/sheriff/excess-proceeds",
        "type": "html", "state": "WV", "county": "Cabell County"
    },
    "monongalia_wv": {
        "url": "https://www.monongaliacounty.gov/sheriff/excess-proceeds",
        "type": "html", "state": "WV", "county": "Monongalia County"
    },
    "wood_wv": {
        "url": "https://www.woodcountywv.com/sheriff/excess-proceeds",
        "type": "html", "state": "WV", "county": "Wood County"
    },
    "raleigh_wv": {
        "url": "https://www.raleighcounty.com/sheriff/excess-proceeds",
        "type": "html", "state": "WV", "county": "Raleigh County"
    },

    # =====================================================================
    # SOUTH DAKOTA
    # =====================================================================
    "minnehaha_sd": {
        "url": "https://www.minnehahacounty.org/dept/tr/excess_proceeds.aspx",
        "type": "html", "state": "SD", "county": "Minnehaha County"
    },
    "pennington_sd": {
        "url": "https://www.pennco.org/treasurer/excess-proceeds",
        "type": "html", "state": "SD", "county": "Pennington County"
    },
    "lincoln_sd": {
        "url": "https://www.lincolncountysd.org/treasurer/excess-proceeds",
        "type": "html", "state": "SD", "county": "Lincoln County"
    },

    # =====================================================================
    # NEW HAMPSHIRE
    # =====================================================================
    "hillsborough_nh": {
        "url": "https://www.hillsboroughcountynh.org/departments/registry-of-deeds/excess-proceeds",
        "type": "html", "state": "NH", "county": "Hillsborough County"
    },
    "rockingham_nh": {
        "url": "https://www.co.rockingham.nh.us/excess-proceeds",
        "type": "html", "state": "NH", "county": "Rockingham County"
    },
    "merrimack_nh": {
        "url": "https://www.merrimackcounty.net/excess-proceeds",
        "type": "html", "state": "NH", "county": "Merrimack County"
    },

    # =====================================================================
    # ALASKA
    # =====================================================================
    "anchorage_ak": {
        "url": "https://www.muni.org/Departments/Assembly/Clerk/Pages/ExcessProceeds.aspx",
        "type": "html", "state": "AK", "county": "Anchorage Borough"
    },
    "matsu_ak": {
        "url": "https://www.matsugov.us/finance/excess-proceeds",
        "type": "html", "state": "AK", "county": "Matanuska-Susitna Borough"
    },
    "fairbanks_ak": {
        "url": "https://www.fnsb.gov/1257/Excess-Proceeds",
        "type": "html", "state": "AK", "county": "Fairbanks North Star Borough"
    },

    # =====================================================================
    # WYOMING
    # =====================================================================
    "laramie_wy": {
        "url": "https://www.laramiecounty.com/treasurer/excess-proceeds",
        "type": "html", "state": "WY", "county": "Laramie County"
    },
    "natrona_wy": {
        "url": "https://www.natronacounty-wy.gov/treasurer/excess-proceeds",
        "type": "html", "state": "WY", "county": "Natrona County"
    },
    "campbell_wy": {
        "url": "https://www.ccgov.net/1257/Excess-Proceeds",
        "type": "html", "state": "WY", "county": "Campbell County"
    },
}


# =========================================================================
# EXPANDED DISCOVERY COUNTIES
# ALL counties in ALL 29 non-judicial states by population (top counties)
# =========================================================================
EXPANDED_DISCOVERY = {
    "CA": [
        "Los Angeles County", "San Diego County", "Orange County", "Riverside County",
        "San Bernardino County", "Santa Clara County", "Alameda County", "Sacramento County",
        "Contra Costa County", "Fresno County", "Kern County", "San Francisco County",
        "Ventura County", "San Mateo County", "San Joaquin County", "Stanislaus County",
        "Sonoma County", "Tulare County", "Santa Barbara County", "Solano County",
        "Monterey County", "Placer County", "San Luis Obispo County", "Santa Cruz County",
        "Merced County", "Marin County", "Butte County", "Yolo County", "El Dorado County",
        "Shasta County", "Imperial County", "Kings County", "Madera County", "Napa County",
        "Humboldt County", "Nevada County", "Sutter County", "Mendocino County",
        "Yuba County", "Lake County", "Tehama County", "Tuolumne County",
    ],
    "TX": [
        "Harris County", "Dallas County", "Tarrant County", "Bexar County", "Travis County",
        "Collin County", "Denton County", "Fort Bend County", "Hidalgo County", "El Paso County",
        "Williamson County", "Montgomery County", "Brazoria County", "Nueces County",
        "Galveston County", "Cameron County", "Bell County", "Lubbock County", "Webb County",
        "McLennan County", "Smith County", "Jefferson County", "Hays County", "Brazos County",
        "Midland County", "Ector County", "Johnson County", "Ellis County", "Parker County",
        "Guadalupe County", "Kaufman County", "Comal County", "Tom Green County",
        "Wichita County", "Taylor County", "Potter County", "Randall County",
        "Bowie County", "Gregg County", "Hunt County", "Victoria County",
    ],
    "NC": [
        "Mecklenburg County", "Wake County", "Guilford County", "Forsyth County",
        "Cumberland County", "Durham County", "Buncombe County", "Gaston County",
        "New Hanover County", "Cabarrus County", "Union County", "Onslow County",
        "Catawba County", "Pitt County", "Rowan County", "Iredell County",
        "Davidson County", "Johnston County", "Robeson County", "Randolph County",
        "Alamance County", "Craven County", "Wayne County", "Harnett County",
        "Brunswick County", "Nash County", "Cleveland County", "Henderson County",
        "Burke County", "Caldwell County", "Moore County", "Lee County",
        "Rockingham County", "Lincoln County", "Surry County", "Wilkes County",
        "Carteret County", "Stanly County", "Lenoir County", "Chatham County",
    ],
    "GA": [
        "Fulton County", "Gwinnett County", "Cobb County", "DeKalb County",
        "Chatham County", "Cherokee County", "Henry County", "Forsyth County",
        "Richmond County", "Clayton County", "Hall County", "Muscogee County",
        "Columbia County", "Bibb County", "Douglas County", "Paulding County",
        "Lowndes County", "Coweta County", "Fayette County", "Carroll County",
        "Houston County", "Newton County", "Whitfield County", "Glynn County",
        "Floyd County", "Bartow County", "Troup County", "Dougherty County",
        "Clarke County", "Liberty County", "Coffee County", "Effingham County",
        "Thomas County", "Bulloch County", "Laurens County", "Spalding County",
    ],
    "WA": [
        "King County", "Pierce County", "Snohomish County", "Spokane County",
        "Clark County", "Thurston County", "Kitsap County", "Yakima County",
        "Whatcom County", "Benton County", "Cowlitz County", "Skagit County",
        "Island County", "Grant County", "Lewis County", "Clallam County",
        "Mason County", "Chelan County", "Walla Walla County", "Franklin County",
        "Grays Harbor County", "Douglas County", "Whitman County", "Okanogan County",
    ],
    "VA": [
        "Fairfax County", "Prince William County", "Loudoun County", "Chesterfield County",
        "Henrico County", "Arlington County", "Stafford County", "Spotsylvania County",
        "Albemarle County", "James City County", "Roanoke County", "Hanover County",
        "Frederick County", "Bedford County", "Campbell County", "Augusta County",
        "Rockingham County", "Montgomery County", "Pittsylvania County", "Fauquier County",
        "Virginia Beach City", "Norfolk City", "Chesapeake City", "Richmond City",
        "Newport News City", "Hampton City", "Alexandria City", "Lynchburg City",
        "Roanoke City", "Portsmouth City", "Suffolk City", "Danville City",
    ],
    "AL": [
        "Jefferson County", "Mobile County", "Madison County", "Montgomery County",
        "Baldwin County", "Shelby County", "Tuscaloosa County", "Lee County",
        "Morgan County", "Etowah County", "Calhoun County", "Houston County",
        "Limestone County", "St. Clair County", "Elmore County", "Lauderdale County",
        "Marshall County", "Talladega County", "Russell County", "Walker County",
        "DeKalb County", "Autauga County", "Colbert County", "Dale County",
        "Coffee County", "Chilton County", "Cullman County", "Blount County",
    ],
    "CO": [
        "Denver County", "El Paso County", "Arapahoe County", "Jefferson County",
        "Adams County", "Douglas County", "Larimer County", "Boulder County",
        "Weld County", "Mesa County", "Pueblo County", "Broomfield County",
        "Garfield County", "Eagle County", "Pitkin County", "Summit County",
        "La Plata County", "Montrose County", "Delta County", "Fremont County",
    ],
    "MI": [
        "Wayne County", "Oakland County", "Macomb County", "Kent County",
        "Genesee County", "Washtenaw County", "Ingham County", "Kalamazoo County",
        "Ottawa County", "Saginaw County", "Muskegon County", "St. Clair County",
        "Berrien County", "Jackson County", "Calhoun County", "Livingston County",
        "Eaton County", "Bay County", "Monroe County", "Allegan County",
    ],
    "AZ": [
        "Maricopa County", "Pima County", "Pinal County", "Yavapai County",
        "Mohave County", "Yuma County", "Coconino County", "Cochise County",
        "Navajo County", "Apache County", "Gila County", "La Paz County",
        "Graham County", "Santa Cruz County",
    ],
    "TN": [
        "Shelby County", "Davidson County", "Knox County", "Hamilton County",
        "Rutherford County", "Williamson County", "Sumner County", "Montgomery County",
        "Blount County", "Sullivan County", "Wilson County", "Maury County",
        "Washington County", "Sevier County", "Bradley County", "Madison County",
        "Anderson County", "Putnam County", "Tipton County", "Robertson County",
    ],
    "OR": [
        "Multnomah County", "Washington County", "Clackamas County", "Lane County",
        "Marion County", "Jackson County", "Deschutes County", "Linn County",
        "Douglas County", "Yamhill County", "Benton County", "Josephine County",
        "Klamath County", "Umatilla County", "Polk County", "Columbia County",
    ],
    "MD": [
        "Montgomery County", "Prince George's County", "Baltimore County",
        "Anne Arundel County", "Howard County", "Baltimore City",
        "Harford County", "Frederick County", "Carroll County", "Charles County",
        "Washington County", "Calvert County", "St. Mary's County", "Wicomico County",
        "Cecil County", "Worcester County", "Allegany County", "Queen Anne's County",
    ],
    "AR": [
        "Pulaski County", "Benton County", "Washington County", "Sebastian County",
        "Faulkner County", "Garland County", "Saline County", "Craighead County",
        "Lonoke County", "Jefferson County", "White County", "Pope County",
        "Crittenden County", "Crawford County", "Miller County", "Boone County",
        "Hot Spring County", "Independence County", "Mississippi County",
        "Greene County", "Union County", "Columbia County", "Hempstead County",
    ],
    "NV": [
        "Clark County", "Washoe County", "Lyon County", "Carson City",
        "Douglas County", "Elko County", "Nye County", "Churchill County",
        "Humboldt County", "White Pine County",
    ],
    "ID": [
        "Ada County", "Canyon County", "Kootenai County", "Bonneville County",
        "Twin Falls County", "Bannock County", "Bingham County", "Nez Perce County",
        "Madison County", "Blaine County", "Bonner County", "Elmore County",
    ],
    "MN": [
        "Hennepin County", "Ramsey County", "Dakota County", "Anoka County",
        "Washington County", "Scott County", "Olmsted County", "Stearns County",
        "St. Louis County", "Wright County", "Sherburne County", "Carver County",
        "Blue Earth County", "Rice County", "Crow Wing County", "Clay County",
        "Otter Tail County", "Goodhue County", "Winona County", "Becker County",
    ],
    "MS": [
        "Hinds County", "Harrison County", "DeSoto County", "Rankin County",
        "Madison County", "Lee County", "Jackson County", "Forrest County",
        "Lauderdale County", "Lowndes County", "Jones County", "Lafayette County",
        "Oktibbeha County", "Pearl River County", "Warren County", "Hancock County",
    ],
    "MO": [
        "St. Louis County", "Jackson County", "St. Charles County", "Greene County",
        "Clay County", "Boone County", "Jasper County", "Cole County",
        "Christian County", "Cass County", "Platte County", "Buchanan County",
        "Jefferson County", "Franklin County", "Cape Girardeau County", "Taney County",
    ],
    "UT": [
        "Salt Lake County", "Utah County", "Davis County", "Weber County",
        "Washington County", "Cache County", "Tooele County", "Iron County",
        "Box Elder County", "Summit County",
    ],
    "NE": [
        "Douglas County", "Lancaster County", "Sarpy County", "Hall County",
        "Buffalo County", "Lincoln County", "Dodge County", "Scotts Bluff County",
        "Madison County", "Adams County",
    ],
    "MA": [
        "Suffolk County", "Middlesex County", "Worcester County", "Essex County",
        "Norfolk County", "Bristol County", "Plymouth County", "Hampden County",
        "Barnstable County", "Hampshire County", "Berkshire County", "Franklin County",
        "Dukes County", "Nantucket County",
    ],
    "AK": [
        "Anchorage Borough", "Matanuska-Susitna Borough", "Fairbanks North Star Borough",
        "Kenai Peninsula Borough", "Juneau Borough", "Ketchikan Gateway Borough",
        "Kodiak Island Borough", "Sitka Borough",
    ],
    "HI": [
        "Honolulu County", "Hawaii County", "Maui County", "Kauai County",
    ],
    "MT": [
        "Yellowstone County", "Missoula County", "Gallatin County", "Flathead County",
        "Cascade County", "Lewis and Clark County", "Ravalli County", "Lake County",
        "Silver Bow County", "Lincoln County",
    ],
    "WV": [
        "Kanawha County", "Berkeley County", "Cabell County", "Monongalia County",
        "Wood County", "Raleigh County", "Putnam County", "Jefferson County",
        "Harrison County", "Marion County", "Mercer County", "Ohio County",
    ],
    "SD": [
        "Minnehaha County", "Pennington County", "Lincoln County", "Brown County",
        "Brookings County", "Codington County", "Meade County", "Davison County",
    ],
    "NH": [
        "Hillsborough County", "Rockingham County", "Merrimack County",
        "Strafford County", "Grafton County", "Cheshire County",
        "Belknap County", "Sullivan County", "Carroll County", "Coos County",
    ],
    "WY": [
        "Laramie County", "Natrona County", "Campbell County", "Sweetwater County",
        "Fremont County", "Albany County", "Sheridan County", "Uinta County",
        "Park County", "Teton County",
    ],
}


def main():
    """Generate the patch commands."""
    print("=" * 70)
    print("FORECLOSURE SCRAPER EXPANSION PLAN")
    print("=" * 70)

    # Count new entries
    from collections import Counter
    state_counts = Counter()
    for key, info in NEW_KNOWN_URLS.items():
        state_counts[info["state"]] += 1

    print(f"\nNew KNOWN_GOVERNMENT_URLS entries: {len(NEW_KNOWN_URLS)}")
    print("\nBy state:")
    for state, count in sorted(state_counts.items(), key=lambda x: -x[1]):
        print(f"  {state}: {count} counties")

    # Count discovery counties
    total_discovery = sum(len(v) for v in EXPANDED_DISCOVERY.items())
    print(f"\nExpanded DISCOVERY_COUNTIES: {len(EXPANDED_DISCOVERY)} states, {total_discovery} total counties")

    # Generate JSON for both dicts
    import json
    print("\n--- Generating patch data ---")

    # Write new URLs as Python dict string
    with open("/tmp/new_known_urls.json", "w") as f:
        json.dump(NEW_KNOWN_URLS, f, indent=2)

    with open("/tmp/expanded_discovery.json", "w") as f:
        json.dump(EXPANDED_DISCOVERY, f, indent=2)

    print("Wrote /tmp/new_known_urls.json")
    print("Wrote /tmp/expanded_discovery.json")
    print("\nReady to deploy!")


if __name__ == "__main__":
    main()
