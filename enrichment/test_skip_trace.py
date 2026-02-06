#!/usr/bin/env python3
"""
Test script for skip_trace.py
Verifies name parsing, phone extraction, email extraction, etc.
"""

import sys
import re

# Import the enricher class
sys.path.insert(0, '/mnt/c/Users/flowc/Documents/foreclosure-leads-app/enrichment')
from skip_trace import SkipTraceEnricher

def test_name_parsing():
    """Test name parsing functionality."""
    print("\n=== Testing Name Parsing ===")
    
    enricher = SkipTraceEnricher(dry_run=True)
    
    test_cases = [
        ("Smith, John", ("John", "Smith")),
        ("John Smith", ("John", "Smith")),
        ("John Michael Smith", ("John", "Smith")),
        ("Smith, John Michael", ("John", "Smith")),
        ("O'Brien, Mary", ("Mary", "O'Brien")),
        ("van der Berg, Peter", ("Peter", "van der Berg")),
    ]
    
    passed = 0
    for name, expected in test_cases:
        result = enricher.parse_name(name)
        status = "PASS" if result == expected else "FAIL"
        if status == "PASS":
            passed += 1
        print(f"{status}: '{name}' -> {result} (expected {expected})")
    
    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def test_phone_extraction():
    """Test phone number extraction."""
    print("\n=== Testing Phone Extraction ===")
    
    enricher = SkipTraceEnricher(dry_run=True)
    
    test_text = """
    Contact Information:
    Phone: (555) 123-4567
    Mobile: 555-987-6543
    Alt: 5551234567
    Invalid: 123-4567
    """
    
    phones = enricher.extract_phones(test_text)
    print(f"Found phones: {phones}")
    print(f"Expected 3 valid phones")
    
    if len(phones) >= 2:
        print("PASS: Found at least 2 phones")
        return True
    else:
        print("FAIL: Should find at least 2 phones")
        return False

def test_email_extraction():
    """Test email extraction."""
    print("\n=== Testing Email Extraction ===")
    
    enricher = SkipTraceEnricher(dry_run=True)
    
    test_text = """
    Email: john.smith@example.com
    Secondary: j***n@gmail.com
    Contact: jane_doe123@yahoo.com
    """
    
    emails = enricher.extract_emails(test_text)
    print(f"Found emails: {emails}")
    
    if len(emails) >= 2:
        print("PASS: Found at least 2 emails")
        return True
    else:
        print("FAIL: Should find at least 2 emails")
        return False

def test_phone_normalization():
    """Test phone normalization."""
    print("\n=== Testing Phone Normalization ===")
    
    enricher = SkipTraceEnricher(dry_run=True)
    
    test_cases = [
        ("(555) 123-4567", "555-123-4567"),
        ("555.123.4567", "555-123-4567"),
        ("5551234567", "555-123-4567"),
        ("1-555-123-4567", "555-123-4567"),
    ]
    
    passed = 0
    for phone, expected in test_cases:
        result = enricher.normalize_phone(phone)
        status = "PASS" if result == expected else "FAIL"
        if status == "PASS":
            passed += 1
        print(f"{status}: '{phone}' -> '{result}' (expected '{expected}')")
    
    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def test_address_extraction():
    """Test address extraction."""
    print("\n=== Testing Address Extraction ===")
    
    enricher = SkipTraceEnricher(dry_run=True)
    
    test_text = """
    Current Address: 123 Main Street, Miami, FL 33101
    Previous Address: 456 Oak Ave, Tampa, FL
    """
    
    address = enricher.extract_address(test_text, "Miami", "FL")
    print(f"Found address: {address}")
    
    if address and "123 Main Street" in address:
        print("PASS: Found correct address")
        return True
    else:
        print("FAIL: Should find 123 Main Street address")
        return False

def main():
    """Run all tests."""
    print("="*60)
    print("Skip Trace Enrichment - Unit Tests")
    print("="*60)
    
    results = []
    
    results.append(("Name Parsing", test_name_parsing()))
    results.append(("Phone Extraction", test_phone_extraction()))
    results.append(("Email Extraction", test_email_extraction()))
    results.append(("Phone Normalization", test_phone_normalization()))
    results.append(("Address Extraction", test_address_extraction()))
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\nAll tests passed!")
        return 0
    else:
        print(f"\n{total - passed} tests failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
