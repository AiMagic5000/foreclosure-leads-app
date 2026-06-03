#!/usr/bin/env python3
"""
Daily Agent Lead Package Generator
===================================
Runs daily to:
1. Query all deed-verified, DNC-cleared, $1500+ non-judicial leads
2. Split across 4 agents (25 each, round-robin by surplus desc)
3. Create dated folder: "YYYY-MM-DD Volume N" on Desktop
4. Generate per-agent subfolders with Excel + Word doc Lead Reports
5. Track which leads have been assigned to avoid duplicates

Usage:
  python3 daily_agent_packages.py                    # Auto-detect volume number
  python3 daily_agent_packages.py --volume 2         # Force volume number
  python3 daily_agent_packages.py --agents 4         # Number of agents (default 4)
  python3 daily_agent_packages.py --per-agent 25     # Leads per agent (default 25)
  python3 daily_agent_packages.py --dry-run           # Preview without generating

Requires: python-docx, openpyxl (pip install python-docx openpyxl)
"""

import json
import os
import sys
import re
import argparse
from datetime import datetime, timezone
from copy import deepcopy

# Try venv first, then system packages
try:
    from docx import Document
except ImportError:
    sys.path.insert(0, '/tmp/docgen-env/lib/python3.12/site-packages')
    from docx import Document

from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import requests

# ── CONFIG ──
SUPABASE_URL = "https://foreclosure-db.alwaysencrypted.com"
SUPABASE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

DESKTOP = "/mnt/c/Users/flowc/Desktop"
TRACKING_FILE = os.path.join(os.path.dirname(__file__), ".assigned_leads.json")

# Non-judicial states we target
APPROVED_STATES = [
    'VA', 'AL', 'MS', 'ID', 'MT', 'WY',  # Tier 1
    'AK', 'MO', 'OR', 'NE', 'WV',        # Tier 2
    'MI', 'MN', 'NH', 'MA', 'RI', 'SD', 'UT', 'OK',  # Tier 3
    'GA',  # Tier 6 (attorney, but no fee cap)
]

MIN_OVERAGE = 1500

# ── Colors ──
GREEN = RGBColor(0x2E, 0x7D, 0x32)
GRAY = RGBColor(0x66, 0x66, 0x66)
LIGHT_GREEN_HEX = '2E7D32'
GOLD_BG = 'FFF8E1'


def load_assigned_ids():
    """Load set of already-assigned lead IDs."""
    if os.path.exists(TRACKING_FILE):
        with open(TRACKING_FILE, 'r') as f:
            return set(json.load(f))
    return set()


def save_assigned_ids(ids):
    """Save updated set of assigned lead IDs."""
    with open(TRACKING_FILE, 'w') as f:
        json.dump(list(ids), f)


def fetch_available_leads(limit=200, exclude_ids=None):
    """Fetch deed-verified, DNC-cleared, $1500+ non-judicial leads."""
    params = {
        "select": "*",
        "order": "overage_amount.desc.nullslast",
        "limit": str(limit),
        "primary_phone": "not.is.null",
        "on_dnc": "eq.false",
        "can_contact": "eq.true",
        "dnc_checked": "eq.true",
        "deed_verified": "eq.true",
        "overage_amount": f"gte.{MIN_OVERAGE}",
        "state_abbr": f"in.({','.join(APPROVED_STATES)})",
        "status": "in.(new,skip_traced,contacted,callback,diamond,gold)",
    }

    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/foreclosure_leads",
        headers=HEADERS,
        params=params,
        timeout=30,
    )
    resp.raise_for_status()
    leads = resp.json()

    # Exclude already-assigned leads
    if exclude_ids:
        leads = [l for l in leads if l['id'] not in exclude_ids]

    return leads


def get_next_volume(date_str):
    """Determine next volume number for today's date."""
    existing = [d for d in os.listdir(DESKTOP) if d.startswith(date_str)]
    volume = 1
    for d in existing:
        match = re.search(r'Volume\s+(\d+)', d)
        if match:
            volume = max(volume, int(match.group(1)) + 1)
    return volume


# ══════════════════════════════════════════════════════════
# WORD DOCUMENT GENERATION
# ══════════════════════════════════════════════════════════

def safe(val, default=""):
    if val is None:
        return default
    return str(val).strip() or default


def fmt_currency(val):
    try:
        v = float(val or 0)
        return f"${v:,.2f}"
    except (ValueError, TypeError):
        return "$0.00"


def full_address(lead):
    parts = [safe(lead.get('property_address'))]
    city = safe(lead.get('city'))
    state = safe(lead.get('state_abbr'))
    zipcode = safe(lead.get('zip_code'))
    if city:
        parts.append(city)
    if state:
        parts.append(state)
    if zipcode and parts:
        parts[-1] = parts[-1] + ' ' + zipcode
    return ', '.join(p for p in parts if p)


def set_cell_shading(cell, color_hex):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)


def add_section_header(doc, title):
    p = doc.add_paragraph()
    p.space_before = Pt(12)
    p.space_after = Pt(4)
    run = p.add_run(title)
    run.bold = True
    run.font.size = Pt(13)
    run.font.color.rgb = GREEN
    border_p = doc.add_paragraph()
    border_p.space_before = Pt(0)
    border_p.space_after = Pt(6)
    pPr = border_p._p.get_or_add_pPr()
    pBdr = parse_xml(
        f'<w:pBdr {nsdecls("w")}>'
        f'  <w:bottom w:val="single" w:sz="8" w:space="1" w:color="{LIGHT_GREEN_HEX}"/>'
        f'</w:pBdr>'
    )
    pPr.append(pBdr)


def add_two_col_table(doc, rows_data):
    table = doc.add_table(rows=len(rows_data), cols=4)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row_data in enumerate(rows_data):
        for j, (label, value) in enumerate(row_data):
            col_idx = j * 2
            cell_l = table.cell(i, col_idx)
            cell_l.text = ''
            p = cell_l.paragraphs[0]
            run = p.add_run(label)
            run.bold = True
            run.font.size = Pt(9)
            run.font.color.rgb = GRAY
            cell_v = table.cell(i, col_idx + 1)
            cell_v.text = ''
            p = cell_v.paragraphs[0]
            run = p.add_run(str(value))
            run.font.size = Pt(10)
    for row in table.rows:
        row.cells[0].width = Inches(1.4)
        row.cells[1].width = Inches(2.1)
        row.cells[2].width = Inches(1.4)
        row.cells[3].width = Inches(2.1)
    return table


def add_recovery_box(doc, lead):
    surplus = float(lead.get('overage_amount', 0) or 0)
    sale_amt = float(lead.get('sale_amount', 0) or 0)
    service_fee = surplus * 0.30
    partnership_fee = service_fee * 0.50
    company_fee = service_fee * 0.50

    table = doc.add_table(rows=4, cols=4)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    title_cell = table.cell(0, 0)
    title_cell.merge(table.cell(0, 3))
    title_cell.text = ''
    p = title_cell.paragraphs[0]
    run = p.add_run('Recovery Opportunity Analysis')
    run.bold = True
    run.italic = True
    run.font.size = Pt(12)
    run.font.color.rgb = GREEN
    set_cell_shading(title_cell, GOLD_BG)

    data = [
        [('Sale Amount', fmt_currency(sale_amt)), ('Partnership Fee (50%)', fmt_currency(partnership_fee))],
        [('Estimated Surplus', fmt_currency(surplus)), ('Company Fee (50%)', fmt_currency(company_fee))],
    ]
    for i, row_data in enumerate(data):
        for j, (label, value) in enumerate(row_data):
            col_idx = j * 2
            cell_l = table.cell(i + 1, col_idx)
            cell_l.text = ''
            p = cell_l.paragraphs[0]
            run = p.add_run(label)
            run.bold = True
            run.font.size = Pt(9)
            set_cell_shading(cell_l, GOLD_BG)
            cell_v = table.cell(i + 1, col_idx + 1)
            cell_v.text = ''
            p = cell_v.paragraphs[0]
            run = p.add_run(value)
            run.font.size = Pt(10)
            set_cell_shading(cell_v, GOLD_BG)

    sf_label = table.cell(3, 0)
    sf_label.text = ''
    p = sf_label.paragraphs[0]
    run = p.add_run('Service Fee (30%)')
    run.bold = True
    run.font.size = Pt(9)
    set_cell_shading(sf_label, GOLD_BG)

    sf_value = table.cell(3, 1)
    sf_value.merge(table.cell(3, 3))
    sf_value.text = ''
    p = sf_value.paragraphs[0]
    run = p.add_run(fmt_currency(service_fee))
    run.bold = True
    run.font.size = Pt(14)
    set_cell_shading(sf_value, GOLD_BG)


def add_call_log_entry(doc, call_num, phone):
    table = doc.add_table(rows=7, cols=4)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    h1 = table.cell(0, 0)
    h1.text = ''
    p = h1.paragraphs[0]
    run = p.add_run(f'Call #{call_num}')
    run.bold = True
    run.font.size = Pt(10)
    headers = [('Date: ___________', 1), ('Time: ___________', 2), ('Duration: ___________', 3)]
    for text, col in headers:
        c = table.cell(0, col)
        c.text = ''
        p = c.paragraphs[0]
        run = p.add_run(text)
        run.font.size = Pt(9)
        run.font.color.rgb = GRAY

    fields = [
        ('Spoke With', ''),
        ('Agent Phone Number', ''),
        ("Client's Phone Number", phone),
        ('Outcome', ''),
    ]
    for i, (label, value) in enumerate(fields):
        cell_l = table.cell(i + 1, 0)
        cell_l.text = ''
        p = cell_l.paragraphs[0]
        run = p.add_run(label)
        run.bold = True
        run.font.size = Pt(9)
        cell_v = table.cell(i + 1, 1)
        cell_v.merge(table.cell(i + 1, 3))
        cell_v.text = ''
        p = cell_v.paragraphs[0]
        run = p.add_run(value)
        run.font.size = Pt(10)

    notes_label = table.cell(5, 0)
    notes_label.merge(table.cell(5, 3))
    notes_label.text = ''
    p = notes_label.paragraphs[0]
    run = p.add_run('Notes:')
    run.bold = True
    run.font.size = Pt(9)

    fu = table.cell(6, 0)
    fu.merge(table.cell(6, 3))
    fu.text = ''
    p = fu.paragraphs[0]
    run = p.add_run('Follow-up Required: [] Yes [] No     Next Action: _________________________________')
    run.font.size = Pt(9)
    doc.add_paragraph()


def generate_lead_report(lead, output_path):
    """Generate a Word document Lead Report matching the PDF template."""
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(1.5)
        section.bottom_margin = Cm(1.5)
        section.left_margin = Cm(2)
        section.right_margin = Cm(2)

    owner = safe(lead.get('owner_name'), 'Unknown')
    phone = safe(lead.get('primary_phone'))
    email = safe(lead.get('primary_email'))
    sec_phone = safe(lead.get('secondary_phone'))
    sec_email = safe(lead.get('secondary_email'), 'N/A')
    address = full_address(lead)
    case_num = safe(lead.get('case_number'))
    apn = safe(lead.get('apn_number') or lead.get('parcel_id'))
    county = safe(lead.get('county'))
    state = safe(lead.get('state_abbr'))
    surplus = float(lead.get('overage_amount', 0) or 0)
    today = datetime.now().strftime('%B %d, %Y')
    deed = lead.get('deed_chain_data') or lead.get('deed_result') or {}
    if isinstance(deed, str):
        try:
            deed = json.loads(deed)
        except:
            deed = {}
    deed_type = safe(deed.get('transaction_type'))
    deed_date = safe(deed.get('transaction_date'))
    deed_price = deed.get('close_price')
    deed_buyer = safe(deed.get('matched_name'))

    # ── PAGE 1 ──
    conf = doc.add_paragraph()
    conf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = conf.add_run('CONFIDENTIAL - FOR AUTHORIZED USE ONLY')
    run.font.color.rgb = GREEN
    run.font.size = Pt(10)
    run.bold = True

    title = doc.add_paragraph()
    title.space_after = Pt(0)
    run = title.add_run('Lead Report')
    run.bold = True
    run.font.size = Pt(24)

    info = doc.add_paragraph()
    info.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    info.space_before = Pt(0)
    run = info.add_run(f'Report Generated: {today}\nCase #: {case_num}\nAPN: {apn}')
    run.font.size = Pt(9)
    run.font.color.rgb = GRAY

    divider = doc.add_paragraph()
    divider.space_before = Pt(0)
    divider.space_after = Pt(6)
    pPr = divider._p.get_or_add_pPr()
    pBdr = parse_xml(
        f'<w:pBdr {nsdecls("w")}>'
        f'  <w:bottom w:val="single" w:sz="12" w:space="1" w:color="{LIGHT_GREEN_HEX}"/>'
        f'</w:pBdr>'
    )
    pPr.append(pBdr)

    # PROPERTY OWNER
    add_section_header(doc, 'PROPERTY OWNER')
    add_two_col_table(doc, [
        [('Full Name', owner), ('Primary Phone', phone)],
        [('Also Known As', ''), ('Secondary Phone', sec_phone or 'N/A')],
        [('Age / DOB', ''), ('Primary Email', email or 'N/A')],
        [('SSN (Last 4)', '***-**-'), ('Secondary Email', sec_email)],
    ])

    # PROPERTY DETAILS
    add_section_header(doc, 'PROPERTY DETAILS')
    prop_addr = safe(lead.get('property_address'))
    city_val = safe(lead.get('city'))
    zip_val = safe(lead.get('zip_code'))
    city_state_zip = f"{city_val}, {state} {zip_val}".strip().strip(',').strip()
    add_two_col_table(doc, [
        [('Address', prop_addr), ('Bedrooms / Baths', f"{safe(lead.get('bedrooms'), '0')} BD / {safe(lead.get('bathrooms'), '0')} BA")],
        [('City / State / ZIP', city_state_zip), ('Lot Size', safe(lead.get('lot_size')))],
        [('County', county), ('Stories', '0')],
        [('Property Type', safe(lead.get('property_type'), 'Single Family Residence')), ('Garage', '')],
        [('Year Built', safe(lead.get('year_built'), '0')), ('Construction', '')],
        [('Square Footage', f"{safe(lead.get('sq_ft'), '0')} sq ft"), ('Zoning', '')],
    ])

    # FORECLOSURE DETAILS
    add_section_header(doc, 'FORECLOSURE DETAILS')
    sale_date = safe(lead.get('sale_date'))
    if sale_date and 'T' in sale_date:
        sale_date = sale_date.split('T')[0]
    add_two_col_table(doc, [
        [('Filing Date', sale_date or 'N/A'), ('Auction Date', sale_date or 'N/A')],
        [('Case Number', case_num), ('Auction Location', '')],
        [('Court', ''), ('Opening Bid', fmt_currency(0))],
        [('Trustee', ''), ('Default Amount', fmt_currency(0))],
        [('Notice Type', ''), ('Lender', safe(lead.get('lender_name')))],
        [('Foreclosure Type', safe(lead.get('foreclosure_type'), 'foreclosure')), ('Mortgage Amount', fmt_currency(lead.get('mortgage_amount', 0)))],
    ])

    # RECOVERY OPPORTUNITY ANALYSIS
    doc.add_paragraph()
    add_recovery_box(doc, lead)

    # TAX ASSESSMENT
    add_section_header(doc, 'TAX ASSESSMENT')
    add_two_col_table(doc, [
        [('Assessed Value', fmt_currency(lead.get('assessed_value', 0))), ('Tax Year', '2025')],
        [('Market Value', fmt_currency(0)), ('Tax Status', 'Current')],
        [('Annual Taxes', fmt_currency(0)), ('Exemptions', 'None')],
    ])

    # SALE HISTORY
    add_section_header(doc, 'SALE HISTORY')
    sale_table = doc.add_table(rows=2, cols=5)
    sale_table.style = 'Table Grid'
    sale_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(['DATE', 'PRICE', 'TYPE', 'BUYER', 'SELLER']):
        cell = sale_table.cell(0, i)
        cell.text = ''
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(9)
        set_cell_shading(cell, 'F5F5F5')
    if deed_date:
        sale_table.cell(1, 0).text = deed_date
        sale_table.cell(1, 1).text = fmt_currency(deed_price) if deed_price else ''
        sale_table.cell(1, 2).text = (deed_type or '')[:30]
        sale_table.cell(1, 3).text = (deed_buyer or '')[:25]
        sale_table.cell(1, 4).text = ''

    # MORTGAGE INFORMATION
    add_section_header(doc, 'MORTGAGE INFORMATION')
    mort_table = doc.add_table(rows=6, cols=2)
    mort_table.style = 'Table Grid'
    mort_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (label, value) in enumerate([
        ('Lender', safe(lead.get('lender_name'))),
        ('Original Amount', fmt_currency(lead.get('mortgage_amount', 0))),
        ('Origination Date', 'N/A'), ('Interest Rate', 'N/A'),
        ('Loan Type', ''), ('Maturity Date', 'N/A'),
    ]):
        cell_l = mort_table.cell(i, 0)
        cell_l.text = ''
        p = cell_l.paragraphs[0]
        run = p.add_run(label)
        run.bold = True
        run.font.size = Pt(9)
        cell_v = mort_table.cell(i, 1)
        cell_v.text = ''
        p = cell_v.paragraphs[0]
        run = p.add_run(value)
        run.font.size = Pt(10)

    # SKIP TRACE DETAILS
    add_section_header(doc, 'SKIP TRACE - ADDITIONAL DETAILS')
    mailing = safe(lead.get('mailing_address'))
    skip_table = doc.add_table(rows=7, cols=2)
    skip_table.style = 'Table Grid'
    skip_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (label, value) in enumerate([
        ('Current Address', mailing or address),
        ('Previous Addresses', ''),
        ('Known Relatives', ''),
        ('Employer', 'Unknown'),
        ('Phone Records', f"{phone} (Mobile)" if phone else 'N/A'),
        ('Email Addresses', email or 'N/A'),
        ('Public Records', 'Bankruptcy: No | Liens: No | Judgments: No'),
    ]):
        cell_l = skip_table.cell(i, 0)
        cell_l.text = ''
        p = cell_l.paragraphs[0]
        run = p.add_run(label)
        run.bold = True
        run.font.size = Pt(9)
        cell_v = skip_table.cell(i, 1)
        cell_v.text = ''
        p = cell_v.paragraphs[0]
        run = p.add_run(value)
        run.font.size = Pt(10)

    source_p = doc.add_paragraph()
    source_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    source_p.space_before = Pt(8)
    run = source_p.add_run(f"Source: {safe(lead.get('source'), 'Government List')} - {county} County | APN: {apn}")
    run.font.size = Pt(8)
    run.font.color.rgb = GRAY

    # ── PAGE 2: CALL NOTES ──
    doc.add_page_break()
    conf2 = doc.add_paragraph()
    conf2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = conf2.add_run('CONFIDENTIAL - FOR AUTHORIZED USE ONLY')
    run.font.color.rgb = GREEN
    run.font.size = Pt(10)
    run.bold = True
    title2 = doc.add_paragraph()
    title2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title2.add_run('Call Notes & Contact Log')
    run.bold = True
    run.font.size = Pt(22)
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run(f"{owner} | {address}")
    run.font.size = Pt(10)
    subtitle2 = doc.add_paragraph()
    subtitle2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle2.add_run(f"Case #: {case_num} | Primary: {phone}")
    run.font.size = Pt(10)
    for i in range(1, 6):
        add_call_log_entry(doc, i, phone)

    footer = doc.add_paragraph()
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.space_before = Pt(20)
    pPr = footer._p.get_or_add_pPr()
    pBdr = parse_xml(
        f'<w:pBdr {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="4" w:space="1" w:color="CCCCCC"/>'
        f'</w:pBdr>'
    )
    pPr.append(pBdr)
    run = footer.add_run(f"\nForeclosure Recovery Inc. - Lead Report for {owner} | Generated {today}")
    run.font.size = Pt(8)
    run.font.color.rgb = GRAY

    doc.save(output_path)


def generate_agent_excel(agent_leads, output_path, agent_name):
    """Generate Excel spreadsheet for an agent's leads."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"{agent_name} Leads"

    header_font = Font(bold=True, color='FFFFFF', size=11)
    header_fill = PatternFill(start_color='2E7D32', end_color='2E7D32', fill_type='solid')
    header_align = Alignment(horizontal='center', vertical='center', wrap_text=True)
    thin_border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    headers = [
        'Owner Name', 'Primary Phone', 'Primary Email', 'Property Address',
        'City', 'State', 'ZIP', 'County', 'APN',
        'Surplus Amount', 'Lead Tier', 'Deed Verified',
        'Deed Match Name', 'Deed Date', 'Deed Type',
        'Sale Date', 'Status', 'Mailing Address'
    ]

    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = thin_border

    for row_idx, lead in enumerate(agent_leads, 2):
        deed = lead.get('deed_chain_data') or lead.get('deed_result') or {}
        if isinstance(deed, str):
            try:
                deed = json.loads(deed)
            except:
                deed = {}
        data = [
            safe(lead.get('owner_name')),
            safe(lead.get('primary_phone')),
            safe(lead.get('primary_email')),
            safe(lead.get('property_address')),
            safe(lead.get('city')),
            safe(lead.get('state_abbr')),
            safe(lead.get('zip_code')),
            safe(lead.get('county')),
            safe(lead.get('apn_number') or lead.get('parcel_id')),
            float(lead.get('overage_amount', 0) or 0),
            safe(lead.get('lead_tier')),
            'YES',
            safe(deed.get('matched_name')),
            safe(deed.get('transaction_date')),
            safe(deed.get('transaction_type', ''))[:40],
            safe(lead.get('sale_date', ''))[:10] if lead.get('sale_date') else '',
            safe(lead.get('status')),
            safe(lead.get('mailing_address')),
        ]
        for col, value in enumerate(data, 1):
            cell = ws.cell(row=row_idx, column=col, value=value)
            cell.border = thin_border
            cell.alignment = Alignment(vertical='center', wrap_text=True)
            if col == 10:
                cell.number_format = '$#,##0.00'

    for col in range(1, len(headers) + 1):
        max_len = max(
            len(str(ws.cell(row=r, column=col).value or ''))
            for r in range(1, ws.max_row + 1)
        )
        ws.column_dimensions[openpyxl.utils.get_column_letter(col)].width = min(max_len + 3, 35)

    summary_row = ws.max_row + 2
    ws.cell(row=summary_row, column=1, value='TOTAL').font = Font(bold=True, size=12)
    total_surplus = sum(float(l.get('overage_amount', 0) or 0) for l in agent_leads)
    total_cell = ws.cell(row=summary_row, column=10, value=total_surplus)
    total_cell.font = Font(bold=True, size=12)
    total_cell.number_format = '$#,##0.00'
    ws.freeze_panes = 'A2'
    wb.save(output_path)


def main():
    parser = argparse.ArgumentParser(description='Daily Agent Lead Package Generator')
    parser.add_argument('--volume', type=int, help='Force volume number')
    parser.add_argument('--agents', type=int, default=4, help='Number of agents')
    parser.add_argument('--per-agent', type=int, default=25, help='Leads per agent')
    parser.add_argument('--dry-run', action='store_true', help='Preview without generating')
    parser.add_argument('--no-track', action='store_true', help='Skip duplicate tracking')
    args = parser.parse_args()

    today_str = datetime.now().strftime('%Y-%m-%d')
    total_needed = args.agents * args.per_agent
    volume = args.volume or get_next_volume(today_str)

    print(f"\n{'='*60}")
    print(f"  USFR Daily Agent Package Generator")
    print(f"{'='*60}")
    print(f"  Date: {today_str}")
    print(f"  Volume: {volume}")
    print(f"  Agents: {args.agents}")
    print(f"  Per agent: {args.per_agent}")
    print(f"  Total needed: {total_needed}")

    # Load tracking
    assigned_ids = load_assigned_ids() if not args.no_track else set()
    print(f"  Previously assigned: {len(assigned_ids)} leads")

    # Fetch available leads
    print(f"\n  Fetching deed-verified, DNC-cleared, $1500+ leads...")
    leads = fetch_available_leads(limit=total_needed + 50, exclude_ids=assigned_ids)
    print(f"  Available: {len(leads)} leads")

    if len(leads) < total_needed:
        print(f"\n  WARNING: Only {len(leads)} leads available, need {total_needed}")
        print(f"  Run pipeline: scrape -> skip trace -> DNC -> PropMix deed verify")
        if not leads:
            print(f"  No leads available. Exiting.")
            sys.exit(1)

    # Take only what we need
    leads = leads[:total_needed]
    leads.sort(key=lambda x: float(x.get('overage_amount', 0) or 0), reverse=True)

    # Split across agents
    agent_names = [f"Agent_{chr(65 + i)}" for i in range(args.agents)]
    agents = {name: [] for name in agent_names}
    for i, lead in enumerate(leads):
        agent = agent_names[i % args.agents]
        agents[agent].append(lead)

    print(f"\n  Agent Allocation:")
    for name, agent_leads in agents.items():
        total = sum(float(l.get('overage_amount', 0) or 0) for l in agent_leads)
        print(f"    {name}: {len(agent_leads)} leads, ${total:,.0f} surplus")

    if args.dry_run:
        print(f"\n  DRY RUN - no files generated")
        return

    # Create output directory
    folder_name = f"{today_str} Volume {volume}"
    output_dir = os.path.join(DESKTOP, folder_name)
    os.makedirs(output_dir, exist_ok=True)

    # Generate per-agent packages
    for agent_name, agent_leads in agents.items():
        if not agent_leads:
            continue

        agent_dir = os.path.join(output_dir, agent_name)
        os.makedirs(agent_dir, exist_ok=True)

        # Excel
        excel_path = os.path.join(agent_dir, f'USFR-{agent_name}-Leads.xlsx')
        generate_agent_excel(agent_leads, excel_path, agent_name)
        print(f"\n  {agent_name}: Excel -> {os.path.basename(excel_path)}")

        # Word docs
        for lead in agent_leads:
            owner = safe(lead.get('owner_name'), 'Unknown')
            safe_name = ''.join(c if c.isalnum() or c in (' ', '-') else '' for c in owner).strip().replace(' ', '-')
            doc_path = os.path.join(agent_dir, f'Lead-Report-{safe_name}.docx')
            generate_lead_report(lead, doc_path)
            surplus = float(lead.get('overage_amount', 0) or 0)
            print(f"    {safe_name} (${surplus:,.0f})")

    # Update tracking
    new_ids = {l['id'] for l in leads}
    assigned_ids.update(new_ids)
    if not args.no_track:
        save_assigned_ids(assigned_ids)

    # Mark leads as contacted in DB
    for lead in leads:
        lead_id = lead['id']
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/foreclosure_leads?id=eq.{lead_id}",
            headers=HEADERS,
            json={"status": "contacted"},
            timeout=10,
        )

    print(f"\n{'='*60}")
    print(f"  COMPLETE: {len(leads)} leads in '{folder_name}'")
    print(f"  Location: {output_dir}")
    print(f"  Leads marked as 'contacted' in database")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
