#!/usr/bin/env python3
"""
Test Suite for Trustee Sales Scraper

Tests all utility functions and lead validation logic without
making actual HTTP requests or database connections.
"""

import sys
from datetime import datetime

# Import functions to test
from trustee_sales_scraper import (
    parse_currency,
    parse_date,
    calculate_overage,
    is_third_party_sale,
)


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

    print(f"  Passed: {passed}/{len(tests)}")
    return failed == 0


def test_parse_date():
    """Test date parsing function."""
    print("\nTesting parse_date...")

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

    print(f"  Passed: {passed}/{len(tests)}")
    return failed == 0


def test_calculate_overage():
    """Test overage calculation."""
    print("\nTesting calculate_overage...")

    tests = [
        (200000, 150000, 50000),  # $50k overage
        (150000, 150000, 0),      # No overage
        (140000, 150000, 0),      # Sold under opening bid (no overage)
        (None, 150000, 0),        # Invalid sale amount
        (200000, None, 0),        # Invalid opening bid
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

    print(f"  Passed: {passed}/{len(tests)}")
    return failed == 0


def test_is_third_party_sale():
    """Test third-party buyer detection."""
    print("\nTesting is_third_party_sale...")

    tests = [
        # (buyer_name, plaintiff_name, expected_result)
        ("John Smith", None, True),                          # Individual buyer
        ("ABC Investment LLC", None, True),                  # Company buyer
        ("Wells Fargo Bank", None, False),                   # Bank
        ("U.S. Bank National Association", None, False),     # National bank
        ("Mortgage Electronic Systems", None, False),        # MERS
        ("Plaintiff", None, False),                          # Plaintiff
        ("First National Credit Union", None, False),        # Credit union
        ("Smith Family Trust", None, False),                 # Trust (could be third-party, but filtered for safety)
        ("Chase Mortgage Services", None, False),            # Servicer
        ("Bob's Investment Co", "Wells Fargo", True),        # Third party (buyer != plaintiff)
        ("Wells Fargo", "Wells Fargo Bank NA", False),       # Same entity
        ("", None, False),                                   # Empty buyer
        (None, None, False),                                 # None buyer
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

    print(f"  Passed: {passed}/{len(tests)}")
    return failed == 0


def test_lead_validation():
    """Test complete lead validation logic."""
    print("\nTesting lead validation logic...")

    # Simulate various lead scenarios
    scenarios = [
        {
            "name": "Valid $25k overage to third party",
            "case_number": "2023-CH-12345",
            "address": "123 Main St, Chicago, IL",
            "opening_bid": 150000,
            "sale_amount": 175000,
            "buyer": "John Smith",
            "should_pass": True,
        },
        {
            "name": "Overage too low ($3k)",
            "case_number": "2023-CH-12346",
            "address": "456 Oak Ave, Chicago, IL",
            "opening_bid": 150000,
            "sale_amount": 153000,
            "buyer": "Jane Doe",
            "should_pass": False,
        },
        {
            "name": "Sold back to bank",
            "case_number": "2023-CH-12347",
            "address": "789 Pine Rd, Chicago, IL",
            "opening_bid": 150000,
            "sale_amount": 175000,
            "buyer": "Wells Fargo Bank",
            "should_pass": False,
        },
        {
            "name": "No overage (sold at opening bid)",
            "case_number": "2023-CH-12348",
            "address": "321 Elm St, Chicago, IL",
            "opening_bid": 150000,
            "sale_amount": 150000,
            "buyer": "Bob Johnson",
            "should_pass": False,
        },
        {
            "name": "Valid $50k overage",
            "case_number": "2023-CH-12349",
            "address": "555 Maple Dr, Chicago, IL",
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
        # Calculate overage
        overage = calculate_overage(scenario["sale_amount"], scenario["opening_bid"])

        # Check third-party sale
        third_party = is_third_party_sale(scenario["buyer"])

        # Apply validation rules
        valid = (
            overage >= MINIMUM_OVERAGE
            and third_party
            and scenario.get("case_number")
            and scenario.get("address")
        )

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

    print(f"  Passed: {passed}/{len(scenarios)}")
    return failed == 0


def run_all_tests():
    """Run all test suites."""
    print("=" * 80)
    print("TRUSTEE SALES SCRAPER - TEST SUITE")
    print("=" * 80)

    results = []
    results.append(("parse_currency", test_parse_currency()))
    results.append(("parse_date", test_parse_date()))
    results.append(("calculate_overage", test_calculate_overage()))
    results.append(("is_third_party_sale", test_is_third_party_sale()))
    results.append(("lead_validation", test_lead_validation()))

    print("\n" + "=" * 80)
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
    success = run_all_tests()
    sys.exit(0 if success else 1)
