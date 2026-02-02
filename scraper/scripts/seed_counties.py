"""
Seed Counties Database
Populates the counties table with all US counties and their scraping configuration.
"""

import asyncio
import json
from pathlib import Path

import asyncpg
import httpx

# All US counties with FIPS codes
# Source: US Census Bureau
US_COUNTIES_API = "https://api.census.gov/data/2020/dec/pl?get=NAME&for=county:*"


async def fetch_counties_from_census() -> list[dict]:
    """Fetch county list from US Census API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(US_COUNTIES_API)
        data = response.json()

        counties = []
        # Skip header row
        for row in data[1:]:
            name = row[0]
            state_fips = row[1]
            county_fips = row[2]

            # Parse county name (remove ", State" suffix)
            county_name = name.split(",")[0].strip()
            # Remove "County" suffix if present
            if county_name.endswith(" County"):
                county_name = county_name[:-7]
            elif county_name.endswith(" Parish"):  # Louisiana
                county_name = county_name[:-7]
            elif county_name.endswith(" Borough"):  # Alaska
                county_name = county_name[:-8]

            counties.append({
                "name": county_name,
                "fips_code": f"{state_fips}{county_fips}",
                "state_fips": state_fips,
            })

        return counties


# State FIPS to abbreviation mapping
STATE_FIPS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
    "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
    "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
    "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
    "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
    "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
    "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
    "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
    "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
    "56": "WY",
}


# Counties with known online records
COUNTIES_WITH_ONLINE_RECORDS = {
    # Florida - RealAuction counties
    "FL": [
        "Alachua", "Baker", "Bay", "Bradford", "Brevard", "Broward",
        "Charlotte", "Citrus", "Clay", "Collier", "Columbia", "Duval",
        "Escambia", "Flagler", "Hernando", "Highlands", "Hillsborough",
        "Indian River", "Lake", "Lee", "Leon", "Manatee", "Marion",
        "Martin", "Miami-Dade", "Monroe", "Nassau", "Okaloosa", "Orange",
        "Osceola", "Palm Beach", "Pasco", "Pinellas", "Polk", "Putnam",
        "Santa Rosa", "Sarasota", "Seminole", "St. Johns", "St. Lucie",
        "Sumter", "Volusia",
    ],
    # Texas - major counties
    "TX": [
        "Harris", "Dallas", "Tarrant", "Bexar", "Travis", "Collin",
        "Denton", "Hidalgo", "El Paso", "Fort Bend", "Williamson",
        "Montgomery", "Cameron", "Nueces", "Bell", "Galveston",
    ],
    # California - major counties
    "CA": [
        "Los Angeles", "San Diego", "Orange", "Riverside", "San Bernardino",
        "Santa Clara", "Alameda", "Sacramento", "Contra Costa", "Fresno",
        "Kern", "San Francisco", "Ventura", "San Mateo", "San Joaquin",
    ],
    # Arizona
    "AZ": ["Maricopa", "Pima", "Pinal", "Yavapai", "Yuma", "Mohave", "Coconino"],
    # Nevada
    "NV": ["Clark", "Washoe", "Carson City", "Douglas", "Lyon", "Nye"],
    # Colorado
    "CO": [
        "Denver", "El Paso", "Arapahoe", "Jefferson", "Adams", "Larimer",
        "Boulder", "Douglas", "Weld", "Pueblo",
    ],
    # Georgia
    "GA": [
        "Fulton", "Gwinnett", "Cobb", "DeKalb", "Chatham", "Clayton",
        "Cherokee", "Forsyth", "Henry", "Richmond",
    ],
    # Ohio
    "OH": [
        "Cuyahoga", "Franklin", "Hamilton", "Summit", "Montgomery",
        "Lucas", "Butler", "Stark", "Lorain", "Mahoning",
    ],
    # Pennsylvania
    "PA": [
        "Philadelphia", "Allegheny", "Montgomery", "Bucks", "Delaware",
        "Lancaster", "Chester", "York", "Berks", "Lehigh",
    ],
    # New York
    "NY": [
        "Kings", "Queens", "New York", "Suffolk", "Bronx", "Nassau",
        "Westchester", "Erie", "Monroe", "Richmond",
    ],
}


# Counties requiring email/FOIA requests
COUNTIES_REQUIRING_EMAIL = {
    "AL": ["Autauga", "Baldwin", "Barbour", "Bibb", "Blount"],
    "AR": ["Arkansas", "Ashley", "Baxter", "Benton", "Boone"],
    "KY": ["Adair", "Allen", "Anderson", "Ballard", "Barren"],
    "MS": ["Adams", "Alcorn", "Amite", "Attala", "Benton"],
    "WV": ["Barbour", "Berkeley", "Boone", "Braxton", "Brooke"],
}


async def seed_database(db_url: str):
    """Seed the counties database."""
    print("Connecting to database...")
    conn = await asyncpg.connect(db_url)

    try:
        print("Fetching county data from Census API...")
        counties = await fetch_counties_from_census()
        print(f"Found {len(counties)} counties")

        # Insert counties
        inserted = 0
        for county in counties:
            state_fips = county["state_fips"]
            state_abbr = STATE_FIPS.get(state_fips)

            if not state_abbr:
                continue

            # Check if county has online records
            has_online = (
                state_abbr in COUNTIES_WITH_ONLINE_RECORDS
                and county["name"] in COUNTIES_WITH_ONLINE_RECORDS[state_abbr]
            )

            # Check if county requires email
            requires_email = (
                state_abbr in COUNTIES_REQUIRING_EMAIL
                and county["name"] in COUNTIES_REQUIRING_EMAIL[state_abbr]
            )

            try:
                await conn.execute(
                    """
                    INSERT INTO counties (name, state_abbr, fips_code, has_online_records, requires_email_request)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (name, state_abbr) DO UPDATE SET
                        fips_code = EXCLUDED.fips_code,
                        has_online_records = EXCLUDED.has_online_records,
                        requires_email_request = EXCLUDED.requires_email_request
                    """,
                    county["name"],
                    state_abbr,
                    county["fips_code"],
                    has_online,
                    requires_email,
                )
                inserted += 1
            except Exception as e:
                print(f"Error inserting {county['name']}, {state_abbr}: {e}")

        print(f"Inserted/updated {inserted} counties")

        # Insert scrape sources
        print("Inserting scrape sources...")
        sources = [
            ("Auction.com", "aggregator", "https://www.auction.com", "AuctionComScraper", True),
            ("RealAuction", "county_auction", "https://www.realauction.com", "RealAuctionScraper", True),
            ("RealtyTrac", "aggregator", "https://www.realtytrac.com", "RealtyTracScraper", True),
            ("Zillow Foreclosures", "aggregator", "https://www.zillow.com", "ZillowScraper", True),
            ("HUD Homes", "aggregator", "https://www.hudhomestore.gov", "HUDHomesScraper", True),
        ]

        for name, source_type, base_url, scraper_class, uses_js in sources:
            await conn.execute(
                """
                INSERT INTO scrape_sources (name, source_type, base_url, scraper_class, uses_javascript, states_covered)
                VALUES ($1, $2, $3, $4, $5, ARRAY['ALL'])
                ON CONFLICT (name) DO UPDATE SET
                    base_url = EXCLUDED.base_url,
                    scraper_class = EXCLUDED.scraper_class
                """,
                name,
                source_type,
                base_url,
                scraper_class,
                uses_js,
            )

        print("Database seeded successfully!")

        # Print summary
        county_count = await conn.fetchval("SELECT COUNT(*) FROM counties")
        online_count = await conn.fetchval("SELECT COUNT(*) FROM counties WHERE has_online_records = TRUE")
        email_count = await conn.fetchval("SELECT COUNT(*) FROM counties WHERE requires_email_request = TRUE")
        source_count = await conn.fetchval("SELECT COUNT(*) FROM scrape_sources")

        print(f"\nSummary:")
        print(f"  Total counties: {county_count}")
        print(f"  Counties with online records: {online_count}")
        print(f"  Counties requiring email: {email_count}")
        print(f"  Scrape sources: {source_count}")

    finally:
        await conn.close()


if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()

    db_url = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/postgres"
    )

    asyncio.run(seed_database(db_url))
