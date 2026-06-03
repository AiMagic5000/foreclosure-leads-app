#!/usr/bin/env python3
"""
Generates src/data/county-court-directory.ts from the 7 JSON files
in data/county-court-data/.

Reads all group*.json files, merges/deduplicates by state abbreviation,
sorts states alphabetically, and outputs a TypeScript module with:
  - CountyCourtInfo and StateCourtDirectory interfaces
  - Embedded data as constants
  - Lookup function with partial/fuzzy matching
"""

import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "county-court-data"
OUTPUT_FILE = BASE_DIR / "src" / "data" / "county-court-directory.ts"

JSON_FILES = [
    "consolidated-all-counties.json",
]


def get_field(obj, *keys, default=""):
    """Return the first matching key's value from obj, or default."""
    for k in keys:
        if k in obj and obj[k]:
            return obj[k]
    return default


def normalize_county(county_obj, state_abbr, state_name, statewide_system, statewide_url):
    """Extract a normalized county record from a JSON county object."""
    return {
        "county": get_field(county_obj, "county_name", "county"),
        "state": state_abbr,
        "efilingSystem": get_field(county_obj, "efiling_system", "e_filing_system", default=""),
        "efilingUrl": get_field(county_obj, "efiling_url", "e_filing_url", default=""),
        "clerkWebsite": get_field(county_obj, "clerk_website", "clerk_url", default=""),
        "phone": get_field(county_obj, "phone", default=""),
        "fax": get_field(county_obj, "fax", default=""),
        "address": get_field(county_obj, "address", "mailing_address", default=""),
        "statewideEfilingSystem": statewide_system,
        "statewideEfilingUrl": statewide_url,
    }


def escape_ts_string(s):
    """Escape a string for safe inclusion in a TypeScript string literal."""
    if not s:
        return ""
    return (
        s.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "")
        .replace("\t", "\\t")
    )


def main():
    # Collect all states keyed by state_abbr
    states_map = {}  # state_abbr -> { state_name, statewide_system, statewide_url, counties_map }

    for fname in JSON_FILES:
        fpath = DATA_DIR / fname
        if not fpath.exists():
            print(f"WARNING: {fpath} not found, skipping", file=sys.stderr)
            continue

        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)

        for state_obj in data:
            abbr = state_obj.get("state_abbr", "")
            name = state_obj.get("state_name", "")
            sw_system = get_field(state_obj, "statewide_efiling_system", "statewide_efiling", default="")
            sw_url = get_field(state_obj, "statewide_efiling_url", default="")

            if abbr not in states_map:
                states_map[abbr] = {
                    "state_name": name,
                    "statewide_system": sw_system,
                    "statewide_url": sw_url,
                    "counties_map": {},  # county_name -> county_record
                }
            else:
                # Merge statewide info if missing
                existing = states_map[abbr]
                if not existing["statewide_system"] and sw_system:
                    existing["statewide_system"] = sw_system
                if not existing["statewide_url"] and sw_url:
                    existing["statewide_url"] = sw_url
                if not existing["state_name"] and name:
                    existing["state_name"] = name

            counties = state_obj.get("counties", [])
            for c in counties:
                county_rec = normalize_county(
                    c, abbr, name,
                    states_map[abbr]["statewide_system"],
                    states_map[abbr]["statewide_url"]
                )
                cname = county_rec["county"]
                if not cname:
                    continue

                existing_counties = states_map[abbr]["counties_map"]
                if cname not in existing_counties:
                    existing_counties[cname] = county_rec
                else:
                    # Merge: fill in blanks from new data
                    old = existing_counties[cname]
                    for key in county_rec:
                        if not old.get(key) and county_rec[key]:
                            old[key] = county_rec[key]

    # Sort states alphabetically by abbreviation
    sorted_abbrs = sorted(states_map.keys())

    total_counties = 0
    total_states = len(sorted_abbrs)

    # Build TypeScript output
    lines = []
    lines.append("// Auto-generated from county court data JSON files")
    lines.append("// Do not edit manually - run scripts/generate-county-court-directory.py to regenerate")
    lines.append("")
    lines.append("export interface CountyCourtInfo {")
    lines.append("  county: string;")
    lines.append("  state: string;")
    lines.append("  efilingSystem: string;")
    lines.append("  efilingUrl: string;")
    lines.append("  clerkWebsite: string;")
    lines.append("  phone: string;")
    lines.append("  fax: string;")
    lines.append("  address: string;")
    lines.append("  statewideEfilingSystem: string;")
    lines.append("  statewideEfilingUrl: string;")
    lines.append("}")
    lines.append("")
    lines.append("export interface StateCourtDirectory {")
    lines.append("  stateName: string;")
    lines.append("  stateAbbr: string;")
    lines.append("  statewideEfilingSystem: string;")
    lines.append("  statewideEfilingUrl: string;")
    lines.append("  counties: CountyCourtInfo[];")
    lines.append("}")
    lines.append("")
    lines.append("// Flat lookup by \"STATE-CountyName\" key for quick access")
    lines.append("export const countyCourtLookup: Record<string, CountyCourtInfo> = {};")
    lines.append("")
    lines.append("export const stateCourtDirectories: StateCourtDirectory[] = [")

    for abbr in sorted_abbrs:
        state_data = states_map[abbr]
        state_name = escape_ts_string(state_data["state_name"])
        sw_system = escape_ts_string(state_data["statewide_system"])
        sw_url = escape_ts_string(state_data["statewide_url"])

        lines.append("  {")
        lines.append(f'    stateName: "{state_name}",')
        lines.append(f'    stateAbbr: "{escape_ts_string(abbr)}",')
        lines.append(f'    statewideEfilingSystem: "{sw_system}",')
        lines.append(f'    statewideEfilingUrl: "{sw_url}",')
        lines.append("    counties: [")

        # Sort counties alphabetically
        county_names = sorted(state_data["counties_map"].keys())
        for cname in county_names:
            rec = state_data["counties_map"][cname]
            county = escape_ts_string(rec["county"])
            state = escape_ts_string(rec["state"])
            efiling_sys = escape_ts_string(rec["efilingSystem"])
            efiling_url = escape_ts_string(rec["efilingUrl"])
            clerk = escape_ts_string(rec["clerkWebsite"])
            phone = escape_ts_string(rec["phone"])
            fax = escape_ts_string(rec["fax"])
            address = escape_ts_string(rec["address"])
            sw_sys_c = escape_ts_string(rec["statewideEfilingSystem"])
            sw_url_c = escape_ts_string(rec["statewideEfilingUrl"])

            lines.append(
                f'      {{ county: "{county}", state: "{state}", '
                f'efilingSystem: "{efiling_sys}", efilingUrl: "{efiling_url}", '
                f'clerkWebsite: "{clerk}", phone: "{phone}", fax: "{fax}", '
                f'address: "{address}", '
                f'statewideEfilingSystem: "{sw_sys_c}", statewideEfilingUrl: "{sw_url_c}" }},'
            )
            total_counties += 1

        lines.append("    ],")
        lines.append("  },")

    lines.append("];")
    lines.append("")
    lines.append("// Build lookup map")
    lines.append("stateCourtDirectories.forEach(sd => {")
    lines.append("  sd.counties.forEach(c => {")
    lines.append('    const key = `${c.state}-${c.county}`;')
    lines.append("    countyCourtLookup[key] = c;")
    lines.append("  });")
    lines.append("});")
    lines.append("")
    lines.append("// Helper to find county court info by state abbr and county name")
    lines.append("// Supports partial and fuzzy matching (strips 'County', 'Parish', etc.)")
    lines.append("export function findCountyCourtInfo(stateAbbr: string, countyName: string): CountyCourtInfo | undefined {")
    lines.append('  const upper = stateAbbr.toUpperCase();')
    lines.append("")
    lines.append("  // Try exact match first")
    lines.append("  const exact = countyCourtLookup[`${upper}-${countyName}`];")
    lines.append("  if (exact) return exact;")
    lines.append("")
    lines.append("  // Try partial match")
    lines.append("  const stateDir = stateCourtDirectories.find(sd => sd.stateAbbr === upper);")
    lines.append("  if (!stateDir) return undefined;")
    lines.append("")
    lines.append('  const normalized = countyName.toLowerCase()')
    lines.append('    .replace(/\\s+(county|parish|borough|census area|city|municipality)$/i, "")')
    lines.append("    .trim();")
    lines.append("")
    lines.append("  return stateDir.counties.find(c => {")
    lines.append("    const cNorm = c.county.toLowerCase()")
    lines.append('      .replace(/\\s+(county|parish|borough|census area|city|municipality)$/i, "")')
    lines.append("      .trim();")
    lines.append("    return (")
    lines.append("      cNorm === normalized ||")
    lines.append("      cNorm.startsWith(normalized) ||")
    lines.append("      normalized.startsWith(cNorm)")
    lines.append("    );")
    lines.append("  });")
    lines.append("}")
    lines.append("")
    lines.append("// Get all counties for a state")
    lines.append("export function getStateCourtCounties(stateAbbr: string): CountyCourtInfo[] {")
    lines.append("  const stateDir = stateCourtDirectories.find(sd => sd.stateAbbr === stateAbbr.toUpperCase());")
    lines.append("  return stateDir?.counties || [];")
    lines.append("}")
    lines.append("")
    lines.append("// Get all state court directories")
    lines.append("export function getAllStateCourtDirectories(): StateCourtDirectory[] {")
    lines.append("  return stateCourtDirectories;")
    lines.append("}")
    lines.append("")

    output = "\n".join(lines)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Generated {OUTPUT_FILE}")
    print(f"  States: {total_states}")
    print(f"  Counties: {total_counties}")
    print(f"  File size: {len(output):,} bytes")


if __name__ == "__main__":
    main()
