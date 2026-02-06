#!/bin/bash
# Setup cron job for county surplus scraper

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$SCRIPT_DIR/county_surplus_scraper.py"
PYTHON_BIN=$(which python3)

echo "County Surplus Scraper - Cron Setup"
echo "===================================="
echo ""
echo "Script location: $SCRIPT_PATH"
echo "Python binary: $PYTHON_BIN"
echo ""

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "ERROR: Script not found at $SCRIPT_PATH"
    exit 1
fi

# Check if Python exists
if [ -z "$PYTHON_BIN" ]; then
    echo "ERROR: python3 not found in PATH"
    exit 1
fi

# Make script executable
chmod +x "$SCRIPT_PATH"

# Cron schedule options
echo "Select cron schedule:"
echo "1) Daily at 2:00 AM"
echo "2) Daily at 6:00 AM"
echo "3) Every Monday at 3:00 AM"
echo "4) Every day at midnight"
echo "5) Custom"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESC="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 6 * * *"
        DESC="Daily at 6:00 AM"
        ;;
    3)
        CRON_SCHEDULE="0 3 * * 1"
        DESC="Every Monday at 3:00 AM"
        ;;
    4)
        CRON_SCHEDULE="0 0 * * *"
        DESC="Every day at midnight"
        ;;
    5)
        read -p "Enter cron schedule (e.g., '0 2 * * *'): " CRON_SCHEDULE
        DESC="Custom schedule"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Build cron command
CRON_COMMAND="$CRON_SCHEDULE $PYTHON_BIN $SCRIPT_PATH >> /tmp/county_surplus_scraper_cron.log 2>&1"

echo ""
echo "Cron job to be added:"
echo "-------------------------------------"
echo "$CRON_COMMAND"
echo "-------------------------------------"
echo ""
echo "Description: $DESC"
echo ""

read -p "Add this cron job? [y/N]: " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
fi

# Add to crontab
(crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "$CRON_COMMAND") | crontab -

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Cron job added successfully!"
    echo ""
    echo "View current crontab:"
    echo "  crontab -l"
    echo ""
    echo "View logs:"
    echo "  tail -f /tmp/county_surplus_scraper.log"
    echo "  tail -f /tmp/county_surplus_scraper_cron.log"
    echo ""
    echo "Remove cron job:"
    echo "  crontab -e"
    echo "  (delete the line containing 'county_surplus_scraper.py')"
else
    echo "✗ Failed to add cron job"
    exit 1
fi
