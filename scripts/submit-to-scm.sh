#!/usr/bin/env bash
# Submit a PDF certified letter to SendCertifiedMail.com via agent-browser
#
# Usage: bash submit-to-scm.sh <pdf_path> <recipient_name> <recipient_address> <recipient_city> <recipient_state> <recipient_zip> [letter_reference]
#
# The PDF must be a Windows path (C:\path\to\file.pdf)
# All address fields are required
# letter_reference is optional (defaults to "Certified Letter - <name>")
#
# Prerequisites:
# - agent-browser installed (npm i -g agent-browser)
# - SendCertifiedMail.com account active (User# 210483)
# - Mailing Profile 236134 configured as sender

set -euo pipefail

PDF_PATH="${1:?PDF path required}"
RECIP_NAME="${2:?Recipient name required}"
RECIP_ADDRESS="${3:?Recipient address required}"
RECIP_CITY="${4:?Recipient city required}"
RECIP_STATE="${5:?Recipient state required}"
RECIP_ZIP="${6:?Recipient ZIP required}"
LETTER_REF="${7:-Certified Letter - $RECIP_NAME}"

SCM_EMAIL="coreypearsonemail@gmail.com"
SCM_PASS="Certifiedpassword#1"
SCM_URL="https://www.sendcertifiedmail.com"

LOG_FILE="/tmp/scm-submit.log"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$LOG_FILE"; }

log "Starting SCM submission for: $RECIP_NAME"
log "PDF: $PDF_PATH"
log "Address: $RECIP_ADDRESS, $RECIP_CITY, $RECIP_STATE $RECIP_ZIP"

# Convert Windows path to WSL path for file existence check
WSL_PDF=$(echo "$PDF_PATH" | sed 's|^C:|/mnt/c|' | sed 's|\\|/|g')
if [ ! -f "$WSL_PDF" ]; then
    log "ERROR: PDF not found at $WSL_PDF"
    exit 1
fi

# Step 1: Login
log "Logging in to SendCertifiedMail.com..."
agent-browser open "$SCM_URL/login" 2>/dev/null

sleep 2
SNAP=$(agent-browser snapshot 2>/dev/null)

# Find email and password fields
EMAIL_REF=$(echo "$SNAP" | grep -i 'textbox.*Email' | head -1 | grep -oP 'ref=\K[^\]]+')
PASS_REF=$(echo "$SNAP" | grep -i 'textbox.*Password' | head -1 | grep -oP 'ref=\K[^\]]+')
LOGIN_BTN=$(echo "$SNAP" | grep -i 'button.*Log In' | head -1 | grep -oP 'ref=\K[^\]]+')

if [ -z "$EMAIL_REF" ] || [ -z "$PASS_REF" ] || [ -z "$LOGIN_BTN" ]; then
    log "ERROR: Could not find login form elements"
    agent-browser close 2>/dev/null
    exit 1
fi

agent-browser fill "$EMAIL_REF" "$SCM_EMAIL" 2>/dev/null
agent-browser fill "$PASS_REF" "$SCM_PASS" 2>/dev/null
agent-browser click "$LOGIN_BTN" 2>/dev/null
sleep 3

# Verify login
SNAP=$(agent-browser snapshot 2>/dev/null)
if echo "$SNAP" | grep -qi "disabled"; then
    log "ERROR: Account is temporarily disabled. Call 800-406-1792 to reactivate."
    agent-browser close 2>/dev/null
    exit 2
fi

# Step 2: Navigate to single letter upload
log "Navigating to single letter upload..."
agent-browser open "$SCM_URL/scm-label" 2>/dev/null
sleep 3

SNAP=$(agent-browser snapshot 2>/dev/null)

# Step 3: Fill in letter reference
log "Filling form fields..."
REF_FIELD=$(echo "$SNAP" | grep -i 'textbox.*[Rr]eference\|textbox.*[Ll]etter' | head -1 | grep -oP 'ref=\K[^\]]+')
if [ -n "$REF_FIELD" ]; then
    agent-browser fill "$REF_FIELD" "$LETTER_REF" 2>/dev/null
    log "Set letter reference: $LETTER_REF"
fi

# Step 4: Upload PDF file
FILE_INPUT=$(echo "$SNAP" | grep -iE 'input.*file|fileinput' | head -1 | grep -oP 'ref=\K[^\]]+')
if [ -n "$FILE_INPUT" ]; then
    agent-browser fill "$FILE_INPUT" "$WSL_PDF" 2>/dev/null
    log "Uploaded PDF file"
else
    log "WARNING: Could not find file upload input. Will try alternative selectors."
    # Try clicking an upload button/area
    UPLOAD_BTN=$(echo "$SNAP" | grep -iE 'button.*[Uu]pload|button.*[Bb]rowse|button.*[Cc]hoose' | head -1 | grep -oP 'ref=\K[^\]]+')
    if [ -n "$UPLOAD_BTN" ]; then
        agent-browser click "$UPLOAD_BTN" 2>/dev/null
        sleep 1
    fi
fi

sleep 2

# Step 5: Fill recipient address fields
SNAP=$(agent-browser snapshot 2>/dev/null)

# Try to find address fields by common labels
fill_field() {
    local pattern="$1"
    local value="$2"
    local ref=$(echo "$SNAP" | grep -iE "textbox.*$pattern|input.*$pattern" | head -1 | grep -oP 'ref=\K[^\]]+')
    if [ -n "$ref" ]; then
        agent-browser fill "$ref" "$value" 2>/dev/null
        log "Filled $pattern: $value"
        return 0
    fi
    return 1
}

# Recipient name
fill_field "[Nn]ame.*[Rr]ecip\|[Rr]ecip.*[Nn]ame\|[Aa]ttention\|[Nn]ame" "$RECIP_NAME" || true

# Street address
fill_field "[Ss]treet\|[Aa]ddress.*1\|[Aa]ddress" "$RECIP_ADDRESS" || true

# City
fill_field "[Cc]ity" "$RECIP_CITY" || true

# State - might be a select dropdown
STATE_SEL=$(echo "$SNAP" | grep -iE "combobox.*[Ss]tate|select.*[Ss]tate" | head -1 | grep -oP 'ref=\K[^\]]+')
if [ -n "$STATE_SEL" ]; then
    agent-browser click "$STATE_SEL" 2>/dev/null
    sleep 1
    # Look for the state option
    SNAP2=$(agent-browser snapshot 2>/dev/null)
    STATE_OPT=$(echo "$SNAP2" | grep -i "option.*$RECIP_STATE" | head -1 | grep -oP 'ref=\K[^\]]+')
    if [ -n "$STATE_OPT" ]; then
        agent-browser click "$STATE_OPT" 2>/dev/null
        log "Selected state: $RECIP_STATE"
    fi
else
    fill_field "[Ss]tate" "$RECIP_STATE" || true
fi

# ZIP
fill_field "[Zz]ip\|[Pp]ostal" "$RECIP_ZIP" || true

sleep 1

# Step 6: Select service type (Certified Mail with Return Receipt)
SNAP=$(agent-browser snapshot 2>/dev/null)
SERVICE_SEL=$(echo "$SNAP" | grep -iE "combobox.*[Ss]ervice\|combobox.*[Mm]ail\|select.*[Ss]ervice\|radio.*[Cc]ertified\|checkbox.*[Rr]eturn" | head -1 | grep -oP 'ref=\K[^\]]+')
if [ -n "$SERVICE_SEL" ]; then
    agent-browser click "$SERVICE_SEL" 2>/dev/null
    sleep 1
    SNAP2=$(agent-browser snapshot 2>/dev/null)
    # Look for "Certified Mail" or "Return Receipt" option
    CERT_OPT=$(echo "$SNAP2" | grep -iE "[Cc]ertified.*[Rr]eturn\|[Rr]eturn.*[Rr]eceipt" | head -1 | grep -oP 'ref=\K[^\]]+')
    if [ -n "$CERT_OPT" ]; then
        agent-browser click "$CERT_OPT" 2>/dev/null
        log "Selected Certified Mail with Return Receipt"
    fi
fi

# Step 7: Select mailing profile (sender)
PROFILE_SEL=$(echo "$SNAP" | grep -iE "combobox.*[Pp]rofile\|select.*[Pp]rofile\|combobox.*[Ss]ender\|combobox.*[Ff]rom" | head -1 | grep -oP 'ref=\K[^\]]+')
if [ -n "$PROFILE_SEL" ]; then
    agent-browser click "$PROFILE_SEL" 2>/dev/null
    sleep 1
    SNAP2=$(agent-browser snapshot 2>/dev/null)
    # Select profile 236134 or "COREY"
    PROFILE_OPT=$(echo "$SNAP2" | grep -iE "236134\|COREY\|1155.*Twain" | head -1 | grep -oP 'ref=\K[^\]]+')
    if [ -n "$PROFILE_OPT" ]; then
        agent-browser click "$PROFILE_OPT" 2>/dev/null
        log "Selected mailing profile 236134"
    fi
fi

# Step 8: Submit the form
sleep 1
SNAP=$(agent-browser snapshot 2>/dev/null)
SUBMIT_BTN=$(echo "$SNAP" | grep -iE "button.*[Ss]ubmit\|button.*[Ss]end\|button.*[Cc]reate\|button.*[Mm]ail\|button.*[Pp]rocess" | head -1 | grep -oP 'ref=\K[^\]]+')
if [ -n "$SUBMIT_BTN" ]; then
    log "Submitting certified mail request..."
    agent-browser click "$SUBMIT_BTN" 2>/dev/null
    sleep 5

    # Check for success
    SNAP=$(agent-browser snapshot 2>/dev/null)
    if echo "$SNAP" | grep -qiE "success\|submitted\|created\|tracking\|label"; then
        log "SUCCESS: Certified mail submitted for $RECIP_NAME"
        # Try to capture tracking number
        TRACKING=$(echo "$SNAP" | grep -ioE '[0-9]{20}' | head -1)
        if [ -n "$TRACKING" ]; then
            log "Tracking: $TRACKING"
        fi
    else
        log "WARNING: Submission may have failed. Check SendCertifiedMail.com dashboard."
    fi
else
    log "ERROR: Could not find submit button"
fi

# Step 9: Close browser
agent-browser close 2>/dev/null
log "Browser closed. SCM submission complete."
