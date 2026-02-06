#!/usr/bin/env python3
"""
Skip Trace Statistics Report
Shows progress and success rates for skip tracing operations.
"""

import sys
from datetime import datetime, timedelta
from supabase import create_client

SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"

def get_stats():
    """Generate skip trace statistics."""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Total leads
        total_response = client.table('foreclosure_leads').select('id', count='exact').execute()
        total_leads = total_response.count

        # Skip traced leads
        traced_response = client.table('foreclosure_leads') \
            .select('id', count='exact') \
            .not_.is_('skip_traced_at', 'null') \
            .execute()
        traced_leads = traced_response.count

        # Not traced yet
        not_traced_response = client.table('foreclosure_leads') \
            .select('id', count='exact') \
            .is_('skip_traced_at', 'null') \
            .not_.is_('owner_name', 'null') \
            .neq('owner_name', 'Property Owner') \
            .execute()
        not_traced = not_traced_response.count

        # Traced with phone found
        phone_response = client.table('foreclosure_leads') \
            .select('id', count='exact') \
            .not_.is_('primary_phone', 'null') \
            .execute()
        with_phone = phone_response.count

        # Traced with email found
        email_response = client.table('foreclosure_leads') \
            .select('id', count='exact') \
            .not_.is_('primary_email', 'null') \
            .execute()
        with_email = email_response.count

        # Traced today
        today = datetime.utcnow().date().isoformat()
        today_response = client.table('foreclosure_leads') \
            .select('id', count='exact') \
            .gte('skip_traced_at', today) \
            .execute()
        traced_today = today_response.count

        # Traced in last 7 days
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        week_response = client.table('foreclosure_leads') \
            .select('id', count='exact') \
            .gte('skip_traced_at', week_ago) \
            .execute()
        traced_week = week_response.count

        # Calculate percentages
        traced_pct = (traced_leads / total_leads * 100) if total_leads > 0 else 0
        phone_pct = (with_phone / traced_leads * 100) if traced_leads > 0 else 0
        email_pct = (with_email / traced_leads * 100) if traced_leads > 0 else 0

        # Print report
        print("=" * 70)
        print("SKIP TRACE STATISTICS REPORT")
        print("=" * 70)
        print(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print()

        print("OVERALL PROGRESS")
        print("-" * 70)
        print(f"  Total Leads:              {total_leads:,}")
        print(f"  Skip Traced:              {traced_leads:,} ({traced_pct:.1f}%)")
        print(f"  Pending Skip Trace:       {not_traced:,}")
        print()

        print("SUCCESS RATES")
        print("-" * 70)
        print(f"  Leads with Phone:         {with_phone:,} ({phone_pct:.1f}% of traced)")
        print(f"  Leads with Email:         {with_email:,} ({email_pct:.1f}% of traced)")
        print()

        print("RECENT ACTIVITY")
        print("-" * 70)
        print(f"  Traced Today:             {traced_today:,}")
        print(f"  Traced Last 7 Days:       {traced_week:,}")
        print()

        print("ESTIMATED COMPLETION")
        print("-" * 70)
        if traced_week > 0:
            daily_avg = traced_week / 7
            days_remaining = not_traced / daily_avg if daily_avg > 0 else 0
            completion_date = datetime.utcnow() + timedelta(days=days_remaining)
            print(f"  Daily Average:            {daily_avg:.1f} leads/day")
            print(f"  Days Until Complete:      {days_remaining:.0f} days")
            print(f"  Estimated Completion:     {completion_date.strftime('%Y-%m-%d')}")
        else:
            print("  Not enough data yet (need at least 7 days of activity)")

        print("=" * 70)

    except Exception as e:
        print(f"Error generating stats: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    try:
        get_stats()
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(0)
