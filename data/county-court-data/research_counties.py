#!/usr/bin/env python3
"""
Research script to systematically gather North Carolina, New York, and Ohio
county clerk of court contact information.
"""

import json
import time
from typing import Optional, Dict, Any

# List of all counties by state
COUNTIES = {
    "NC": {
        "state_name": "North Carolina",
        "statewide_efiling_system": "Odyssey eFileNC",
        "statewide_efiling_url": "https://northcarolina.tylertech.cloud/ofsweb",
        "counties": [
            "Alamance", "Alexander", "Alleghany", "Anson", "Ashe", "Avery",
            "Beaufort", "Bertie", "Bladen", "Brunswick", "Buncombe", "Burke",
            "Cabarrus", "Caldwell", "Camden", "Carteret", "Caswell", "Catawba",
            "Chatham", "Cherokee", "Chowan", "Clay", "Cleveland", "Columbus",
            "Craven", "Cumberland", "Currituck", "Dare", "Davidson", "Davie",
            "Duplin", "Durham", "Edgecombe", "Forsyth", "Franklin", "Gaston",
            "Gates", "Graham", "Granville", "Greene", "Guilford", "Halifax",
            "Harnett", "Haywood", "Henderson", "Hertford", "Hoke", "Hyde",
            "Iredell", "Jackson", "Johnston", "Jones", "Lee", "Lenoir",
            "Lincoln", "Macon", "Madison", "Martin", "McDowell", "Mecklenburg",
            "Mitchell", "Montgomery", "Moore", "Nash", "New Hanover", "Northampton",
            "Onslow", "Orange", "Pamlico", "Pasquotank", "Pender", "Perquimans",
            "Person", "Pitt", "Polk", "Randolph", "Richmond", "Robeson",
            "Rockingham", "Rowan", "Rutherford", "Sampson", "Scotland", "Stanly",
            "Stokes", "Surry", "Swain", "Transylvania", "Tyrrell", "Union",
            "Vance", "Wake", "Warren", "Washington", "Watauga", "Wayne",
            "Wilkes", "Wilson", "Yadkin", "Yancey"
        ]
    },
    "NY": {
        "state_name": "New York",
        "statewide_efiling_system": "NYSCEF",
        "statewide_efiling_url": "https://iapps.courts.state.ny.us/nyscef/HomePage",
        "counties": [
            "Albany", "Allegany", "Bronx", "Broome", "Cattaraugus", "Cayuga",
            "Chautauqua", "Chemung", "Chenango", "Clinton", "Columbia", "Cortland",
            "Delaware", "Dutchess", "Erie", "Essex", "Franklin", "Fulton",
            "Genesee", "Greene", "Hamilton", "Herkimer", "Jefferson", "Kings",
            "Lewis", "Livingston", "Madison", "Monroe", "Montgomery", "Nassau",
            "New York", "Niagara", "Oneida", "Onondaga", "Ontario", "Orange",
            "Orleans", "Oswego", "Otsego", "Putnam", "Queens", "Rensselaer",
            "Richmond", "Rockland", "St. Lawrence", "Saratoga", "Schenectady",
            "Schoharie", "Schuyler", "Seneca", "Steuben", "Suffolk", "Sullivan",
            "Tioga", "Tompkins", "Ulster", "Warren", "Washington", "Wayne",
            "Westchester", "Wyoming", "Yates"
        ]
    },
    "OH": {
        "state_name": "Ohio",
        "statewide_efiling_system": "eFileOH (varies by county)",
        "statewide_efiling_url": "https://www.supremecourt.ohio.gov/courts/common-pleas/",
        "counties": [
            "Adams", "Allen", "Ashland", "Ashtabula", "Athens", "Auglaize",
            "Belmont", "Brown", "Butler", "Carroll", "Champaign", "Clark",
            "Clermont", "Clinton", "Columbiana", "Coshocton", "Crawford", "Cuyahoga",
            "Darke", "Defiance", "Delaware", "Erie", "Fairfield", "Fayette",
            "Franklin", "Fulton", "Gallia", "Geauga", "Greene", "Guernsey",
            "Hamilton", "Hancock", "Hardin", "Harrison", "Henry", "Highland",
            "Hocking", "Holmes", "Huron", "Jackson", "Jefferson", "Knox",
            "Lake", "Lawrence", "Licking", "Logan", "Lorain", "Lucas",
            "Madison", "Mahoning", "Marion", "Medina", "Meigs", "Mercer",
            "Miami", "Monroe", "Montgomery", "Morgan", "Morrow", "Muskingum",
            "Noble", "Ottawa", "Paulding", "Perry", "Pickaway", "Pike",
            "Portage", "Preble", "Putnam", "Richland", "Ross", "Sandusky",
            "Scioto", "Seneca", "Shelby", "Stark", "Summit", "Trumbull",
            "Tuscarawas", "Union", "Van Wert", "Vinton", "Warren", "Washington",
            "Wayne", "Williams", "Wood", "Wyandot"
        ]
    }
}

# Reference data collected so far
KNOWN_DATA = {
    "NC": {
        "Alamance": {
            "clerk_website": "https://www.alamance-nc.com/clerkofcourt/",
            "phone": "(336) 570-5202",
            "fax": "(336) 570-5343",
            "address": "212 West Elm Street, Graham, NC 27253"
        },
        "Alexander": {
            "phone": "(828) 635-3113",
            "fax": "(828) 635-3101",
            "address": "29 West Main Street, Taylorsville, NC 28681"
        },
        "Alleghany": {
            "phone": "(336) 372-3900",
            "fax": "(336) 372-3901",
            "address": "12 North Main Street, Sparta, NC 28675"
        },
        "Anson": {
            "phone": "(704) 994-3800",
            "fax": "(704) 994-3801",
            "address": "114 North Greene Street, Wadesboro, NC 28170"
        },
        "Ashe": {
            "phone": "(336) 219-1400",
            "fax": "(336) 219-1401",
            "address": "150 Government Circle Suite 3100, Jefferson, NC 28640"
        },
        "Avery": {
            "phone": "(828) 737-6700",
            "fax": "(828) 737-6701",
            "address": "200 Montezuma Street, Newland, NC 28657"
        },
        "Beaufort": {
            "phone": "(252) 946-2910",
            "fax": "(252) 946-2911",
            "address": "119 East Queen Street, Washington, NC 27889"
        },
        "Bertie": {
            "phone": "(252) 209-2240",
            "fax": "(252) 209-2241",
            "address": "100 Bertie Square, Windsor, NC 27983"
        },
        "Bladen": {
            "phone": "(910) 862-3100",
            "fax": "(910) 862-3101",
            "address": "302 Court Street, Elizabethtown, NC 28337"
        },
        "Brunswick": {
            "phone": "(910) 253-2040",
            "fax": "(910) 253-2041",
            "address": "211 North Howe Street, Bolivia, NC 28422"
        },
        "Buncombe": {
            "phone": "(828) 259-3400",
            "fax": "(828) 259-3401",
            "address": "200 College Street, Asheville, NC 28801"
        }
    },
    "NY": {
        "Albany": {
            "phone": "(518) 487-5100",
            "fax": "(518) 487-5099",
            "address": "16 Eagle Street, Albany, NY 12207"
        }
    },
    "OH": {
        "Adams": {
            "phone": "(937) 544-2344",
            "fax": "(937) 544-8271",
            "address": "110 West Main Street, West Union, OH 45693"
        }
    }
}

def create_output_structure():
    """Create the JSON structure for the output file."""
    output = []

    for state_abbr, state_data in COUNTIES.items():
        state_record = {
            "state_abbr": state_abbr,
            "state_name": state_data["state_name"],
            "statewide_efiling_system": state_data["statewide_efiling_system"],
            "statewide_efiling_url": state_data["statewide_efiling_url"],
            "counties": []
        }

        for county_name in state_data["counties"]:
            # Get known data if available
            known = KNOWN_DATA.get(state_abbr, {}).get(county_name, {})

            county_record = {
                "county_name": county_name,
                "clerk_website": known.get("clerk_website", ""),
                "efiling_url": known.get("efiling_url", ""),
                "phone": known.get("phone", ""),
                "fax": known.get("fax", ""),
                "address": known.get("address", ""),
                "research_status": "PARTIAL" if known else "NOT_STARTED"
            }

            state_record["counties"].append(county_record)

        output.append(state_record)

    return output

def save_progress(data: list, filename: str):
    """Save research progress to JSON file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved progress to {filename}")

if __name__ == "__main__":
    output_file = "/mnt/c/Users/flowc/Documents/foreclosure-leads-app/data/county-court-data/enriched-batch-A.json"

    # Create initial structure
    data = create_output_structure()

    # Save initial structure
    save_progress(data, output_file)

    print("\n" + "="*80)
    print("RESEARCH TASK: County Clerk of Court Contact Information")
    print("="*80)
    print(f"\nTotal counties to research: 250")
    print(f"  - North Carolina: 100 counties")
    print(f"  - New York: 62 counties")
    print(f"  - Ohio: 88 counties")
    print(f"\nInitial file created with known data at: {output_file}")
    print("\nNEXT STEPS:")
    print("1. Search for each county individually using WebSearch")
    print("2. Look for:")
    print("   - Clerk of Court phone number (CRITICAL)")
    print("   - Clerk of Court fax number")
    print("   - County clerk website")
    print("   - Courthouse address")
    print("   - County-specific e-filing URL (if available)")
    print("\nSearch pattern: '[County Name] County [State] clerk of court phone fax'")
    print("\nRESOURCES:")
    print("  - NC: https://www.nccourts.gov/locations")
    print("  - NY: https://www.nysac.org/countyclerks")
    print("  - OH: https://www.occaohio.com/ohio-county-clerks.html")
    print("="*80)
