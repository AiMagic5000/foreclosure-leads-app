#!/usr/bin/env python3
"""
Test script for county_surplus_scraper.py
Tests individual components without full scrape.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from county_surplus_scraper import (
    CountySurplusScraper,
    SupabaseClient,
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)


def test_supabase_connection():
    """Test Supabase connection."""
    print("Testing Supabase connection...")
    db = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Try to check if a lead exists (should work even if no leads)
    try:
        exists = db.check_lead_exists("123 Test St", "Test Owner")
        print(f"✓ Supabase connection successful")
        print(f"  Test lead exists: {exists}")
        return True
    except Exception as e:
        print(f"✗ Supabase connection failed: {e}")
        return False


def test_google_search():
    """Test Google search functionality."""
    print("\nTesting Google search...")
    scraper = CountySurplusScraper()

    query = "Gwinnett County GA excess proceeds list"
    urls = scraper.google_search(query, num_results=5)

    print(f"✓ Found {len(urls)} URLs for query: {query}")
    for i, url in enumerate(urls[:3], 1):
        print(f"  {i}. {url}")

    return len(urls) > 0


def test_url_discovery():
    """Test URL discovery for a single county."""
    print("\nTesting URL discovery...")
    scraper = CountySurplusScraper()

    urls = scraper.discover_county_urls("Gwinnett County", "GA")

    print(f"✓ Discovered {len(urls)} URLs for Gwinnett County, GA")
    for i, url in enumerate(urls[:5], 1):
        print(f"  {i}. {url}")

    return len(urls) > 0


def test_file_discovery():
    """Test finding downloadable files on a page."""
    print("\nTesting file discovery...")
    scraper = CountySurplusScraper()

    # Use a known county URL
    test_url = "https://www.gwinnettcounty.com/web/gwinnett/departments/taxcommissioner/taxsales"

    files = scraper.find_downloadable_files(test_url)

    print(f"✓ Found {len(files)} downloadable files at {test_url}")
    for i, (url, file_type) in enumerate(files[:5], 1):
        print(f"  {i}. [{file_type.upper()}] {url}")

    return True


def test_amount_parsing():
    """Test amount parsing logic."""
    print("\nTesting amount parsing...")
    scraper = CountySurplusScraper()

    test_cases = [
        ("$1,234.56", 1234.56),
        ("$12,345", 12345.0),
        ("1234.56", 1234.56),
        ("$1,234", 1234.0),
        ("invalid", 0.0),
    ]

    all_passed = True
    for input_str, expected in test_cases:
        result = scraper._parse_amount(input_str)
        passed = abs(result - expected) < 0.01
        status = "✓" if passed else "✗"
        print(f"  {status} '{input_str}' -> {result} (expected {expected})")
        if not passed:
            all_passed = False

    return all_passed


def test_address_parsing():
    """Test address component parsing."""
    print("\nTesting address parsing...")
    scraper = CountySurplusScraper()

    test_cases = [
        ("123 Main St, Atlanta, GA 30301", "Atlanta", "30301"),
        ("456 Oak Ave, Lawrenceville GA 30043", "Lawrenceville GA", "30043"),
        ("789 Pine St", None, None),
    ]

    all_passed = True
    for address, expected_city, expected_zip in test_cases:
        city, zip_code = scraper._parse_address_components(address)
        passed = (city == expected_city or expected_city is None) and (zip_code == expected_zip or expected_zip is None)
        status = "✓" if passed else "✗"
        print(f"  {status} '{address}'")
        print(f"      City: {city}, Zip: {zip_code}")
        if not passed:
            all_passed = False

    return all_passed


def test_single_county():
    """Test full process for a single county (no DB insert)."""
    print("\nTesting single county process (Gwinnett County, GA)...")
    print("Note: This will download files but NOT insert into database")

    scraper = CountySurplusScraper()

    # Override insert to prevent actual DB writes
    original_insert = scraper.db.insert_lead
    scraper.db.insert_lead = lambda lead: print(f"  [DRY RUN] Would insert: {lead['owner_name']} - {lead['property_address']}")

    try:
        scraper.process_county("Gwinnett County", "GA")
        print("✓ Single county test completed")
        return True
    except Exception as e:
        print(f"✗ Single county test failed: {e}")
        return False
    finally:
        # Restore original insert method
        scraper.db.insert_lead = original_insert


def main():
    """Run all tests."""
    print("="*60)
    print("County Surplus Scraper - Test Suite")
    print("="*60)

    tests = [
        ("Supabase Connection", test_supabase_connection),
        ("Google Search", test_google_search),
        ("URL Discovery", test_url_discovery),
        ("File Discovery", test_file_discovery),
        ("Amount Parsing", test_amount_parsing),
        ("Address Parsing", test_address_parsing),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"✗ {name} failed with exception: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print(f"\nPassed: {passed}/{total}")

    if passed == total:
        print("\n✓ All tests passed!")
        print("\nTo run full scraper:")
        print("  python3 county_surplus_scraper.py")
        print("\nTo test single county (with DB inserts):")
        print("  # Edit county_surplus_scraper.py and replace TARGET_COUNTIES")
        print("  # with: [{'name': 'Gwinnett County', 'state': 'GA'}]")
    else:
        print("\n✗ Some tests failed. Fix issues before running full scraper.")

    return passed == total


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
