#!/usr/bin/env python3
"""
Standalone Test Suite for Trustee Sales Scraper Utilities

Tests utility functions without requiring external dependencies.
Copy-paste the functions directly here for testing.
"""

import re
from datetime import datetime
from typing import Optional


# ============================================================================
# UTILITY FUNCTIONS (copied from trustee_sales_scraper.py)
# ============================================================================

def parse_currency(value: str) -> Optional[float]:
    """Parse currency string to float."""
    if not value:
        return None

    cleaned = re.sub(r'[$,\s]', '', str(value))

    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def parse_date(date_str: str) -> Optional[str]:
    """Parse date string to ISO format (YYYY-MM-DD)."""
    if not date_str:
        return None

    date_str = date_str.strip()

    formats = [
        "%m/%d/%Y",
        "%Y-%m-%d",
        "%B %d, %Y",
        "%b %d, %Y",
        "%m-%d-%Y",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None


def calculate_overage(sale_amount: float, opening_bid: float) -> float:
    """Calculate overage (surplus funds) from sale."""
    if not sale_amount or not opening_bid:
        return 0.0

    overage = sale_amount - opening_bid
    return max(0.0, overage)


def is_third_party_sale(buyer_name: str, plaintiff_name: str = None) -> bool:
    """Determine if sale was to third-party buyer (not back to bank/plaintiff)."""
    if not buyer_name:
        return False

    buyer_lower = buyer_name.lower()

    bank_keywords = [
        "bank",
        "mortgage",
        "plaintiff",
        "beneficiary",
        "lender",
        "trust",
        "servicer",
        "federal",
        "national",
        "credit union",
    ]

    for keyword in bank_keywords:
        if keyword in buyer_lower:
            return False

    if plaintiff_name:
        if plaintiff_name.lower() in buyer_lower or buyer_lower in plaintiff_name.lower():
            return False

    return True


# ============================================================================
# TEST FUNCTIONS
# ============================================================================

def test_parse_currency():
    """Test currency parsing function."""
    print("Testing parse_currency...")

    tests = [
        ("$1,234.56", 1234.56),
        ("1234.56", 1234.56),
        ("$1,234", 1234.0),
        ("$150,000.00", 150000.0),
        ("25000", 25000.0),
        ("$25,000", 25000.0),
        ("", None),
        (None, None),
        ("invalid", None),
    ]

    passed = 0
    failed = 0

    for input_val, expected in tests:
        result = parse_currency(input_val)
        if result == expected:
            print(f"  ✓ '{input_val}' -> {result}")
            passed += 1
        else:
            print(f"  ✗ '{input_val}' -> {result} (expected {expected})")
            failed += 1

    print(f"  Passed: {passed}/{len(tests)}\n")
    return failed == 0


def test_parse_date():
    """Test date parsing function."""
    print("Testing parse_date...")

    tests = [
        ("12/25/2023", "2023-12-25"),
        ("2023-12-25", "2023-12-25"),
        ("December 25, 2023", "2023-12-25"),
        ("Dec 25, 2023", "2023-12-25"),
        ("12-25-2023", "2023-12-25"),
        ("", None),
        (None, None),
    ]

    passed = 0
    failed = 0

    for input_val, expected in tests:
        result = parse_date(input_val)
        if result == expected:
            print(f"  ✓ '{input_val}' -> {result}")
            passed += 1
        else:
            print(f"  ✗ '{input_val}' -> {result} (expected {expected})")
            failed += 1

    print(f"  Passed: {passed}/{len(tests)}\n")
    return failed == 0


def test_calculate_overage():
    """Test overage calculation."""
    print("Testing calculate_overage...")

    tests = [
        (200000, 150000, 50000),
        (150000, 150000, 0),
        (140000, 150000, 0),
        (None, 150000, 0),
        (200000, None, 0),
    ]

    passed = 0
    failed = 0

    for sale_amt, opening_bid, expected in tests:
        result = calculate_overage(sale_amt, opening_bid)
        if result == expected:
            print(f"  ✓ Sale: ${sale_amt}, Opening: ${opening_bid} -> Overage: ${result:,.0f}")
            passed += 1
        else:
            print(f"  ✗ Sale: ${sale_amt}, Opening: ${opening_bid} -> ${result:,.0f} (expected ${expected:,.0f})")
            failed += 1

    print(f"  Passed: {passed}/{len(tests)}\n")
    return failed == 0


def test_is_third_party_sale():
    """Test third-party buyer detection."""
    print("Testing is_third_party_sale...")

    tests = [
        ("John Smith", None, True),
        ("ABC Investment LLC", None, True),
        ("Wells Fargo Bank", None, False),
        ("U.S. Bank National Association", None, False),
        ("Mortgage Electronic Systems", None, False),
        ("Plaintiff", None, False),
        ("First National Credit Union", None, False),
        ("Smith Family Trust", None, False),
        ("Chase Mortgage Services", None, False),
        ("Bob's Investment Co", "Wells Fargo", True),
        ("Wells Fargo", "Wells Fargo Bank NA", False),
        ("", None, False),
        (None, None, False),
    ]

    passed = 0
    failed = 0

    for buyer, plaintiff, expected in tests:
        result = is_third_party_sale(buyer, plaintiff)
        status = "Third Party" if result else "Bank/Plaintiff"
        expected_status = "Third Party" if expected else "Bank/Plaintiff"

        if result == expected:
            print(f"  ✓ '{buyer}' -> {status}")
            passed += 1
        else:
            print(f"  ✗ '{buyer}' -> {status} (expected {expected_status})")
            failed += 1

    print(f"  Passed: {passed}/{len(tests)}\n")
    return failed == 0


def test_lead_validation():
    """Test complete lead validation logic."""
    print("Testing lead validation logic...")

    scenarios = [
        {
            "name": "Valid $25k overage to third party",
            "opening_bid": 150000,
            "sale_amount": 175000,
            "buyer": "John Smith",
            "should_pass": True,
        },
        {
            "name": "Overage too low ($3k)",
            "opening_bid": 150000,
            "sale_amount": 153000,
            "buyer": "Jane Doe",
            "should_pass": False,
        },
        {
            "name": "Sold back to bank",
            "opening_bid": 150000,
            "sale_amount": 175000,
            "buyer": "Wells Fargo Bank",
            "should_pass": False,
        },
        {
            "name": "No overage (sold at opening bid)",
            "opening_bid": 150000,
            "sale_amount": 150000,
            "buyer": "Bob Johnson",
            "should_pass": False,
        },
        {
            "name": "Valid $50k overage",
            "opening_bid": 200000,
            "sale_amount": 250000,
            "buyer": "ABC Investments LLC",
            "should_pass": True,
        },
    ]

    MINIMUM_OVERAGE = 5000
    passed = 0
    failed = 0

    for scenario in scenarios:
        overage = calculate_overage(scenario["sale_amount"], scenario["opening_bid"])
        third_party = is_third_party_sale(scenario["buyer"])
        valid = overage >= MINIMUM_OVERAGE and third_party

        if valid == scenario["should_pass"]:
            status = "VALID" if valid else "REJECTED"
            reason = []
            if overage < MINIMUM_OVERAGE:
                reason.append(f"overage ${overage:,.0f} < ${MINIMUM_OVERAGE:,}")
            if not third_party:
                reason.append("sold to bank/plaintiff")
            if not overage:
                reason.append("no overage")

            reason_str = f" ({', '.join(reason)})" if reason else ""
            print(f"  ✓ {scenario['name']}: {status}{reason_str}")
            passed += 1
        else:
            print(f"  ✗ {scenario['name']}: Expected {scenario['should_pass']}, got {valid}")
            failed += 1

    print(f"  Passed: {passed}/{len(scenarios)}\n")
    return failed == 0


def run_all_tests():
    """Run all test suites."""
    print("=" * 80)
    print("TRUSTEE SALES SCRAPER - UTILITY TEST SUITE")
    print("=" * 80)
    print()

    results = []
    results.append(("parse_currency", test_parse_currency()))
    results.append(("parse_date", test_parse_date()))
    results.append(("calculate_overage", test_calculate_overage()))
    results.append(("is_third_party_sale", test_is_third_party_sale()))
    results.append(("lead_validation", test_lead_validation()))

    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    total_passed = sum(1 for _, passed in results if passed)
    total_failed = len(results) - total_passed

    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {test_name}")

    print(f"\nTotal: {total_passed}/{len(results)} test suites passed")
    print("=" * 80)

    return total_failed == 0


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)
