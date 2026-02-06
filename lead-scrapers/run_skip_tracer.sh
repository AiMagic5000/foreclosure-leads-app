#!/bin/bash
#
# Skip Tracer Execution Script
# Runs skip_tracer.py with proper logging and error handling
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/skip_tracer.log"

echo "========================================" | tee -a "$LOG_FILE"
echo "Skip Tracer Started: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Run skip tracer
cd "$SCRIPT_DIR" && python3 skip_tracer.py

EXIT_CODE=$?

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "Skip Tracer Finished: $(date)" | tee -a "$LOG_FILE"
echo "Exit Code: $EXIT_CODE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

exit $EXIT_CODE
