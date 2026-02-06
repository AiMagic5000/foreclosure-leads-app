#!/usr/bin/env python3
"""
Progress Monitor for Skip Trace Enrichment

Shows real-time statistics from the database about enrichment progress.
Updates every 30 seconds.
"""

import os
import sys
import time
from datetime import datetime
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://foreclosure-db.alwaysencrypted.com"
)
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
)


def clear_screen():
    """Clear the terminal screen."""
    os.system('clear' if os.name != 'nt' else 'cls')


def get_statistics(supabase: Client) -> dict:
    """Get enrichment statistics from database.
    
    Args:
        supabase: Supabase client
        
    Returns:
        Dictionary with statistics
    """
    try:
        # Total leads
        total_response = supabase.table('foreclosure_leads').select(
            'id', count='exact'
        ).execute()
        total_leads = total_response.count
        
        # Leads with phones
        phones_response = supabase.table('foreclosure_leads').select(
            'id', count='exact'
        ).not_.is_('primary_phone', 'null').execute()
        leads_with_phones = phones_response.count
        
        # Leads with emails
        emails_response = supabase.table('foreclosure_leads').select(
            'id', count='exact'
        ).not_.is_('primary_email', 'null').execute()
        leads_with_emails = emails_response.count
        
        # Leads with addresses
        addresses_response = supabase.table('foreclosure_leads').select(
            'id', count='exact'
        ).not_.is_('mailing_address', 'null').execute()
        leads_with_addresses = addresses_response.count
        
        # Leads remaining
        remaining_response = supabase.table('foreclosure_leads').select(
            'id', count='exact'
        ).is_('primary_phone', 'null').neq(
            'owner_name', 'Property Owner'
        ).execute()
        remaining_leads = remaining_response.count
        
        # Source breakdown
        sources = {}
        for source in ['truepeoplesearch', 'fastpeoplesearch', 'whitepages', 'addresses.com']:
            source_response = supabase.table('foreclosure_leads').select(
                'id', count='exact'
            ).eq('skip_trace_source', source).execute()
            sources[source] = source_response.count
        
        # Recent enrichments (last hour)
        one_hour_ago = datetime.utcnow().replace(microsecond=0).isoformat()
        recent_response = supabase.table('foreclosure_leads').select(
            'id', count='exact'
        ).gte('skip_trace_at', one_hour_ago).execute()
        recent_enrichments = recent_response.count
        
        return {
            'total_leads': total_leads,
            'leads_with_phones': leads_with_phones,
            'leads_with_emails': leads_with_emails,
            'leads_with_addresses': leads_with_addresses,
            'remaining_leads': remaining_leads,
            'sources': sources,
            'recent_enrichments': recent_enrichments,
        }
    
    except Exception as e:
        print(f"Error fetching statistics: {str(e)}")
        return None


def display_statistics(stats: dict):
    """Display statistics in a formatted way.
    
    Args:
        stats: Statistics dictionary
    """
    clear_screen()
    
    print("="*70)
    print(" "*20 + "SKIP TRACE PROGRESS MONITOR")
    print("="*70)
    print(f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Overall progress
    total = stats['total_leads']
    enriched = stats['leads_with_phones']
    remaining = stats['remaining_leads']
    
    if total > 0:
        progress_pct = (enriched / total) * 100
        remaining_pct = (remaining / total) * 100
    else:
        progress_pct = 0
        remaining_pct = 0
    
    print("OVERALL PROGRESS")
    print("-" * 70)
    print(f"Total Leads:              {total:,}")
    print(f"Enriched (with phone):    {enriched:,} ({progress_pct:.1f}%)")
    print(f"Remaining:                {remaining:,} ({remaining_pct:.1f}%)")
    print()
    
    # Progress bar
    bar_width = 50
    filled = int(bar_width * progress_pct / 100)
    bar = '█' * filled + '░' * (bar_width - filled)
    print(f"[{bar}] {progress_pct:.1f}%")
    print()
    
    # Data completeness
    print("DATA COMPLETENESS")
    print("-" * 70)
    
    phone_pct = (stats['leads_with_phones'] / total * 100) if total > 0 else 0
    email_pct = (stats['leads_with_emails'] / total * 100) if total > 0 else 0
    address_pct = (stats['leads_with_addresses'] / total * 100) if total > 0 else 0
    
    print(f"Leads with Phone:         {stats['leads_with_phones']:,} ({phone_pct:.1f}%)")
    print(f"Leads with Email:         {stats['leads_with_emails']:,} ({email_pct:.1f}%)")
    print(f"Leads with Address:       {stats['leads_with_addresses']:,} ({address_pct:.1f}%)")
    print()
    
    # Source breakdown
    print("SOURCE BREAKDOWN")
    print("-" * 70)
    
    sources_sorted = sorted(stats['sources'].items(), key=lambda x: x[1], reverse=True)
    for source, count in sources_sorted:
        source_pct = (count / enriched * 100) if enriched > 0 else 0
        print(f"{source:25} {count:,} ({source_pct:.1f}%)")
    print()
    
    # Recent activity
    print("RECENT ACTIVITY")
    print("-" * 70)
    print(f"Enriched in last hour:    {stats['recent_enrichments']:,}")
    print()
    
    # Time estimate
    if remaining > 0 and stats['recent_enrichments'] > 0:
        leads_per_hour = stats['recent_enrichments']
        hours_remaining = remaining / leads_per_hour
        print(f"Estimated time remaining: {hours_remaining:.1f} hours")
        print(f"(based on {leads_per_hour} leads/hour)")
    elif remaining == 0:
        print("ENRICHMENT COMPLETE!")
    print()
    
    print("="*70)
    print("Press Ctrl+C to exit | Updates every 30 seconds")


def main():
    """Main monitoring loop."""
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        while True:
            stats = get_statistics(supabase)
            if stats:
                display_statistics(stats)
            else:
                print("Error fetching statistics. Retrying in 30 seconds...")
            
            time.sleep(30)
    
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped.")
        sys.exit(0)


if __name__ == '__main__':
    main()
