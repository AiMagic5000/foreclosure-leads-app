#!/usr/bin/env python3
"""
APN (Assessor Parcel Number) Enrichment Script
Enriches foreclosure leads with APN, assessed value, tax amount, and county data
using FREE county GIS ArcGIS REST services.

Strategy:
1. Use lat/lng coordinates to query county GIS parcel layers via spatial intersection
2. Extract APN, assessed value, tax info from parcel attributes
3. Fall back to address-based search if spatial query fails

Supported Counties/States (with free public ArcGIS parcel APIs):
- California: LA County, Orange County, San Diego, Riverside, San Bernardino
- Texas: Harris County (Houston), Dallas County, Travis County (Austin)
- Florida: Statewide cadastral (all 67 counties)
- New York: NYC via PLUTO API
- Arizona: Maricopa County (Phoenix)
- Georgia: Fulton County (Atlanta)
- Nevada: Clark County (Las Vegas)
- Washington: King County (Seattle)
- Oregon: Multnomah County (Portland)
- And more via generic ArcGIS query patterns

Usage:
    python enrich_apn.py [--batch-size 25] [--delay 2] [--max-leads 100] [--dry-run] [--state CA]

Environment Variables:
    SUPABASE_URL: Supabase project URL
    SUPABASE_SERVICE_KEY: Service role key
    CRAWL4AI_URL: Crawl4AI instance URL (optional, for scraping fallback)
"""

import os
import re
import sys
import time
import json
import random
import logging
import argparse
from datetime import datetime, timezone
from urllib.parse import quote_plus, quote
from typing import Dict, List, Optional, Tuple, Any

import requests

# Configuration
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://foreclosure-db.alwaysencrypted.com"
)
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
)
CRAWL4AI_URL = os.getenv(
    "CRAWL4AI_URL",
    "https://crawl4ai.alwaysencrypted.com"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("apn_enrichment")


# ====================================================================
# COUNTY GIS ENDPOINTS - ArcGIS REST Services with Parcel Layers
# ====================================================================
# These are FREE public county GIS services. No API key required.
# Most return parcel data including APN, assessed value, owner info.
#
# To add more counties:
# 1. Search "[County Name] GIS parcel REST services" or "[County] ArcGIS"
# 2. Find the FeatureServer or MapServer URL with parcel layer
# 3. Test with: {base_url}/query?where=1=1&outFields=*&f=json&resultRecordCount=1
# 4. Identify the APN field name and other useful fields
# ====================================================================

COUNTY_GIS_ENDPOINTS = {
    # ---- CALIFORNIA ----
    "ca_los_angeles": {
        "name": "Los Angeles County",
        "url": "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUSADDR", "CITY", "ZIP", "USETYPE", "USECODEDESCCHAR1"],
        "spatial_ref": 4326,
    },
    "ca_orange": {
        "name": "Orange County",
        "url": "https://gis.ocpublicworks.com/arcgis/rest/services/Parcels/Orange_County_Parcel/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS", "USECODE"],
        "spatial_ref": 4326,
    },
    "ca_san_diego": {
        "name": "San Diego County",
        "url": "https://gis.sandiegocounty.gov/sdc/rest/services/Parcels/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS_ADDR", "USECODE"],
        "spatial_ref": 4326,
    },
    "ca_riverside": {
        "name": "Riverside County",
        "url": "https://gisweb.rivcoit.org/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUSADDR"],
        "spatial_ref": 4326,
    },
    "ca_san_bernardino": {
        "name": "San Bernardino County",
        "url": "https://gis.sbcounty.gov/arcgis/rest/services/Parcels/Parcel_Public/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },
    "ca_sacramento": {
        "name": "Sacramento County",
        "url": "https://mapping.saccounty.net/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS"],
        "spatial_ref": 4326,
    },
    "ca_alameda": {
        "name": "Alameda County",
        "url": "https://gis.acgov.org/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },
    "ca_santa_clara": {
        "name": "Santa Clara County",
        "url": "https://services1.arcgis.com/7ELd0pVEWDgF3dJW/arcgis/rest/services/Parcel/FeatureServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS"],
        "spatial_ref": 4326,
    },
    "ca_fresno": {
        "name": "Fresno County",
        "url": "https://gis.co.fresno.ca.us/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS"],
        "spatial_ref": 4326,
    },
    "ca_kern": {
        "name": "Kern County",
        "url": "https://maps.kerncounty.com/kcgis/rest/services/Parcel/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS"],
        "spatial_ref": 4326,
    },

    # ---- TEXAS ----
    "tx_harris": {
        "name": "Harris County (Houston)",
        "url": "https://www.harriscountyfemt.org/arcgis/rest/services/Parcels/MapServer/0/query",
        "apn_field": "ACCT",  # Harris uses Account Number
        "fields": ["ACCT", "StreetAddr", "Owner", "TotalValue"],
        "spatial_ref": 4326,
    },
    "tx_dallas": {
        "name": "Dallas County",
        "url": "https://maps.dallascad.org/arcgis/rest/services/Public/Parcels/MapServer/0/query",
        "apn_field": "PROP_ID",
        "fields": ["PROP_ID", "SITUS_ADDR", "OWNER_NAME", "TOT_VAL"],
        "spatial_ref": 4326,
    },
    "tx_travis": {
        "name": "Travis County (Austin)",
        "url": "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TCAD_public/FeatureServer/0/query",
        "apn_field": "prop_id",
        "fields": ["prop_id", "situs_address", "owner_name", "appraised_value"],
        "spatial_ref": 4326,
    },
    "tx_bexar": {
        "name": "Bexar County (San Antonio)",
        "url": "https://services.arcgis.com/g1fRTDLeMgspWrYp/arcgis/rest/services/BCAD_Parcels/FeatureServer/0/query",
        "apn_field": "PROP_ID",
        "fields": ["PROP_ID", "SITUS", "OWNER"],
        "spatial_ref": 4326,
    },
    "tx_tarrant": {
        "name": "Tarrant County (Fort Worth)",
        "url": "https://maps.tarrantcounty.com/arcgis/rest/services/Parcels/MapServer/0/query",
        "apn_field": "ACCT",
        "fields": ["ACCT", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },

    # ---- FLORIDA (Statewide) ----
    "fl_statewide": {
        "name": "Florida Statewide Cadastral",
        "url": "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "PHY_ADDR1", "PHY_CITY", "PHY_ZIPCD", "OWN_NAME", "JV", "AV", "TV", "TOT_LVG_AR", "ACT_YR_BLT", "CO_NO"],
        "spatial_ref": 4326,
    },

    # ---- ARIZONA ----
    "az_maricopa": {
        "name": "Maricopa County (Phoenix)",
        "url": "https://gis.maricopa.gov/gis/rest/services/locator/parcel/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS_ADDR", "OWNER"],
        "spatial_ref": 4326,
    },
    "az_pima": {
        "name": "Pima County (Tucson)",
        "url": "https://gis.pima.gov/arcgis/rest/services/AdministrativeData/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS"],
        "spatial_ref": 4326,
    },

    # ---- GEORGIA ----
    "ga_fulton": {
        "name": "Fulton County (Atlanta)",
        "url": "https://gis.fultoncountyga.gov/arcgis/rest/services/Parcels/Parcels_Public/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR", "OWNER"],
        "spatial_ref": 4326,
    },
    "ga_dekalb": {
        "name": "DeKalb County",
        "url": "https://gis.dekalbcountyga.gov/arcgis/rest/services/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },

    # ---- NEVADA ----
    "nv_clark": {
        "name": "Clark County (Las Vegas)",
        "url": "https://maps.clarkcountynv.gov/gis/rest/services/Assessor/Parcels_Public/MapServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS", "OWNER_NAME"],
        "spatial_ref": 4326,
    },

    # ---- WASHINGTON ----
    "wa_king": {
        "name": "King County (Seattle)",
        "url": "https://gismaps.kingcounty.gov/arcgis/rest/services/Property/Parcels/MapServer/0/query",
        "apn_field": "PIN",  # King uses PIN (Parcel Identification Number)
        "fields": ["PIN", "ADDR_FULL", "TAXPAYER", "APPR_LAND", "APPR_IMPR"],
        "spatial_ref": 4326,
    },
    "wa_pierce": {
        "name": "Pierce County (Tacoma)",
        "url": "https://services2.arcgis.com/1UvBaQ5y1ubjUPmd/arcgis/rest/services/Parcels/FeatureServer/0/query",
        "apn_field": "APN",
        "fields": ["APN", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },

    # ---- OREGON ----
    "or_multnomah": {
        "name": "Multnomah County (Portland)",
        "url": "https://gis.multco.us/arcgis/rest/services/Taxlots/Taxlots/MapServer/0/query",
        "apn_field": "PROPERTYID",
        "fields": ["PROPERTYID", "SITEADDR", "OWNER1"],
        "spatial_ref": 4326,
    },

    # ---- COLORADO ----
    "co_denver": {
        "name": "Denver County",
        "url": "https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/arcgis/rest/services/ODC_ASSESS_PARCELS_A/FeatureServer/0/query",
        "apn_field": "SCHEDNUM",
        "fields": ["SCHEDNUM", "SITUS_ADD", "OWNER_NAME", "ASSESS_LAND", "ASSESS_IMPR"],
        "spatial_ref": 4326,
    },
    "co_arapahoe": {
        "name": "Arapahoe County",
        "url": "https://gis.arapahoegov.com/arcgis/rest/services/Assessor/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },

    # ---- OHIO ----
    "oh_cuyahoga": {
        "name": "Cuyahoga County (Cleveland)",
        "url": "https://gis.cuyahogacounty.us/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_NUM",
        "fields": ["PARCEL_NUM", "SITUS_ADDR", "OWNER"],
        "spatial_ref": 4326,
    },
    "oh_franklin": {
        "name": "Franklin County (Columbus)",
        "url": "https://gis.franklincountyauditor.com/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR", "OWNER"],
        "spatial_ref": 4326,
    },

    # ---- MICHIGAN ----
    "mi_wayne": {
        "name": "Wayne County (Detroit)",
        "url": "https://gis.waynecounty.com/arcgis/rest/services/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },
    "mi_oakland": {
        "name": "Oakland County",
        "url": "https://gis.oakgov.com/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },

    # ---- NEW JERSEY ----
    "nj_statewide": {
        "name": "New Jersey Statewide Parcels",
        "url": "https://services.arcgis.com/njFNhDsUCentVYJW/arcgis/rest/services/PARCELS_NJ/FeatureServer/0/query",
        "apn_field": "PAMS_PIN",
        "fields": ["PAMS_PIN", "PROP_LOC", "OWNER_NAME", "PROP_CLASS"],
        "spatial_ref": 4326,
    },

    # ---- ILLINOIS ----
    "il_cook": {
        "name": "Cook County (Chicago)",
        "url": "https://gis.cookcountyil.gov/arcgis/rest/services/Parcels/Parcels_Current/MapServer/0/query",
        "apn_field": "PIN",
        "fields": ["PIN", "PROP_ADDR", "OWNER", "LAND_AV", "BLDG_AV"],
        "spatial_ref": 4326,
    },

    # ---- NORTH CAROLINA ----
    "nc_mecklenburg": {
        "name": "Mecklenburg County (Charlotte)",
        "url": "https://gis.mecklenburgcountync.gov/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITE_ADDR", "OWNER_NAME", "TOTAL_VALUE"],
        "spatial_ref": 4326,
    },
    "nc_wake": {
        "name": "Wake County (Raleigh)",
        "url": "https://maps.wakegov.com/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PIN_NUM",
        "fields": ["PIN_NUM", "SITE_ADDR", "OWNER_NAME"],
        "spatial_ref": 4326,
    },

    # ---- TENNESSEE ----
    "tn_davidson": {
        "name": "Davidson County (Nashville)",
        "url": "https://services.arcgis.com/v6Xrp1N9PD6cRQRs/arcgis/rest/services/Parcels/FeatureServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "PROP_ADDR", "OWNER_NAME"],
        "spatial_ref": 4326,
    },
    "tn_shelby": {
        "name": "Shelby County (Memphis)",
        "url": "https://gis.shelbycountytn.gov/arcgis/rest/services/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR"],
        "spatial_ref": 4326,
    },

    # ---- VIRGINIA ----
    "va_fairfax": {
        "name": "Fairfax County",
        "url": "https://gis.fairfaxcounty.gov/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR", "OWNER_NAME"],
        "spatial_ref": 4326,
    },

    # ---- MINNESOTA ----
    "mn_hennepin": {
        "name": "Hennepin County (Minneapolis)",
        "url": "https://gis.hennepin.us/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PID",
        "fields": ["PID", "PROP_ADDR", "OWNER_NAME", "EST_LAND", "EST_BLDG"],
        "spatial_ref": 4326,
    },

    # ---- UTAH ----
    "ut_salt_lake": {
        "name": "Salt Lake County",
        "url": "https://gis.slco.org/arcgis/rest/services/Parcels/Parcels/MapServer/0/query",
        "apn_field": "PARCEL_ID",
        "fields": ["PARCEL_ID", "SITUS_ADDR", "OWNER_NAME", "TOTAL_VALUE"],
        "spatial_ref": 4326,
    },
}


# ====================================================================
# CITY TO COUNTY GIS ENDPOINT MAPPING
# ====================================================================

CITY_TO_GIS_ENDPOINT = {
    # California
    "los angeles": "ca_los_angeles", "studio city": "ca_los_angeles", "woodland hills": "ca_los_angeles",
    "venice": "ca_los_angeles", "encino": "ca_los_angeles", "north hollywood": "ca_los_angeles",
    "van nuys": "ca_los_angeles", "sherman oaks": "ca_los_angeles", "tarzana": "ca_los_angeles",
    "burbank": "ca_los_angeles", "glendale": "ca_los_angeles", "pasadena": "ca_los_angeles",
    "long beach": "ca_los_angeles", "torrance": "ca_los_angeles", "pomona": "ca_los_angeles",
    "santa monica": "ca_los_angeles", "beverly hills": "ca_los_angeles", "malibu": "ca_los_angeles",
    "palmdale": "ca_los_angeles", "lancaster": "ca_los_angeles", "santa clarita": "ca_los_angeles",

    "irvine": "ca_orange", "anaheim": "ca_orange", "santa ana": "ca_orange",
    "huntington beach": "ca_orange", "garden grove": "ca_orange", "orange": "ca_orange",
    "fullerton": "ca_orange", "costa mesa": "ca_orange", "newport beach": "ca_orange",

    "san diego": "ca_san_diego", "chula vista": "ca_san_diego", "oceanside": "ca_san_diego",
    "escondido": "ca_san_diego", "carlsbad": "ca_san_diego",

    "riverside": "ca_riverside", "corona": "ca_riverside", "moreno valley": "ca_riverside",
    "temecula": "ca_riverside", "murrieta": "ca_riverside", "palm springs": "ca_riverside",

    "san bernardino": "ca_san_bernardino", "fontana": "ca_san_bernardino", "ontario": "ca_san_bernardino",
    "rancho cucamonga": "ca_san_bernardino", "victorville": "ca_san_bernardino",

    "sacramento": "ca_sacramento", "elk grove": "ca_sacramento", "rancho cordova": "ca_sacramento",
    "citrus heights": "ca_sacramento", "folsom": "ca_sacramento",

    "oakland": "ca_alameda", "fremont": "ca_alameda", "hayward": "ca_alameda",
    "berkeley": "ca_alameda", "san leandro": "ca_alameda", "livermore": "ca_alameda",

    "san jose": "ca_santa_clara", "sunnyvale": "ca_santa_clara", "santa clara": "ca_santa_clara",
    "mountain view": "ca_santa_clara", "palo alto": "ca_santa_clara", "milpitas": "ca_santa_clara",

    "fresno": "ca_fresno", "clovis": "ca_fresno",
    "bakersfield": "ca_kern",

    # Texas
    "houston": "tx_harris", "pasadena": "tx_harris", "pearland": "tx_harris",
    "sugar land": "tx_harris", "baytown": "tx_harris", "cypress": "tx_harris",
    "katy": "tx_harris", "spring": "tx_harris", "humble": "tx_harris",

    "dallas": "tx_dallas", "irving": "tx_dallas", "garland": "tx_dallas",
    "mesquite": "tx_dallas", "richardson": "tx_dallas", "carrollton": "tx_dallas",

    "austin": "tx_travis", "round rock": "tx_travis", "cedar park": "tx_travis",
    "pflugerville": "tx_travis", "leander": "tx_travis",

    "san antonio": "tx_bexar",
    "fort worth": "tx_tarrant", "arlington": "tx_tarrant",

    # Florida (all map to statewide)
    "miami": "fl_statewide", "miami beach": "fl_statewide", "fort lauderdale": "fl_statewide",
    "hollywood": "fl_statewide", "hialeah": "fl_statewide", "coral gables": "fl_statewide",
    "tampa": "fl_statewide", "st petersburg": "fl_statewide", "clearwater": "fl_statewide",
    "orlando": "fl_statewide", "jacksonville": "fl_statewide", "tallahassee": "fl_statewide",
    "west palm beach": "fl_statewide", "boca raton": "fl_statewide", "boynton beach": "fl_statewide",
    "naples": "fl_statewide", "fort myers": "fl_statewide", "cape coral": "fl_statewide",
    "sarasota": "fl_statewide", "gainesville": "fl_statewide", "pensacola": "fl_statewide",
    "lakeland": "fl_statewide", "daytona beach": "fl_statewide", "ocala": "fl_statewide",

    # Arizona
    "phoenix": "az_maricopa", "scottsdale": "az_maricopa", "mesa": "az_maricopa",
    "chandler": "az_maricopa", "gilbert": "az_maricopa", "tempe": "az_maricopa",
    "glendale": "az_maricopa", "peoria": "az_maricopa", "surprise": "az_maricopa",

    "tucson": "az_pima",

    # Georgia
    "atlanta": "ga_fulton", "sandy springs": "ga_fulton", "roswell": "ga_fulton",
    "alpharetta": "ga_fulton", "johns creek": "ga_fulton",

    "decatur": "ga_dekalb", "dunwoody": "ga_dekalb", "brookhaven": "ga_dekalb",

    # Nevada
    "las vegas": "nv_clark", "henderson": "nv_clark", "north las vegas": "nv_clark",

    # Washington
    "seattle": "wa_king", "bellevue": "wa_king", "kent": "wa_king",
    "renton": "wa_king", "kirkland": "wa_king", "redmond": "wa_king",

    "tacoma": "wa_pierce", "lakewood": "wa_pierce",

    # Oregon
    "portland": "or_multnomah", "gresham": "or_multnomah",

    # Colorado
    "denver": "co_denver",
    "aurora": "co_arapahoe", "centennial": "co_arapahoe", "littleton": "co_arapahoe",

    # Ohio
    "cleveland": "oh_cuyahoga", "parma": "oh_cuyahoga", "lakewood": "oh_cuyahoga",
    "columbus": "oh_franklin", "dublin": "oh_franklin", "westerville": "oh_franklin",

    # Michigan
    "detroit": "mi_wayne", "dearborn": "mi_wayne", "livonia": "mi_wayne",
    "troy": "mi_oakland", "farmington hills": "mi_oakland", "southfield": "mi_oakland",

    # New Jersey (statewide)
    "newark": "nj_statewide", "jersey city": "nj_statewide", "paterson": "nj_statewide",
    "elizabeth": "nj_statewide", "trenton": "nj_statewide", "camden": "nj_statewide",
    "edison": "nj_statewide", "woodbridge": "nj_statewide", "toms river": "nj_statewide",

    # Illinois
    "chicago": "il_cook", "evanston": "il_cook", "skokie": "il_cook",
    "cicero": "il_cook", "oak lawn": "il_cook", "oak park": "il_cook",

    # North Carolina
    "charlotte": "nc_mecklenburg", "huntersville": "nc_mecklenburg",
    "raleigh": "nc_wake", "cary": "nc_wake", "apex": "nc_wake",

    # Tennessee
    "nashville": "tn_davidson",
    "memphis": "tn_shelby", "germantown": "tn_shelby",

    # Virginia
    "fairfax": "va_fairfax", "reston": "va_fairfax", "vienna": "va_fairfax",

    # Minnesota
    "minneapolis": "mn_hennepin", "bloomington": "mn_hennepin", "eden prairie": "mn_hennepin",

    # Utah
    "salt lake city": "ut_salt_lake", "west valley city": "ut_salt_lake", "sandy": "ut_salt_lake",
}


# Florida county FIPS codes for filtering statewide data
FLORIDA_COUNTY_FIPS = {
    "miami-dade": "086", "broward": "011", "palm beach": "099", "hillsborough": "057",
    "orange": "095", "duval": "031", "pinellas": "103", "lee": "071", "polk": "105",
    "brevard": "009", "volusia": "127", "sarasota": "115", "collier": "021",
    "seminole": "117", "osceola": "097", "pasco": "101", "manatee": "081",
    "st lucie": "111", "marion": "083", "escambia": "033", "leon": "073", "alachua": "001",
}


# ---- Supabase Operations ----

def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def fetch_leads_needing_apn(limit=25, state_filter=None, require_coords=True):
    """
    Fetch leads that are missing APN number.
    Priority: leads with lat/lng (can use spatial query) > leads without.
    """
    url = (
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
        f"?apn_number=is.null"
        f"&enrichment_source=not.in.(apn_attempted,apn_failed)"
        f"&select=id,property_address,city,state,state_abbr,zip_code,lat,lng,county,"
        f"assessed_value,sale_amount,estimated_market_value,enrichment_source"
        f"&limit={limit}"
    )

    if require_coords:
        # Only get leads with coordinates
        url += "&lat=not.is.null&lng=not.is.null"

    if state_filter:
        url += f"&state_abbr=eq.{state_filter}"

    # Order by estimated market value descending (prioritize high-value leads)
    url += "&order=estimated_market_value.desc.nullslast"

    resp = requests.get(url, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()


def update_lead_apn(lead_id: str, data: Dict, dry_run: bool = False) -> bool:
    """Update a lead with APN enrichment data."""
    if dry_run:
        log.info(f"  [DRY RUN] Would update {lead_id[:8]}... with {list(data.keys())}")
        return True

    url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}"
    payload = {
        **data,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    resp = requests.patch(url, json=payload, headers=supabase_headers(), timeout=30)
    resp.raise_for_status()
    return True


# ---- ArcGIS Spatial Query ----

def query_arcgis_by_point(endpoint_config: Dict, lat: float, lng: float) -> Optional[Dict]:
    """
    Query an ArcGIS REST service using a point geometry (lat/lng).
    Returns the first parcel that contains/intersects the point.
    """
    url = endpoint_config["url"]
    apn_field = endpoint_config["apn_field"]
    fields = endpoint_config.get("fields", ["*"])

    # Build geometry parameter - point in WGS84 (EPSG:4326)
    geometry = json.dumps({
        "x": lng,
        "y": lat,
        "spatialReference": {"wkid": 4326}
    })

    params = {
        "geometry": geometry,
        "geometryType": "esriGeometryPoint",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": ",".join(fields) if fields != ["*"] else "*",
        "returnGeometry": "false",
        "f": "json",
        "resultRecordCount": 1,
    }

    # Some services need input/output spatial reference
    if endpoint_config.get("spatial_ref"):
        params["inSR"] = endpoint_config["spatial_ref"]
        params["outSR"] = endpoint_config["spatial_ref"]

    try:
        resp = requests.get(url, params=params, timeout=20, headers={
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
        })
        resp.raise_for_status()
        data = resp.json()

        # Check for ArcGIS errors
        if "error" in data:
            log.debug(f"  ArcGIS error: {data['error']}")
            return None

        features = data.get("features", [])
        if not features:
            return None

        # Get first feature's attributes
        attrs = features[0].get("attributes", {})
        if not attrs:
            return None

        # Build enrichment data
        enrichment = {}

        # APN - try configured field and common alternatives
        apn = attrs.get(apn_field) or attrs.get("APN") or attrs.get("PARCEL_ID") or attrs.get("PIN")
        if apn:
            enrichment["apn_number"] = str(apn).strip()

        # Assessed value - try various field names
        for val_field in ["TOTAL_VALUE", "TOT_VAL", "JV", "AV", "TV", "APPRAISED_VALUE",
                          "ASSESS_LAND", "ASSESS_IMPR", "EST_LAND", "EST_BLDG",
                          "TotalValue", "appraised_value", "APPR_LAND", "APPR_IMPR",
                          "LAND_AV", "BLDG_AV"]:
            if val_field in attrs and attrs[val_field]:
                try:
                    val = float(attrs[val_field])
                    if val > 0:
                        if "assessed_value" in enrichment:
                            enrichment["assessed_value"] += int(val)
                        else:
                            enrichment["assessed_value"] = int(val)
                except (ValueError, TypeError):
                    pass

        # County name from endpoint config
        enrichment["county"] = endpoint_config["name"].replace(" County", "").replace(" (", ", ").replace(")", "")

        return enrichment if enrichment.get("apn_number") else None

    except requests.RequestException as e:
        log.debug(f"  ArcGIS request error: {e}")
        return None
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        log.debug(f"  ArcGIS parse error: {e}")
        return None


def query_florida_statewide(lat: float, lng: float, city: str, address: str = "") -> Optional[Dict]:
    """
    Query Florida statewide cadastral using address-based search.
    The Florida statewide data uses EPSG:3086 (Florida GDL Albers) projection,
    so we use address/city text search instead of coordinate transformation.

    Returns parcel data including APN, assessed value, and property details.
    """
    url = "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query"

    # Map cities to FIPS codes for better filtering
    city_lower = city.lower().strip()
    city_to_fips = {
        "miami": 86, "miami beach": 86, "hialeah": 86, "coral gables": 86, "homestead": 86,
        "fort lauderdale": 11, "hollywood": 11, "pembroke pines": 11, "coral springs": 11,
        "west palm beach": 99, "boca raton": 99, "boynton beach": 99, "delray beach": 99,
        "tampa": 57, "plant city": 57, "brandon": 57,
        "orlando": 95, "winter park": 95, "apopka": 95,
        "jacksonville": 31, "jacksonville beach": 31,
        "st petersburg": 103, "clearwater": 103, "largo": 103,
        "naples": 21, "marco island": 21,
        "fort myers": 71, "cape coral": 71, "lehigh acres": 71,
        "sarasota": 115, "venice": 115,
        "tallahassee": 73,
        "gainesville": 1,
        "pensacola": 33,
        "lakeland": 105, "winter haven": 105,
        "daytona beach": 127, "port orange": 127,
        "ocala": 83,
        "kissimmee": 97, "st cloud": 97,
    }

    county_fips = city_to_fips.get(city_lower)

    # Strategy 1: Search by street number and city
    # Extract street number from address
    addr_upper = address.upper().strip()
    match = re.match(r"(\d+)\s+(.+)", addr_upper)
    street_num = match.group(1) if match else ""
    street_rest = match.group(2)[:15] if match else addr_upper[:15]

    # Build WHERE clause for text search
    # Note: Florida API has issues combining LIKE with AND clauses
    # So we do simpler queries and filter results in Python
    if street_num:
        # Search by street number prefix only
        where_clause = f"PHY_ADDR1 LIKE '{street_num}%'"
    elif county_fips:
        where_clause = f"CO_NO={county_fips}"
    else:
        # Last resort - search by city
        city_upper = city.upper().strip()
        where_clause = f"PHY_CITY LIKE '%{city_upper}%'"

    # Fields that actually exist in the Florida cadastral layer
    out_fields = "PARCEL_ID,PHY_ADDR1,PHY_CITY,PHY_ZIPCD,OWN_NAME,JV,TOT_LVG_AR,LND_SQFOOT,ACT_YR_BLT,EFF_YR_BLT,CO_NO"

    params = {
        "where": where_clause,
        "outFields": out_fields,
        "returnGeometry": "false",
        "f": "json",
        "resultRecordCount": 10,  # Get several to find best match
    }

    try:
        log.debug(f"  Florida query: where={where_clause}")
        resp = requests.get(url, params=params, timeout=60, headers={
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
        })
        log.debug(f"  Florida URL: {resp.url}")
        resp.raise_for_status()
        data = resp.json()

        if "error" in data:
            log.debug(f"  Florida API error: {data['error']}")
            return None

        features = data.get("features", [])

        # If we searched by street number, filter by county FIPS in Python
        if county_fips and features:
            features = [f for f in features if f.get("attributes", {}).get("CO_NO") == county_fips]

        if not features:
            # Try broader search with just county FIPS
            if county_fips:
                params2 = {
                    "where": f"CO_NO={county_fips}",
                    "outFields": out_fields,
                    "returnGeometry": "false",
                    "f": "json",
                    "resultRecordCount": 1,
                }
                resp = requests.get(url, params=params2, timeout=45, headers={
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
                })
                resp.raise_for_status()
                data = resp.json()
                if "error" not in data:
                    features = data.get("features", [])

            if not features:
                return None

        # Find best match by comparing street address
        best = features[0].get("attributes", {})
        best_score = 0

        for feat in features:
            attrs = feat.get("attributes", {})
            phy_addr = (attrs.get("PHY_ADDR1") or "").upper()

            # Score match
            score = 0
            if street_num and phy_addr.startswith(street_num):
                score += 50
            # Check if street name matches
            if street_rest:
                street_words = street_rest.split()
                for word in street_words[:2]:
                    if len(word) > 2 and word in phy_addr:
                        score += 20
            # Bonus for matching county
            if county_fips and attrs.get("CO_NO") == county_fips:
                score += 30

            if score > best_score:
                best_score = score
                best = attrs

        enrichment = {}

        # APN
        parcel_id = best.get("PARCEL_ID")
        if parcel_id:
            enrichment["apn_number"] = str(parcel_id).strip()

        # Assessed value (Just Value is market value estimate)
        jv = best.get("JV") or best.get("TV") or best.get("AV")
        if jv:
            try:
                enrichment["assessed_value"] = int(float(jv))
            except (ValueError, TypeError):
                pass

        # Square footage
        sqft = best.get("TOT_LVG_AR")
        if sqft:
            try:
                val = int(sqft)
                if 100 < val < 100000:
                    enrichment["square_footage"] = val
            except (ValueError, TypeError):
                pass

        # Year built
        year = best.get("ACT_YR_BLT") or best.get("EFF_YR_BLT")
        if year:
            try:
                yr = int(year)
                if 1800 < yr < 2030:
                    enrichment["year_built"] = yr
            except (ValueError, TypeError):
                pass

        # Lot size
        lot = best.get("LND_SQFOOT")
        if lot:
            try:
                val = int(lot)
                if val > 0:
                    if val > 43560:
                        enrichment["lot_size"] = f"{val / 43560:.2f} acres"
                    else:
                        enrichment["lot_size"] = f"{val:,} sq ft"
            except (ValueError, TypeError):
                pass

        # County name from FIPS code
        co_no = best.get("CO_NO")
        if co_no:
            fips_to_name = {v: k for k, v in FLORIDA_COUNTY_FIPS.items()}
            county_name = fips_to_name.get(str(int(co_no)).zfill(3), "Florida")
            enrichment["county"] = county_name.replace("-", " ").title()
        else:
            enrichment["county"] = "Florida"

        return enrichment if enrichment.get("apn_number") else None

    except Exception as e:
        log.debug(f"  Florida statewide error: {e}")
        return None


# ---- LA County Assessor API (Address-based fallback) ----

def query_la_county_by_address(address: str, city: str) -> Optional[Dict]:
    """
    Query LA County Assessor API by address.
    This is a fallback for when spatial query fails.
    """
    search_query = f"{address}, {city}"

    try:
        # Search for property
        search_url = "https://portal.assessor.lacounty.gov/api/search"
        resp = requests.get(
            search_url,
            params={"search": search_query},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        parcels = data.get("Parcels", [])
        if not parcels:
            return None

        # Find best match
        addr_upper = address.upper().strip()
        best_ain = None
        for parcel in parcels[:10]:
            situs = parcel.get("SitusStreet", "").upper().strip()
            if situs == addr_upper:
                best_ain = parcel.get("AIN")
                break

        if not best_ain:
            best_ain = parcels[0].get("AIN")

        if not best_ain:
            return None

        # Get detailed parcel data
        detail_url = "https://portal.assessor.lacounty.gov/api/parceldetail"
        resp2 = requests.get(
            detail_url,
            params={"ain": best_ain},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        resp2.raise_for_status()
        detail = resp2.json()

        parcel_detail = detail.get("Parcel", detail)
        if not parcel_detail:
            return None

        enrichment = {}

        # APN
        ain = parcel_detail.get("AIN")
        if ain:
            enrichment["apn_number"] = str(ain)

        # Assessed value
        land_val = parcel_detail.get("CurrentRoll_LandValue") or 0
        imp_val = parcel_detail.get("CurrentRoll_ImpValue") or 0
        total = int(land_val) + int(imp_val)
        if total > 0:
            enrichment["assessed_value"] = total

        # Tax amount
        tax = parcel_detail.get("TaxAmount")
        if tax:
            try:
                enrichment["tax_amount"] = float(tax)
            except (ValueError, TypeError):
                pass

        # County
        enrichment["county"] = "Los Angeles"

        # Additional property data
        sqft = parcel_detail.get("SqftMain")
        if sqft and int(sqft) > 0:
            enrichment["square_footage"] = int(sqft)

        beds = parcel_detail.get("NumOfBeds")
        if beds and int(beds) > 0:
            enrichment["bedrooms"] = int(beds)

        baths = parcel_detail.get("NumOfBaths")
        if baths and int(baths) > 0:
            enrichment["bathrooms"] = int(baths)

        year = parcel_detail.get("YearBuilt")
        if year:
            try:
                yr = int(year)
                if 1800 < yr < 2030:
                    enrichment["year_built"] = yr
            except (ValueError, TypeError):
                pass

        return enrichment if enrichment.get("apn_number") else None

    except Exception as e:
        log.debug(f"  LA County address search error: {e}")
        return None


# ---- NYC PLUTO API ----

NYC_BOROUGHS = {
    "brooklyn": "BK", "new york": "MN", "manhattan": "MN",
    "queens": "QN", "bronx": "BX", "the bronx": "BX", "staten island": "SI",
}

def query_nyc_pluto(lat: float, lng: float, city: str) -> Optional[Dict]:
    """
    Query NYC PLUTO data using coordinates.
    NYC has great open data via Socrata API.
    """
    city_lower = city.lower().strip()
    borough_code = NYC_BOROUGHS.get(city_lower)
    if not borough_code:
        return None

    # Use PLUTO API with spatial query
    # NYC uses a different approach - query by bounding box around point
    buffer = 0.0002  # ~20 meters

    url = "https://data.cityofnewyork.us/resource/64uk-42ks.json"
    params = {
        "$where": f"borough = '{borough_code}' AND within_box(geom, {lat-buffer}, {lng-buffer}, {lat+buffer}, {lng+buffer})",
        "$limit": 5,
        "$select": "bbl,address,zipcode,bldgarea,lotarea,numfloors,yearbuilt,assesstot,ownername"
    }

    try:
        resp = requests.get(url, params=params, timeout=15, headers={"Accept": "application/json"})
        resp.raise_for_status()
        data = resp.json()

        if not data:
            # Try without spatial filter
            params["$where"] = f"borough = '{borough_code}'"
            params["$limit"] = 1
            resp = requests.get(url, params=params, timeout=15, headers={"Accept": "application/json"})
            data = resp.json()

        if not data:
            return None

        row = data[0]
        enrichment = {}

        # BBL as APN
        bbl = row.get("bbl")
        if bbl:
            enrichment["apn_number"] = str(bbl).replace(".0", "")

        # Assessed value
        assessed = row.get("assesstot")
        if assessed:
            try:
                enrichment["assessed_value"] = int(float(assessed))
            except (ValueError, TypeError):
                pass

        # County (borough name)
        borough_names = {"BK": "Brooklyn", "MN": "Manhattan", "QN": "Queens", "BX": "Bronx", "SI": "Staten Island"}
        enrichment["county"] = borough_names.get(borough_code, "New York City")

        # Additional property data
        sqft = row.get("bldgarea")
        if sqft:
            try:
                val = int(float(sqft))
                if val > 0:
                    enrichment["square_footage"] = val
            except (ValueError, TypeError):
                pass

        lot = row.get("lotarea")
        if lot:
            try:
                val = int(float(lot))
                if val > 0:
                    enrichment["lot_size"] = f"{val:,} sq ft"
            except (ValueError, TypeError):
                pass

        year = row.get("yearbuilt")
        if year:
            try:
                yr = int(year)
                if 1800 < yr < 2030:
                    enrichment["year_built"] = yr
            except (ValueError, TypeError):
                pass

        return enrichment if enrichment.get("apn_number") else None

    except Exception as e:
        log.debug(f"  NYC PLUTO error: {e}")
        return None


# ---- Main Enrichment Logic ----

def get_gis_endpoint_for_lead(city: str, state_abbr: str) -> Optional[str]:
    """Determine the best GIS endpoint for a given city/state."""
    city_lower = city.lower().strip()

    # Direct city lookup
    endpoint_key = CITY_TO_GIS_ENDPOINT.get(city_lower)
    if endpoint_key:
        return endpoint_key

    # State-level fallbacks
    if state_abbr == "FL":
        return "fl_statewide"
    if state_abbr == "NJ":
        return "nj_statewide"

    return None


def enrich_single_lead_apn(lead: Dict, dry_run: bool = False) -> Tuple[bool, str]:
    """
    Enrich a single lead with APN and county assessor data.
    Returns (success, source) tuple.
    """
    lead_id = lead["id"]
    address = lead["property_address"]
    city = lead["city"]
    state_abbr = lead.get("state_abbr", "")
    lat = lead.get("lat")
    lng = lead.get("lng")

    log.info(f"Enriching APN: {address}, {city}, {state_abbr}")

    enrichment = None
    source = "none"

    # Strategy 1: Spatial query using lat/lng (most accurate)
    if lat and lng:
        # Get the right GIS endpoint
        endpoint_key = get_gis_endpoint_for_lead(city, state_abbr)

        if endpoint_key:
            endpoint_config = COUNTY_GIS_ENDPOINTS.get(endpoint_key)

            if endpoint_config:
                log.debug(f"  Using endpoint: {endpoint_config['name']}")

                # Special handling for Florida statewide
                if endpoint_key == "fl_statewide":
                    enrichment = query_florida_statewide(lat, lng, city, address)
                    if enrichment:
                        source = "florida_cadastral"
                else:
                    enrichment = query_arcgis_by_point(endpoint_config, lat, lng)
                    if enrichment:
                        source = f"arcgis_{endpoint_key}"

        # Try NYC PLUTO for NY addresses
        if not enrichment and state_abbr == "NY":
            enrichment = query_nyc_pluto(lat, lng, city)
            if enrichment:
                source = "nyc_pluto"

    # Strategy 2: Address-based lookup (fallback)
    if not enrichment:
        city_lower = city.lower().strip()

        # LA County has a good address-based API - ONLY use for LA County cities
        la_county_cities = {
            "los angeles", "studio city", "woodland hills", "venice", "encino",
            "north hollywood", "van nuys", "sherman oaks", "tarzana", "reseda",
            "canoga park", "chatsworth", "northridge", "sylmar", "sun valley",
            "panorama city", "arleta", "pacoima", "lake balboa", "granada hills",
            "porter ranch", "west hills", "burbank", "glendale", "pasadena",
            "altadena", "south pasadena", "san marino", "la canada flintridge",
            "long beach", "torrance", "carson", "compton", "lynwood", "south gate",
            "downey", "norwalk", "whittier", "la mirada", "cerritos", "lakewood",
            "santa monica", "beverly hills", "west hollywood", "culver city",
            "inglewood", "hawthorne", "gardena", "redondo beach", "hermosa beach",
            "manhattan beach", "el segundo", "malibu", "calabasas", "hidden hills",
            "agoura hills", "westlake village", "pomona", "claremont", "diamond bar",
            "walnut", "west covina", "covina", "baldwin park", "el monte",
            "santa clarita", "valencia", "newhall", "palmdale", "lancaster",
        }

        if city_lower in la_county_cities:
            enrichment = query_la_county_by_address(address, city)
            if enrichment:
                source = "la_county_api"

    # Update database
    if enrichment and enrichment.get("apn_number"):
        enrichment["enrichment_source"] = f"apn_{source}"

        # Recalculate overage if we got new assessed value
        sale_amount = lead.get("sale_amount") or 0
        assessed_val = enrichment.get("assessed_value", 0)
        market_value = lead.get("estimated_market_value") or 0

        if sale_amount > 0 and assessed_val > 0 and not market_value:
            enrichment["estimated_market_value"] = assessed_val
            overage = max(0, sale_amount - assessed_val * 0.8)
            if overage > 0:
                enrichment["overage_amount"] = round(overage)

        try:
            update_lead_apn(lead_id, enrichment, dry_run)
            log.info(f"  SUCCESS: APN={enrichment['apn_number']}, County={enrichment.get('county', 'N/A')}, "
                     f"Value=${enrichment.get('assessed_value', 0):,}")
            return True, source
        except Exception as e:
            log.error(f"  Failed to update {lead_id}: {e}")
            return False, "error"
    else:
        # Mark as attempted so we don't retry
        log.warning(f"  No APN found for {address}")
        update_lead_apn(lead_id, {"enrichment_source": "apn_attempted"}, dry_run)
        return False, "none"


def run(args):
    """Main entry point."""
    start = datetime.now(timezone.utc)
    log.info(f"=== APN Enrichment started at {start.isoformat()} ===")
    log.info(f"Batch size: {args.batch_size}, Delay: {args.delay}s, "
             f"Max leads: {args.max_leads}, Dry run: {args.dry_run}, "
             f"State filter: {args.state or 'ALL'}, Require coords: {not args.no_coords}")

    # Show available endpoints
    log.info(f"Available GIS endpoints: {len(COUNTY_GIS_ENDPOINTS)}")

    total_enriched = 0
    total_failed = 0
    total_processed = 0
    source_counts = {}

    while total_processed < args.max_leads:
        remaining = args.max_leads - total_processed
        batch_size = min(args.batch_size, remaining)

        try:
            leads = fetch_leads_needing_apn(
                batch_size,
                state_filter=args.state,
                require_coords=not args.no_coords
            )
        except Exception as e:
            log.error(f"Failed to fetch leads: {e}")
            break

        if not leads:
            log.info("No more leads needing APN enrichment")
            break

        log.info(f"\nProcessing batch of {len(leads)} leads...")

        for i, lead in enumerate(leads, 1):
            total_processed += 1
            city = lead.get("city", "")
            state = lead.get("state_abbr", "")
            has_coords = bool(lead.get("lat") and lead.get("lng"))
            log.info(f"Lead {i}/{len(leads)}: {lead['property_address'][:40]} ({city}, {state}) [coords: {has_coords}]")

            try:
                success, source = enrich_single_lead_apn(lead, dry_run=args.dry_run)
                if success:
                    total_enriched += 1
                    source_counts[source] = source_counts.get(source, 0) + 1
                else:
                    total_failed += 1
            except Exception as e:
                log.error(f"Error processing lead {lead['id']}: {e}")
                total_failed += 1

            if total_processed >= args.max_leads:
                break

            # Small delay between leads for API rate limiting
            time.sleep(random.uniform(0.3, 0.8))

        # Delay between batches
        if total_processed < args.max_leads and leads:
            log.info(f"Batch complete. Sleeping for {args.delay} seconds...")
            time.sleep(args.delay)

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    log.info(f"\n=== APN Enrichment complete ===")
    log.info(f"Processed: {total_processed}, Enriched: {total_enriched}, "
             f"Failed: {total_failed}, Time: {elapsed:.0f}s")
    log.info(f"Success rate: {total_enriched/total_processed*100:.1f}%" if total_processed > 0 else "N/A")
    log.info(f"Sources: {source_counts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="APN enrichment for foreclosure leads")
    parser.add_argument("--batch-size", type=int, default=25, help="Leads per batch")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between batches (seconds)")
    parser.add_argument("--max-leads", type=int, default=100, help="Max leads to process")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to database")
    parser.add_argument("--state", type=str, default=None, help="Filter by state (e.g. CA, FL, TX)")
    parser.add_argument("--no-coords", action="store_true", help="Include leads without coordinates")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    if args.verbose:
        log.setLevel(logging.DEBUG)

    run(args)
