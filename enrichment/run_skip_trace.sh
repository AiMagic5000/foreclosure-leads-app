#!/bin/bash

# Skip Trace Enrichment Runner
# Convenience script for common execution scenarios

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Skip Trace Enrichment Runner ===${NC}\n"

# Check if Python script exists
if [ ! -f "skip_trace.py" ]; then
    echo -e "${RED}Error: skip_trace.py not found${NC}"
    exit 1
fi

# Parse command line arguments
MODE=${1:-standard}

case $MODE in
    test|dry-run)
        echo -e "${YELLOW}Running in DRY RUN mode (no database updates)${NC}"
        python skip_trace.py --batch-size 10 --delay 3 --dry-run
        ;;
    
    fast)
        echo -e "${YELLOW}Running in FAST mode (batch=25, delay=3s)${NC}"
        echo -e "${RED}Warning: Fast mode may trigger rate limiting${NC}"
        python skip_trace.py --batch-size 25 --delay 3
        ;;
    
    slow)
        echo -e "${YELLOW}Running in SLOW mode (batch=10, delay=10s)${NC}"
        echo -e "${GREEN}Slow mode is safest against rate limiting${NC}"
        python skip_trace.py --batch-size 10 --delay 10
        ;;
    
    standard|normal)
        echo -e "${YELLOW}Running in STANDARD mode (batch=50, delay=5s)${NC}"
        python skip_trace.py --batch-size 50 --delay 5
        ;;
    
    background|bg)
        echo -e "${YELLOW}Running in BACKGROUND mode${NC}"
        echo -e "${GREEN}Logs will be written to: skip_trace_bg.log${NC}"
        nohup python skip_trace.py --batch-size 50 --delay 5 > skip_trace_bg.log 2>&1 &
        PID=$!
        echo -e "${GREEN}Started with PID: $PID${NC}"
        echo -e "Monitor with: ${YELLOW}tail -f skip_trace.log${NC}"
        echo -e "Stop with: ${YELLOW}kill $PID${NC}"
        ;;
    
    status)
        echo -e "${YELLOW}Checking running processes...${NC}"
        PROCS=$(ps aux | grep "[s]kip_trace.py")
        if [ -z "$PROCS" ]; then
            echo -e "${RED}No skip_trace.py processes running${NC}"
        else
            echo -e "${GREEN}Running processes:${NC}"
            echo "$PROCS"
        fi
        
        if [ -f "skip_trace.log" ]; then
            echo -e "\n${YELLOW}Last 10 log entries:${NC}"
            tail -10 skip_trace.log
        fi
        ;;
    
    stop)
        echo -e "${YELLOW}Stopping all skip_trace.py processes...${NC}"
        pkill -f skip_trace.py
        echo -e "${GREEN}Stopped${NC}"
        ;;
    
    help|--help|-h)
        echo "Usage: $0 [MODE]"
        echo ""
        echo "Modes:"
        echo "  test, dry-run   - Test run without database updates (10 leads)"
        echo "  fast            - Fast mode (batch=25, delay=3s) - may trigger rate limits"
        echo "  slow            - Slow mode (batch=10, delay=10s) - safest"
        echo "  standard        - Standard mode (batch=50, delay=5s) - default"
        echo "  background, bg  - Run in background with nohup"
        echo "  status          - Check if running and show recent logs"
        echo "  stop            - Stop all running instances"
        echo "  help            - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 test         # Dry run to test"
        echo "  $0 standard     # Normal processing"
        echo "  $0 bg           # Run in background"
        echo "  $0 status       # Check progress"
        echo "  $0 stop         # Stop all instances"
        ;;
    
    *)
        echo -e "${RED}Unknown mode: $MODE${NC}"
        echo "Run '$0 help' for usage"
        exit 1
        ;;
esac
