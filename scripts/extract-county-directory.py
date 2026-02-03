#!/usr/bin/env python3
"""
Extract county directory data from US County Asset Recovery Directory 2026 PDFs.
Outputs a TypeScript data file for the foreclosure-leads-app.
"""

import pdfplumber
import re
import json
import os

PDF_DIR = "/mnt/c/Users/flowc/Downloads/files"
OUTPUT_TS = "/mnt/c/Users/flowc/Documents/foreclosure-leads-app/src/data/county-directory.ts"
OUTPUT_JSON = "/mnt/c/Users/flowc/Documents/foreclosure-leads-app/src/data/county-directory.json"

# State name to abbreviation mapping
STATE_ABBR = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
    'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
    'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
    'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
    'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
    'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Puerto Rico': 'PR',
    'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
    'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY'
}

# State header pattern: "StateName XX Counties" or "StateName XX counties"
STATE_HEADER_RE = re.compile(
    r'^(' + '|'.join(re.escape(s) for s in STATE_ABBR.keys()) + r')\s+\d+\s+[Cc]ounties',
    re.MULTILINE
)

# County line: CountyName (XXX) XXX-XXXX
COUNTY_LINE_RE = re.compile(
    r'^([A-Z][A-Za-z\s\.\'-]+?)\s+\((\d{3})\)\s+(\d{3}[- ]?\d{4})'
)

# Email line
EMAIL_RE = re.compile(r'EMAIL:\s*(\S+@\S+)', re.IGNORECASE)

# Website line
WEBSITE_RE = re.compile(r'WEBSITE:\s*(https?://\S+)', re.IGNORECASE)


def extract_all_text():
    """Read all PDFs and concatenate text."""
    all_text = []
    pdf_files = sorted([
        f for f in os.listdir(PDF_DIR)
        if f.endswith('.pdf') and 'US-County-Asset-Recovery' in f
    ])

    print(f"Found {len(pdf_files)} PDF files")

    for pdf_file in pdf_files:
        path = os.path.join(PDF_DIR, pdf_file)
        print(f"  Reading {pdf_file}...")
        pdf = pdfplumber.open(path)
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_text.append(text)
        pdf.close()

    return '\n'.join(all_text)


def parse_directory(text):
    """Parse the full text into structured county data."""
    counties = []
    current_state = None
    lines = text.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # Check for state header
        state_match = STATE_HEADER_RE.match(line)
        if state_match:
            current_state = state_match.group(1)
            print(f"  Found state: {current_state}")
            i += 1
            # Skip the "COUNTY / PHONE / EMAIL / WEBSITE QR" header if present
            if i < len(lines) and 'COUNTY' in lines[i] and 'PHONE' in lines[i]:
                i += 1
            continue

        # Check for county entry (has phone number)
        county_match = COUNTY_LINE_RE.match(line)
        if county_match and current_state:
            county_name = county_match.group(1).strip()
            area_code = county_match.group(2)
            phone_rest = county_match.group(3).replace(' ', '-')
            phone = f"({area_code}) {phone_rest}"

            email = ""
            website = ""

            # Look ahead for EMAIL and WEBSITE lines
            for j in range(1, 5):
                if i + j >= len(lines):
                    break
                next_line = lines[i + j].strip()

                # Stop if we hit another county or state header
                if COUNTY_LINE_RE.match(next_line):
                    break
                if STATE_HEADER_RE.match(next_line):
                    break

                email_match = EMAIL_RE.search(next_line)
                if email_match:
                    email = email_match.group(1)

                website_match = WEBSITE_RE.search(next_line)
                if website_match:
                    website = website_match.group(1)

            state_abbr = STATE_ABBR.get(current_state, '')
            counties.append({
                'county': county_name,
                'state': state_abbr,
                'stateName': current_state,
                'phone': phone,
                'email': email,
                'website': website,
            })

        i += 1

    return counties


def generate_typescript(counties):
    """Generate the TypeScript data file."""
    # Group by state
    by_state = {}
    for c in counties:
        state = c['state']
        if state not in by_state:
            by_state[state] = []
        by_state[state].append(c)

    ts_lines = [
        '// Auto-generated from US County Asset Recovery Directory 2026',
        '// Do not edit manually - run scripts/extract-county-directory.py to regenerate',
        '',
        'export interface CountyContact {',
        '  county: string;',
        '  state: string;',
        '  phone: string;',
        '  email: string;',
        '  website: string;',
        '}',
        '',
        'export interface StateDirectory {',
        '  stateName: string;',
        '  stateAbbr: string;',
        '  counties: CountyContact[];',
        '}',
        '',
        '// Flat lookup by "STATE-CountyName" key for quick access',
        'export const countyDirectoryLookup: Record<string, CountyContact> = {};',
        '',
        'export const stateDirectories: StateDirectory[] = [',
    ]

    for state_abbr in sorted(by_state.keys()):
        state_counties = by_state[state_abbr]
        state_name = state_counties[0]['stateName']
        ts_lines.append(f'  {{')
        ts_lines.append(f'    stateName: "{state_name}",')
        ts_lines.append(f'    stateAbbr: "{state_abbr}",')
        ts_lines.append(f'    counties: [')

        for c in sorted(state_counties, key=lambda x: x['county']):
            phone = c['phone'].replace('"', '\\"')
            email = c['email'].replace('"', '\\"')
            website = c['website'].replace('"', '\\"')
            county = c['county'].replace('"', '\\"')
            ts_lines.append(f'      {{ county: "{county}", state: "{state_abbr}", phone: "{phone}", email: "{email}", website: "{website}" }},')

        ts_lines.append(f'    ],')
        ts_lines.append(f'  }},')

    ts_lines.append('];')
    ts_lines.append('')
    ts_lines.append('// Build lookup map')
    ts_lines.append('stateDirectories.forEach(sd => {')
    ts_lines.append('  sd.counties.forEach(c => {')
    ts_lines.append('    const key = `${c.state}-${c.county}`;')
    ts_lines.append('    countyDirectoryLookup[key] = c;')
    ts_lines.append('  });')
    ts_lines.append('});')
    ts_lines.append('')
    ts_lines.append('// Helper to find county contact by state abbr and county name')
    ts_lines.append('export function findCountyContact(stateAbbr: string, countyName: string): CountyContact | undefined {')
    ts_lines.append('  // Try exact match first')
    ts_lines.append('  const exact = countyDirectoryLookup[`${stateAbbr}-${countyName}`];')
    ts_lines.append('  if (exact) return exact;')
    ts_lines.append('')
    ts_lines.append('  // Try partial match (county name might differ slightly)')
    ts_lines.append('  const stateDir = stateDirectories.find(sd => sd.stateAbbr === stateAbbr);')
    ts_lines.append('  if (!stateDir) return undefined;')
    ts_lines.append('')
    ts_lines.append('  const normalized = countyName.toLowerCase().replace(/\\s+county$/i, "").trim();')
    ts_lines.append('  return stateDir.counties.find(c => ')
    ts_lines.append('    c.county.toLowerCase() === normalized ||')
    ts_lines.append('    c.county.toLowerCase().startsWith(normalized) ||')
    ts_lines.append('    normalized.startsWith(c.county.toLowerCase())')
    ts_lines.append('  );')
    ts_lines.append('}')
    ts_lines.append('')
    ts_lines.append('// Get all counties for a state')
    ts_lines.append('export function getStateCounties(stateAbbr: string): CountyContact[] {')
    ts_lines.append('  const stateDir = stateDirectories.find(sd => sd.stateAbbr === stateAbbr);')
    ts_lines.append('  return stateDir?.counties || [];')
    ts_lines.append('}')
    ts_lines.append('')

    return '\n'.join(ts_lines)


if __name__ == '__main__':
    print("Extracting county directory from PDFs...")
    text = extract_all_text()
    print(f"\nTotal text length: {len(text):,} characters")

    print("\nParsing county data...")
    counties = parse_directory(text)
    print(f"\nTotal counties extracted: {len(counties)}")

    # Stats
    states_found = set(c['state'] for c in counties)
    print(f"States found: {len(states_found)}")
    with_email = sum(1 for c in counties if c['email'])
    with_website = sum(1 for c in counties if c['website'])
    print(f"Counties with email: {with_email}")
    print(f"Counties with website: {with_website}")

    # Per-state counts
    by_state = {}
    for c in counties:
        by_state[c['state']] = by_state.get(c['state'], 0) + 1
    print("\nPer-state counts:")
    for state in sorted(by_state.keys()):
        print(f"  {state}: {by_state[state]}")

    # Write JSON (for debugging)
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(counties, f, indent=2)
    print(f"\nJSON written to {OUTPUT_JSON}")

    # Write TypeScript
    ts_content = generate_typescript(counties)
    with open(OUTPUT_TS, 'w') as f:
        f.write(ts_content)
    print(f"TypeScript written to {OUTPUT_TS}")
    print("Done!")
