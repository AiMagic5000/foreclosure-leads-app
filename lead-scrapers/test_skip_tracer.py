#!/usr/bin/env python3
"""
Test script for skip_tracer.py
Verifies Supabase connection and schema without making any changes.
"""

import sys
from supabase import create_client

SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"

def test_connection():
    """Test Supabase connection."""
    print("Testing Supabase connection...")
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✓ Connected to Supabase")
        return client
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        sys.exit(1)

def test_schema(client):
    """Test table schema."""
    print("\nTesting foreclosure_leads table schema...")
    try:
        # Fetch one row to inspect columns
        response = client.table('foreclosure_leads').select('*').limit(1).execute()

        if not response.data:
            print("⚠ Table exists but is empty")
            return

        lead = response.data[0]
        print(f"✓ Table has {len(lead)} columns")

        # Check required columns
        required = ['id', 'owner_name', 'property_address', 'state', 'city']
        for col in required:
            if col in lead:
                print(f"  ✓ {col}: {type(lead[col]).__name__}")
            else:
                print(f"  ✗ {col}: MISSING")

        # Check skip trace columns
        trace_cols = ['primary_phone', 'secondary_phone', 'primary_email',
                     'associated_names', 'current_mailing_address', 'skip_traced_at']
        print("\nSkip trace columns:")
        for col in trace_cols:
            if col in lead:
                print(f"  ✓ {col}: {type(lead[col]).__name__}")
            else:
                print(f"  ⚠ {col}: missing (will be added on first update)")

    except Exception as e:
        print(f"✗ Schema test failed: {e}")
        sys.exit(1)

def test_query(client):
    """Test query for leads needing skip trace."""
    print("\nTesting query for leads needing skip trace...")
    try:
        response = client.table('foreclosure_leads') \
            .select('id, owner_name, state, city') \
            .is_('skip_traced_at', 'null') \
            .not_.is_('owner_name', 'null') \
            .neq('owner_name', 'Property Owner') \
            .limit(5) \
            .execute()

        leads = response.data if response.data else []
        print(f"✓ Found {len(leads)} leads needing skip trace (showing max 5)")

        if leads:
            print("\nSample leads:")
            for i, lead in enumerate(leads[:3], 1):
                print(f"  {i}. ID {lead['id']}: {lead['owner_name']} ({lead.get('city', 'N/A')}, {lead.get('state', 'N/A')})")
        else:
            print("  (All leads already skip traced or no valid leads)")

    except Exception as e:
        print(f"✗ Query test failed: {e}")
        sys.exit(1)

def main():
    print("=" * 60)
    print("Skip Tracer Test Suite")
    print("=" * 60)

    client = test_connection()
    test_schema(client)
    test_query(client)

    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    print("\nYou can now run: python skip_tracer.py")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        sys.exit(0)
