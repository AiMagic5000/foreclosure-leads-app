#!/usr/bin/env python3
"""
Setup Validation Script
Validates that all dependencies and services are available before running skip trace.
"""

import os
import sys
import subprocess

def check_python_version():
    """Check Python version is 3.8+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        return False, f"Python 3.8+ required, found {version.major}.{version.minor}"
    return True, f"Python {version.major}.{version.minor}.{version.micro}"

def check_dependency(package):
    """Check if a Python package is installed"""
    try:
        __import__(package)
        return True, "Installed"
    except ImportError:
        return False, "Missing"

def check_service(url, name):
    """Check if a service is reachable"""
    try:
        import requests
        response = requests.get(url, timeout=5)
        if response.status_code < 500:
            return True, f"Reachable (status {response.status_code})"
        else:
            return False, f"Error (status {response.status_code})"
    except Exception as e:
        return False, str(e)

def check_file_exists(filepath):
    """Check if a file exists"""
    return os.path.exists(filepath), "Exists" if os.path.exists(filepath) else "Missing"

def main():
    """Run all validation checks"""
    print("="*70)
    print(" "*20 + "SETUP VALIDATION")
    print("="*70)
    print()
    
    checks = []
    
    # Python version
    print("Checking Python version...")
    status, msg = check_python_version()
    checks.append(("Python Version", status, msg))
    print(f"  {'✓' if status else '✗'} {msg}\n")
    
    # Dependencies
    print("Checking Python dependencies...")
    for package in ['requests', 'supabase']:
        status, msg = check_dependency(package)
        checks.append((f"Package: {package}", status, msg))
        print(f"  {'✓' if status else '✗'} {package}: {msg}")
    print()
    
    # Services
    print("Checking services...")
    
    supabase_url = os.getenv("SUPABASE_URL", "https://foreclosure-db.alwaysencrypted.com")
    crawl4ai_url = os.getenv("CRAWL4AI_URL", "https://crawl4ai.alwaysencrypted.com")
    
    status, msg = check_service(f"{supabase_url}/rest/v1/", "Supabase")
    checks.append(("Supabase Database", status, msg))
    print(f"  {'✓' if status else '✗'} Supabase: {msg}")
    
    status, msg = check_service(f"{crawl4ai_url}/health", "Crawl4AI")
    checks.append(("Crawl4AI Service", status, msg))
    print(f"  {'✓' if status else '✗'} Crawl4AI: {msg}")
    print()
    
    # Environment variables
    print("Checking environment variables...")
    env_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'CRAWL4AI_URL']
    for var in env_vars:
        value = os.getenv(var)
        if value:
            status = True
            msg = "Set (using env var)"
        else:
            status = True  # OK to use defaults
            msg = "Using default"
        checks.append((f"Env: {var}", status, msg))
        print(f"  {'✓' if status else '✗'} {var}: {msg}")
    print()
    
    # Required files
    print("Checking required files...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    required_files = [
        'skip_trace.py',
        'requirements.txt',
        'run_skip_trace.sh',
    ]
    
    for filename in required_files:
        filepath = os.path.join(script_dir, filename)
        status, msg = check_file_exists(filepath)
        checks.append((f"File: {filename}", status, msg))
        print(f"  {'✓' if status else '✗'} {filename}: {msg}")
    print()
    
    # Summary
    print("="*70)
    print("SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, status, _ in checks if status)
    total = len(checks)
    
    for name, status, msg in checks:
        print(f"{'✓' if status else '✗'} {name:30} {msg}")
    
    print()
    print(f"Passed: {passed}/{total} checks")
    
    if passed == total:
        print("\n✓ All checks passed! System is ready to run.")
        print("\nNext steps:")
        print("  1. Run tests:     python3 test_skip_trace.py")
        print("  2. Dry run:       ./run_skip_trace.sh test")
        print("  3. Start:         ./run_skip_trace.sh standard")
        return 0
    else:
        print(f"\n✗ {total - passed} checks failed. Please fix the issues above.")
        
        # Suggest fixes
        print("\nSuggested fixes:")
        for name, status, msg in checks:
            if not status:
                if "Package:" in name:
                    pkg = name.split(":")[1].strip()
                    print(f"  - Install {pkg}: pip install {pkg}")
                elif "Supabase" in name:
                    print(f"  - Check Supabase is running and URL is correct")
                elif "Crawl4AI" in name:
                    print(f"  - Check Crawl4AI is running at {crawl4ai_url}")
                elif "File:" in name:
                    print(f"  - Missing file: {name}")
        
        return 1

if __name__ == '__main__':
    sys.exit(main())
