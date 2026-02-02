"""
Foreclosure Data Source Registry
Comprehensive registry of all foreclosure data sources across the US.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class DataSource:
    """A foreclosure data source."""
    name: str
    source_type: str
    base_url: str
    states: list[str] = field(default_factory=list)
    scraper_class: str = ""
    requires_login: bool = False
    uses_javascript: bool = False
    rate_limit: int = 10
    notes: str = ""


# Major Nationwide Auction Platforms
NATIONWIDE_SOURCES = [
    DataSource(
        name="Auction.com",
        source_type="aggregator",
        base_url="https://www.auction.com/residential/foreclosure",
        states=["ALL"],
        scraper_class="AuctionComScraper",
        uses_javascript=True,
        rate_limit=5,
        notes="Largest online foreclosure auction platform"
    ),
    DataSource(
        name="RealtyTrac",
        source_type="aggregator",
        base_url="https://www.realtytrac.com/mapsearch/foreclosures",
        states=["ALL"],
        scraper_class="RealtyTracScraper",
        uses_javascript=True,
        rate_limit=3,
        notes="Comprehensive foreclosure listings"
    ),
    DataSource(
        name="Zillow Foreclosures",
        source_type="aggregator",
        base_url="https://www.zillow.com/homes/for_sale/fore_lt/",
        states=["ALL"],
        scraper_class="ZillowScraper",
        uses_javascript=True,
        rate_limit=2,
        notes="Pre-foreclosure and foreclosure listings"
    ),
    DataSource(
        name="Foreclosure.com",
        source_type="aggregator",
        base_url="https://www.foreclosure.com",
        states=["ALL"],
        scraper_class="ForeclosureComScraper",
        requires_login=True,
        uses_javascript=True,
        rate_limit=5,
    ),
    DataSource(
        name="HUD Homes",
        source_type="aggregator",
        base_url="https://www.hudhomestore.gov",
        states=["ALL"],
        scraper_class="HUDHomesScraper",
        uses_javascript=True,
        notes="HUD-owned foreclosed properties"
    ),
    DataSource(
        name="Homepath (Fannie Mae)",
        source_type="aggregator",
        base_url="https://www.homepath.com",
        states=["ALL"],
        scraper_class="HomepathScraper",
        uses_javascript=True,
        notes="Fannie Mae foreclosed properties"
    ),
    DataSource(
        name="HomeSteps (Freddie Mac)",
        source_type="aggregator",
        base_url="https://www.homesteps.com",
        states=["ALL"],
        scraper_class="HomeStepsScraper",
        uses_javascript=True,
        notes="Freddie Mac foreclosed properties"
    ),
]

# State-Specific and Regional Sources
STATE_SOURCES = {
    # ALABAMA
    "AL": [
        DataSource(
            name="Alabama Real Property Search",
            source_type="county_recorder",
            base_url="https://arc-sos.state.al.us/CGI/CORPNAME.MBR/INPUT",
            states=["AL"],
        ),
    ],

    # ARIZONA
    "AZ": [
        DataSource(
            name="Maricopa County Public Trustee",
            source_type="public_trustee",
            base_url="https://recorder.maricopa.gov/",
            states=["AZ"],
            scraper_class="MaricopaTrusteeScraper",
            notes="Phoenix metro area - largest AZ county"
        ),
        DataSource(
            name="Arizona Auction Network",
            source_type="tax_deed_auction",
            base_url="https://www.arizonaauctionnetwork.com",
            states=["AZ"],
            scraper_class="AZAuctionNetworkScraper",
        ),
    ],

    # CALIFORNIA
    "CA": [
        DataSource(
            name="Los Angeles County Recorder",
            source_type="county_recorder",
            base_url="https://www.lavote.net/apps/filedownload/",
            states=["CA"],
            notes="LA County trustee sales"
        ),
        DataSource(
            name="San Diego County Recorder",
            source_type="county_recorder",
            base_url="https://arcc.sdcounty.ca.gov/",
            states=["CA"],
        ),
        DataSource(
            name="Orange County Recorder",
            source_type="county_recorder",
            base_url="https://cr.ocgov.com/",
            states=["CA"],
        ),
        DataSource(
            name="California Foreclosure Network",
            source_type="county_auction",
            base_url="https://www.californiaforeclosurenetwork.com",
            states=["CA"],
            uses_javascript=True,
        ),
    ],

    # COLORADO
    "CO": [
        DataSource(
            name="Denver Public Trustee",
            source_type="public_trustee",
            base_url="https://www.denvergov.org/Government/Departments/Public-Trustee",
            states=["CO"],
            scraper_class="DenverTrusteeScraper",
            notes="Denver metro foreclosure auctions"
        ),
        DataSource(
            name="Arapahoe County Public Trustee",
            source_type="public_trustee",
            base_url="https://www.arapahoegov.com/1041/Public-Trustee",
            states=["CO"],
        ),
        DataSource(
            name="Colorado Public Trustee Association",
            source_type="aggregator",
            base_url="https://www.coloradotrustees.org",
            states=["CO"],
        ),
    ],

    # FLORIDA
    "FL": [
        DataSource(
            name="RealAuction (Florida)",
            source_type="county_auction",
            base_url="https://www.realauction.com",
            states=["FL"],
            scraper_class="RealAuctionScraper",
            uses_javascript=True,
            notes="Many FL counties use RealAuction"
        ),
        DataSource(
            name="Miami-Dade County Clerk",
            source_type="court_records",
            base_url="https://www2.miami-dadeclerk.com/",
            states=["FL"],
            notes="Judicial foreclosure records"
        ),
        DataSource(
            name="Hillsborough County Tax Deeds",
            source_type="tax_deed_auction",
            base_url="https://www.hillsclerk.com/",
            states=["FL"],
        ),
        DataSource(
            name="GovEase (Florida)",
            source_type="county_auction",
            base_url="https://www.govease.com/foreclosures/florida",
            states=["FL"],
            uses_javascript=True,
        ),
    ],

    # GEORGIA
    "GA": [
        DataSource(
            name="Georgia Superior Court Clerks",
            source_type="court_records",
            base_url="https://www.gsccca.org/",
            states=["GA"],
            scraper_class="GSCCCAScraper",
            notes="Statewide court records"
        ),
        DataSource(
            name="Fulton County Tax Commissioner",
            source_type="tax_deed_auction",
            base_url="https://www.fultoncountytaxes.org/",
            states=["GA"],
            notes="Atlanta metro tax deed sales"
        ),
        DataSource(
            name="DeKalb County Tax",
            source_type="tax_deed_auction",
            base_url="https://www.dekalbcountyga.gov/tax-commissioner",
            states=["GA"],
        ),
    ],

    # ILLINOIS
    "IL": [
        DataSource(
            name="Cook County Clerk",
            source_type="court_records",
            base_url="https://www.cookcountyclerkofcourt.org/",
            states=["IL"],
            notes="Chicago metro judicial foreclosures"
        ),
        DataSource(
            name="Illinois Foreclosure Listing Service",
            source_type="aggregator",
            base_url="https://www.abortivelisting.com/",
            states=["IL"],
        ),
    ],

    # MARYLAND
    "MD": [
        DataSource(
            name="Maryland Case Search",
            source_type="court_records",
            base_url="https://casesearch.courts.state.md.us/",
            states=["MD"],
            notes="Statewide foreclosure case search"
        ),
        DataSource(
            name="Alex Cooper Auctioneers",
            source_type="county_auction",
            base_url="https://www.alexcooper.com/",
            states=["MD"],
            uses_javascript=True,
        ),
    ],

    # MICHIGAN
    "MI": [
        DataSource(
            name="Wayne County Treasurer",
            source_type="tax_deed_auction",
            base_url="https://www.waynecounty.com/treasurer/",
            states=["MI"],
            notes="Detroit metro tax sales"
        ),
        DataSource(
            name="Michigan Tax Sale",
            source_type="tax_deed_auction",
            base_url="https://www.tax-sale.info",
            states=["MI"],
            uses_javascript=True,
        ),
    ],

    # NEVADA
    "NV": [
        DataSource(
            name="Clark County Recorder",
            source_type="county_recorder",
            base_url="https://www.clarkcountynv.gov/recorder/",
            states=["NV"],
            notes="Las Vegas metro"
        ),
        DataSource(
            name="Washoe County Recorder",
            source_type="county_recorder",
            base_url="https://www.washoecounty.gov/recorder/",
            states=["NV"],
            notes="Reno area"
        ),
    ],

    # NEW JERSEY
    "NJ": [
        DataSource(
            name="NJ Courts Online",
            source_type="court_records",
            base_url="https://portal.njcourts.gov/",
            states=["NJ"],
            notes="Statewide foreclosure dockets"
        ),
        DataSource(
            name="NJ Tax Sale List",
            source_type="tax_deed_auction",
            base_url="https://www.njtaxsalelist.com/",
            states=["NJ"],
        ),
    ],

    # NEW YORK
    "NY": [
        DataSource(
            name="NYC Sheriff Sales",
            source_type="sheriff_sale",
            base_url="https://www1.nyc.gov/site/finance/taxes/property-lien-sales.page",
            states=["NY"],
            notes="NYC property sales"
        ),
        DataSource(
            name="NYS Courts eFiling",
            source_type="court_records",
            base_url="https://iapps.courts.state.ny.us/",
            states=["NY"],
        ),
    ],

    # NORTH CAROLINA
    "NC": [
        DataSource(
            name="NC Courts",
            source_type="court_records",
            base_url="https://www.nccourts.gov/",
            states=["NC"],
        ),
        DataSource(
            name="Mecklenburg County Tax",
            source_type="tax_deed_auction",
            base_url="https://www.mecknc.gov/",
            states=["NC"],
            notes="Charlotte metro"
        ),
    ],

    # OHIO
    "OH": [
        DataSource(
            name="Cuyahoga County Sheriff",
            source_type="sheriff_sale",
            base_url="https://sheriff.cuyahogacounty.us/",
            states=["OH"],
            scraper_class="CuyahogaSheriffScraper",
            notes="Cleveland metro"
        ),
        DataSource(
            name="Franklin County Sheriff",
            source_type="sheriff_sale",
            base_url="https://sheriff.franklincountyohio.gov/",
            states=["OH"],
            notes="Columbus metro"
        ),
        DataSource(
            name="Hamilton County Sheriff",
            source_type="sheriff_sale",
            base_url="https://www.hcso.org/",
            states=["OH"],
            notes="Cincinnati metro"
        ),
    ],

    # PENNSYLVANIA
    "PA": [
        DataSource(
            name="Philadelphia Sheriff Sales",
            source_type="sheriff_sale",
            base_url="https://www.officeofphiladelphiasheriff.com/",
            states=["PA"],
            scraper_class="PhillySheriffScraper",
            uses_javascript=True,
        ),
        DataSource(
            name="Allegheny County Sheriff",
            source_type="sheriff_sale",
            base_url="https://www.alleghenycounty.us/",
            states=["PA"],
            notes="Pittsburgh metro"
        ),
    ],

    # TEXAS
    "TX": [
        DataSource(
            name="Harris County Foreclosures",
            source_type="county_auction",
            base_url="https://www.hctax.net/",
            states=["TX"],
            notes="Houston metro"
        ),
        DataSource(
            name="Dallas County Tax",
            source_type="tax_deed_auction",
            base_url="https://www.dallascounty.org/",
            states=["TX"],
        ),
        DataSource(
            name="Bexar County Tax",
            source_type="tax_deed_auction",
            base_url="https://www.bexar.org/",
            states=["TX"],
            notes="San Antonio"
        ),
        DataSource(
            name="Texas Foreclosure Listing Service",
            source_type="aggregator",
            base_url="https://www.texasforeclosurelisting.com",
            states=["TX"],
        ),
    ],

    # VIRGINIA
    "VA": [
        DataSource(
            name="Virginia Judicial System",
            source_type="court_records",
            base_url="https://www.vacourts.gov/",
            states=["VA"],
        ),
        DataSource(
            name="Fairfax County",
            source_type="tax_deed_auction",
            base_url="https://www.fairfaxcounty.gov/",
            states=["VA"],
        ),
    ],

    # WASHINGTON
    "WA": [
        DataSource(
            name="King County Recorder",
            source_type="county_recorder",
            base_url="https://kingcounty.gov/depts/records-licensing/",
            states=["WA"],
            notes="Seattle metro"
        ),
        DataSource(
            name="Pierce County Trustee",
            source_type="public_trustee",
            base_url="https://www.piercecountywa.gov/",
            states=["WA"],
            notes="Tacoma"
        ),
    ],
}

# Counties requiring email/FOIA requests (no online records)
FOIA_REQUIRED_COUNTIES = {
    "AL": ["Autauga", "Baldwin", "Bibb"],  # Example - need full list
    "AR": ["Arkansas", "Ashley", "Baxter"],
    "KY": ["Adair", "Allen", "Anderson"],
    "MS": ["Adams", "Alcorn", "Amite"],
    "WV": ["Barbour", "Berkeley", "Boone"],
}


def get_sources_for_state(state_abbr: str) -> list[DataSource]:
    """Get all data sources for a given state."""
    sources = []

    # Add state-specific sources
    if state_abbr in STATE_SOURCES:
        sources.extend(STATE_SOURCES[state_abbr])

    # Add nationwide sources
    for source in NATIONWIDE_SOURCES:
        if "ALL" in source.states or state_abbr in source.states:
            sources.append(source)

    return sources


def get_all_sources() -> list[DataSource]:
    """Get all registered data sources."""
    sources = list(NATIONWIDE_SOURCES)
    for state_sources in STATE_SOURCES.values():
        sources.extend(state_sources)
    return sources


# US States with foreclosure type classification
US_STATES = {
    "AL": {"name": "Alabama", "type": "non-judicial"},
    "AK": {"name": "Alaska", "type": "non-judicial"},
    "AZ": {"name": "Arizona", "type": "non-judicial"},
    "AR": {"name": "Arkansas", "type": "both"},
    "CA": {"name": "California", "type": "non-judicial"},
    "CO": {"name": "Colorado", "type": "non-judicial"},
    "CT": {"name": "Connecticut", "type": "judicial"},
    "DE": {"name": "Delaware", "type": "judicial"},
    "FL": {"name": "Florida", "type": "judicial"},
    "GA": {"name": "Georgia", "type": "non-judicial"},
    "HI": {"name": "Hawaii", "type": "both"},
    "ID": {"name": "Idaho", "type": "non-judicial"},
    "IL": {"name": "Illinois", "type": "judicial"},
    "IN": {"name": "Indiana", "type": "judicial"},
    "IA": {"name": "Iowa", "type": "both"},
    "KS": {"name": "Kansas", "type": "judicial"},
    "KY": {"name": "Kentucky", "type": "judicial"},
    "LA": {"name": "Louisiana", "type": "judicial"},
    "ME": {"name": "Maine", "type": "judicial"},
    "MD": {"name": "Maryland", "type": "both"},
    "MA": {"name": "Massachusetts", "type": "non-judicial"},
    "MI": {"name": "Michigan", "type": "non-judicial"},
    "MN": {"name": "Minnesota", "type": "non-judicial"},
    "MS": {"name": "Mississippi", "type": "non-judicial"},
    "MO": {"name": "Missouri", "type": "non-judicial"},
    "MT": {"name": "Montana", "type": "non-judicial"},
    "NE": {"name": "Nebraska", "type": "both"},
    "NV": {"name": "Nevada", "type": "non-judicial"},
    "NH": {"name": "New Hampshire", "type": "non-judicial"},
    "NJ": {"name": "New Jersey", "type": "judicial"},
    "NM": {"name": "New Mexico", "type": "judicial"},
    "NY": {"name": "New York", "type": "judicial"},
    "NC": {"name": "North Carolina", "type": "non-judicial"},
    "ND": {"name": "North Dakota", "type": "both"},
    "OH": {"name": "Ohio", "type": "judicial"},
    "OK": {"name": "Oklahoma", "type": "both"},
    "OR": {"name": "Oregon", "type": "non-judicial"},
    "PA": {"name": "Pennsylvania", "type": "judicial"},
    "RI": {"name": "Rhode Island", "type": "non-judicial"},
    "SC": {"name": "South Carolina", "type": "judicial"},
    "SD": {"name": "South Dakota", "type": "both"},
    "TN": {"name": "Tennessee", "type": "non-judicial"},
    "TX": {"name": "Texas", "type": "non-judicial"},
    "UT": {"name": "Utah", "type": "non-judicial"},
    "VT": {"name": "Vermont", "type": "judicial"},
    "VA": {"name": "Virginia", "type": "non-judicial"},
    "WA": {"name": "Washington", "type": "non-judicial"},
    "WV": {"name": "West Virginia", "type": "non-judicial"},
    "WI": {"name": "Wisconsin", "type": "judicial"},
    "WY": {"name": "Wyoming", "type": "non-judicial"},
    "DC": {"name": "District of Columbia", "type": "non-judicial"},
}
