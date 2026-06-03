#!/usr/bin/env python3
"""
Real Foreclosure Lead Scraper - FREE Sources

Scrapes actual foreclosure data from:
1. County excess funds lists (tax sale overages)
2. auction.com (mortgage foreclosures)
3. Trustee websites (Judicial Sales Corp, Stox Quickbase)
4. County assessor sites (property details from parcel numbers)

Based on Foreclosure Academy methodology.

Usage:
    python real_foreclosure_scraper.py --source auction --state CA --limit 100
    python real_foreclosure_scraper.py --source county --county "Los Angeles" --state CA
    python real_foreclosure_scraper.py --source trustee --trustee judicial_sales

Environment:
    SUPABASE_URL, SUPABASE_SERVICE_KEY, TWOCAPTCHA_API_KEY
"""

import os
import re
import sys
import json
import time
import random
import logging
import argparse
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import quote_plus, urlencode
from typing import Dict, List, Optional, Tuple, Any

import requests
from bs4 import BeautifulSoup

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://foreclosure-db.alwaysencrypted.com")
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
)
TWOCAPTCHA_API_KEY = os.getenv("TWOCAPTCHA_API_KEY", "8a0864545fcb5a34406bc9aa9af38288")
CRAWL4AI_URL = os.getenv("CRAWL4AI_URL", "https://crawl4ai.alwaysencrypted.com")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("real_foreclosure_scraper")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

# ============================================================================
# COUNTY EXCESS FUNDS SOURCES
# Search: "county name" + "excess funds" / "overbids" / "surplus funds"
# ============================================================================

COUNTY_EXCESS_FUNDS_URLS = {
    # ========================================================================
    # GEORGIA - Aggregator with 158 counties
    # ========================================================================
    "georgia_all": {
        "url": "https://www.ealbertlaw.com/blog/excess-funds-list-georgia-counties",
        "type": "aggregator",
        "state": "GA"
    },
    "fulton_ga": {
        "url": "https://fultonassessor.org/wp-content/uploads/sites/50/2021/01/unclaimedfunds.pdf",
        "type": "pdf",
        "state": "GA"
    },
    "gwinnett_ga": {
        "url": "https://www.gwinnetttaxcommissioner.com/property-tax/tax-sale-excess-funds",
        "type": "html_table",
        "state": "GA"
    },
    "dekalb_ga": {
        "url": "https://www.dekalbcountyga.gov/tax-commissioner/excess-funds",
        "type": "html_table",
        "state": "GA"
    },
    # ========================================================================
    # CALIFORNIA (excluded from expansion but keeping existing entries)
    # ========================================================================
    "los_angeles_ca": {
        "url": "https://ttc.lacounty.gov/excess-proceeds/",
        "type": "pdf_list",
        "state": "CA"
    },
    "orange_ca": {
        "url": "https://www.ocgov.com/gov/ttc/proptax/excessproceeds",
        "type": "html_table",
        "state": "CA"
    },
    "san_diego_ca": {
        "url": "https://www.sdttc.com/content/ttc/en/tax-collection/excess-proceeds.html",
        "type": "pdf_list",
        "state": "CA"
    },
    # ========================================================================
    # FLORIDA
    # ========================================================================
    "miami_dade_fl": {
        "url": "https://www.miamidade.gov/global/finance/taxdeeds/excess-funds.page",
        "type": "html_table",
        "state": "FL"
    },
    "broward_fl": {
        "url": "https://www.broward.org/RecordsTaxesTreasury/ExcessFunds/Pages/default.aspx",
        "type": "html_table",
        "state": "FL"
    },
    "hillsborough_fl": {
        "url": "https://www.hillsclerk.com/Records-and-Tax-Services/Tax-Deeds/Tax-Deed-Surplus",
        "type": "html_table",
        "state": "FL"
    },
    # ========================================================================
    # TEXAS
    # ========================================================================
    "harris_tx": {
        "url": "https://www.hctx.net/constables/pct1/excessfunds.aspx",
        "type": "html_table",
        "state": "TX"
    },
    "dallas_tx": {
        "url": "https://www.dallascounty.org/departments/tax/excess-proceeds.php",
        "type": "html_table",
        "state": "TX"
    },
    "tarrant_tx": {
        "url": "https://www.tarrantcounty.com/en/tax/tax-sale/excess-proceeds.html",
        "type": "html_table",
        "state": "TX"
    },
    # ========================================================================
    # ARIZONA
    # ========================================================================
    "maricopa_az": {
        "url": "https://treasurer.maricopa.gov/excess-proceeds/",
        "type": "html_table",
        "state": "AZ"
    },
    "pima_az": {
        "url": "https://www.pima.gov/1866/Tax-Lien-Sale",
        "type": "html_table",
        "state": "AZ"
    },
    "pinal_az": {
        "url": "https://www.pinalcountyaz.gov/Treasurer/Pages/TaxLienSale.aspx",
        "type": "html_table",
        "state": "AZ"
    },
    # ========================================================================
    # ILLINOIS
    # ========================================================================
    "cook_il": {
        "url": "https://www.cookcountytreasurer.com/scavengersales.aspx",
        "type": "html_table",
        "state": "IL"
    },
    "dupage_il": {
        "url": "https://www.dupagecounty.gov/treasurer/tax_sale.php",
        "type": "html_table",
        "state": "IL"
    },
    "lake_il": {
        "url": "https://www.lakecountyil.gov/4394/Annual-Tax-Sale",
        "type": "html_table",
        "state": "IL"
    },
    # ========================================================================
    # ALABAMA (AL)
    # ========================================================================
    "jefferson_al": {
        "url": "https://www.jccal.org/Default.asp?ID=2350&pg=Tax",
        "type": "html_table",
        "state": "AL"
    },
    "mobile_al": {
        "url": "https://www.mobilecountyal.gov/government/departments/revenue/tax-sales/",
        "type": "html_table",
        "state": "AL"
    },
    "madison_al": {
        "url": "https://www.madisoncountyal.gov/departments/tax-collector/tax-sale",
        "type": "html_table",
        "state": "AL"
    },
    # ========================================================================
    # ALASKA (AK)
    # ========================================================================
    "anchorage_ak": {
        "url": "https://www.muni.org/Departments/finance/treasury/Pages/TaxForeclosure.aspx",
        "type": "html_table",
        "state": "AK"
    },
    "fairbanks_ak": {
        "url": "https://www.fnsb.gov/291/Foreclosure",
        "type": "html_table",
        "state": "AK"
    },
    "matanuska_susitna_ak": {
        "url": "https://www.matsugov.us/finance/property-tax-foreclosure",
        "type": "html_table",
        "state": "AK"
    },
    # ========================================================================
    # COLORADO (CO)
    # ========================================================================
    "denver_co": {
        "url": "https://denver.prelive.opencities.com/files/assets/public/v/7/clerk-and-recorder/documents/foreclosures/forms/4001_pt_excessfundsclaimform.pdf",
        "type": "pdf",
        "state": "CO"
    },
    "arapahoe_co": {
        "url": "https://www.arapahoeco.gov/your_county/county_departments/public_trustee/foreclosures/overbid_information.php",
        "type": "html_table",
        "state": "CO"
    },
    "el_paso_co": {
        "url": "https://treasurer.elpasoco.com/tax-lien-sale/",
        "type": "html_table",
        "state": "CO"
    },
    # ========================================================================
    # CONNECTICUT (CT)
    # ========================================================================
    "fairfield_ct": {
        "url": "https://sso.eservices.jud.ct.gov/foreclosures/Public/PendPostbyTownList.aspx",
        "type": "html_table",
        "state": "CT"
    },
    "hartford_ct": {
        "url": "https://sso.eservices.jud.ct.gov/foreclosures/Public/PendPostbyTownList.aspx",
        "type": "html_table",
        "state": "CT"
    },
    "new_haven_ct": {
        "url": "https://sso.eservices.jud.ct.gov/foreclosures/Public/PendPostbyTownList.aspx",
        "type": "html_table",
        "state": "CT"
    },
    # ========================================================================
    # DELAWARE (DE)
    # ========================================================================
    "new_castle_de": {
        "url": "https://www.nccde.org/389/Sheriff-Sales",
        "type": "html_table",
        "state": "DE"
    },
    "kent_de": {
        "url": "https://www.co.kent.de.us/sheriff/sales.aspx",
        "type": "html_table",
        "state": "DE"
    },
    "sussex_de": {
        "url": "https://sussexcountyde.gov/sheriff-sales",
        "type": "html_table",
        "state": "DE"
    },
    # ========================================================================
    # DISTRICT OF COLUMBIA (DC)
    # ========================================================================
    "dc_dc": {
        "url": "https://otr.cfo.dc.gov/page/real-property-tax-sale",
        "type": "html_table",
        "state": "DC"
    },
    # ========================================================================
    # HAWAII (HI)
    # ========================================================================
    "honolulu_hi": {
        "url": "https://www.honolulu.gov/budget/realproperty/rp-tax-sale.html",
        "type": "html_table",
        "state": "HI"
    },
    "hawaii_hi": {
        "url": "https://www.hawaiicounty.gov/departments/finance/real-property-tax/tax-sale",
        "type": "html_table",
        "state": "HI"
    },
    "maui_hi": {
        "url": "https://www.mauicounty.gov/1889/Tax-Sale",
        "type": "html_table",
        "state": "HI"
    },
    # ========================================================================
    # IDAHO (ID)
    # ========================================================================
    "ada_id": {
        "url": "https://adacounty.id.gov/treasurer/tax-deed-sales/",
        "type": "html_table",
        "state": "ID"
    },
    "canyon_id": {
        "url": "https://www.canyoncounty.id.gov/elected-officials/treasurer/tax-deed-sales",
        "type": "html_table",
        "state": "ID"
    },
    "kootenai_id": {
        "url": "https://www.kcgov.us/departments/treasurer/tax-deed-sales",
        "type": "html_table",
        "state": "ID"
    },
    # ========================================================================
    # INDIANA (IN)
    # ========================================================================
    "marion_in": {
        "url": "https://www.indy.gov/activity/prepare-for-a-tax-sale",
        "type": "html_table",
        "state": "IN"
    },
    "lake_in": {
        "url": "https://www.lakecountyin.org/departments/auditor/tax_sale.php",
        "type": "html_table",
        "state": "IN"
    },
    "hamilton_in": {
        "url": "https://www.hamiltoncounty.in.gov/452/Real-Property-Tax-Sale",
        "type": "html_table",
        "state": "IN"
    },
    # ========================================================================
    # IOWA (IA)
    # ========================================================================
    "polk_ia": {
        "url": "https://www.polkcountyiowa.gov/treasurer/tax-sale/",
        "type": "html_table",
        "state": "IA"
    },
    "linn_ia": {
        "url": "https://www.linncountyiowa.gov/434/Tax-Sale",
        "type": "html_table",
        "state": "IA"
    },
    "scott_ia": {
        "url": "https://www.scottcountyiowa.gov/treasurer/tax-sale",
        "type": "html_table",
        "state": "IA"
    },
    # ========================================================================
    # KANSAS (KS)
    # ========================================================================
    "johnson_ks": {
        "url": "https://www.jocogov.org/dept/treasury-and-financial-management/tax-sale",
        "type": "html_table",
        "state": "KS"
    },
    "sedgwick_ks": {
        "url": "https://www.sedgwickcounty.org/treasurer/tax-sales/",
        "type": "html_table",
        "state": "KS"
    },
    "wyandotte_ks": {
        "url": "https://www.wycokck.org/Departments/Treasurer/Tax-Sale",
        "type": "html_table",
        "state": "KS"
    },
    # ========================================================================
    # KENTUCKY (KY)
    # ========================================================================
    "jefferson_ky": {
        "url": "https://www.jeffersoncountyclerk.org/2022-jefferson-county-delinquent-property-listing/",
        "type": "html_table",
        "state": "KY"
    },
    "fayette_ky": {
        "url": "https://www.fayettecountypay.com/tax-sales.html",
        "type": "html_table",
        "state": "KY"
    },
    "kenton_ky": {
        "url": "https://kentoncountykyclerk.com/delinquent-property-tax/",
        "type": "html_table",
        "state": "KY"
    },
    # ========================================================================
    # LOUISIANA (LA)
    # ========================================================================
    "east_baton_rouge_la": {
        "url": "https://www.brla.gov/455/Adjudicated-Property",
        "type": "html_table",
        "state": "LA"
    },
    "jefferson_la": {
        "url": "https://www.jeffparish.gov/337/Surplus-Property-Division",
        "type": "html_table",
        "state": "LA"
    },
    "orleans_la": {
        "url": "https://www.nolaassessor.com/",
        "type": "html_table",
        "state": "LA"
    },
    # ========================================================================
    # MAINE (ME)
    # ========================================================================
    "cumberland_me": {
        "url": "https://www.cumberlandcounty.org/388/Tax-Acquired-Property",
        "type": "html_table",
        "state": "ME"
    },
    "york_me": {
        "url": "https://www.yorkcountymaine.gov/departments/tax_collector/index.php",
        "type": "html_table",
        "state": "ME"
    },
    "penobscot_me": {
        "url": "https://www.penobscot-county.net/treasurer",
        "type": "html_table",
        "state": "ME"
    },
    # ========================================================================
    # MARYLAND (MD)
    # ========================================================================
    "baltimore_county_md": {
        "url": "https://www.baltimorecountymd.gov/departments/budfin/taxpayer-services/tax-sale",
        "type": "html_table",
        "state": "MD"
    },
    "montgomery_md": {
        "url": "https://www.montgomerycountymd.gov/Finance/TaxSale-general.html",
        "type": "html_table",
        "state": "MD"
    },
    "prince_georges_md": {
        "url": "https://www.princegeorgescountymd.gov/435/Tax-Sale",
        "type": "html_table",
        "state": "MD"
    },
    # ========================================================================
    # MASSACHUSETTS (MA)
    # ========================================================================
    "middlesex_ma": {
        "url": "https://www.mass.gov/info-details/massachusetts-law-about-mortgage-foreclosure",
        "type": "html_table",
        "state": "MA"
    },
    "worcester_ma": {
        "url": "https://www.worcesterma.gov/finance/liens-auctions/public-auctions/tax-foreclosures",
        "type": "html_table",
        "state": "MA"
    },
    "suffolk_ma": {
        "url": "https://www.cityofboston.gov/treasury/collecting/",
        "type": "html_table",
        "state": "MA"
    },
    # ========================================================================
    # MICHIGAN (MI)
    # ========================================================================
    "wayne_mi": {
        "url": "https://www.waynecounty.com/elected/treasurer/property-tax-auction.aspx",
        "type": "html_table",
        "state": "MI"
    },
    "oakland_mi": {
        "url": "https://www.oakgov.com/government/oakland-county-treasurer-s-office/property-taxes/property-tax-foreclosure-surplus-claims",
        "type": "html_table",
        "state": "MI"
    },
    "macomb_mi": {
        "url": "https://www.macombgov.org/departments/treasurers-office/tax-foreclosure/auction-and-claims",
        "type": "html_table",
        "state": "MI"
    },
    # ========================================================================
    # MINNESOTA (MN)
    # ========================================================================
    "hennepin_mn": {
        "url": "https://www.hennepin.us/residents/property/tax-forfeited-land",
        "type": "html_table",
        "state": "MN"
    },
    "ramsey_mn": {
        "url": "https://www.ramseycounty.us/residents/property-home/property-taxes/tax-forfeited-properties",
        "type": "html_table",
        "state": "MN"
    },
    "dakota_mn": {
        "url": "https://www.co.dakota.mn.us/HomeProperty/PropertyTaxes/TaxForfeiture/Pages/default.aspx",
        "type": "html_table",
        "state": "MN"
    },
    # ========================================================================
    # MISSISSIPPI (MS)
    # ========================================================================
    "hinds_ms": {
        "url": "https://www.hindscountyms.com/departments/tax-collector/tax-sale",
        "type": "html_table",
        "state": "MS"
    },
    "harrison_ms": {
        "url": "https://www.co.harrison.ms.us/departments/tax-collector",
        "type": "html_table",
        "state": "MS"
    },
    "desoto_ms": {
        "url": "https://www.desotocountyms.gov/departments/tax-collector/tax-sale",
        "type": "html_table",
        "state": "MS"
    },
    # ========================================================================
    # MISSOURI (MO)
    # ========================================================================
    "jackson_mo": {
        "url": "https://www.16thcircuit.org/excess-proceeds",
        "type": "html_table",
        "state": "MO"
    },
    "st_louis_county_mo": {
        "url": "https://revenue.stlouisco.com/Collection/Delinquent-Tax-Sale/",
        "type": "html_table",
        "state": "MO"
    },
    "st_charles_mo": {
        "url": "https://www.sccmo.org/689/Tax-Sales",
        "type": "html_table",
        "state": "MO"
    },
    # ========================================================================
    # MONTANA (MT)
    # ========================================================================
    "yellowstone_mt": {
        "url": "https://www.yellowstonecountymt.gov/treasurer/tax_lien_sales.asp",
        "type": "html_table",
        "state": "MT"
    },
    "missoula_mt": {
        "url": "https://www.missoulacounty.us/government/administration/treasurer/tax-lien-sale",
        "type": "html_table",
        "state": "MT"
    },
    "gallatin_mt": {
        "url": "https://gallatincomt.virtualtownhall.net/treasurer/tax-lien-sale",
        "type": "html_table",
        "state": "MT"
    },
    # ========================================================================
    # NEBRASKA (NE)
    # ========================================================================
    "douglas_ne": {
        "url": "https://www.douglascounty-ne.gov/government/departments/treasurer/tax-sale",
        "type": "html_table",
        "state": "NE"
    },
    "lancaster_ne": {
        "url": "https://www.lancaster.ne.gov/363/Tax-Sale",
        "type": "html_table",
        "state": "NE"
    },
    "sarpy_ne": {
        "url": "https://www.sarpy.gov/260/Tax-Sale",
        "type": "html_table",
        "state": "NE"
    },
    # ========================================================================
    # NEVADA (NV)
    # ========================================================================
    "clark_nv": {
        "url": "https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/excess-proceeds",
        "type": "html_table",
        "state": "NV"
    },
    "washoe_nv": {
        "url": "https://www.washoecounty.gov/treas/TaxSale.php",
        "type": "html_table",
        "state": "NV"
    },
    "nye_nv": {
        "url": "https://www.nyecountynv.gov/1037/Excess-Proceeds",
        "type": "html_table",
        "state": "NV"
    },
    # ========================================================================
    # NEW HAMPSHIRE (NH)
    # ========================================================================
    "hillsborough_nh": {
        "url": "https://www.manchesternh.gov/Departments/Tax-Collector",
        "type": "html_table",
        "state": "NH"
    },
    "rockingham_nh": {
        "url": "https://www.co.rockingham.nh.us/departments/registry_of_deeds/index.php",
        "type": "html_table",
        "state": "NH"
    },
    "merrimack_nh": {
        "url": "https://www.concordnh.gov/241/Tax-Collector",
        "type": "html_table",
        "state": "NH"
    },
    # ========================================================================
    # NEW JERSEY (NJ)
    # ========================================================================
    "bergen_nj": {
        "url": "https://www.njcourts.gov/sites/default/files/courts/superior-court-clerks-office/superiorcourttrustfund.pdf",
        "type": "pdf",
        "state": "NJ"
    },
    "essex_nj": {
        "url": "https://www.essexsheriff.com/sheriffs-sale/",
        "type": "html_table",
        "state": "NJ"
    },
    "hudson_nj": {
        "url": "https://www.hudsoncountynj.org/sheriff/sheriffs-sales",
        "type": "html_table",
        "state": "NJ"
    },
    # ========================================================================
    # NEW MEXICO (NM)
    # ========================================================================
    "bernalillo_nm": {
        "url": "https://www.bernco.gov/property-tax/delinquent-property-tax/",
        "type": "html_table",
        "state": "NM"
    },
    "dona_ana_nm": {
        "url": "https://www.donaanacounty.org/treasurer/delinquent-property-tax",
        "type": "html_table",
        "state": "NM"
    },
    "santa_fe_nm": {
        "url": "https://www.santafecountynm.gov/treasurer/delinquent_taxes",
        "type": "html_table",
        "state": "NM"
    },
    # ========================================================================
    # NEW YORK (NY)
    # ========================================================================
    "kings_ny": {
        "url": "https://ww2.nycourts.gov/courts/2jd/kingsclerk/surplus.shtml",
        "type": "html_table",
        "state": "NY"
    },
    "queens_ny": {
        "url": "https://ww2.nycourts.gov/courts/11jd/queensclerk/surplus.shtml",
        "type": "html_table",
        "state": "NY"
    },
    "suffolk_ny": {
        "url": "https://www.sullivanny.gov/Departments/Treasurer/Foreclosures",
        "type": "html_table",
        "state": "NY"
    },
    # ========================================================================
    # NORTH CAROLINA (NC)
    # ========================================================================
    "mecklenburg_nc": {
        "url": "https://www.mecknc.gov/FinanceDept/TaxCollections/Pages/TaxSale.aspx",
        "type": "html_table",
        "state": "NC"
    },
    "wake_nc": {
        "url": "https://www.wake.gov/departments-government/tax-administration/tax-foreclosure",
        "type": "html_table",
        "state": "NC"
    },
    "guilford_nc": {
        "url": "https://www.guilfordcountync.gov/our-county/tax/delinquent-taxes-foreclosure",
        "type": "html_table",
        "state": "NC"
    },
    # ========================================================================
    # NORTH DAKOTA (ND)
    # ========================================================================
    "cass_nd": {
        "url": "https://www.casscountynd.gov/departments/auditor/tax-sale",
        "type": "html_table",
        "state": "ND"
    },
    "burleigh_nd": {
        "url": "https://www.burleighco.com/departments/auditor/tax-sale/",
        "type": "html_table",
        "state": "ND"
    },
    "grand_forks_nd": {
        "url": "https://www.gfcounty.nd.gov/departments/auditor/tax-sale",
        "type": "html_table",
        "state": "ND"
    },
    # ========================================================================
    # OHIO (OH)
    # ========================================================================
    "cuyahoga_oh": {
        "url": "https://cuyahogacounty.gov/coc/excess-funds",
        "type": "html_table",
        "state": "OH"
    },
    "franklin_oh": {
        "url": "https://clerk.franklincountyohio.gov/onlineResources/Obtain-Excess-Funds-in-Foreclosure-Cases",
        "type": "html_table",
        "state": "OH"
    },
    "hamilton_oh": {
        "url": "https://www.courtclerk.org/forms-filings/excess-funds-forms/",
        "type": "html_table",
        "state": "OH"
    },
    # ========================================================================
    # OKLAHOMA (OK)
    # ========================================================================
    "oklahoma_ok": {
        "url": "https://docs.oklahomacounty.org/treasurer/CountyOwnedList.asp",
        "type": "html_table",
        "state": "OK"
    },
    "tulsa_ok": {
        "url": "https://assessor.tulsacounty.org/",
        "type": "html_table",
        "state": "OK"
    },
    "cleveland_ok": {
        "url": "https://www.clevelandcountyok.com/290/Tax-Sale",
        "type": "html_table",
        "state": "OK"
    },
    # ========================================================================
    # OREGON (OR)
    # ========================================================================
    "multnomah_or": {
        "url": "https://multco.us/info/surplus-funds-claims-form",
        "type": "html_table",
        "state": "OR"
    },
    "washington_or": {
        "url": "https://www.washingtoncountyor.gov/at/tax-foreclosure",
        "type": "html_table",
        "state": "OR"
    },
    "clackamas_or": {
        "url": "https://www.clackamas.us/property",
        "type": "html_table",
        "state": "OR"
    },
    # ========================================================================
    # PENNSYLVANIA (PA)
    # ========================================================================
    "philadelphia_pa": {
        "url": "https://phillysheriff.com/wp-content/uploads/2023/11/Benders-Questions-Procedure-for-Excess-Proceeds-and-Escheatment.pdf",
        "type": "pdf",
        "state": "PA"
    },
    "allegheny_pa": {
        "url": "https://www.alleghenycounty.us/real-estate/property-tax/tax-sale",
        "type": "html_table",
        "state": "PA"
    },
    "montgomery_pa": {
        "url": "https://www.montgomerycountypa.gov/2596/Outstanding-Surplus-Checks",
        "type": "html_table",
        "state": "PA"
    },
    # ========================================================================
    # RHODE ISLAND (RI)
    # ========================================================================
    "providence_ri": {
        "url": "https://www.providenceri.gov/finance/tax-sale/",
        "type": "html_table",
        "state": "RI"
    },
    "kent_ri": {
        "url": "https://www.warwickri.gov/tax-collector",
        "type": "html_table",
        "state": "RI"
    },
    "washington_ri": {
        "url": "https://www.southkingstownri.com/268/Tax-Collector",
        "type": "html_table",
        "state": "RI"
    },
    # ========================================================================
    # SOUTH DAKOTA (SD)
    # ========================================================================
    "minnehaha_sd": {
        "url": "https://www.minnehahacounty.org/dept/au/taxdeed/tax_deed.aspx",
        "type": "html_table",
        "state": "SD"
    },
    "pennington_sd": {
        "url": "https://www.pennco.org/317/Tax-Deed-Sales",
        "type": "html_table",
        "state": "SD"
    },
    "lincoln_sd": {
        "url": "https://www.lincolncountysd.org/259/Tax-Deed-Sales",
        "type": "html_table",
        "state": "SD"
    },
    # ========================================================================
    # TENNESSEE (TN)
    # ========================================================================
    "shelby_tn": {
        "url": "https://shelbycountytrustee.com/158/Excess-Proceeds",
        "type": "html_table",
        "state": "TN"
    },
    "davidson_tn": {
        "url": "https://www.nashville.gov/departments/finance/trustee/delinquent-taxes",
        "type": "html_table",
        "state": "TN"
    },
    "knox_tn": {
        "url": "https://www.knoxcounty.org/trustee/tax_sale.php",
        "type": "html_table",
        "state": "TN"
    },
    # ========================================================================
    # UTAH (UT)
    # ========================================================================
    "salt_lake_ut": {
        "url": "https://www.saltlakecounty.gov/treasurer/refunds--excess-funds/find-excess-funds/",
        "type": "html_table",
        "state": "UT"
    },
    "utah_ut": {
        "url": "https://www.utahcounty.gov/taxsale/ExcessFunds.html",
        "type": "html_table",
        "state": "UT"
    },
    "davis_ut": {
        "url": "https://www.daviscountyutah.gov/auditor/tax-administration-group/tax-sale/delinquent-tax-sale",
        "type": "html_table",
        "state": "UT"
    },
    # ========================================================================
    # VERMONT (VT)
    # ========================================================================
    "chittenden_vt": {
        "url": "https://www.burlingtonvt.gov/Assessor/Tax-Sale",
        "type": "html_table",
        "state": "VT"
    },
    "rutland_vt": {
        "url": "https://www.rutlandcity.org/departments/tax-collector",
        "type": "html_table",
        "state": "VT"
    },
    "washington_vt": {
        "url": "https://montpelier-vt.org/286/Tax-Sale",
        "type": "html_table",
        "state": "VT"
    },
    # ========================================================================
    # VIRGINIA (VA)
    # ========================================================================
    "fairfax_va": {
        "url": "https://www.fairfaxcounty.gov/taxes/pay/auction-real-property",
        "type": "html_table",
        "state": "VA"
    },
    "virginia_beach_va": {
        "url": "https://www.vbgov.com/government/departments/real-estate-assessor/Pages/default.aspx",
        "type": "html_table",
        "state": "VA"
    },
    "prince_william_va": {
        "url": "https://www.pwcgov.org/government/dept/finance/Pages/Tax-Sale.aspx",
        "type": "html_table",
        "state": "VA"
    },
    # ========================================================================
    # WASHINGTON (WA)
    # ========================================================================
    "king_wa": {
        "url": "https://kingcounty.gov/en/dept/executive-services/buildings-property/treasury-operations/tax-foreclosures/excess-auction-money/excess-funds-data",
        "type": "html_table",
        "state": "WA"
    },
    "pierce_wa": {
        "url": "https://www.piercecountywa.gov/6652/Surplus",
        "type": "html_table",
        "state": "WA"
    },
    "snohomish_wa": {
        "url": "https://snohomishcountywa.gov/220/Tax-Foreclosures",
        "type": "html_table",
        "state": "WA"
    },
    # ========================================================================
    # WEST VIRGINIA (WV)
    # ========================================================================
    "kanawha_wv": {
        "url": "https://www.kanawha.us/sheriff/tax-sales/",
        "type": "html_table",
        "state": "WV"
    },
    "berkeley_wv": {
        "url": "https://www.berkeleycountycomm.org/index.php/sheriff/tax-sales",
        "type": "html_table",
        "state": "WV"
    },
    "cabell_wv": {
        "url": "https://www.cabellcounty.org/sheriff/tax-sales/",
        "type": "html_table",
        "state": "WV"
    },
    # ========================================================================
    # WISCONSIN (WI)
    # ========================================================================
    "milwaukee_wi": {
        "url": "https://county.milwaukee.gov/EN/Treasurer/Foreclosed-Property-Sales",
        "type": "html_table",
        "state": "WI"
    },
    "dane_wi": {
        "url": "https://www.danecountylandinfo.com/delinquent_taxes.htm",
        "type": "html_table",
        "state": "WI"
    },
    "waukesha_wi": {
        "url": "https://www.waukeshacounty.gov/treasurer/tax-delinquent-sales/",
        "type": "html_table",
        "state": "WI"
    },
    # ========================================================================
    # WYOMING (WY)
    # ========================================================================
    "laramie_wy": {
        "url": "https://www.laramiecounty.com/416/Tax-Sale",
        "type": "html_table",
        "state": "WY"
    },
    "natrona_wy": {
        "url": "https://www.natronacounty-wy.gov/263/Tax-Sale",
        "type": "html_table",
        "state": "WY"
    },
    "campbell_wy": {
        "url": "https://www.ccgov.net/319/Tax-Sale",
        "type": "html_table",
        "state": "WY"
    },
}


# ============================================================================
# TRUSTEE WEBSITES
# ============================================================================

TRUSTEE_SOURCES = {
    "judicial_sales_il": {
        "name": "The Judicial Sales Corporation",
        "url": "https://www.tjsc.com",
        "sales_url": "https://www.tjsc.com/Sales/CompletedSales",
        "states": ["IL"],
        "type": "trustee"
    },
    "stox_quickbase": {
        "name": "Stox Quickbase",
        "url": "https://cds.rfrk.com",
        "sales_url": "https://cds.rfrk.com/portal/ca",
        "states": ["CA", "AZ", "NV", "WA", "OR"],
        "type": "trustee"
    },
    "auction_com": {
        "name": "Auction.com",
        "url": "https://www.auction.com",
        "api_url": "https://www.auction.com/api/v2/search/foreclosure",
        "states": ["ALL"],
        "type": "marketplace"
    }
}


def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }


def get_session() -> requests.Session:
    """Create a session with random user agent."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    })
    return session


def solve_captcha(site_key: str, page_url: str, captcha_type: str = "recaptcha") -> Optional[str]:
    """Solve CAPTCHA using 2captcha API."""
    if not TWOCAPTCHA_API_KEY:
        log.warning("No 2captcha API key configured")
        return None

    try:
        # Submit captcha
        if captcha_type == "recaptcha":
            submit_url = f"http://2captcha.com/in.php?key={TWOCAPTCHA_API_KEY}&method=userrecaptcha&googlekey={site_key}&pageurl={page_url}&json=1"
        else:
            submit_url = f"http://2captcha.com/in.php?key={TWOCAPTCHA_API_KEY}&method=hcaptcha&sitekey={site_key}&pageurl={page_url}&json=1"

        resp = requests.get(submit_url, timeout=30)
        result = resp.json()

        if result.get("status") != 1:
            log.error(f"Captcha submit failed: {result}")
            return None

        captcha_id = result["request"]
        log.info(f"Captcha submitted, ID: {captcha_id}")

        # Poll for result
        for _ in range(30):  # Max 2.5 minutes
            time.sleep(5)
            result_url = f"http://2captcha.com/res.php?key={TWOCAPTCHA_API_KEY}&action=get&id={captcha_id}&json=1"
            resp = requests.get(result_url, timeout=30)
            result = resp.json()

            if result.get("status") == 1:
                log.info("Captcha solved successfully")
                return result["request"]
            elif result.get("request") != "CAPCHA_NOT_READY":
                log.error(f"Captcha solve failed: {result}")
                return None

        log.error("Captcha solve timeout")
        return None

    except Exception as e:
        log.error(f"Captcha error: {e}")
        return None


# ============================================================================
# AUCTION.COM SCRAPER
# ============================================================================

def scrape_auction_com(state: str, limit: int = 100) -> List[Dict]:
    """
    Scrape foreclosure listings from auction.com

    Returns completed/sold properties with third-party bidders (potential overages)
    """
    leads = []
    session = get_session()

    # auction.com API endpoint
    api_url = "https://www.auction.com/api/v2/search"

    params = {
        "assetTypes": "foreclosure",
        "state": state,
        "status": "sold",  # completed sales
        "sortField": "eventDate",
        "sortDir": "desc",
        "page": 1,
        "pageSize": min(limit, 50)
    }

    try:
        log.info(f"Fetching auction.com foreclosures for {state}...")

        # They may require different headers
        session.headers.update({
            "Accept": "application/json",
            "Referer": f"https://www.auction.com/residential/{state.lower()}/foreclosure/",
        })

        resp = session.get(api_url, params=params, timeout=30)

        if resp.status_code == 403:
            log.warning("auction.com blocked request, trying Crawl4AI...")
            return scrape_auction_com_via_crawl4ai(state, limit)

        resp.raise_for_status()
        data = resp.json()

        for item in data.get("results", [])[:limit]:
            # Only interested in third-party sales (not back to bank)
            if item.get("soldToBank", False):
                continue

            opening_bid = item.get("openingBid", 0)
            sale_price = item.get("salePrice", 0)

            if sale_price > opening_bid:
                overage = sale_price - opening_bid

                lead = {
                    "property_address": item.get("address", {}).get("street", ""),
                    "city": item.get("address", {}).get("city", ""),
                    "state": state,
                    "state_abbr": state,
                    "zip_code": item.get("address", {}).get("zip", ""),
                    "county": item.get("address", {}).get("county", ""),
                    "sale_date": item.get("eventDate"),
                    "sale_amount": sale_price,
                    "opening_bid": opening_bid,
                    "overage_amount": overage,
                    "foreclosure_type": "mortgage",
                    "trustee_name": item.get("trusteeName", ""),
                    "case_number": item.get("fileNumber", ""),
                    "source": "auction.com",
                    "source_url": f"https://www.auction.com/details/{item.get('id', '')}",
                    "lat": item.get("address", {}).get("latitude"),
                    "lng": item.get("address", {}).get("longitude"),
                }
                leads.append(lead)
                log.info(f"  Found: {lead['property_address']} - ${overage:,.0f} overage")

        log.info(f"Found {len(leads)} leads with overages from auction.com")
        return leads

    except Exception as e:
        log.error(f"auction.com scrape error: {e}")
        return []


def scrape_auction_com_via_crawl4ai(state: str, limit: int = 100) -> List[Dict]:
    """Scrape auction.com using Crawl4AI to bypass blocks."""
    leads = []

    url = f"https://www.auction.com/residential/{state.lower()}/foreclosure/?status=sold"

    try:
        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={
                "urls": [url],  # Crawl4AI requires array format
                "word_count_threshold": 10,
                "bypass_cache": True,
                "js_code": "window.scrollTo(0, document.body.scrollHeight);",
                "wait_for": "css:.property-card"
            },
            timeout=120
        )

        if resp.status_code == 200:
            data = resp.json()
            # Parse the extracted data
            extracted = data.get("result", {}).get("extracted_content", [])
            for item in extracted[:limit]:
                # Process and add to leads
                pass

    except Exception as e:
        log.error(f"Crawl4AI auction.com error: {e}")

    return leads


# ============================================================================
# COUNTY EXCESS FUNDS SCRAPER
# ============================================================================

def get_state_name(abbr: str) -> str:
    """Convert state abbreviation to full name."""
    state_names = {
        "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
        "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
        "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
        "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
        "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
        "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
        "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
        "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
        "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
        "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
        "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas",
        "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
        "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    }
    return state_names.get(abbr, abbr)


def get_counties_for_state(state_abbr: str) -> List[str]:
    """Get all county keys configured for a given state abbreviation."""
    matches = []
    for county_key, config in COUNTY_EXCESS_FUNDS_URLS.items():
        config_state = config.get("state", "")
        # Also check the suffix convention (e.g., _ca, _fl)
        if config_state == state_abbr or county_key.endswith(f"_{state_abbr.lower()}"):
            matches.append(county_key)
    return matches


def scrape_county_excess_funds(county_key: str) -> List[Dict]:
    """
    Scrape excess funds list from a county website.

    Returns list of tax sale overages with property info.
    """
    if county_key not in COUNTY_EXCESS_FUNDS_URLS:
        log.error(f"Unknown county: {county_key}")
        return []

    config = COUNTY_EXCESS_FUNDS_URLS[county_key]
    url = config["url"]
    page_type = config["type"]
    state_abbr = config.get("state", county_key.split("_")[-1].upper())

    leads = []
    session = get_session()

    try:
        log.info(f"Scraping {county_key} ({state_abbr}) excess funds from {url}")

        resp = session.get(url, timeout=30)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        if page_type == "html_table":
            leads = parse_html_table_excess_funds(soup, county_key, state_abbr)
        elif page_type == "pdf_list":
            # Find PDF links and download/parse them
            pdf_links = soup.find_all("a", href=re.compile(r"\.pdf", re.I))
            for link in pdf_links[:3]:  # Limit to recent PDFs
                pdf_url = link.get("href")
                if not pdf_url.startswith("http"):
                    pdf_url = url.rsplit("/", 1)[0] + "/" + pdf_url
                leads.extend(scrape_pdf_excess_funds(pdf_url, county_key))
        elif page_type == "pdf":
            leads.extend(scrape_pdf_excess_funds(url, county_key))

        log.info(f"Found {len(leads)} excess funds leads from {county_key}")
        return leads

    except Exception as e:
        log.error(f"County excess funds scrape error for {county_key}: {e}")
        return []


def scrape_georgia_aggregator(limit: int = 20) -> List[Dict]:
    """
    Scrape the E. Albert Law Georgia Excess Funds aggregator page.
    This page links to 158 county excess funds lists.
    Extracts actual county government URLs (not anchor links).
    """
    leads = []
    url = "https://www.ealbertlaw.com/blog/excess-funds-list-georgia-counties"

    try:
        log.info("Scraping Georgia excess funds aggregator...")

        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={"urls": [url], "word_count_threshold": 5},
            timeout=120
        )

        if resp.status_code != 200:
            log.warning(f"Aggregator crawl failed: {resp.status_code}")
            return leads

        data = resp.json()
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        soup = BeautifulSoup(html, "html.parser")

        # Find actual county government links (not ealbertlaw.com anchors)
        # These are the real county excess funds pages
        county_links = []
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            # Skip internal anchors and ealbertlaw links
            if "ealbertlaw.com" in href or href.startswith("#"):
                continue
            # Look for government sites, county sites, or PDFs
            if any(domain in href.lower() for domain in [".gov", "county", ".pdf", "assessor", "clerk", "treasurer", "tax"]):
                county_name = link.get_text(strip=True)
                if county_name and len(county_name) > 2:
                    county_links.append((county_name, href))

        log.info(f"Found {len(county_links)} actual county URLs")

        seen_urls = set()
        processed = 0

        for county_name, href in county_links:
            if processed >= limit:
                break
            if href in seen_urls:
                continue
            seen_urls.add(href)

            log.info(f"  [{processed+1}/{min(limit, len(county_links))}] {county_name}: {href[:60]}...")

            if ".pdf" in href.lower():
                # PDF link - note for later processing
                leads.append({
                    "county": county_name,
                    "state": "Georgia",
                    "state_abbr": "GA",
                    "source": "georgia_aggregator",
                    "source_url": href,
                    "type": "pdf_link"
                })
                processed += 1
            else:
                # HTML page - try to scrape it
                county_leads = scrape_county_page_for_excess_funds(href, county_name)
                if county_leads:
                    leads.extend(county_leads)
                    processed += 1
                else:
                    # No data found, but record the source
                    leads.append({
                        "county": county_name,
                        "state": "Georgia",
                        "state_abbr": "GA",
                        "source": "georgia_county",
                        "source_url": href,
                        "type": "empty_page"
                    })
                    processed += 1

            # Rate limit
            time.sleep(random.uniform(0.5, 1.5))

        log.info(f"Found {len(leads)} items from Georgia aggregator")
        return leads

    except Exception as e:
        log.error(f"Georgia aggregator error: {e}")
        return leads


def scrape_county_page_for_excess_funds(url: str, county_name: str) -> List[Dict]:
    """Scrape a single county's excess funds page."""
    leads = []

    try:
        resp = requests.post(
            f"{CRAWL4AI_URL}/crawl",
            json={"urls": [url], "word_count_threshold": 5},
            timeout=60
        )

        if resp.status_code != 200:
            return leads

        data = resp.json()
        results = data.get("results", [])
        html = results[0].get("html", "") if results else ""

        soup = BeautifulSoup(html, "html.parser")

        # Look for tables or PDFs on this page
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")
            headers = []

            for row in rows:
                cells = row.find_all(["th", "td"])

                if not headers:
                    headers = [c.get_text(strip=True).lower() for c in cells]
                    continue

                if len(cells) >= 2:
                    data_row = {headers[i]: cells[i].get_text(strip=True)
                               for i in range(min(len(headers), len(cells)))}

                    lead = {
                        "property_address": data_row.get("property", data_row.get("address", "")),
                        "parcel_id": data_row.get("parcel", data_row.get("parcel number", "")),
                        "owner_name": data_row.get("owner", data_row.get("defendant", "")),
                        "overage_amount": parse_money(
                            data_row.get("excess", data_row.get("surplus", data_row.get("amount", "0")))
                        ),
                        "sale_date": data_row.get("sale date", data_row.get("date", "")),
                        "county": county_name,
                        "state": "Georgia",
                        "state_abbr": "GA",
                        "foreclosure_type": "tax_sale",
                        "source": "georgia_county",
                        "source_url": url,
                    }

                    if lead["overage_amount"] > 0 or lead["owner_name"]:
                        leads.append(lead)

        # Also check for PDF links on the page
        pdf_links = soup.find_all("a", href=re.compile(r"\.pdf", re.I))
        for pdf_link in pdf_links[:3]:
            pdf_url = pdf_link.get("href", "")
            if not pdf_url.startswith("http"):
                pdf_url = url.rsplit("/", 1)[0] + "/" + pdf_url
            leads.append({
                "county": county_name,
                "state_abbr": "GA",
                "source": "georgia_county_pdf",
                "source_url": pdf_url,
                "type": "pdf_link"
            })

    except Exception as e:
        log.debug(f"County page scrape error for {county_name}: {e}")

    return leads


def parse_html_table_excess_funds(soup: BeautifulSoup, county_key: str, state_abbr: str = "") -> List[Dict]:
    """Parse HTML table of excess funds."""
    leads = []

    if not state_abbr:
        state_abbr = county_key.split("_")[-1].upper()

    # Derive county name from key (remove state suffix)
    parts = county_key.rsplit("_", 1)
    county_name = parts[0].replace("_", " ").title() if len(parts) > 1 else county_key.replace("_", " ").title()

    # Find tables with excess funds data
    tables = soup.find_all("table")

    for table in tables:
        rows = table.find_all("tr")
        headers = []

        for row in rows:
            cells = row.find_all(["th", "td"])

            if not headers:
                headers = [c.get_text(strip=True).lower() for c in cells]
                continue

            if len(cells) >= 3:
                data = {headers[i]: cells[i].get_text(strip=True) for i in range(min(len(headers), len(cells)))}

                # Map common field names (expanded for different state formats)
                lead = {
                    "property_address": (
                        data.get("property address", "") or
                        data.get("address", "") or
                        data.get("property", "") or
                        data.get("property location", "") or
                        data.get("situs address", "") or
                        data.get("site address", "")
                    ),
                    "parcel_id": (
                        data.get("parcel", "") or
                        data.get("parcel number", "") or
                        data.get("apn", "") or
                        data.get("parcel id", "") or
                        data.get("tax id", "") or
                        data.get("pin", "")
                    ),
                    "owner_name": (
                        data.get("owner", "") or
                        data.get("owner name", "") or
                        data.get("defendant", "") or
                        data.get("former owner", "") or
                        data.get("property owner", "") or
                        data.get("taxpayer", "") or
                        data.get("name", "")
                    ),
                    "overage_amount": parse_money(
                        data.get("excess", "") or
                        data.get("surplus", "") or
                        data.get("amount", "") or
                        data.get("excess proceeds", "") or
                        data.get("surplus funds", "") or
                        data.get("overbid", "") or
                        data.get("overage", "") or
                        data.get("excess amount", "0")
                    ),
                    "sale_date": (
                        data.get("sale date", "") or
                        data.get("date", "") or
                        data.get("auction date", "") or
                        data.get("date of sale", "") or
                        data.get("foreclosure date", "")
                    ),
                    "case_number": (
                        data.get("case", "") or
                        data.get("case number", "") or
                        data.get("tax sale number", "") or
                        data.get("case #", "") or
                        data.get("case no", "") or
                        data.get("docket", "")
                    ),
                    "county": county_name,
                    "state": get_state_name(state_abbr),
                    "state_abbr": state_abbr,
                    "foreclosure_type": "tax_sale",
                    "source": f"county_{county_key}",
                }

                if lead["overage_amount"] > 0:
                    leads.append(lead)

    return leads


def scrape_pdf_excess_funds(pdf_url: str, county_key: str) -> List[Dict]:
    """Download and parse PDF excess funds list."""
    # This would require PyPDF2 or pdfplumber
    # For now, return empty - implement later
    log.info(f"PDF parsing not yet implemented: {pdf_url}")
    return []


def parse_money(text: str) -> float:
    """Parse money string to float."""
    if not text:
        return 0.0
    cleaned = re.sub(r"[^\d.]", "", str(text))
    try:
        return float(cleaned)
    except:
        return 0.0


# ============================================================================
# JUDICIAL SALES CORPORATION SCRAPER (Illinois)
# ============================================================================

def scrape_judicial_sales(limit: int = 100) -> List[Dict]:
    """
    Scrape completed foreclosure sales from The Judicial Sales Corporation.

    Illinois mortgage foreclosure trustee - covers Cook County and surrounding area.
    Table format: Sale ID, Case #, Law Firm, Address, City, County, ZIP, Sale Date, Sale Amount
    """
    leads = []
    session = get_session()

    base_url = "https://www.tjsc.com"
    sales_url = f"{base_url}/Sales/CompletedSales"

    try:
        log.info("Scraping Judicial Sales Corporation completed sales...")

        resp = session.get(sales_url, timeout=30)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Find the completed sales table
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")

            for row in rows[:limit]:
                cells = row.find_all("td")

                # Need at least 7 cells for valid data row
                if len(cells) < 7:
                    continue

                try:
                    # Extract data from cells
                    # Actual format: Date | Time | Sale ID | Case # | Law Firm | Address | City | County | ZIP | TBD | # | Sale Amount | empty | empty
                    sale_date = cells[0].get_text(strip=True) if len(cells) > 0 else ""
                    sale_time = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    sale_id = cells[2].get_text(strip=True) if len(cells) > 2 else ""
                    case_number = cells[3].get_text(strip=True) if len(cells) > 3 else ""
                    law_firm = cells[4].get_text(strip=True) if len(cells) > 4 else ""

                    # Address is in cell 5 (index 5), often in a link
                    address_cell = cells[5] if len(cells) > 5 else None
                    address = ""
                    if address_cell:
                        link = address_cell.find("a")
                        address = link.get_text(strip=True) if link else address_cell.get_text(strip=True)

                    city = cells[6].get_text(strip=True) if len(cells) > 6 else ""
                    county = cells[7].get_text(strip=True) if len(cells) > 7 else ""
                    zip_code = cells[8].get_text(strip=True) if len(cells) > 8 else ""

                    # Sale amount is in cell 11 (index 11)
                    sale_amount = 0
                    if len(cells) > 11:
                        sale_amount = parse_money(cells[11].get_text(strip=True))

                    # Skip if no valid address
                    if not address or not re.search(r"\d+.*(?:St|Ave|Dr|Rd|Blvd|Ln|Ct|Way|Pl|Ter|Cir)", address, re.I):
                        continue

                    lead = {
                        "property_address": address,
                        "city": city,
                        "county": county,
                        "state": "Illinois",
                        "state_abbr": "IL",
                        "zip_code": zip_code,
                        "case_number": case_number,
                        "sale_date": sale_date,
                        "sale_amount": sale_amount,
                        "foreclosure_type": "auction",  # Completed trustee sale
                        "trustee_name": law_firm or "The Judicial Sales Corporation",
                        "source": "judicial_sales_corp",
                        "source_url": sales_url,
                    }
                    leads.append(lead)
                    log.info(f"  Found: {address}, {city} {zip_code}")

                except Exception as e:
                    log.debug(f"Error parsing sale row: {e}")
                    continue

        log.info(f"Found {len(leads)} leads from Judicial Sales Corporation")
        return leads

    except Exception as e:
        log.error(f"Judicial Sales scrape error: {e}")
        return []


# ============================================================================
# STOX QUICKBASE SCRAPER (West Coast)
# ============================================================================

def scrape_stox_quickbase(state: str = "CA", limit: int = 100) -> List[Dict]:
    """
    Scrape foreclosure sales from Stox Quickbase (CDS).

    States: CA, AZ, NV, WA, OR
    """
    leads = []
    session = get_session()

    base_url = f"https://cds.rfrk.com/portal/{state.lower()}"

    try:
        log.info(f"Scraping Stox Quickbase for {state}...")

        resp = session.get(base_url, timeout=30)

        if resp.status_code != 200:
            log.warning(f"Stox Quickbase returned {resp.status_code}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")

        # Find the 60 days sales link
        sales_link = soup.find("a", text=re.compile(r"60 days", re.I))

        if sales_link:
            sales_url = sales_link.get("href")
            if not sales_url.startswith("http"):
                sales_url = "https://cds.rfrk.com" + sales_url

            resp = session.get(sales_url, timeout=30)
            soup = BeautifulSoup(resp.text, "html.parser")

        # Parse sales table
        table = soup.find("table")
        if table:
            rows = table.find_all("tr")[1:]  # Skip header

            for row in rows[:limit]:
                cells = row.find_all("td")
                if len(cells) >= 5:
                    # Check if sold to third party (not beneficiary)
                    result = cells[-1].get_text(strip=True).lower()
                    if "beneficiary" in result or "bank" in result:
                        continue

                    address = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    opening_bid = parse_money(cells[2].get_text()) if len(cells) > 2 else 0
                    sale_amount = parse_money(cells[3].get_text()) if len(cells) > 3 else 0

                    if sale_amount > opening_bid:
                        overage = sale_amount - opening_bid

                        lead = {
                            "property_address": address,
                            "state_abbr": state,
                            "opening_bid": opening_bid,
                            "sale_amount": sale_amount,
                            "overage_amount": overage,
                            "foreclosure_type": "mortgage",
                            "source": "stox_quickbase",
                        }
                        leads.append(lead)
                        log.info(f"  Found: {address} - ${overage:,.0f} overage")

        log.info(f"Found {len(leads)} leads from Stox Quickbase")
        return leads

    except Exception as e:
        log.error(f"Stox Quickbase scrape error: {e}")
        return []


# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def save_leads_to_db(leads: List[Dict], dry_run: bool = False) -> int:
    """Save scraped leads to database."""
    if not leads:
        return 0

    saved = 0

    for lead in leads:
        try:
            # Clean and prepare data (match existing DB schema)
            # Get values with fallbacks
            state_abbr_val = lead.get("state_abbr", "")[:2] if lead.get("state_abbr") else ""
            state_val = lead.get("state", "")
            if not state_val and state_abbr_val:
                state_val = get_state_name(state_abbr_val)
            county_val = lead.get("county", "")

            # Derive county from state if not provided
            if not county_val and state_abbr_val == "IL":
                county_val = "Cook"
            if not county_val and state_abbr_val == "GA":
                county_val = "Unknown"
            if not county_val:
                county_val = "Unknown"

            payload = {
                "id": str(uuid.uuid4()),  # Generate UUID for new record
                "property_address": lead.get("property_address", "Unknown")[:255],
                "city": lead.get("city", "Unknown")[:100],
                "state": state_val if state_val else "Unknown",
                "state_abbr": state_abbr_val if state_abbr_val else "XX",
                "zip_code": lead.get("zip_code", "00000")[:10],
                "county": county_val if county_val else None,  # Allow null
                "owner_name": lead.get("owner_name") or "Unknown Owner",  # Required NOT NULL
                "parcel_id": lead.get("parcel_id") or None,
                "sale_date": lead.get("sale_date"),
                "sale_amount": lead.get("sale_amount", 0) or 0,
                "overage_amount": lead.get("overage_amount", 0) or 0,
                # Valid types: pre-foreclosure, bank-owned, auction
                "foreclosure_type": lead.get("foreclosure_type", "auction"),
                "case_number": lead.get("case_number") or None,
                "trustee_name": lead.get("trustee_name") or None,
                "source": lead.get("source", "scraper"),
                "source_type": "county_surplus",  # DB uses source_type, not source_url
                "batch_id": f"batch-{datetime.now().strftime('%Y-%m-%d')}-surplus",
                "lat": lead.get("lat"),
                "lng": lead.get("lng"),
                "status": "new",
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None and v != ""}

            if dry_run:
                log.info(f"[DRY RUN] Would save: {payload.get('property_address')}")
                saved += 1
                continue

            # Insert to database (new record with UUID)
            url = f"{SUPABASE_URL}/rest/v1/foreclosure_leads"
            headers = supabase_headers()
            headers["Prefer"] = "return=minimal"

            resp = requests.post(url, json=payload, headers=headers, timeout=30)

            if resp.status_code in (200, 201, 204):
                saved += 1
                log.debug(f"Saved: {payload.get('property_address')}")
            else:
                log.warning(f"Failed to save lead: {resp.status_code} - {resp.text[:300]}")

        except Exception as e:
            log.error(f"Error saving lead: {e}")

    return saved


# ============================================================================
# MAIN
# ============================================================================

def get_all_configured_states() -> List[str]:
    """Get unique list of all states that have county configurations."""
    states = set()
    for county_key, config in COUNTY_EXCESS_FUNDS_URLS.items():
        state = config.get("state", "")
        if not state:
            # Fallback to suffix convention
            parts = county_key.rsplit("_", 1)
            if len(parts) > 1 and len(parts[1]) == 2:
                state = parts[1].upper()
        if state:
            states.add(state)
    return sorted(states)


# States to exclude from scraping
EXCLUDED_STATES = {"AR", "SC"}


def main():
    parser = argparse.ArgumentParser(description="Scrape real foreclosure leads from free sources")
    parser.add_argument("--source", choices=["auction", "county", "trustee", "georgia", "all"], default="all")
    parser.add_argument("--state", default="ALL", help="State abbreviation or ALL for all states")
    parser.add_argument("--county", help="County key (e.g., los_angeles_ca)")
    parser.add_argument("--trustee", choices=["judicial_sales", "stox"], help="Trustee source")
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--list-states", action="store_true", help="List all configured states and exit")
    args = parser.parse_args()

    if args.list_states:
        states = get_all_configured_states()
        log.info(f"Configured states ({len(states)}): {', '.join(states)}")
        for st in states:
            counties = get_counties_for_state(st)
            log.info(f"  {st} ({get_state_name(st)}): {', '.join(counties)}")
        return 0

    log.info(f"=== Real Foreclosure Scraper started at {datetime.now(timezone.utc).isoformat()} ===")
    log.info(f"Source: {args.source}, State: {args.state}, Limit: {args.limit}")

    configured_states = get_all_configured_states()
    log.info(f"Total configured states: {len(configured_states)}")
    log.info(f"Excluded states: {', '.join(sorted(EXCLUDED_STATES))}")

    all_leads = []

    if args.source in ("georgia", "all"):
        leads = scrape_georgia_aggregator(limit=args.limit)
        all_leads.extend(leads)

    if args.source in ("auction", "all"):
        if args.state == "ALL":
            # Run auction.com for major states
            for state in ["CA", "FL", "TX", "AZ", "IL", "GA", "OH", "NY", "PA", "MI", "NJ", "NC", "VA", "WA"]:
                if state not in EXCLUDED_STATES:
                    leads = scrape_auction_com(state, args.limit)
                    all_leads.extend(leads)
                    time.sleep(random.uniform(2, 4))
        else:
            leads = scrape_auction_com(args.state, args.limit)
            all_leads.extend(leads)

    if args.source in ("county", "all"):
        if args.county:
            leads = scrape_county_excess_funds(args.county)
            all_leads.extend(leads)
        elif args.state == "ALL":
            # Scrape all configured counties across all states
            total_counties = len(COUNTY_EXCESS_FUNDS_URLS)
            processed = 0
            for county_key, config in COUNTY_EXCESS_FUNDS_URLS.items():
                state = config.get("state", "")
                if state in EXCLUDED_STATES:
                    continue
                if county_key == "georgia_all":
                    continue  # Georgia aggregator handled separately

                processed += 1
                log.info(f"[{processed}/{total_counties}] Processing {county_key} ({state})...")

                leads = scrape_county_excess_funds(county_key)
                all_leads.extend(leads)

                # Rate limit between counties
                time.sleep(random.uniform(1, 3))
        else:
            # Scrape all counties for a specific state
            county_keys = get_counties_for_state(args.state)
            log.info(f"Found {len(county_keys)} counties for {args.state}: {', '.join(county_keys)}")
            for county_key in county_keys:
                if county_key == "georgia_all":
                    continue
                leads = scrape_county_excess_funds(county_key)
                all_leads.extend(leads)
                time.sleep(random.uniform(1, 3))

    if args.source in ("trustee", "all"):
        if args.trustee == "judicial_sales" or args.source == "all":
            leads = scrape_judicial_sales(args.limit)
            all_leads.extend(leads)

        if args.trustee == "stox" or args.source == "all":
            if args.state == "ALL":
                for state in ["CA", "AZ", "NV", "WA", "OR"]:
                    leads = scrape_stox_quickbase(state, args.limit)
                    all_leads.extend(leads)
                    time.sleep(random.uniform(2, 4))
            else:
                leads = scrape_stox_quickbase(args.state, args.limit)
                all_leads.extend(leads)

    log.info(f"\n=== Total leads found: {len(all_leads)} ===")

    # Summary by state
    state_counts = {}
    for lead in all_leads:
        st = lead.get("state_abbr", "??")
        state_counts[st] = state_counts.get(st, 0) + 1
    for st in sorted(state_counts.keys()):
        log.info(f"  {st}: {state_counts[st]} leads")

    if all_leads:
        saved = save_leads_to_db(all_leads, args.dry_run)
        log.info(f"Saved {saved} leads to database")

    return len(all_leads)


if __name__ == "__main__":
    sys.exit(0 if main() > 0 else 1)
