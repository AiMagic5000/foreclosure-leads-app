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
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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


const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "skip_traced", label: "Skip Traced" },
  { value: "contacted", label: "Contacted" },
  { value: "callback", label: "Callback" },
  { value: "converted", label: "Converted" },
]

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "fee_high", label: "Highest Fee" },
  { value: "fee_low", label: "Lowest Fee" },
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
    propertyAddress: String(row.property_address || ""),
    city: String(row.city || ""),
    state: String(row.state || ""),
    stateAbbr: String(row.state_abbr || ""),
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState(stateParam || "All States")
  const [selectedStatus, setSelectedStatus] = useState("all")
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

  // Fetch leads from Supabase
  useEffect(() => {
    async function fetchLeads() {
      setLeadsLoading(true)
      const { data, error } = await supabase
        .from("foreclosure_leads")
        .select("id,owner_name,property_address,city,state,state_abbr,zip_code,county,parcel_id,apn_number,sale_date,sale_amount,mortgage_amount,lender_name,foreclosure_type,primary_phone,secondary_phone,primary_email,status,source,scraped_at,lat,lng,property_image_url,mailing_address,associated_names,property_type,year_built,square_footage,lot_size,bedrooms,bathrooms,stories,assessed_value,estimated_market_value,overage_amount,case_number,trustee_name,created_at")
        .order("primary_phone", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(2500) as { data: Record<string, unknown>[] | null; error: unknown }

      if (!error && data) {
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
      }
      setLeadsLoading(false)
    }
    fetchLeads()
  }, [])

  const skipTracedCount = useMemo(
    () => dbLeads.filter(l => l.primaryPhone).length,
    [dbLeads]
  )

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
                      <div className="text-sm text-muted-foreground">{lead.city}, {lead.stateAbbr}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${lead.saleAmount.toLocaleString()}</div>
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
    contacted: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    callback: "bg-green-500/10 text-green-600 dark:text-green-400",
    converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  } as const

  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const filtered = dbLeads.filter((lead) => {
      const matchesSearch =
        query === "" ||
        lead.ownerName.toLowerCase().includes(query) ||
        lead.propertyAddress.toLowerCase().includes(query) ||
        lead.city.toLowerCase().includes(query) ||
        lead.parcelId.toLowerCase().includes(query)

      const matchesState =
        selectedState === "All States" || lead.state === selectedState

      const matchesStatus =
        selectedStatus === "all" ||
        lead.status === selectedStatus ||
        (selectedStatus === "skip_traced" && lead.primaryPhone && lead.primaryPhone.length > 0)

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
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled={selectedLeads.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export ({selectedLeads.length})
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, city, or APN..."
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
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
          <div className="col-span-2">Contact</div>
          <div className="col-span-1">Status</div>
        </div>
      </div>

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
                  className="hidden lg:grid grid-cols-12 gap-4 items-center cursor-pointer"
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
                      return satUrl ? (
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
                      ) : (
                        <div className="w-20 h-20 rounded bg-slate-200 flex items-center justify-center border border-gray-200 flex-shrink-0">
                          <Home className="h-8 w-8 text-slate-400" />
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
                        <div className="font-medium truncate">
                          <BlurredText revealed={isRevealed}>{lead.propertyAddress}</BlurredText>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lead.city}, {lead.stateAbbr} {lead.zipCode}
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
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        ${lead.saleAmount.toLocaleString()}
                      </span>
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
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(lead.saleDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    {lead.primaryPhone ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <a href={isRevealed ? `tel:${lead.primaryPhone}` : '#'} className="text-sm font-medium text-emerald-700 hover:underline" onClick={(e) => { e.stopPropagation(); if (!isRevealed) e.preventDefault() }}>
                            <BlurredText revealed={isRevealed}>{lead.primaryPhone}</BlurredText>
                          </a>
                        </div>
                        {lead.secondaryPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              <BlurredText revealed={isRevealed}>{lead.secondaryPhone}</BlurredText>
                            </span>
                          </div>
                        )}
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
                        {lead.status.replace("_", " ")}
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
                        return satUrl ? (
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
                        ) : (
                          <div className="w-20 h-20 rounded bg-slate-200 flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <Home className="h-8 w-8 text-slate-400" />
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          <BlurredText revealed={isRevealed}>{lead.ownerName}</BlurredText>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lead.city}, {lead.stateAbbr}
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
                        {lead.status.replace("_", " ")}
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
                      <div className="font-medium">
                        <BlurredText revealed={isRevealed}>{lead.propertyAddress}</BlurredText>
                      </div>
                      <div className="text-muted-foreground">{lead.city}, {lead.stateAbbr} {lead.zipCode}</div>
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
                  <div className="border-t pt-3">
                    {lead.primaryPhone ? (
                      <div className="flex items-center gap-2">
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
