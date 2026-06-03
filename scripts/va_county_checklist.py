#!/usr/bin/env python3
"""
VA Human-in-the-Loop County Checklist Generator

Generates a checklist of counties that need manual intervention to access
surplus funds / excess proceeds data. This includes:
- Counties with no online data portal
- Counties requiring FOIA requests
- Counties requiring phone calls
- Counties requiring in-person visits

Output: CSV with county name, state, contact info, required action, status

Run: python3 va_county_checklist.py --output /tmp/va_county_checklist.csv
"""

import csv
import re
import sys
import argparse
from datetime import datetime

NON_JUDICIAL = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "GA", "HI", "ID", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NC",
    "OR", "SD", "TN", "TX", "UT", "VA", "WA", "WV", "WY"
}

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "GA": "Georgia", "HI": "Hawaii",
    "ID": "Idaho", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan",
    "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana",
    "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NC": "North Carolina",
    "OR": "Oregon", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas",
    "UT": "Utah", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WY": "Wyoming",
}

# Counties already configured in the scraper (don't need manual work)
AUTOMATED_COUNTIES = set()  # Will be populated from scraper config


def parse_county_directory(ts_file: str) -> list:
    counties = []
    with open(ts_file, "r", encoding="utf-8") as f:
        content = f.read()
    pattern = r'\{\s*county:\s*"([^"]+)",\s*state:\s*"([^"]+)",\s*phone:\s*"([^"]*)",\s*email:\s*"([^"]*)",\s*website:\s*"([^"]*)"\s*\}'
    for m in re.finditer(pattern, content):
        counties.append({
            "county": m.group(1),
            "state": m.group(2),
            "phone": m.group(3),
            "email": m.group(4),
            "website": m.group(5),
        })
    return counties


def determine_action(county_info: dict) -> str:
    """Determine what manual action is needed for this county."""
    has_email = county_info["email"] and "@" in county_info["email"]
    has_phone = county_info["phone"] and len(county_info["phone"]) > 5
    has_website = county_info["website"] and county_info["website"].startswith("http")

    if has_email:
        return "EMAIL_FOIA"
    elif has_phone:
        return "PHONE_REQUEST"
    elif has_website:
        return "CHECK_WEBSITE"
    else:
        return "RESEARCH_NEEDED"


def generate_instructions(action: str, county: str, state: str) -> str:
    """Generate VA instructions for each action type."""
    state_name = STATE_NAMES.get(state, state)
    instructions = {
        "EMAIL_FOIA": f"Send FOIA email requesting current excess proceeds/surplus funds list for {county}, {state_name}. Ask for Excel/PDF format. Template in county_email_outreach.py.",
        "PHONE_REQUEST": f"Call county office and request excess proceeds list. Ask: 1) Do you have an excess proceeds or surplus funds list? 2) Can you email it to claim@usforeclosurerecovery.com? 3) Is it available online?",
        "CHECK_WEBSITE": f"Visit the county website and search for: excess proceeds, surplus funds, tax sale overages, unclaimed funds. Check the Treasurer and Tax Collector pages.",
        "RESEARCH_NEEDED": f"Google search: '{county} {state_name} excess proceeds list site:.gov' and '{county} {state_name} surplus funds tax sale'. Find contact info.",
    }
    return instructions.get(action, "Research needed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--county-dir", type=str,
                       default="/mnt/c/Users/flowc/Documents/foreclosure-leads-app/src/data/county-directory.ts")
    parser.add_argument("--state", type=str, help="Filter to one state")
    parser.add_argument("--output", type=str, default="/tmp/va_county_checklist.csv")
    parser.add_argument("--priority", choices=["high", "medium", "all"], default="all",
                       help="high=top 10 counties per state, medium=top 20, all=everything")

    args = parser.parse_args()

    counties = parse_county_directory(args.county_dir)
    nj = [c for c in counties if c["state"] in NON_JUDICIAL]

    if args.state:
        nj = [c for c in nj if c["state"] == args.state.upper()]

    # Write CSV
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Priority", "State", "County", "Action",
            "Phone", "Email", "Website",
            "Instructions", "Status", "Notes", "Date Completed"
        ])

        # Group by state
        from collections import defaultdict
        by_state = defaultdict(list)
        for c in nj:
            by_state[c["state"]].append(c)

        row_num = 0
        for state in sorted(by_state.keys()):
            state_counties = by_state[state]

            # Priority limiting
            if args.priority == "high":
                state_counties = state_counties[:10]
            elif args.priority == "medium":
                state_counties = state_counties[:20]

            for i, c in enumerate(state_counties):
                action = determine_action(c)
                instructions = generate_instructions(action, c["county"], c["state"])
                priority = "HIGH" if i < 5 else ("MEDIUM" if i < 15 else "LOW")

                writer.writerow([
                    priority,
                    c["state"],
                    c["county"],
                    action,
                    c["phone"],
                    c["email"],
                    c["website"],
                    instructions,
                    "NOT STARTED",
                    "",
                    "",
                ])
                row_num += 1

    print(f"Generated {row_num} checklist items -> {args.output}")
    print(f"\nAction breakdown:")
    actions = {}
    for c in nj:
        a = determine_action(c)
        actions[a] = actions.get(a, 0) + 1
    for a, count in sorted(actions.items(), key=lambda x: -x[1]):
        print(f"  {a}: {count}")


if __name__ == "__main__":
    main()
