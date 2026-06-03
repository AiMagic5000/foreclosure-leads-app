# Auto-Print Certified Mail Requests + SendCertifiedMail.com Submission
# Monitors claim@usforeclosurerecovery.com ONLY for "Certified Mail Request" subject emails
# Downloads .docx attachments, prints them on the EPSON ET-15000,
# converts the letter to PDF, and submits to SendCertifiedMail.com for USPS Certified Mail delivery.
#
# IMPORTANT: This ONLY prints emails with "Certified Mail Request" in the subject.
# All other emails are completely ignored.
#
# Schedule: Windows Task Scheduler, every 15 minutes

$ErrorActionPreference = "Stop"

$PrinterName = "EPSON ET-15000 Series"
$LibreOffice = "C:\Program Files\LibreOffice\program\soffice.exe"
$TempDir = "$env:TEMP\certified-mail-print"
$ProcessedFile = "$env:APPDATA\certified-mail-processed.txt"
$LogFile = "$env:APPDATA\certified-mail-print.log"
$ScmSubmitScript = "C:\Users\flowc\Documents\foreclosure-leads-app\scripts\submit-to-scm.sh"
$DesktopLettersDir = "$env:USERPROFILE\Desktop\Certified Mail Letters"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -Append -FilePath $LogFile -Encoding UTF8
    Write-Host "$timestamp - $Message"
}

if (-not (Test-Path $TempDir)) { New-Item -ItemType Directory -Path $TempDir -Force | Out-Null }
if (-not (Test-Path $ProcessedFile)) { New-Item -ItemType File -Path $ProcessedFile -Force | Out-Null }

$processed = @(Get-Content $ProcessedFile -ErrorAction SilentlyContinue | Where-Object { $_ -ne "" })

Write-Log "Starting certified mail print check..."

$wslTempDir = "/mnt/c" + ($TempDir.Substring(2) -replace '\\', '/')

$pyScript = @"
import imaplib
import email
import email.header
import os
import json
import sys
import re

host = "imap.hostinger.com"
port = 993
user = "claim@usforeclosurerecovery.com"
pw = "Thepassword#1234"
temp_dir = "$wslTempDir"

os.makedirs(temp_dir, exist_ok=True)

def extract_address_from_html(html_body):
    """Extract mailing address fields from the certified mail email HTML body."""
    result = {}
    # Extract table rows: <td>Label</td><td>Value</td>
    rows = re.findall(r'<td[^>]*>([^<]*)</td>\s*<td[^>]*>([^<]*)</td>', html_body, re.IGNORECASE)
    for label, value in rows:
        label_lower = label.strip().lower()
        val = value.strip()
        if not val:
            continue
        if "claimant" in label_lower or label_lower == "name":
            result["name"] = val
        elif "mailing" in label_lower:
            result["mailing_address"] = val
        elif "property" in label_lower and "address" in label_lower:
            result["property_address"] = val
        elif label_lower == "state":
            result["state"] = val
        elif "surplus" in label_lower or "amount" in label_lower:
            result["amount"] = val

    # Parse mailing address into components (format: "123 Main St, City, ST 12345" or "123 Main St City ST 12345")
    addr = result.get("mailing_address", "")
    if addr:
        # Try comma-separated: "123 Main St, City, ST 12345"
        parts = [p.strip() for p in addr.split(",")]
        if len(parts) >= 3:
            result["street"] = parts[0]
            result["city"] = parts[1]
            # Last part: "ST 12345" or "ST  12345"
            state_zip = parts[-1].strip()
            sz_match = re.match(r'([A-Z]{2})\s+(\d{5}(?:-\d{4})?)', state_zip)
            if sz_match:
                result["addr_state"] = sz_match.group(1)
                result["zip"] = sz_match.group(2)
            else:
                result["addr_state"] = state_zip[:2] if len(state_zip) >= 2 else ""
                result["zip"] = re.search(r'\d{5}', state_zip).group() if re.search(r'\d{5}', state_zip) else ""
        elif len(parts) == 2:
            result["street"] = parts[0]
            state_zip = parts[1].strip()
            # Try to extract "City ST 12345"
            csz = re.match(r'(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)', state_zip)
            if csz:
                result["city"] = csz.group(1)
                result["addr_state"] = csz.group(2)
                result["zip"] = csz.group(3)
        else:
            # Single string - try regex
            full = re.match(r'(.+?),?\s+([A-Za-z\s]+?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)', addr)
            if full:
                result["street"] = full.group(1)
                result["city"] = full.group(2)
                result["addr_state"] = full.group(3)
                result["zip"] = full.group(4)

    return result

try:
    mail = imaplib.IMAP4_SSL(host, port)
    mail.login(user, pw)
    mail.select("INBOX")

    # ONLY search for "Certified Mail Request" subject -- nothing else
    status, messages = mail.search(None, 'SUBJECT "Certified Mail Request"')

    if status != "OK" or not messages[0]:
        print(json.dumps({"emails": []}))
        mail.logout()
        sys.exit(0)

    results = []
    msg_ids = messages[0].split()

    for msg_id in msg_ids:
        status, msg_data = mail.fetch(msg_id, "(RFC822)")
        if status != "OK":
            continue

        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)

        subj_parts = email.header.decode_header(msg["Subject"])
        subject = ""
        for part, enc in subj_parts:
            if isinstance(part, bytes):
                subject += part.decode(enc or "utf-8", errors="replace")
            else:
                subject += str(part)

        # Double-check: ONLY process if subject starts with "Certified Mail Request"
        if not subject.startswith("Certified Mail Request"):
            continue

        msg_uid = msg_id.decode()
        attachments = []
        address_info = {}

        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue

            content_type = part.get_content_type()
            filename = part.get_filename()

            # Extract address from HTML body
            if content_type == "text/html" and not filename:
                try:
                    html_body = part.get_payload(decode=True).decode("utf-8", errors="replace")
                    address_info = extract_address_from_html(html_body)
                except:
                    pass

            # Save .docx attachments
            if filename and filename.lower().endswith(".docx"):
                safe_name = filename.replace(" ", "_")
                filepath = os.path.join(temp_dir, f"{msg_uid}_{safe_name}")
                payload = part.get_payload(decode=True)
                if payload:
                    with open(filepath, "wb") as f:
                        f.write(payload)
                    attachments.append(filepath)

        results.append({
            "uid": msg_uid,
            "subject": subject,
            "attachments": attachments,
            "address": address_info
        })

    print(json.dumps({"emails": results}))
    mail.logout()
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
"@

$pyFile = "$env:TEMP\cert_mail_imap.py"
$pyScript | Out-File -FilePath $pyFile -Encoding UTF8 -Force

$wslPyFile = "/mnt/c" + ($pyFile.Substring(2) -replace '\\', '/')

try {
    $rawOutput = wsl python3 $wslPyFile 2>&1
    $jsonStr = ($rawOutput | Out-String).Trim()

    if (-not $jsonStr -or $jsonStr -eq "") {
        Write-Log "Python returned empty output"
        exit 0
    }

    $data = $jsonStr | ConvertFrom-Json

    if ($data.error) {
        Write-Log "IMAP error: $($data.error)"
        exit 1
    }

    if (-not $data.emails -or $data.emails.Count -eq 0) {
        Write-Log "No certified mail requests found in inbox."
        exit 0
    }

    Write-Log "Found $($data.emails.Count) certified mail email(s) total"

    $newCount = 0

    foreach ($emailItem in $data.emails) {
        $uid = $emailItem.uid

        if ($processed -contains $uid) {
            continue
        }

        $newCount++
        Write-Log "NEW: $($emailItem.subject) (UID: $uid)"

        # Kill any lingering LibreOffice before printing batch
        Get-Process soffice* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1

        foreach ($attachment in $emailItem.attachments) {
            $winPath = $attachment -replace "^/mnt/c", "C:"
            $winPath = $winPath -replace "/", "\"

            if (-not (Test-Path $winPath)) {
                Write-Log "WARN: Attachment not found at $winPath"
                continue
            }

            $filename = Split-Path $winPath -Leaf
            Write-Log "Printing: $filename -> $PrinterName"

            try {
                # Use cmd /c to properly handle quoted paths with LibreOffice
                $cmdLine = "`"$LibreOffice`" --headless --norestore --pt `"$PrinterName`" `"$winPath`""
                cmd /c $cmdLine 2>&1 | Out-Null

                Write-Log "OK: Sent $filename to printer"
                Start-Sleep -Seconds 3
            }
            catch {
                Write-Log "ERROR printing $filename : $_"
            }
        }

        # --- Copy digital letters to Desktop folder ---
        $addrInfo = $emailItem.address
        $recipName = if ($addrInfo.name) { $addrInfo.name } else { "Unknown" }
        $recipAmount = if ($addrInfo.amount) { $addrInfo.amount -replace '[^0-9]', '' } else { "0" }
        $recipState = if ($addrInfo.addr_state) { $addrInfo.addr_state } elseif ($addrInfo.state) { $addrInfo.state } else { "" }
        $folderName = "$recipName - $recipState - $recipAmount"
        $destFolder = Join-Path $DesktopLettersDir $folderName

        if (-not (Test-Path $DesktopLettersDir)) { New-Item -ItemType Directory -Path $DesktopLettersDir -Force | Out-Null }
        if (-not (Test-Path $destFolder)) { New-Item -ItemType Directory -Path $destFolder -Force | Out-Null }

        foreach ($attachment in $emailItem.attachments) {
            $srcPath = $attachment -replace "^/mnt/c", "C:" -replace "/", "\"
            if (Test-Path $srcPath) {
                Copy-Item $srcPath -Destination $destFolder -Force
            }
        }

        # Write mailing info file for easy copy-paste
        $infoFile = Join-Path $destFolder "MAILING-INFO.txt"
        $infoContent = @"
Name: $recipName
Address: $(if ($addrInfo.street) { $addrInfo.street } elseif ($addrInfo.mailing_address) { $addrInfo.mailing_address } else { '' })
City: $(if ($addrInfo.city) { $addrInfo.city } else { '' })
State: $recipState
ZIP: $(if ($addrInfo.zip) { $addrInfo.zip } else { '' })
Surplus: $(if ($addrInfo.amount) { $addrInfo.amount } else { '' })

SENDER:
COREY
1155 East Twain Avenue, #108148
Las Vegas, NV 89169
"@
        $infoContent | Out-File -FilePath $infoFile -Encoding UTF8 -Force
        Write-Log "Copied digital letters to Desktop: $folderName"

        # --- PDF Conversion + SendCertifiedMail.com Submission ---
        # Find the Letter .docx (starts with "Letter-")
        $letterDocx = $null
        foreach ($attachment in $emailItem.attachments) {
            $leafName = Split-Path ($attachment -replace "^/mnt/c", "C:" -replace "/", "\") -Leaf
            if ($leafName -like "*Letter-*") {
                $letterDocx = $attachment -replace "^/mnt/c", "C:" -replace "/", "\"
                break
            }
        }

        if ($letterDocx -and (Test-Path $letterDocx)) {
            # Convert Letter .docx to PDF using LibreOffice
            $pdfDir = "$TempDir\pdf"
            if (-not (Test-Path $pdfDir)) { New-Item -ItemType Directory -Path $pdfDir -Force | Out-Null }

            Write-Log "Converting $letterDocx to PDF..."
            try {
                $convertCmd = "`"$LibreOffice`" --headless --norestore --convert-to pdf --outdir `"$pdfDir`" `"$letterDocx`""
                cmd /c $convertCmd 2>&1 | Out-Null

                # Find the generated PDF (LibreOffice keeps original filename, changes extension)
                $docxLeaf = Split-Path $letterDocx -Leaf
                $pdfName = [System.IO.Path]::GetFileNameWithoutExtension($docxLeaf) + ".pdf"
                $pdfPath = Join-Path $pdfDir $pdfName

                if (Test-Path $pdfPath) {
                    Write-Log "PDF created: $pdfPath"

                    # Extract address fields from email body
                    $addrInfo = $emailItem.address
                    $recipName = if ($addrInfo.name) { $addrInfo.name } else { "" }
                    $recipStreet = if ($addrInfo.street) { $addrInfo.street } elseif ($addrInfo.mailing_address) { $addrInfo.mailing_address } else { "" }
                    $recipCity = if ($addrInfo.city) { $addrInfo.city } else { "" }
                    $recipState = if ($addrInfo.addr_state) { $addrInfo.addr_state } elseif ($addrInfo.state) { $addrInfo.state } else { "" }
                    $recipZip = if ($addrInfo.zip) { $addrInfo.zip } else { "" }

                    if ($recipName -and $recipStreet -and $recipCity -and $recipState -and $recipZip) {
                        Write-Log "Submitting to SendCertifiedMail.com: $recipName at $recipStreet, $recipCity, $recipState $recipZip"

                        try {
                            $wslPdfPath = "/mnt/c" + ($pdfPath.Substring(2) -replace '\\', '/')
                            $wslScmScript = "/mnt/c" + ($ScmSubmitScript.Substring(2) -replace '\\', '/')

                            $scmResult = wsl bash "$wslScmScript" "$pdfPath" "$recipName" "$recipStreet" "$recipCity" "$recipState" "$recipZip" "Certified Letter - $recipName" 2>&1
                            $scmOutput = ($scmResult | Out-String).Trim()

                            if ($scmOutput -match "SUCCESS") {
                                Write-Log "SCM: Successfully submitted certified mail for $recipName"
                            } elseif ($scmOutput -match "disabled") {
                                Write-Log "SCM: Account disabled - letter printed but NOT submitted to USPS. Call 800-406-1792."
                            } else {
                                Write-Log "SCM: Submission result - $scmOutput"
                            }
                        }
                        catch {
                            Write-Log "SCM ERROR: $_"
                        }
                    } else {
                        Write-Log "SCM SKIP: Missing address fields (name=$recipName, street=$recipStreet, city=$recipCity, state=$recipState, zip=$recipZip)"
                    }
                } else {
                    Write-Log "WARN: PDF conversion produced no output at $pdfPath"
                }
            }
            catch {
                Write-Log "PDF conversion error: $_"
            }
        } else {
            Write-Log "WARN: No Letter .docx found in attachments for SCM submission"
        }

        $uid | Out-File -Append $ProcessedFile -Encoding UTF8
        Write-Log "Marked UID $uid as processed"
    }

    if ($newCount -eq 0) {
        Write-Log "No new certified mail requests (all previously processed)."
    } else {
        Write-Log "Print + SCM complete: $newCount new request(s) processed."
    }
}
catch {
    Write-Log "FATAL: $_"
    exit 1
}
