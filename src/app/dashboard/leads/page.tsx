"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Ruler,
  BedDouble,
  Bath,
  Car,
  TreePine,
  Building,
  FileText,
  UserSearch,
  Users,
  Globe,
  Clock,
  Hash,
  Landmark,
  Receipt,
  Scale,
  Gavel,
  Database,
  Eye,
  EyeOff,
  ShieldAlert,
  TrendingUp,
  Printer,
  Lock,
  CreditCard,
  CheckCircle2,
  XCircle,
  Volume2,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { usePin } from "@/lib/pin-context"
import { supabase } from "@/lib/supabase"
import { RecoveryCountdown } from "@/components/recovery-countdown"

interface LeadData {
  id: string
  ownerName: string
  propertyAddress: string
  city: string
  state: string
  stateAbbr: string
  zipCode: string
  county: string
  parcelId: string
  saleDate: string
  saleAmount: number
  mortgageAmount: number
  lenderName: string
  foreclosureType: string
  primaryPhone: string
  secondaryPhone: string | null
  primaryEmail: string | null
  secondaryEmail: string | null
  status: string
  source: string
  scrapedAt: string
  lat: number
  lng: number
  propertyImageUrl?: string | null
  dncChecked: boolean
  onDnc: boolean
  canContact: boolean
  dncType: string | null
  voicemailSent: boolean
  voicemailSentAt: string | null
  voicemailError: string | null
  skipTrace: {
    fullName: string
    aliases: string[]
    age: number
    dob: string
    ssn_last4: string
    currentAddress: string
    previousAddresses: string[]
    phones: { number: string; type: string; carrier: string }[]
    emails: string[]
    relatives: string[]
    employer: string | null
    bankruptcyFlag: boolean
    liensFlag: boolean
    judgmentsFlag: boolean
  }
  property: {
    propertyType: string
    yearBuilt: number
    sqft: number
    lotSize: string
    bedrooms: number
    bathrooms: number
    stories: number
    garage: string
    pool: boolean
    roofType: string
    hvac: string
    foundation: string
    construction: string
    zoning: string
    subdivision: string
    legalDescription: string
  }
  taxData: {
    assessedValue: number
    marketValue: number
    taxYear: number
    annualTaxes: number
    taxStatus: string
    exemptions: string[]
    lastTaxPayment: string
    taxDelinquent: boolean
    delinquentAmount: number
  }
  saleHistory: {
    date: string
    price: number
    type: string
    buyer: string
    seller: string
  }[]
  mortgageInfo: {
    lender: string
    originalAmount: number
    originationDate: string
    interestRate: number
    loanType: string
    maturityDate: string
    secondMortgage: boolean
    secondAmount: number | null
  }
  foreclosureDetails: {
    filingDate: string
    caseNumber: string
    courtName: string
    trustee: string
    auctionDate: string
    auctionLocation: string
    openingBid: number
    estimatedSurplus: number
    defaultAmount: number
    noticeType: string
  }
}

const LEADS_PER_PAGE = 20

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-muted/50 rounded-lg" />
      <div className="h-32 bg-muted/50 rounded-lg" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-32 bg-muted/50 rounded-lg" />
      ))}
    </div>
  )
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "vd_ready", label: "VD Ready" },
  { value: "skip_traced", label: "Skip Traced" },
  { value: "new", label: "New" },
  { value: "skip_trace_failed", label: "Skip Trace Failed" },
  { value: "dnc_blocked", label: "DNC Blocked" },
  { value: "contacted", label: "Contacted" },
  { value: "callback", label: "Callback" },
  { value: "converted", label: "Converted" },
  { value: "dead", label: "Dead" },
]

const sortOptions = [
  { value: "vd_ready_fee", label: "VD Ready + Highest Fee" },
  { value: "fee_high", label: "Highest Fee" },
  { value: "fee_low", label: "Lowest Fee" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "surplus_high", label: "Highest Surplus" },
  { value: "surplus_low", label: "Lowest Surplus" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "sale_date_asc", label: "Sale Date (Oldest)" },
  { value: "sale_date_desc", label: "Sale Date (Newest)" },
]

function BlurredText({ children, className = "", revealed = false }: { children: React.ReactNode; className?: string; revealed?: boolean }) {
  if (revealed) {
    return <span className={className}>{children}</span>
  }
  return (
    <span className={cn("select-none", className)} style={{ filter: "blur(5px)", WebkitFilter: "blur(5px)" }}>
      {children}
    </span>
  )
}

function DncStatusIcon({ lead }: { lead: LeadData }) {
  if (!lead.primaryPhone) return null
  if (!lead.dncChecked) {
    return (
      <span title="DNC check pending" className="flex items-center">
        <Clock className="h-3.5 w-3.5 text-yellow-500" />
      </span>
    )
  }
  if (lead.onDnc) {
    return (
      <span title="On Do Not Call list" className="flex items-center">
        <XCircle className="h-3.5 w-3.5 text-red-500" />
      </span>
    )
  }
  return (
    <span title="DNC cleared - OK to contact" className="flex items-center">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    </span>
  )
}

function VoiceDropButton({ lead, sending, onSend }: { lead: LeadData; sending: boolean; onSend: (id: string) => void }) {
  if (!lead.primaryPhone) return null

  if (lead.voicemailSent) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Sent
      </Badge>
    )
  }

  if (lead.voicemailError) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1" title={lead.voicemailError}>
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    )
  }

  const canSend = lead.canContact && !lead.onDnc && lead.dncChecked

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (canSend && !sending) onSend(lead.id) }}
      disabled={!canSend || sending}
      title={!lead.dncChecked ? "DNC check pending" : lead.onDnc ? "On DNC list" : "Send voice drop"}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
        canSend && !sending
          ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
      )}
    >
      {sending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      {sending ? "Sending..." : "Voice Drop"}
    </button>
  )
}

function DataRow({ label, value, icon: Icon, blurred = false, revealed = false }: { label: string; value: string | number; icon?: React.ElementType; blurred?: boolean; revealed?: boolean }) {
  return (
    <div className="flex justify-between items-start py-1.5 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      {blurred && !revealed ? (
        <BlurredText className="font-medium text-right max-w-[60%]">{value}</BlurredText>
      ) : (
        <span className="font-medium text-right max-w-[60%]">{value}</span>
      )}
    </div>
  )
}


function FlagBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <Badge className={active ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}>
      {label}: {active ? "Yes" : "No"}
    </Badge>
  )
}

function printLead(lead: LeadData) {
  const surplus = lead.foreclosureDetails.estimatedSurplus
  const serviceFee = surplus * 0.25
  const closerFee = serviceFee * 0.10
  const adminFee = serviceFee * 0.05
  const netRevenue = serviceFee - closerFee - adminFee
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const html = `<!DOCTYPE html>
<html><head><title>Lead Report - ${lead.ownerName}</title>
<style>
@page { size: letter; margin: 0.75in; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.5; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
.header h1 { font-size: 20pt; color: #059669; font-weight: 700; }
.header .meta { text-align: right; font-size: 9pt; color: #6b7280; }
.section { margin-bottom: 16px; }
.section-title { font-size: 12pt; font-weight: 700; color: #059669; border-bottom: 1.5px solid #d1d5db; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
table { width: 100%; border-collapse: collapse; font-size: 10pt; }
table td { padding: 4px 8px; vertical-align: top; }
table td:first-child { font-weight: 600; color: #374151; width: 180px; }
table td:nth-child(2) { color: #1a1a1a; }
.two-col { display: flex; gap: 24px; }
.two-col > div { flex: 1; }
.highlight-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; margin: 12px 0; }
.highlight-box h3 { color: #059669; font-size: 11pt; margin-bottom: 6px; }
.highlight-box table td:first-child { width: 160px; }
.financial-row { font-size: 13pt; font-weight: 700; color: #059669; }
.sale-table { width: 100%; border: 1px solid #d1d5db; }
.sale-table th { background: #f3f4f6; padding: 6px 8px; text-align: left; font-size: 9pt; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #d1d5db; }
.sale-table td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
.notes-header { text-align: center; margin-bottom: 24px; }
.notes-header h1 { font-size: 18pt; color: #059669; }
.notes-header p { font-size: 10pt; color: #6b7280; }
.call-entry { border: 1px solid #d1d5db; border-radius: 6px; padding: 16px; margin-bottom: 16px; min-height: 140px; }
.call-entry .call-header { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
.call-entry .call-header span { font-size: 9pt; color: #6b7280; }
.call-line { border-bottom: 1px dotted #d1d5db; height: 28px; }
.footer { text-align: center; font-size: 8pt; color: #9ca3af; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
.confidential { text-align: center; font-size: 8pt; color: #ef4444; font-weight: 600; margin-bottom: 8px; letter-spacing: 1px; }
</style></head><body>

<!-- PAGE 1: Lead Report -->
<div class="page">
<div class="confidential">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</div>
<div class="header">
  <h1>Lead Report</h1>
  <div class="meta">
    <div>Report Generated: ${today}</div>
    <div>Case #: ${lead.foreclosureDetails.caseNumber}</div>
    <div>APN: ${lead.parcelId}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Property Owner</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Full Name</td><td>${lead.skipTrace.fullName}</td></tr>
        <tr><td>Also Known As</td><td>${lead.skipTrace.aliases.join(", ")}</td></tr>
        <tr><td>Age / DOB</td><td>${lead.skipTrace.age} / ${lead.skipTrace.dob}</td></tr>
        <tr><td>SSN (Last 4)</td><td>***-**-${lead.skipTrace.ssn_last4}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Primary Phone</td><td>${lead.primaryPhone || "N/A"}</td></tr>
        <tr><td>Secondary Phone</td><td>${lead.secondaryPhone || "N/A"}</td></tr>
        <tr><td>Primary Email</td><td>${lead.primaryEmail || "N/A"}</td></tr>
        <tr><td>Secondary Email</td><td>${lead.secondaryEmail || "N/A"}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Property Details</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Address</td><td>${lead.propertyAddress}</td></tr>
        <tr><td>City / State / ZIP</td><td>${lead.city}, ${lead.stateAbbr} ${lead.zipCode}</td></tr>
        <tr><td>County</td><td>${lead.county}</td></tr>
        <tr><td>Property Type</td><td>${lead.property.propertyType}</td></tr>
        <tr><td>Year Built</td><td>${lead.property.yearBuilt}</td></tr>
        <tr><td>Square Footage</td><td>${lead.property.sqft.toLocaleString()} sq ft</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Bedrooms / Baths</td><td>${lead.property.bedrooms} BD / ${lead.property.bathrooms} BA</td></tr>
        <tr><td>Lot Size</td><td>${lead.property.lotSize}</td></tr>
        <tr><td>Stories</td><td>${lead.property.stories}</td></tr>
        <tr><td>Garage</td><td>${lead.property.garage}</td></tr>
        <tr><td>Construction</td><td>${lead.property.construction}</td></tr>
        <tr><td>Zoning</td><td>${lead.property.zoning}</td></tr>
      </table>
    </div>
  </div>
  <table style="margin-top:8px">
    <tr><td>Legal Description</td><td style="font-size:9pt">${lead.property.legalDescription}</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">Foreclosure Details</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Filing Date</td><td>${new Date(lead.foreclosureDetails.filingDate).toLocaleDateString()}</td></tr>
        <tr><td>Case Number</td><td>${lead.foreclosureDetails.caseNumber}</td></tr>
        <tr><td>Court</td><td>${lead.foreclosureDetails.courtName}</td></tr>
        <tr><td>Trustee</td><td>${lead.foreclosureDetails.trustee}</td></tr>
        <tr><td>Notice Type</td><td>${lead.foreclosureDetails.noticeType}</td></tr>
        <tr><td>Foreclosure Type</td><td>${lead.foreclosureType}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Auction Date</td><td style="font-weight:700;color:#dc2626">${new Date(lead.foreclosureDetails.auctionDate).toLocaleDateString()}</td></tr>
        <tr><td>Auction Location</td><td>${lead.foreclosureDetails.auctionLocation}</td></tr>
        <tr><td>Opening Bid</td><td>$${lead.foreclosureDetails.openingBid.toLocaleString()}</td></tr>
        <tr><td>Default Amount</td><td>$${lead.foreclosureDetails.defaultAmount.toLocaleString()}</td></tr>
        <tr><td>Lender</td><td>${lead.lenderName}</td></tr>
        <tr><td>Mortgage Amount</td><td>$${lead.mortgageAmount.toLocaleString()}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="highlight-box">
  <h3>Recovery Opportunity Analysis</h3>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Sale Amount</td><td>$${lead.saleAmount.toLocaleString()}</td></tr>
        <tr><td>Estimated Surplus</td><td>$${surplus.toLocaleString()}</td></tr>
        <tr><td>Service Fee (25%)</td><td class="financial-row">$${serviceFee.toLocaleString()}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Closer Fee (10%)</td><td>-$${closerFee.toLocaleString()}</td></tr>
        <tr><td>Admin Fee (5%)</td><td>-$${adminFee.toLocaleString()}</td></tr>
        <tr><td>Net Revenue</td><td class="financial-row">$${netRevenue.toLocaleString()}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Tax Assessment</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Assessed Value</td><td>$${lead.taxData.assessedValue.toLocaleString()}</td></tr>
        <tr><td>Market Value</td><td>$${lead.taxData.marketValue.toLocaleString()}</td></tr>
        <tr><td>Annual Taxes</td><td>$${lead.taxData.annualTaxes.toLocaleString()}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Tax Year</td><td>${lead.taxData.taxYear}</td></tr>
        <tr><td>Tax Status</td><td>${lead.taxData.taxDelinquent ? "DELINQUENT - $" + lead.taxData.delinquentAmount.toLocaleString() : "Current"}</td></tr>
        <tr><td>Exemptions</td><td>${lead.taxData.exemptions.join(", ") || "None"}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Sale History</div>
  <table class="sale-table">
    <thead><tr><th>Date</th><th>Price</th><th>Type</th><th>Buyer</th><th>Seller</th></tr></thead>
    <tbody>
      ${lead.saleHistory.map(s => `<tr><td>${new Date(s.date).toLocaleDateString()}</td><td>$${s.price.toLocaleString()}</td><td>${s.type}</td><td>${s.buyer}</td><td>${s.seller}</td></tr>`).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Mortgage Information</div>
  <table>
    <tr><td>Lender</td><td>${lead.mortgageInfo.lender}</td></tr>
    <tr><td>Original Amount</td><td>$${lead.mortgageInfo.originalAmount.toLocaleString()}</td></tr>
    <tr><td>Origination Date</td><td>${new Date(lead.mortgageInfo.originationDate).toLocaleDateString()}</td></tr>
    <tr><td>Interest Rate</td><td>${lead.mortgageInfo.interestRate}%</td></tr>
    <tr><td>Loan Type</td><td>${lead.mortgageInfo.loanType}</td></tr>
    <tr><td>Maturity Date</td><td>${new Date(lead.mortgageInfo.maturityDate).toLocaleDateString()}</td></tr>
    ${lead.mortgageInfo.secondMortgage ? `<tr><td>Second Mortgage</td><td>$${(lead.mortgageInfo.secondAmount || 0).toLocaleString()}</td></tr>` : ""}
  </table>
</div>

<div class="section">
  <div class="section-title">Skip Trace - Additional Details</div>
  <table>
    <tr><td>Current Address</td><td>${lead.skipTrace.currentAddress}</td></tr>
    <tr><td>Previous Addresses</td><td>${lead.skipTrace.previousAddresses.join("; ")}</td></tr>
    <tr><td>Known Relatives</td><td>${lead.skipTrace.relatives.join(", ")}</td></tr>
    <tr><td>Employer</td><td>${lead.skipTrace.employer || "Unknown"}</td></tr>
    <tr><td>Phone Records</td><td>${lead.skipTrace.phones.map(p => p.number + " (" + p.type + " - " + p.carrier + ")").join("; ")}</td></tr>
    <tr><td>Email Addresses</td><td>${lead.skipTrace.emails.join("; ")}</td></tr>
  </table>
  <table style="margin-top:8px">
    <tr><td>Public Records</td><td>
      Bankruptcy: ${lead.skipTrace.bankruptcyFlag ? "YES" : "No"} |
      Liens: ${lead.skipTrace.liensFlag ? "YES" : "No"} |
      Judgments: ${lead.skipTrace.judgmentsFlag ? "YES" : "No"}
    </td></tr>
  </table>
</div>

<div class="footer">
  Source: ${lead.source} | APN: ${lead.parcelId} | Scraped: ${new Date(lead.scrapedAt).toLocaleDateString()}
</div>
</div>

<!-- PAGE 2: Call Notes -->
<div class="page">
<div class="confidential">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</div>
<div class="notes-header">
  <h1>Call Notes & Contact Log</h1>
  <p>${lead.skipTrace.fullName} | ${lead.propertyAddress}, ${lead.city}, ${lead.stateAbbr} ${lead.zipCode}</p>
  <p>Case #: ${lead.foreclosureDetails.caseNumber} | Primary: ${lead.primaryPhone || "N/A"}</p>
</div>

${[1,2,3,4,5].map(n => `
<div class="call-entry">
  <div class="call-header">
    <span><strong>Call #${n}</strong></span>
    <span>Date: _____________ &nbsp;&nbsp; Time: _____________ &nbsp;&nbsp; Duration: _____________</span>
  </div>
  <table style="margin-bottom:8px">
    <tr><td style="width:120px">Spoke With</td><td style="border-bottom:1px dotted #d1d5db">&#160;</td></tr>
    <tr><td>Phone Used</td><td style="border-bottom:1px dotted #d1d5db">&#160;</td></tr>
    <tr><td>Outcome</td><td style="border-bottom:1px dotted #d1d5db">&#160;</td></tr>
  </table>
  <div style="font-size:9pt;font-weight:600;color:#6b7280;margin-bottom:4px">Notes:</div>
  <div class="call-line"></div>
  <div class="call-line"></div>
  <div class="call-line"></div>
  <div style="margin-top:6px">
    <span style="font-size:9pt;color:#6b7280">Follow-up Required: &#9633; Yes &#9633; No &nbsp;&nbsp;&nbsp; Next Action: _________________________________</span>
  </div>
</div>
`).join("")}

<div class="footer">
  US Foreclosure Leads - Lead Report for ${lead.skipTrace.fullName} | Generated ${today}
</div>
</div>

</body></html>`

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }
}

function LeadDropdown({ lead, revealed, onReveal }: { lead: LeadData; revealed: boolean; onReveal: () => void }) {
  const [activeTab, setActiveTab] = useState<"property" | "skipTrace" | "tax" | "foreclosure" | "map">("property")

  const tabs = [
    { id: "property" as const, label: "Property Details", icon: Home },
    { id: "foreclosure" as const, label: "Foreclosure", icon: Gavel },
    { id: "skipTrace" as const, label: "Skip Trace", icon: UserSearch },
    { id: "tax" as const, label: "Tax & Sales", icon: Receipt },
    { id: "map" as const, label: "Map", icon: MapPin },
  ]

  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      {/* Recovery Countdown Timer */}
      <RecoveryCountdown
        saleDate={lead.saleDate || null}
        stateAbbr={lead.stateAbbr}
        scrapedAt={lead.scrapedAt}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}

        {/* Print & Reveal Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => printLead(lead)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700 shadow-sm transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
          <button
            onClick={onReveal}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
              revealed
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            )}
          >
            {revealed ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide Sensitive Data
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Reveal Sensitive Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Property Details Tab */}
      {activeTab === "property" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Location</h4>
            <DataRow label="Address" value={lead.propertyAddress} icon={MapPin} blurred revealed={revealed} />
            <DataRow label="City" value={`${lead.city}, ${lead.stateAbbr} ${lead.zipCode}`} />
            {lead.parcelId && <DataRow label="APN" value={lead.parcelId} icon={Hash} blurred revealed={revealed} />}
            {lead.county && <DataRow label="County" value={lead.county} icon={Globe} />}
            <DataRow label="Type" value={lead.property.propertyType} icon={Building} />
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Building</h4>
            <DataRow label="Year Built" value={lead.property.yearBuilt || "---"} icon={Calendar} />
            <DataRow label="Sq Ft" value={lead.property.sqft > 0 ? lead.property.sqft.toLocaleString() : "---"} icon={Ruler} />
            <DataRow label="Lot Size" value={lead.property.lotSize || "---"} icon={TreePine} />
            <DataRow label="Stories" value={lead.property.stories || "---"} />
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Features</h4>
            <DataRow label="Bedrooms" value={lead.property.bedrooms || "---"} icon={BedDouble} />
            <DataRow label="Bathrooms" value={lead.property.bathrooms || "---"} icon={Bath} />
            <DataRow label="Garage" value={lead.property.garage || "---"} icon={Car} />
            <DataRow label="Pool" value={lead.property.pool ? "Yes" : "---"} />
            <DataRow label="Roof" value={lead.property.roofType || "---"} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Financial Summary</h4>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">${lead.saleAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Sale Amount</p>
              </div>
              {lead.taxData.marketValue > 0 && (
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">${lead.taxData.marketValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Est. Market Value</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600">${lead.foreclosureDetails.estimatedSurplus.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Est. Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-700">${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">25% Service Fee</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip Trace Tab */}
      {activeTab === "skipTrace" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Identity</h4>
            <DataRow label="Full Name" value={lead.skipTrace.fullName} icon={UserSearch} blurred revealed={revealed} />
            <DataRow label="Age" value={lead.skipTrace.age} />
            <DataRow label="DOB" value={new Date(lead.skipTrace.dob).toLocaleDateString()} blurred revealed={revealed} />
            <DataRow label="SSN Last 4" value={`***-**-${lead.skipTrace.ssn_last4}`} blurred revealed={revealed} />
            {lead.skipTrace.aliases.length > 0 && (
              <DataRow label="Aliases" value={lead.skipTrace.aliases.join(", ")} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact Info</h4>
            {lead.skipTrace.phones.map((phone, i) => (
              <DataRow key={i} label={phone.type} value={`${phone.number} (${phone.carrier})`} icon={Phone} blurred revealed={revealed} />
            ))}
            {lead.skipTrace.emails.map((email, i) => (
              <DataRow key={i} label={i === 0 ? "Primary Email" : "Alt Email"} value={email} icon={Mail} blurred revealed={revealed} />
            ))}
            {lead.skipTrace.employer && (
              <DataRow label="Employer" value={lead.skipTrace.employer} icon={Building} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Addresses</h4>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Current:</span>
                <p className="font-medium">
                  <BlurredText revealed={revealed}>
                    {lead.skipTrace.currentAddress}
                    {lead.city && lead.stateAbbr && `, ${lead.city}, ${lead.stateAbbr}`}
                    {lead.zipCode && ` ${lead.zipCode}`}
                  </BlurredText>
                </p>
              </div>
              {lead.skipTrace.previousAddresses.map((addr, i) => (
                <div key={i}>
                  <span className="text-xs text-muted-foreground">Previous {i + 1}:</span>
                  <p><BlurredText revealed={revealed}>{addr}</BlurredText></p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Relatives</h4>
            <div className="space-y-1">
              {lead.skipTrace.relatives.map((rel, i) => (
                <p key={i} className="text-sm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <BlurredText revealed={revealed}>{rel}</BlurredText>
                </p>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Public Records Flags</h4>
            <div className="flex flex-wrap gap-2">
              <FlagBadge label="Bankruptcy" active={lead.skipTrace.bankruptcyFlag} />
              <FlagBadge label="Liens" active={lead.skipTrace.liensFlag} />
              <FlagBadge label="Judgments" active={lead.skipTrace.judgmentsFlag} />
            </div>
          </div>
        </div>
      )}

      {/* Tax & Sales Tab */}
      {activeTab === "tax" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tax Assessment ({lead.taxData.taxYear})</h4>
            <DataRow label="Assessed Value" value={`$${lead.taxData.assessedValue.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Market Value" value={`$${lead.taxData.marketValue.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Annual Taxes" value={`$${lead.taxData.annualTaxes.toLocaleString()}`} icon={Receipt} />
            <DataRow label="Tax Status" value={lead.taxData.taxStatus} />
            <DataRow label="Last Payment" value={new Date(lead.taxData.lastTaxPayment).toLocaleDateString()} icon={Calendar} />
            {lead.taxData.taxDelinquent && (
              <DataRow label="Delinquent Amount" value={`$${lead.taxData.delinquentAmount.toLocaleString()}`} />
            )}
            {lead.taxData.exemptions.length > 0 && (
              <DataRow label="Exemptions" value={lead.taxData.exemptions.join(", ")} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mortgage Info</h4>
            <DataRow label="Lender" value={lead.mortgageInfo.lender} icon={Landmark} />
            <DataRow label="Original Amount" value={`$${lead.mortgageInfo.originalAmount.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Origination" value={new Date(lead.mortgageInfo.originationDate).toLocaleDateString()} icon={Calendar} />
            <DataRow label="Interest Rate" value={`${lead.mortgageInfo.interestRate}%`} />
            <DataRow label="Loan Type" value={lead.mortgageInfo.loanType} />
            <DataRow label="Maturity" value={new Date(lead.mortgageInfo.maturityDate).toLocaleDateString()} />
            {lead.mortgageInfo.secondMortgage && (
              <DataRow label="2nd Mortgage" value={`$${(lead.mortgageInfo.secondAmount || 0).toLocaleString()}`} />
            )}
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sale History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Price</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Buyer</th>
                    <th className="text-left py-2 font-medium">Seller</th>
                  </tr>
                </thead>
                <tbody>
                  {lead.saleHistory.map((sale, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="py-2 font-medium">${sale.price.toLocaleString()}</td>
                      <td className="py-2">{sale.type}</td>
                      <td className="py-2">{sale.buyer}</td>
                      <td className="py-2">{sale.seller}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Foreclosure Tab */}
      {activeTab === "foreclosure" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Filing Details</h4>
            <DataRow label="Case Number" value={lead.foreclosureDetails.caseNumber} icon={FileText} blurred revealed={revealed} />
            <DataRow label="Filing Date" value={new Date(lead.foreclosureDetails.filingDate).toLocaleDateString()} icon={Calendar} />
            <DataRow label="Notice Type" value={lead.foreclosureDetails.noticeType} icon={Gavel} />
            <DataRow label="Court" value={lead.foreclosureDetails.courtName} icon={Scale} />
            <DataRow label="Trustee" value={lead.foreclosureDetails.trustee} />
            <DataRow label="Foreclosure Type" value={lead.foreclosureType} />
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auction & Financials</h4>
            <DataRow label="Auction Date" value={new Date(lead.foreclosureDetails.auctionDate).toLocaleDateString()} icon={Calendar} />
            <DataRow label="Auction Location" value={lead.foreclosureDetails.auctionLocation} icon={MapPin} />
            <DataRow label="Opening Bid" value={`$${lead.foreclosureDetails.openingBid.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Default Amount" value={`$${lead.foreclosureDetails.defaultAmount.toLocaleString()}`} icon={DollarSign} />
            <div className="pt-2 mt-2 border-t">
              <DataRow
                label="Estimated Surplus"
                value={`$${lead.foreclosureDetails.estimatedSurplus.toLocaleString()}`}
                icon={DollarSign}
              />
            </div>
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Recovery Opportunity</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${lead.foreclosureDetails.estimatedSurplus.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Estimated Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">25% Service Fee</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${(lead.foreclosureDetails.estimatedSurplus * 0.25 * 0.85).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Net (After Closer + Admin)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === "map" && (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border" style={{ height: 400 }}>
            <iframe
              title={`Map - ${lead.propertyAddress}`}
              src={
                lead.lat && lead.lng
                  ? `https://maps.google.com/maps?q=${lead.lat},${lead.lng}&z=17&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(`${lead.propertyAddress}, ${lead.city}, ${lead.stateAbbr} ${lead.zipCode}`)}&z=17&output=embed`
              }
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span><BlurredText revealed={revealed}>{lead.propertyAddress}, {lead.city}, {lead.stateAbbr} {lead.zipCode}</BlurredText></span>
            </div>
            {lead.parcelId && (
              <div className="flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>APN: <BlurredText revealed={revealed}>{lead.parcelId}</BlurredText></span>
              </div>
            )}
            {lead.county && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{lead.county} County</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span>Source: {lead.source}</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          <span>Source: {lead.source}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Scraped: {new Date(lead.scrapedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5" />
          <span>APN: {lead.parcelId}</span>
        </div>
      </div>
    </div>
  )
}

// Map a Supabase DB row to the LeadData interface
function mapDbRowToLead(row: Record<string, unknown>): LeadData {
  const saleAmount = Number(row.sale_amount) || 0
  const mortgageAmount = Number(row.mortgage_amount) || 0
  const marketValue = Number(row.estimated_market_value) || 0
  const dbOverage = Number(row.overage_amount) || 0

  // Use DB-calculated overage if available, otherwise calculate
  let estimatedSurplus = dbOverage
  if (!estimatedSurplus && saleAmount > 0) {
    if (mortgageAmount > 0 && saleAmount > mortgageAmount) {
      estimatedSurplus = saleAmount - mortgageAmount
    } else if (marketValue > 0 && saleAmount > marketValue * 0.8) {
      estimatedSurplus = Math.round(saleAmount - marketValue * 0.8)
    }
  }

  // Use apn_number as primary, parcel_id as fallback
  const apn = String(row.apn_number || row.parcel_id || "")

  return {
    id: String(row.id || ""),
    ownerName: String(row.owner_name || "Unknown Owner"),
    propertyAddress: String(row.property_address || row.mailing_address || ""),
    city: String(row.city || ""),
    state: String(row.state || row.state_abbr || ""),
    stateAbbr: String(row.state_abbr || row.state || ""),
    zipCode: String(row.zip_code || ""),
    county: String(row.county || ""),
    parcelId: apn,
    saleDate: String(row.sale_date || ""),
    saleAmount,
    mortgageAmount,
    lenderName: String(row.lender_name || ""),
    foreclosureType: String(row.foreclosure_type || "foreclosure"),
    primaryPhone: String(row.primary_phone || ""),
    secondaryPhone: row.secondary_phone ? String(row.secondary_phone) : null,
    primaryEmail: row.primary_email ? String(row.primary_email) : null,
    secondaryEmail: null,
    status: String(row.status || "new"),
    source: String(row.source || ""),
    scrapedAt: String(row.scraped_at || new Date().toISOString()),
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    propertyImageUrl: row.property_image_url ? String(row.property_image_url) : null,
    dncChecked: Boolean(row.dnc_checked),
    onDnc: Boolean(row.on_dnc),
    canContact: Boolean(row.can_contact),
    dncType: row.dnc_type ? String(row.dnc_type) : null,
    voicemailSent: Boolean(row.voicemail_sent),
    voicemailSentAt: row.voicemail_sent_at ? String(row.voicemail_sent_at) : null,
    voicemailError: row.voicemail_error ? String(row.voicemail_error) : null,
    skipTrace: {
      fullName: String(row.owner_name || ""),
      aliases: [],
      age: 0,
      dob: "",
      ssn_last4: "",
      currentAddress: String(row.mailing_address || row.property_address || ""),
      previousAddresses: [],
      phones: row.primary_phone ? [{ number: String(row.primary_phone), type: "Mobile", carrier: "" }] : [],
      emails: row.primary_email ? [String(row.primary_email)] : [],
      relatives: (row.associated_names as string[]) || [],
      employer: null,
      bankruptcyFlag: false,
      liensFlag: false,
      judgmentsFlag: false,
    },
    property: {
      propertyType: String(row.property_type || "Single Family Residence"),
      yearBuilt: Number(row.year_built) || 0,
      sqft: Number(row.square_footage) || 0,
      lotSize: String(row.lot_size || ""),
      bedrooms: Number(row.bedrooms) || 0,
      bathrooms: Number(row.bathrooms) || 0,
      stories: Number(row.stories) || 0,
      garage: "",
      pool: false,
      roofType: "",
      hvac: "",
      foundation: "",
      construction: "",
      zoning: "",
      subdivision: "",
      legalDescription: "",
    },
    taxData: {
      assessedValue: Number(row.assessed_value) || 0,
      marketValue,
      taxYear: 2025,
      annualTaxes: Number(row.tax_amount) || 0,
      taxStatus: "Unknown",
      exemptions: [],
      lastTaxPayment: "",
      taxDelinquent: false,
      delinquentAmount: 0,
    },
    saleHistory: [],
    mortgageInfo: {
      lender: String(row.lender_name || ""),
      originalAmount: mortgageAmount,
      originationDate: "",
      interestRate: 0,
      loanType: "",
      maturityDate: "",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "",
      caseNumber: String(row.case_number || ""),
      courtName: "",
      trustee: String(row.trustee_name || ""),
      auctionDate: String(row.sale_date || ""),
      auctionLocation: "",
      openingBid: saleAmount,
      estimatedSurplus,
      defaultAmount: 0,
      noticeType: "",
    },
  }
}

function LeadsPageContent() {
  const searchParams = useSearchParams()
  const stateParam = searchParams.get("state")
  const statusParam = searchParams.get("status")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState(stateParam || "All States")
  const [selectedStatus, setSelectedStatus] = useState(statusParam || "all")
  const [sortBy, setSortBy] = useState("fee_high")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [expandedLeads, setExpandedLeads] = useState<string[]>([])
  const [hiddenLeads, setHiddenLeads] = useState<string[]>([])
  const [dbLeads, setDbLeads] = useState<LeadData[]>([])
  const [dbStates, setDbStates] = useState<string[]>(["All States"])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [mapModal, setMapModal] = useState<{lat: number, lng: number, address: string, propertyType: string} | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { isVerified, statesAccess, isAdmin, isLoading } = usePin()
  const [sendingVoiceDrop, setSendingVoiceDrop] = useState<Record<string, boolean>>({})
  const [testVdOpen, setTestVdOpen] = useState(false)
  const [testVdPhone, setTestVdPhone] = useState("")
  const [testVdName, setTestVdName] = useState("")
  const [testVdSending, setTestVdSending] = useState(false)
  const [testVdResult, setTestVdResult] = useState<{ success?: boolean; error?: string; script?: string } | null>(null)

  const sendTestVoiceDrop = useCallback(async () => {
    if (!testVdPhone || testVdSending) return
    setTestVdSending(true)
    setTestVdResult(null)
    try {
      const res = await fetch("/api/voice-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPhone: testVdPhone, testName: testVdName || "John Smith" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTestVdResult({ success: false, error: data.error || "Test failed" })
      } else {
        setTestVdResult({ success: true, script: data.script })
      }
    } catch (err) {
      setTestVdResult({ success: false, error: err instanceof Error ? err.message : "Test failed" })
    } finally {
      setTestVdSending(false)
    }
  }, [testVdPhone, testVdName, testVdSending])

  // Skip Trace state
  const [skipTraceOpen, setSkipTraceOpen] = useState(false)
  const [skipTraceLoading, setSkipTraceLoading] = useState(false)
  const [skipTraceResult, setSkipTraceResult] = useState<{
    step: "idle" | "submitting" | "polling" | "importing" | "done" | "error"
    message: string
    queueId?: string
    analytics?: { balance: number; properties_traced: number }
    importResult?: { updated: number; skipped: number; totalResults: number }
  }>({ step: "idle", message: "" })
  const [skipTraceBatchSize, setSkipTraceBatchSize] = useState("100")
  const [skipTracePriority, setSkipTracePriority] = useState("best_data")

  const loadSkipTraceAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/skip-trace?action=analytics")
      if (res.ok) {
        const data = await res.json()
        setSkipTraceResult(prev => ({ ...prev, analytics: data }))
      }
    } catch { /* ignore */ }
  }, [])

  const submitSkipTrace = useCallback(async () => {
    setSkipTraceLoading(true)
    setSkipTraceResult({ step: "submitting", message: "Submitting leads to Tracerfy..." })
    try {
      const res = await fetch("/api/skip-trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchSize: parseInt(skipTraceBatchSize),
          priority: skipTracePriority,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Submit failed")

      const queueId = data.queueId
      setSkipTraceResult({
        step: "polling",
        message: `Submitted ${data.leadsSubmitted} leads. Queue ID: ${queueId}. Waiting for results...`,
        queueId: String(queueId),
      })

      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 5 minutes max
      const poll = async () => {
        attempts++
        try {
          const statusRes = await fetch(`/api/skip-trace?action=status&queueId=${queueId}`)
          const statusData = await statusRes.json()

          const isPending = statusData.pending === true ||
            (Array.isArray(statusData) && statusData.length === 0)

          if (isPending && attempts < maxAttempts) {
            setSkipTraceResult(prev => ({
              ...prev,
              step: "polling",
              message: `Processing... (check ${attempts}/${maxAttempts}). Tracerfy is tracing ${data.leadsSubmitted} leads.`,
            }))
            setTimeout(poll, 5000)
            return
          }

          // Results ready - import them
          setSkipTraceResult(prev => ({ ...prev, step: "importing", message: "Results ready. Importing into database..." }))
          const importRes = await fetch(`/api/skip-trace?action=import&queueId=${queueId}`)
          const importData = await importRes.json()

          if (importData.success) {
            setSkipTraceResult({
              step: "done",
              message: `Import complete! ${importData.updated} leads updated, ${importData.skipped} skipped.`,
              queueId: String(queueId),
              importResult: importData,
            })
            // Refresh leads
            window.location.reload()
          } else {
            setSkipTraceResult({
              step: "error",
              message: importData.error || "Import failed",
              queueId: String(queueId),
            })
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000)
          } else {
            setSkipTraceResult({
              step: "error",
              message: `Polling timed out after ${maxAttempts} attempts. Queue ID: ${queueId} - check Tracerfy dashboard.`,
              queueId: String(queueId),
            })
          }
        }
      }

      setTimeout(poll, 10000) // First check after 10 seconds
    } catch (err) {
      setSkipTraceResult({
        step: "error",
        message: err instanceof Error ? err.message : "Skip trace failed",
      })
    } finally {
      setSkipTraceLoading(false)
    }
  }, [skipTraceBatchSize, skipTracePriority])

  const sendVoiceDrop = useCallback(async (leadId: string) => {
    setSendingVoiceDrop(prev => ({ ...prev, [leadId]: true }))
    try {
      const res = await fetch("/api/voice-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Voice drop failed")
      setDbLeads(prev => prev.map(l =>
        l.id === leadId
          ? { ...l, voicemailSent: true, voicemailSentAt: new Date().toISOString() }
          : l
      ))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Voice drop failed"
      setDbLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, voicemailError: msg } : l
      ))
    } finally {
      setSendingVoiceDrop(prev => ({ ...prev, [leadId]: false }))
    }
  }, [])

  // Generate satellite image URL from Esri World Imagery (free, no API key)
  const getSatelliteUrl = (lat: number, lng: number, zoom: number = 18) => {
    if (!lat || !lng || lat === 0 || lng === 0) return null
    const n = Math.pow(2, zoom)
    const x = Math.floor((lng + 180) / 360 * n)
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n)
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`
  }

  // Sync URL state param with dropdown
  useEffect(() => {
    if (stateParam && stateParam !== selectedState) {
      setSelectedState(stateParam)
    }
  }, [stateParam])

  // Sync URL status param with dropdown
  useEffect(() => {
    if (statusParam && statusParam !== selectedStatus) {
      setSelectedStatus(statusParam)
    }
  }, [statusParam])

  // Fetch leads from Supabase
  useEffect(() => {
    async function fetchLeads() {
      setLeadsLoading(true)
      setLoadError(null)

      try {
        const { data, error } = await supabase
          .from("foreclosure_leads")
          .select("id,owner_name,property_address,city,state,state_abbr,zip_code,county,parcel_id,apn_number,sale_date,sale_amount,mortgage_amount,lender_name,foreclosure_type,primary_phone,secondary_phone,primary_email,status,source,scraped_at,lat,lng,property_image_url,mailing_address,associated_names,property_type,year_built,square_footage,lot_size,bedrooms,bathrooms,stories,assessed_value,estimated_market_value,overage_amount,case_number,trustee_name,created_at,dnc_checked,on_dnc,can_contact,dnc_type,voicemail_sent,voicemail_sent_at,voicemail_error")
          .order("primary_phone", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(5000) as { data: Record<string, unknown>[] | null; error: unknown }

        if (error) {
          throw new Error('Failed to load leads from database')
        }

        if (!data) {
          throw new Error('No data returned from database')
        }

        // Single pass: map rows and build state set simultaneously
        const mapped: LeadData[] = []
        const stateSet = new Set<string>()
        for (const row of data) {
          const lead = mapDbRowToLead(row)
          mapped.push(lead)
          if (lead.state) stateSet.add(lead.state)
        }
        setDbLeads(mapped)
        setDbStates(["All States", ...Array.from(stateSet).sort()])
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Error fetching leads:', err)
        setLoadError(err instanceof Error ? err.message : 'Failed to load leads')
        setDbLeads([])
      } finally {
        setLeadsLoading(false)
      }
    }
    fetchLeads()
  }, [])

  // Retry function for error state
  const retryFetchLeads = useCallback(() => {
    setLoadError(null)
    window.location.reload()
  }, [])

  const skipTracedCount = useMemo(
    () => dbLeads.filter(l => l.primaryPhone).length,
    [dbLeads]
  )

  // Count leads by status for badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    let vdReady = 0
    dbLeads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1
      if (lead.canContact && lead.dncChecked && !lead.onDnc && lead.primaryPhone) {
        vdReady++
      }
    })
    counts["vd_ready"] = vdReady
    return counts
  }, [dbLeads])

  // Track last data update timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Loading error state
  const [loadError, setLoadError] = useState<string | null>(null)

  const toggleHidden = useCallback((id: string) => {
    setHiddenLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  // Paywall: if not verified, show PIN access prompt
  if (!isLoading && !isVerified && !isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foreclosure Leads</h1>
          <p className="text-muted-foreground">Enter your access PIN to view leads</p>
        </div>

        {/* Blurred preview of leads behind paywall */}
        <div className="relative">
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
            <div className="text-center max-w-md p-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">PIN Access Required</h2>
              <p className="text-muted-foreground mb-4">
                Enter the 8-character PIN sent to your email after purchase to access skip-traced foreclosure leads with property data, contact info, and surplus recovery analysis.
              </p>
              <div className="space-y-3">
                <Link href="https://startmybusinessinc.gumroad.com/l/vzqbhs" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full" size="lg">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase 5-State Access - $495
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Already Have a PIN? Go to Settings
                  </Button>
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                {[
                  "Daily updated leads",
                  "Skip-traced contacts",
                  "Property & tax data",
                  "Surplus calculations",
                  "Google Maps view",
                  "Print-ready reports",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blurred lead cards behind the paywall */}
          <div className="space-y-4 filter blur-sm pointer-events-none select-none" aria-hidden="true">
            {dbLeads.slice(0, 3).map((lead) => (
              <Card key={lead.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">{lead.ownerName}</div>
                      <div className="text-sm text-muted-foreground">{lead.county ? `${lead.county} County, ` : ""}{lead.stateAbbr}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{lead.saleAmount > 0 ? `$${lead.saleAmount.toLocaleString()}` : lead.stateAbbr}</div>
                      {lead.foreclosureDetails.estimatedSurplus > 0 && (
                        <div className="text-xs text-emerald-600">${lead.foreclosureDetails.estimatedSurplus.toLocaleString()} surplus</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statusColors = {
    new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    skip_traced: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    skip_trace_failed: "bg-red-500/10 text-red-600 dark:text-red-400",
    dnc_blocked: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    contacted: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    callback: "bg-green-500/10 text-green-600 dark:text-green-400",
    converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dead: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  } as const

  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const filtered = dbLeads.filter((lead) => {
      const matchesSearch =
        query === "" ||
        lead.ownerName.toLowerCase().includes(query) ||
        lead.propertyAddress.toLowerCase().includes(query) ||
        lead.city.toLowerCase().includes(query) ||
        lead.county.toLowerCase().includes(query) ||
        lead.parcelId.toLowerCase().includes(query)

      const matchesState =
        selectedState === "All States" || lead.state === selectedState

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "vd_ready"
          ? (lead.canContact && lead.dncChecked && !lead.onDnc && !!lead.primaryPhone)
          : lead.status === selectedStatus)

      return matchesSearch && matchesState && matchesStatus
    })

    // Sort the filtered leads
    return filtered.sort((a, b) => {
      const feeA = a.foreclosureDetails.estimatedSurplus * 0.25
      const feeB = b.foreclosureDetails.estimatedSurplus * 0.25
      const surplusA = a.foreclosureDetails.estimatedSurplus
      const surplusB = b.foreclosureDetails.estimatedSurplus
      const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0
      const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0
      const createdA = a.scrapedAt ? new Date(a.scrapedAt).getTime() : 0
      const createdB = b.scrapedAt ? new Date(b.scrapedAt).getTime() : 0

      switch (sortBy) {
        case "vd_ready_fee": {
          const aReady = (a.canContact && a.dncChecked && !a.onDnc && !!a.primaryPhone) ? 1 : 0
          const bReady = (b.canContact && b.dncChecked && !b.onDnc && !!b.primaryPhone) ? 1 : 0
          if (bReady !== aReady) return bReady - aReady
          return feeB - feeA
        }
        case "fee_high":
          return feeB - feeA
        case "fee_low":
          return feeA - feeB
        case "surplus_high":
          return surplusB - surplusA
        case "surplus_low":
          return surplusA - surplusB
        case "expiring_soon":
          // Leads with sale dates closer to now (expiring soon) first
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return dateA - dateB
        case "sale_date_asc":
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return dateA - dateB
        case "sale_date_desc":
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return dateB - dateA
        case "oldest":
          return createdA - createdB
        case "newest":
        default:
          return createdB - createdA
      }
    })
  }, [dbLeads, searchQuery, selectedState, selectedStatus, sortBy])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedState, selectedStatus])

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PER_PAGE))
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE
    return filteredLeads.slice(start, start + LEADS_PER_PAGE)
  }, [filteredLeads, currentPage])

  const toggleLeadSelection = useCallback((id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const toggleAllLeads = useCallback(() => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(paginatedLeads.map((l) => l.id))
    }
  }, [selectedLeads.length, paginatedLeads])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  // Export filtered leads to CSV
  const exportToCSV = useCallback(() => {
    const leadsToExport = filteredLeads
    if (leadsToExport.length === 0) {
      alert('No leads to export')
      return
    }

    const headers = [
      'Owner Name',
      'Address',
      'City',
      'State',
      'Zip',
      'Phone',
      'Email',
      'Status',
      'Overage Amount',
      'Sale Date',
      'Sale Amount',
      'County',
      'Parcel ID'
    ]

    const rows = leadsToExport.map(lead => [
      lead.ownerName,
      lead.propertyAddress,
      lead.city,
      lead.stateAbbr,
      lead.zipCode,
      lead.primaryPhone || '',
      lead.primaryEmail || lead.skipTrace?.emails?.[0] || '',
      lead.status,
      `$${lead.foreclosureDetails.estimatedSurplus.toLocaleString()}`,
      lead.saleDate ? new Date(lead.saleDate).toLocaleDateString() : '',
      `$${lead.saleAmount.toLocaleString()}`,
      lead.county,
      lead.parcelId
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell =>
          // Escape commas and quotes in CSV
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `foreclosure-leads-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [filteredLeads])

  const PaginationBar = () => filteredLeads.length > LEADS_PER_PAGE ? (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1}-{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm font-medium px-3">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  ) : null

  // Show loading skeleton
  if (leadsLoading && dbLeads.length === 0) {
    return <LoadingSkeleton />
  }

  // Show error state
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
          <ShieldAlert className="h-8 w-8" style={{ color: '#dc2626' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: '#1E3A5F' }}>Failed to Load Leads</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {loadError}
        </p>
        <Button
          onClick={retryFetchLeads}
          className="mt-4"
          style={{ backgroundColor: '#1E3A5F', color: '#ffffff' }}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foreclosure Leads</h1>
          <p className="text-muted-foreground">
            {leadsLoading ? "Loading leads..." : (
              <>
                {filteredLeads.length} leads found
                {totalPages > 1 && (
                  <span className="ml-1">(page {currentPage}/{totalPages})</span>
                )}
                {skipTracedCount > 0 && (
                  <span className="ml-2 text-emerald-600 font-medium">
                    {skipTracedCount} skip traced
                  </span>
                )}
                <span className="hidden sm:inline"> -- Click any lead to expand</span>
              </>
            )}
          </p>
          {lastUpdated && !leadsLoading && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Last updated: {Math.floor((Date.now() - lastUpdated.getTime()) / 60000)} minutes ago
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredLeads.length === 0}
            style={{
              backgroundColor: filteredLeads.length > 0 ? '#1E3A5F' : undefined,
              color: filteredLeads.length > 0 ? '#ffffff' : undefined,
              borderColor: '#1E3A5F'
            }}
            className="hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV ({filteredLeads.length})
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setTestVdOpen(true)}
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Test Voice Drop
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => { setSkipTraceOpen(true); loadSkipTraceAnalytics() }}
              className="border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              <UserSearch className="h-4 w-4 mr-2" />
              Skip Trace
            </Button>
          )}
        </div>
      </div>

      {/* Skip Trace Modal */}
      {skipTraceOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (skipTraceResult.step === "idle" || skipTraceResult.step === "done" || skipTraceResult.step === "error") setSkipTraceOpen(false) }}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserSearch className="h-5 w-5 text-blue-600" />
                Skip Trace via Tracerfy
              </CardTitle>
              <CardDescription>
                Submit leads without phone numbers to Tracerfy for skip tracing. Returns phone numbers, emails, and mailing addresses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skipTraceResult.analytics && (
                <div className="flex gap-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <div>
                    <span className="text-muted-foreground">Credits:</span>{" "}
                    <span className="font-bold text-blue-700">{skipTraceResult.analytics.balance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Traced:</span>{" "}
                    <span className="font-medium">{skipTraceResult.analytics.properties_traced.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Need trace:</span>{" "}
                    <span className="font-medium">{dbLeads.filter(l => !l.primaryPhone).length.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {(skipTraceResult.step === "idle" || skipTraceResult.step === "error") && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Batch Size</label>
                    <select
                      value={skipTraceBatchSize}
                      onChange={(e) => setSkipTraceBatchSize(e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="10">10 leads (test run)</option>
                      <option value="50">50 leads</option>
                      <option value="100">100 leads</option>
                      <option value="250">250 leads</option>
                      <option value="500">500 leads</option>
                      <option value="1000">1,000 leads (max)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Each lead costs 1 credit ($0.02). {skipTraceBatchSize} leads = {parseInt(skipTraceBatchSize)} credits.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Priority</label>
                    <select
                      value={skipTracePriority}
                      onChange={(e) => setSkipTracePriority(e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="best_data">Best Data First (has address + city)</option>
                      <option value="highest_surplus">Highest Surplus First</option>
                      <option value="newest">Newest Leads First</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      &quot;Best Data First&quot; traces leads with addresses for highest hit rate.
                    </p>
                  </div>
                </>
              )}

              {skipTraceResult.step !== "idle" && (
                <div className={`p-3 rounded-lg text-sm ${
                  skipTraceResult.step === "done" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                  skipTraceResult.step === "error" ? "bg-red-50 text-red-800 border border-red-200" :
                  "bg-blue-50 text-blue-800 border border-blue-200"
                }`}>
                  <div className="flex items-center gap-2">
                    {(skipTraceResult.step === "submitting" || skipTraceResult.step === "polling" || skipTraceResult.step === "importing") && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {skipTraceResult.step === "done" && <CheckCircle2 className="h-4 w-4" />}
                    {skipTraceResult.step === "error" && <XCircle className="h-4 w-4" />}
                    <span>{skipTraceResult.message}</span>
                  </div>
                  {skipTraceResult.importResult && (
                    <div className="mt-2 text-xs space-y-0.5">
                      <div>Results returned: {skipTraceResult.importResult.totalResults}</div>
                      <div>Leads updated with phone/email: {skipTraceResult.importResult.updated}</div>
                      <div>No data found: {skipTraceResult.importResult.skipped}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => { setSkipTraceOpen(false); setSkipTraceResult({ step: "idle", message: "" }) }}
                disabled={skipTraceResult.step === "submitting" || skipTraceResult.step === "polling" || skipTraceResult.step === "importing"}
              >
                {skipTraceResult.step === "done" ? "Close" : "Cancel"}
              </Button>
              {(skipTraceResult.step === "idle" || skipTraceResult.step === "error") && (
                <Button
                  onClick={submitSkipTrace}
                  disabled={skipTraceLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {skipTraceLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserSearch className="h-4 w-4 mr-2" />
                      Start Skip Trace ({skipTraceBatchSize} leads)
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Test Voice Drop Modal */}
      {testVdOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setTestVdOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-amber-600" />
                Test Voice Drop
              </CardTitle>
              <CardDescription>
                Send a test voicemail to any phone number to verify the automation works before using it on leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                <Input
                  placeholder="(555) 123-4567"
                  value={testVdPhone}
                  onChange={(e) => setTestVdPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Test Name (optional)</label>
                <Input
                  placeholder="John Smith"
                  value={testVdName}
                  onChange={(e) => setTestVdName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Name used in the personalized script. Defaults to &quot;John Smith&quot;.
                </p>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-sm text-muted-foreground">Script preview</summary>
                <pre className="mt-1 whitespace-pre-wrap bg-slate-50 p-2 rounded text-xs border max-h-40 overflow-y-auto">
{`This is Corey Pearson from Foreclosure Recovery Inc. This message is specifically for ${testVdName || "John Smith"}, or to any family members, to let ${(testVdName || "John Smith").split(" ")[0]} know:

We are obligated to inform you that the property at [lead address], APN number [lead APN], is going to close out with excess funds associated with the homes equity after the bank has been paid from the foreclosure sale.

We want to make sure that when the funds are distributed, they are sent to the correct address. We need your current forwarding address in order to send the check.

Please contact us at eight, eight, eight, five, four, five, eight, zero, zero, seven or email us at claim at U.S. foreclosure recovery dot com to update your forwarding address, so the funds that are collected after the bank has been made whole from the foreclosure sale can be distributed to you in a timely manner.

Please get a pen and replay this message to take down our phone number so you can call back and talk to Allie your recovery agent at eight, eight, eight, five, four, five, eight, zero, zero, seven.

Thank you.`}
                </pre>
              </details>
              {testVdResult && (
                <div className={`p-3 rounded-lg text-sm ${testVdResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                  {testVdResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Voice drop sent successfully
                      </div>
                      {testVdResult.script && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium">View script used</summary>
                          <pre className="mt-1 whitespace-pre-wrap bg-white/50 p-2 rounded">{testVdResult.script}</pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" />
                      {testVdResult.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => { setTestVdOpen(false); setTestVdResult(null) }}>
                Cancel
              </Button>
              <Button
                onClick={sendTestVoiceDrop}
                disabled={!testVdPhone || testVdSending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {testVdSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, county, or APN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {dbStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                const params = new URLSearchParams(window.location.search)
                if (e.target.value === "all") {
                  params.delete("status")
                } else {
                  params.set("status", e.target.value)
                }
                const qs = params.toString()
                window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname)
              }}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((option) => {
                const count = option.value === 'all' ? dbLeads.length : (statusCounts[option.value] || 0)
                return (
                  <option key={option.value} value={option.value}>
                    {option.label} ({count})
                  </option>
                )
              })}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Top Pagination */}
      <PaginationBar />

      {/* Leads Table Header */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
              onChange={toggleAllLeads}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-xs">Photo</span>
          </div>
          <div className="col-span-2">Property Owner</div>
          <div className="col-span-3">Address & Details</div>
          <div className="col-span-2">Sale Info</div>
          <div className="col-span-2">
            <span>DNC Contact Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-0.5 text-[10px]">
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                Clear
              </span>
              <span className="flex items-center gap-0.5 text-[10px]">
                <XCircle className="h-2.5 w-2.5 text-red-500" />
                DNC
              </span>
              <span className="flex items-center gap-0.5 text-[10px]">
                <Clock className="h-2.5 w-2.5 text-yellow-500" />
                Pending
              </span>
            </div>
          </div>
          <div className="col-span-1">Status</div>
        </div>
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 && !leadsLoading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
            <Database className="h-8 w-8" style={{ color: '#10b981' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#1E3A5F' }}>No Leads Found</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {searchQuery || selectedState !== 'All States' || selectedStatus !== 'all' ? (
              <>
                No leads match your current filters. Try adjusting your search criteria or clearing filters.
              </>
            ) : (
              <>
                No foreclosure leads are currently available in the database.
              </>
            )}
          </p>
          {(searchQuery || selectedState !== 'All States' || selectedStatus !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedState('All States')
                setSelectedStatus('all')
              }}
              style={{ borderColor: '#1E3A5F', color: '#1E3A5F' }}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Leads */}
      <div className="space-y-4">
        {paginatedLeads.map((lead) => {
          const isExpanded = expandedLeads.includes(lead.id)
          const isRevealed = !hiddenLeads.includes(lead.id)
          return (
            <Card
              key={lead.id}
              className={cn(
                "transition-colors",
                selectedLeads.includes(lead.id) && "border-primary bg-primary/5",
                isExpanded && "ring-1 ring-emerald-500/30"
              )}
            >
              <CardContent className="p-4">
                {/* Desktop Row */}
                <div
                  className="hidden lg:grid grid-cols-12 gap-4 items-start cursor-pointer"
                  onClick={() => toggleExpanded(lead.id)}
                >
                  <div className="col-span-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleLeadSelection(lead.id)}
                      className="h-4 w-4 rounded border-gray-300 flex-shrink-0"
                    />
                    {(() => {
                      const satUrl = getSatelliteUrl(lead.lat, lead.lng)
                      if (satUrl) {
                        return (
                          <div
                            className="relative w-20 h-20 rounded overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                            title="Click to view property"
                            onClick={() => setMapModal({
                              lat: lead.lat,
                              lng: lead.lng,
                              address: `${lead.propertyAddress}, ${lead.city}, ${lead.stateAbbr} ${lead.zipCode}`,
                              propertyType: lead.property.propertyType
                            })}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={satUrl} alt={lead.propertyAddress} className="w-full h-full object-cover" />
                          </div>
                        )
                      }
                      const stateColors: Record<string, string> = {
                        OH: "bg-blue-600", IL: "bg-indigo-600", TX: "bg-red-600",
                        GA: "bg-amber-600", MD: "bg-orange-600", FL: "bg-emerald-600", WA: "bg-teal-600"
                      }
                      const bgColor = stateColors[lead.stateAbbr] || "bg-slate-500"
                      return (
                        <div className={`w-14 h-14 rounded-lg ${bgColor} flex flex-col items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-white font-bold text-lg leading-none">{lead.stateAbbr || "—"}</span>
                          <Home className="h-3 w-3 text-white/70 mt-0.5" />
                        </div>
                      )
                    })()}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          <BlurredText revealed={isRevealed}>{lead.ownerName}</BlurredText>
                        </div>
                        {lead.parcelId && (
                          <Badge variant="outline" className="text-xs mt-1 bg-blue-50 border-blue-200 text-blue-700">
                            <Hash className="h-3 w-3 mr-1" />
                            <BlurredText revealed={isRevealed}>{lead.parcelId}</BlurredText>
                          </Badge>
                        )}
                        {lead.county && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {lead.county} County
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {lead.propertyAddress ? (
                          <div className="font-medium truncate">
                            <BlurredText revealed={isRevealed}>{lead.propertyAddress}</BlurredText>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">Address not available</div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {[lead.city, lead.stateAbbr, lead.zipCode].filter(Boolean).join(", ") || (lead.county ? `${lead.county} County, ${lead.stateAbbr}` : lead.stateAbbr)}
                        </div>
                        {(lead.property.sqft > 0 || lead.property.bedrooms > 0) && (
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-1">
                            {lead.property.bedrooms > 0 && (
                              <span className="flex items-center gap-0.5">
                                <BedDouble className="h-3 w-3" />
                                {lead.property.bedrooms}
                              </span>
                            )}
                            {lead.property.bathrooms > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Bath className="h-3 w-3" />
                                {lead.property.bathrooms}
                              </span>
                            )}
                            {lead.property.sqft > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Ruler className="h-3 w-3" />
                                {lead.property.sqft.toLocaleString()} sf
                              </span>
                            )}
                          </div>
                        )}
                        {lead.property.yearBuilt > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Built {lead.property.yearBuilt}
                            {lead.property.lotSize && ` • ${lead.property.lotSize} lot`}
                          </div>
                        )}
                        {lead.taxData.assessedValue > 0 && (
                          <div className="text-xs font-medium text-blue-600 mt-1">
                            Assessed: ${lead.taxData.assessedValue.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    {lead.saleAmount > 0 ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          ${lead.saleAmount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">Sale data pending</div>
                    )}
                    {lead.taxData.marketValue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-3 w-3" />
                        MV: ${lead.taxData.marketValue.toLocaleString()}
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <DollarSign className="h-3 w-3" />
                        ${lead.foreclosureDetails.estimatedSurplus.toLocaleString()} surplus
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <TrendingUp className="h-3 w-3" />
                        ${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()} fee
                      </div>
                    )}
                    {lead.saleDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(lead.saleDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    {lead.primaryPhone ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <DncStatusIcon lead={lead} />
                          <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <a href={isRevealed ? `tel:${lead.primaryPhone}` : '#'} className="text-sm font-medium text-emerald-700 hover:underline" onClick={(e) => { e.stopPropagation(); if (!isRevealed) e.preventDefault() }}>
                            <BlurredText revealed={isRevealed}>{lead.primaryPhone}</BlurredText>
                          </a>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <VoiceDropButton lead={lead} sending={!!sendingVoiceDrop[lead.id]} onSend={sendVoiceDrop} />
                        </div>
                        {lead.primaryEmail && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-blue-600 truncate max-w-[140px]">
                              <BlurredText revealed={isRevealed}>{lead.primaryEmail}</BlurredText>
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="text-xs">No phone on file</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                        {lead.status.replaceAll("_", " ")}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <RecoveryCountdown
                      saleDate={lead.saleDate || null}
                      stateAbbr={lead.stateAbbr}
                      scrapedAt={lead.scrapedAt}
                      compact
                    />
                  </div>
                </div>

                {/* Mobile Card */}
                <div className="lg:hidden space-y-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpanded(lead.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="h-4 w-4 rounded border-gray-300 mt-1"
                        />
                      </div>
                      {(() => {
                        const satUrl = getSatelliteUrl(lead.lat, lead.lng)
                        if (satUrl) {
                          return (
                            <div
                              className="relative w-20 h-20 rounded overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all bg-slate-100"
                              title="Click to view property"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMapModal({
                                  lat: lead.lat,
                                  lng: lead.lng,
                                  address: `${lead.propertyAddress}, ${lead.city}, ${lead.stateAbbr} ${lead.zipCode}`,
                                  propertyType: lead.property.propertyType
                                })
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={satUrl} alt={lead.propertyAddress} className="w-full h-full object-cover" />
                            </div>
                          )
                        }
                        const stateColors: Record<string, string> = {
                          OH: "bg-blue-600", IL: "bg-indigo-600", TX: "bg-red-600",
                          GA: "bg-amber-600", MD: "bg-orange-600", FL: "bg-emerald-600", WA: "bg-teal-600"
                        }
                        const bgColor = stateColors[lead.stateAbbr] || "bg-slate-500"
                        return (
                          <div className={`w-14 h-14 rounded-lg ${bgColor} flex flex-col items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-white font-bold text-lg leading-none">{lead.stateAbbr || "—"}</span>
                            <Home className="h-3 w-3 text-white/70 mt-0.5" />
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          <BlurredText revealed={isRevealed}>{lead.ownerName}</BlurredText>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {[lead.city, lead.stateAbbr].filter(Boolean).join(", ") || (lead.county ? `${lead.county} County` : "")}
                        </div>
                        {lead.parcelId && (
                          <Badge variant="outline" className="text-xs mt-1 bg-blue-50 border-blue-200 text-blue-700">
                            <Hash className="h-3 w-3 mr-1" />
                            <BlurredText revealed={isRevealed}>{lead.parcelId}</BlurredText>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                        {lead.status.replaceAll("_", " ")}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {lead.propertyAddress ? (
                        <div className="font-medium">
                          <BlurredText revealed={isRevealed}>{lead.propertyAddress}</BlurredText>
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">Address not available</div>
                      )}
                      <div className="text-muted-foreground">{[lead.city, lead.stateAbbr, lead.zipCode].filter(Boolean).join(", ") || (lead.county ? `${lead.county} County, ${lead.stateAbbr}` : lead.stateAbbr)}</div>
                      {(lead.property.sqft > 0 || lead.property.bedrooms > 0) && (
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600 mt-1">
                          {lead.property.bedrooms > 0 && (
                            <span className="flex items-center gap-1">
                              <BedDouble className="h-3 w-3" />
                              {lead.property.bedrooms}
                            </span>
                          )}
                          {lead.property.bathrooms > 0 && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {lead.property.bathrooms}
                            </span>
                          )}
                          {lead.property.sqft > 0 && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              {lead.property.sqft.toLocaleString()} sf
                            </span>
                          )}
                        </div>
                      )}
                      {lead.property.yearBuilt > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Built {lead.property.yearBuilt}
                          {lead.property.lotSize && ` • ${lead.property.lotSize} lot`}
                        </div>
                      )}
                      {lead.county && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {lead.county} County
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm items-center">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${lead.saleAmount.toLocaleString()}</span>
                    </div>
                    {lead.taxData.marketValue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-3 w-3" />
                        MV: ${lead.taxData.marketValue.toLocaleString()}
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <DollarSign className="h-3 w-3" />
                        ${lead.foreclosureDetails.estimatedSurplus.toLocaleString()} surplus
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <TrendingUp className="h-3 w-3" />
                        ${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()} fee
                      </div>
                    )}
                    {lead.saleDate && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(lead.saleDate).toLocaleDateString()}
                      </div>
                    )}
                    <RecoveryCountdown
                      saleDate={lead.saleDate || null}
                      stateAbbr={lead.stateAbbr}
                      scrapedAt={lead.scrapedAt}
                      compact
                    />
                  </div>

                  {/* Mobile Contact Info */}
                  <div className="border-t pt-3 space-y-2">
                    {lead.primaryPhone ? (
                      <>
                        <div className="flex items-center gap-2">
                          <DncStatusIcon lead={lead} />
                          <Phone className="h-4 w-4 text-emerald-600" />
                          <a href={isRevealed ? `tel:${lead.primaryPhone}` : '#'} className="text-sm font-medium text-emerald-700 hover:underline" onClick={(e) => { e.stopPropagation(); if (!isRevealed) e.preventDefault() }}>
                            <BlurredText revealed={isRevealed}>{lead.primaryPhone}</BlurredText>
                          </a>
                          {lead.primaryEmail && (
                            <>
                              <span className="text-muted-foreground">|</span>
                              <Mail className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-xs text-blue-600 truncate">
                                <BlurredText revealed={isRevealed}>{lead.primaryEmail}</BlurredText>
                              </span>
                            </>
                          )}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <VoiceDropButton lead={lead} sending={!!sendingVoiceDrop[lead.id]} onSend={sendVoiceDrop} />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Phone className="h-4 w-4" />
                        <span>No phone on file</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Detail Dropdown */}
                {isExpanded && <LeadDropdown lead={lead} revealed={isRevealed} onReveal={() => toggleHidden(lead.id)} />}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bottom Pagination */}
      <PaginationBar />

      {/* Map Modal Popup */}
      {mapModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setMapModal(null)}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl overflow-hidden max-w-[800px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMapModal(null)}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="w-full" style={{ aspectRatio: '16/9' }}>
              {(() => {
                const satUrl = getSatelliteUrl(mapModal.lat, mapModal.lng, 19)
                if (!satUrl) return (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <Home className="h-16 w-16 text-slate-400" />
                  </div>
                )
                const zoom = 19
                const n = Math.pow(2, zoom)
                const centerX = (mapModal.lng + 180) / 360 * n
                const centerY = (1 - Math.log(Math.tan(mapModal.lat * Math.PI / 180) + 1 / Math.cos(mapModal.lat * Math.PI / 180)) / Math.PI) / 2 * n
                const tiles: {x: number, y: number, key: string}[] = []
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -2; dx <= 2; dx++) {
                    const tx = Math.floor(centerX) + dx
                    const ty = Math.floor(centerY) + dy
                    tiles.push({x: tx, y: ty, key: `${tx}-${ty}`})
                  }
                }
                return (
                  <div className="w-full h-full relative overflow-hidden bg-slate-800">
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
                      {tiles.map(t => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={t.key}
                          src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${t.x}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Satellite View
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="p-4 bg-slate-50 border-t">
              <p className="font-medium text-slate-800">{mapModal.address}</p>
              <p className="text-sm text-slate-500">{mapModal.propertyType || "Property"} • Satellite Imagery</p>
            </div>
          </div>
        </div>
      )}

      {/* Source note */}
      {filteredLeads.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          All lead data sourced from county recorder offices, court filings, and public notice databases.
        </p>
      )}

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No leads found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading leads...</div>}>
      <LeadsPageContent />
    </Suspense>
  )
}
