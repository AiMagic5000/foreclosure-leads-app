#!/usr/bin/env python3
"""
Merge all county court JSON files into a single consolidated dataset.
Prioritizes enriched data over original skeleton data.
Deduplicates by state + county name, keeping the record with the most fields filled.
"""

import json
import os
import sys

BASE = '/mnt/c/Users/flowc/Documents/foreclosure-leads-app/data/county-court-data'

# Field names that might vary between files
FIELD_MAP = {
    'efiling_url': ['efiling_url', 'e_filing_url'],
    'efiling_system': ['efiling_system', 'e_filing_system'],
    'clerk_website': ['clerk_website', 'clerk_url'],
    'address': ['address', 'mailing_address'],
    'statewide_efiling_system': ['statewide_efiling_system', 'statewide_efiling'],
}

def normalize_county(county_data):
    """Normalize field names to consistent keys."""
    result = {}
    for canonical, variants in FIELD_MAP.items():
        for v in variants:
            val = county_data.get(v, '')
            if val and str(val).strip():
                result[canonical] = str(val).strip()
                break
        if canonical not in result:
            result[canonical] = ''

    # Copy standard fields
    for key in ['county_name', 'phone', 'fax', 'clerk_name']:
        result[key] = (county_data.get(key, '') or '').strip()

    return result

def normalize_name(name):
    """Strip suffixes like County, Parish, Borough for dedup matching."""
    import re
    n = name.strip()
    n = re.sub(r'\s+(County|Parish|Borough|Census Area|City|Municipality)$', '', n, flags=re.IGNORECASE)
    return n.strip()

def count_filled(county):
    """Count non-empty fields for quality comparison."""
    return sum(1 for v in county.values() if v and str(v).strip())

def merge_county(existing, new):
    """Merge two county records, preferring non-empty values."""
    merged = {}
    all_keys = set(list(existing.keys()) + list(new.keys()))
    for key in all_keys:
        old_val = (existing.get(key, '') or '').strip()
        new_val = (new.get(key, '') or '').strip()
        # Prefer non-empty, prefer longer/more detailed value
        if new_val and (not old_val or len(new_val) > len(old_val)):
            merged[key] = new_val
        elif old_val:
            merged[key] = old_val
        else:
            merged[key] = ''
    return merged

def main():
    # Load order: originals first, then enriched (enriched overrides)
    originals = sorted([f for f in os.listdir(BASE) if f.startswith('group') and f.endswith('.json')])
    enriched = sorted([f for f in os.listdir(BASE) if (f.startswith('enriched') or f.startswith('followup')) and f.endswith('.json')])

    # Process originals first, then enriched (enriched data takes priority)
    all_files = originals + enriched

    # Master data: state_abbr -> { state_info, counties: {county_name: data} }
    master = {}

    for fname in all_files:
        path = os.path.join(BASE, fname)
        try:
            with open(path) as f:
                data = json.load(f)
        except Exception as e:
            print(f"  SKIP {fname}: {e}", file=sys.stderr)
            continue

        for state in data:
            abbr = state.get('state_abbr', '')
            if not abbr:
                continue

            if abbr not in master:
                master[abbr] = {
                    'state_name': state.get('state_name', ''),
                    'statewide_efiling_system': '',
                    'statewide_efiling_url': '',
                    'counties': {}
                }

            # Update statewide info (prefer non-empty)
            for field in ['statewide_efiling_system', 'statewide_efiling', 'statewide_efiling_url']:
                val = (state.get(field, '') or '').strip()
                if val:
                    canonical = 'statewide_efiling_system' if 'system' in field or field == 'statewide_efiling' else 'statewide_efiling_url'
                    if not master[abbr][canonical] or len(val) > len(master[abbr][canonical]):
                        master[abbr][canonical] = val

            if state.get('state_name', ''):
                master[abbr]['state_name'] = state['state_name']

            for county in state.get('counties', []):
                name = (county.get('county_name', '') or '').strip()
                if not name:
                    continue

                normalized = normalize_county(county)
                # Use normalized name (without "County" suffix) as dedup key
                dedup_key = normalize_name(name)
                normalized['county_name'] = name

                if dedup_key in master[abbr]['counties']:
                    # Keep the shorter name (without "County") as canonical
                    existing = master[abbr]['counties'][dedup_key]
                    merged = merge_county(existing, normalized)
                    # Prefer name without "County" suffix for consistency
                    if len(existing.get('county_name', '')) <= len(name):
                        merged['county_name'] = existing['county_name']
                    master[abbr]['counties'][dedup_key] = merged
                else:
                    master[abbr]['counties'][dedup_key] = normalized

    # Build final output
    output = []
    total_counties = 0
    total_fax = 0
    total_phone = 0

    for abbr in sorted(master.keys()):
        state_data = master[abbr]
        counties = sorted(state_data['counties'].values(), key=lambda c: c.get('county_name', ''))

        fax_count = sum(1 for c in counties if (c.get('fax') or '').strip())
        phone_count = sum(1 for c in counties if (c.get('phone') or '').strip())
        total_counties += len(counties)
        total_fax += fax_count
        total_phone += phone_count

        output.append({
            'state_abbr': abbr,
            'state_name': state_data['state_name'],
            'statewide_efiling_system': state_data['statewide_efiling_system'],
            'statewide_efiling_url': state_data['statewide_efiling_url'],
            'counties': counties
        })

        print(f"  {abbr}: {len(counties):4d} counties, {fax_count:4d} fax, {phone_count:4d} phone")

    # Write consolidated file
    out_path = os.path.join(BASE, 'consolidated-all-counties.json')
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2)

    size_mb = os.path.getsize(out_path) / 1024 / 1024
    print(f"\n{'='*60}")
    print(f"CONSOLIDATED: {total_counties} counties, {total_fax} fax, {total_phone} phone")
    print(f"File: {out_path} ({size_mb:.1f} MB)")
    print(f"States: {len(output)}")

if __name__ == '__main__':
    main()
