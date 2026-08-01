"use client"

import { useAgentManager } from "@/components/agent-manager-modal"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { usePin } from "@/lib/pin-context"
import { CountyInfoDialog } from "@/components/county-info-dialog"
import { UPGRADE_URL } from "@/lib/upgrade"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { leadTypeCopy } from "@/lib/surplus/lead-type-copy"
import { hasSeparateMailingAddress } from "@/lib/surplus/address"
import { RecoveryCountdown } from "@/components/recovery-countdown"
import { ZipLocalTime } from "@/components/zip-local-time"
import {
  FileStack,
  Loader2,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  DollarSign,
  Calendar,
  Eye,
  EyeOff,
  Info,
  Home,
  Send,
  CheckCircle2,
  Landmark,
  Hash,
  Gavel,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Volume2,
  PhoneCall,
  MessageSquare,
  Lock,
  Building,
  Ruler,
  BedDouble,
  Bath,
  TrendingUp,
  Globe,
  FileText,
  Scale,
  Printer,
  X,
  UserSearch,
  Search,
  Clock,
  Receipt,
  Users,
  Database,
  TreePine,
  Car,
  XCircle,
  ShieldAlert,
  MailCheck,
  Ban,
  Flag,
  RotateCcw,
  Trash2,
  ShoppingCart,
  Download,
  Upload,
} from "lucide-react"

/* ===== TYPES ===== */

interface SkipTraceData {
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

interface PropertyData {
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
}

interface TaxData {
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

interface MortgageInfo {
  lender: string
  originalAmount: number
  originationDate: string
  interestRate: number
  loanType: string
  maturityDate: string
  secondMortgage: boolean
  secondAmount: number | null
}

interface ForeclosureDetails {
  filingDate: string
  caseNumber: string
  courtName: string
  trustee: string
  auctionDate: string
  auctionLocation: string
  openingBid: number
  estimatedSurplus: number
  surplusEstimated: boolean
  defaultAmount: number
  noticeType: string
}

interface SaleHistoryEntry {
  date: string
  price: number
  type: string
  buyer: string
  seller: string
}

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
  allPhones: string[]
  badPhones: string[]
  badEmails: string[]
  primaryEmail: string | null
  secondaryEmail: string | null
  allEmails: string[]
  status: string
  source: string
  scrapedAt: string
  lat: number
  lng: number
  overageAmount: number
  dncChecked: boolean
  onDnc: boolean
  canContact: boolean
  voicemailSent: boolean
  voicemailSentAt: string | null
  voicemailError: string | null
  smsSent: boolean
  emailDraftCreated: boolean
  agreementSigned: boolean
  agreementSignedPdfUrl: string | null
  leadType: string
  mailingAddress: string
  certifiedLetterRequested: boolean
  canCertify: boolean
  badEmail: boolean
  badPhone: boolean
  agentStatus: string
  isMock: boolean
  assignedAt: string
  skipTrace: SkipTraceData
  property: PropertyData
  taxData: TaxData
  mortgageInfo: MortgageInfo
  foreclosureDetails: ForeclosureDetails
  saleHistory: SaleHistoryEntry[]
}

/* ===== MOCK DATA ===== */

const MOCK_LEAD: LeadData = {
  id: "mock-demo-lead-001",
  ownerName: "John & Mary Smith",
  propertyAddress: "1234 Oak Valley Drive",
  city: "Orlando",
  state: "Florida",
  stateAbbr: "FL",
  zipCode: "32801",
  county: "Orange",
  parcelId: "25-2204-3041-0010",
  saleDate: "2025-11-15",
  saleAmount: 285000,
  mortgageAmount: 192000,
  lenderName: "Wells Fargo Bank N.A.",
  foreclosureType: "Judicial",
  primaryPhone: "(407) 555-0199",
  secondaryPhone: "(407) 555-0233",
  allPhones: ["(407) 555-0199", "(407) 555-0233"],
  badPhones: [],
  badEmails: [],
  primaryEmail: "j.smith.example@email.com",
  secondaryEmail: null,
  allEmails: ["j.smith.example@email.com"],
  status: "new",
  source: "Orange County Clerk",
  scrapedAt: new Date().toISOString(),
  lat: 28.5383,
  lng: -81.3792,
  overageAmount: 93000,
  dncChecked: true,
  onDnc: false,
  canContact: true,
  voicemailSent: false,
  voicemailSentAt: null,
  voicemailError: null,
  smsSent: false,
  emailDraftCreated: false,
  agreementSigned: false,
  agreementSignedPdfUrl: null,
  leadType: "",
  mailingAddress: "5678 Elm Street, Tampa, FL 33602",
  certifiedLetterRequested: false,
  canCertify: true,
  badEmail: false,
  badPhone: false,
  agentStatus: "",
  isMock: true,
  assignedAt: new Date().toISOString(),
  skipTrace: {
    fullName: "John Robert Smith",
    aliases: ["Johnny Smith", "J.R. Smith"],
    age: 54,
    dob: "1971-06-14",
    ssn_last4: "4821",
    currentAddress: "1234 Oak Valley Drive",
    previousAddresses: ["789 Maple St, Tampa, FL 33602", "456 Pine Ave, Jacksonville, FL 32099"],
    phones: [
      { number: "(407) 555-0199", type: "Mobile", carrier: "T-Mobile" },
      { number: "(407) 555-0233", type: "Home", carrier: "AT&T" },
    ],
    emails: ["j.smith.example@email.com"],
    relatives: ["Mary A. Smith (Spouse)", "Robert J. Smith (Father)", "Jennifer Smith-Davis (Daughter)"],
    employer: "Orlando Regional Medical Center",
    bankruptcyFlag: false,
    liensFlag: true,
    judgmentsFlag: false,
  },
  property: {
    propertyType: "Single Family Residence",
    yearBuilt: 2003,
    sqft: 2150,
    lotSize: "0.28 acres",
    bedrooms: 4,
    bathrooms: 2,
    stories: 2,
    garage: "2-Car Attached",
    pool: true,
    roofType: "Shingle",
  },
  taxData: {
    assessedValue: 247500,
    marketValue: 310000,
    taxYear: 2025,
    annualTaxes: 4250,
    taxStatus: "Delinquent",
    exemptions: ["Homestead"],
    lastTaxPayment: "2024-03-15",
    taxDelinquent: true,
    delinquentAmount: 8500,
  },
  mortgageInfo: {
    lender: "Wells Fargo Bank N.A.",
    originalAmount: 192000,
    originationDate: "2003-08-01",
    interestRate: 5.25,
    loanType: "Conventional",
    maturityDate: "2033-08-01",
    secondMortgage: false,
    secondAmount: null,
  },
  foreclosureDetails: {
    filingDate: "2025-06-10",
    caseNumber: "2025-CF-004821",
    courtName: "Orange County Circuit Court",
    trustee: "Shapiro & Fishman LLP",
    auctionDate: "2025-11-15",
    auctionLocation: "Orange County Courthouse, 425 N Orange Ave",
    openingBid: 192000,
    estimatedSurplus: 93000,
    surplusEstimated: false,
    defaultAmount: 32000,
    noticeType: "Lis Pendens",
  },
  saleHistory: [
    { date: "2003-08-01", price: 198000, type: "Purchase", buyer: "John & Mary Smith", seller: "DR Horton Inc." },
  ],
}

const LEAD_LIMITS: Record<string, number> = {
  basic: 0,
  free: 0,
  free_webcast: 0,
  partnership: 125,
  junior_owner_operator: 125,
  owner_operator: 250,
  admin: 9999,
}

const ACCOUNT_LABELS: Record<string, string> = {
  basic: "Free",
  free: "Free",
  free_webcast: "Free",
  partnership: "Asset Recovery Agent",
  junior_owner_operator: "Junior Owner Operator",
  owner_operator: "Owner Operator",
  admin: "Admin",
}

/* ===== UTILITY COMPONENTS ===== */

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Surplus shows a real or comparables-based estimate; never a confusing $0.
function surplusDisp(fd: { estimatedSurplus: number; surplusEstimated: boolean }): string {
  if (fd.estimatedSurplus > 0) return `$${fmt(fd.estimatedSurplus)}${fd.surplusEstimated ? " (est.)" : ""}`
  return "To be verified"
}
function feeDisp(fd: { estimatedSurplus: number }): string {
  return fd.estimatedSurplus > 0 ? `$${fmt(fd.estimatedSurplus * 0.30)}` : "To be verified"
}
function netDisp(fd: { estimatedSurplus: number }): string {
  return fd.estimatedSurplus > 0 ? `$${fmt(fd.estimatedSurplus * 0.30 * 0.85)}` : "To be verified"
}

const LEAD_FAQS: { q: string; a: string }[] = [
  { q: "Why does a lead show an estimated surplus instead of an exact amount?",
    a: "The figures come from public foreclosure and county records plus an estimate of the property's value from comparable sales in the area. The exact surplus is confirmed during the forensic audit, after you verify the property and sale details with the claimant. Treat the estimate as a strong starting point, not a final number." },
  { q: "What is the 'Opening Bid' on the Foreclosure tab?",
    a: "It's the amount the foreclosing party started the auction at, which usually reflects what was owed (loan balance plus fees). When a property sells for more than the opening bid, the extra money is surplus that belongs to the former owner. Comparing the opening bid to the property's market value is how we estimate potential surplus." },
  { q: "What does the auction / sale date mean?",
    a: "It's the date the property was (or is scheduled to be) sold at foreclosure. A past date means the sale likely happened and surplus may already be held by the state. Always confirm the date with the claimant, since records can lag or change." },
  { q: "Why do I need to verify the property details with the claimant?",
    a: "The data we provide is collected from state and county sources and is preliminary. Your job as the agent is to confirm it is accurate -- the address, the sale, the ownership -- so we can run an accurate forensic audit and establish the claimant's right to the funds. Verifying first prevents wasted filings and protects the claim." },
  { q: "What is the forensic audit and what is my role?",
    a: "The forensic audit is our detailed review that confirms how much surplus exists and who is legally entitled to it. Your role is to make first contact, confirm the claimant is the right party, and verify the property details. Once you confirm interest and the basics check out, we handle the audit and filing." },
  { q: "What is the estimated surplus based on?",
    a: "Either the recorded overage when the state publishes it, or -- when it does not -- an estimate from comparable property values in the area minus the opening bid/debt. If we do not yet have enough data, the lead shows 'To be verified' instead of a number; your verification call fills that gap." },
  { q: "What if the claimant says the property info is wrong or outdated?",
    a: "That is exactly why you call. Note what they correct -- ownership, address, whether they still owned it at the time of sale -- and we update the record and re-run the audit. Corrected information makes the claim stronger, not weaker." },
  { q: "Is the claimant guaranteed to be owed money?",
    a: "No. The estimate indicates a surplus is likely based on the records, but it is confirmed only after the audit. Be honest: tell them a surplus 'may be available' and that we verify it at no cost or risk to them." },
  { q: "What is the difference between a foreclosure-sale lead and a pre-foreclosure lead?",
    a: "A completed foreclosure-sale lead means the property already sold and surplus may be held now. A pre-foreclosure lead means the sale has not happened yet, so there is no surplus to claim yet -- that conversation is about the upcoming sale. The lead's type label tells you which, and your scripts adjust automatically." },
  { q: "The lead says 'DNC-cleared' or 'manual dial only' -- what does that mean?",
    a: "DNC-cleared means the number passed our Do-Not-Call scrub and is safe to contact. 'Manual dial only' means contact is allowed but should be a manual, person-to-person call rather than automated. Always follow the status shown on the lead." },
  { q: "How do I explain there is no upfront cost?",
    a: "We work on contingency -- the claimant pays nothing out of pocket. Our fee comes only out of the funds we successfully recover. If nothing is recovered, they owe nothing. Lead with that; it removes their biggest hesitation." },
  { q: "The claimant is interested -- what are the next steps?",
    a: "Confirm their identity and the property details, then send the agreement and Limited Power of Attorney (use the Email or Certified Letter buttons). Once they sign, we begin the forensic audit and filing. Log the contact so the team can take it from there." },
  { q: "I have a bad email or phone number -- can I flag it so it turns red and I skip it?",
    a: "Yes. Click the small circle-slash icon next to any phone number or email in your list to mark it bad -- it turns red and gets a line through it, and outreach (voice drops, SMS, email) will skip it. Click the same icon again to restore it. To mark the whole lead, open it and go to the Notes tab: set it Active, Bad Lead, or Dead. Bad and dead leads automatically drop to the bottom of your inventory, and you can show only the ones you want with the Active / Marked Bad / Dead filter at the top of the page." },
]

function LeadFAQ() {
  return (
    <details className="mt-4 rounded-lg border bg-muted/30">
      <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-sm">
        Common Questions &amp; Answers About These Leads
      </summary>
      <div className="px-3 pb-3 space-y-1.5">
        {LEAD_FAQS.map((f, i) => (
          <details key={i} className="rounded-md border bg-background">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">{f.q}</summary>
            <p className="px-3 pb-3 pt-1 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </details>
  )
}

function BlurredText({ children, className = "", revealed = false }: { children: React.ReactNode; className?: string; revealed?: boolean }) {
  if (revealed) return <span className={className}>{children}</span>
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
    <Badge className={active ? "bg-red-100 text-red-700 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"}>
      {active ? "!" : "-"} {label}
    </Badge>
  )
}

function DncStatusIcon({ lead }: { lead: LeadData }) {
  if (!lead.primaryPhone) return null
  if (lead.onDnc) {
    return (
      <span title="On Do Not Call list" className="flex items-center">
        <XCircle className="h-3.5 w-3.5 text-red-500" />
      </span>
    )
  }
  if (lead.canContact && !lead.onDnc) {
    return (
      <span title="DNC cleared - OK to contact" className="flex items-center">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      </span>
    )
  }
  if (!lead.dncChecked) {
    return (
      <span title="DNC check pending" className="flex items-center">
        <Clock className="h-3.5 w-3.5 text-yellow-500" />
      </span>
    )
  }
  return (
    <span title="DNC cleared - OK to contact" className="flex items-center">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    </span>
  )
}

function ActionButton({ icon: Icon, label, color, onShowUpgrade }: { icon: React.ElementType; label: string; color: string; onShowUpgrade: () => void }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-600 text-white hover:bg-emerald-700",
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    violet: "bg-violet-600 text-white hover:bg-violet-700",
    indigo: "bg-indigo-600 text-white hover:bg-indigo-700",
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onShowUpgrade() }}
      className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors", colorMap[color] || colorMap.emerald)}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  )
}

// Lead category badge so agents instantly tell a tax sale / pre-foreclosure / completed
// foreclosure apart -- drives which outreach wording the email/voice/SMS use.
function LeadTypeBadge({ lead }: { lead: LeadData }) {
  const key = leadTypeCopy(lead.leadType, lead.foreclosureType).key
  const map: Record<string, { label: string; cls: string }> = {
    foreclosure: { label: "Foreclosure", cls: "bg-slate-100 text-slate-700 border-slate-200" },
    tax_deed: { label: "Tax Sale", cls: "bg-red-100 text-red-700 border-red-200" },
    pre_foreclosure: { label: "Pre-Foreclosure", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  }
  const m = map[key] || map.foreclosure
  return <Badge className={cn("text-[10px] px-1.5 py-0", m.cls)}>{m.label}</Badge>
}

// Persistent outreach activity per lead (loaded from the DB every session, for every paid agent):
// Emailed = a draft was created for this lead, Texted = an SMS was sent, VM = ringless voicemail delivered.
function OutreachStatus({ lead }: { lead: LeadData }) {
  if (!lead.emailDraftCreated && !lead.smsSent && !lead.voicemailSent && !lead.agreementSigned) return null
  return (
    <div className="flex flex-wrap items-center gap-1 pt-0.5">
      {lead.emailDraftCreated && (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] gap-1 px-1.5 py-0" title="You created an email draft for this lead">
          <Mail className="h-3 w-3" />
          Emailed
        </Badge>
      )}
      {lead.smsSent && (
        <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] gap-1 px-1.5 py-0" title="You sent an SMS to this lead">
          <MessageSquare className="h-3 w-3" />
          Texted
        </Badge>
      )}
      {lead.voicemailSent && (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-1 px-1.5 py-0" title="Ringless voicemail delivered to this lead">
          <CheckCircle2 className="h-3 w-3" />
          VM
        </Badge>
      )}
      {lead.agreementSigned && (
        <Badge className="bg-green-600 text-white border-green-700 text-[10px] gap-1 px-1.5 py-0" title="Claimant signed the contingency agreement online">
          <CheckCircle2 className="h-3 w-3" />
          SIGNED
        </Badge>
      )}
    </div>
  )
}

function VoiceDropBtn({ lead, sending, onSend, hasSlybroadcast, onNeedCreds }: { lead: LeadData; sending: boolean; onSend: (id: string) => void; hasSlybroadcast?: boolean; onNeedCreds?: () => void }) {
  if (!lead.primaryPhone) return null

  // Ringless voicemail runs under the agent's own SlyBroadcast account — inactive until connected.
  if (!hasSlybroadcast) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onNeedCreds?.() }}
        title="Connect SlyBroadcast in My Account to activate"
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer"
      >
        <Volume2 className="h-3 w-3" />
        Voice Drop
      </button>
    )
  }

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

  const dncBlocked = lead.onDnc || (!lead.dncChecked && !lead.canContact)
  const canSend = !!lead.primaryPhone && lead.canContact && !lead.onDnc

  if (dncBlocked) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1" title="On Do Not Call list">
        <ShieldAlert className="h-3 w-3" />
        DNC
      </Badge>
    )
  }

  if (!lead.dncChecked && !lead.canContact) {
    return (
      <button disabled className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 cursor-not-allowed" title="DNC check pending">
        <Clock className="h-3 w-3" />
        Pending DNC
      </button>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (canSend && !sending) onSend(lead.id) }}
      disabled={!canSend || sending}
      title={canSend ? "Send voice drop" : "DNC check required or no phone"}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
        canSend && !sending
          ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
          : "bg-gray-200 text-gray-500 cursor-not-allowed"
      )}
    >
      {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
      {sending ? "Sending..." : "Voice Drop"}
    </button>
  )
}

/* ===== DATA TRANSFORMATION ===== */

function transformDbRow(row: Record<string, unknown>): LeadData {
  const saleAmount = Number(row.sale_amount) || 0
  const mortgageAmount = Number(row.mortgage_amount) || 0
  // Market value from area comparables (Zestimate is stored in assessed_value on FDH leads).
  const marketValue = Number(row.estimated_market_value) || Number(row.assessed_value) || 0
  const dbOverage = Number(row.overage_amount) || 0

  // Real overage if we have it; otherwise estimate from comparables:
  // equity above the lender's claim ~= market value (comps) - opening bid/debt.
  let estimatedSurplus = dbOverage
  let surplusEstimated = false
  if (!estimatedSurplus) {
    if (mortgageAmount > 0 && saleAmount > mortgageAmount) {
      estimatedSurplus = Math.round(saleAmount - mortgageAmount); surplusEstimated = true
    } else if (marketValue > 0 && saleAmount > 0 && marketValue > saleAmount) {
      estimatedSurplus = Math.round(marketValue - saleAmount); surplusEstimated = true
    }
  }

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
    // every email on the lead (primary + extras incl. agent-added), deduped
    allEmails: Array.from(new Set([
      ...(row.primary_email ? [String(row.primary_email).toLowerCase()] : []),
      ...((Array.isArray(row.email_addresses) ? row.email_addresses : []) as string[]).map((e) => String(e).toLowerCase()),
    ])),
    badPhones: (Array.isArray(row.bad_phones) ? row.bad_phones : []) as string[],
    badEmails: ((Array.isArray(row.bad_emails) ? row.bad_emails : []) as string[]).map((e) => String(e).toLowerCase()),
    // Every phone on the lead. Emails already surfaced all of theirs; phones only
    // ever showed primary + secondary, so a THIRD number (e.g. one the agent added
    // for a relative or gatekeeper) was saved to phone_numbers and then invisible —
    // the agent could add it and never see it again. Dedupe on last-10-digits so
    // formatting differences don't produce duplicates.
    allPhones: (() => {
      const seen = new Set<string>()
      const out: string[] = []
      const push = (p: unknown) => {
        const s = String(p || "").trim()
        const key = s.replace(/\D/g, "").slice(-10)
        if (!s || key.length !== 10 || seen.has(key)) return
        seen.add(key); out.push(s)
      }
      push(row.primary_phone)
      push(row.secondary_phone)
      ;(Array.isArray(row.phone_numbers) ? row.phone_numbers : []).forEach(push)
      return out
    })(),
    status: String(row.status || "new"),
    source: String(row.source || ""),
    scrapedAt: String(row.scraped_at || new Date().toISOString()),
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    overageAmount: estimatedSurplus,
    dncChecked: Boolean(row.dnc_checked),
    onDnc: Boolean(row.on_dnc),
    canContact: Boolean(row.can_contact),
    voicemailSent: Boolean(row.voicemail_sent),
    voicemailSentAt: row.voicemail_sent_at ? String(row.voicemail_sent_at) : null,
    voicemailError: row.voicemail_error ? String(row.voicemail_error) : null,
    smsSent: Boolean(row.sms_sent),
    emailDraftCreated: Boolean(row.email_draft_created),
    agreementSigned: Boolean(row.agreement_signed),
    agreementSignedPdfUrl: row.agreement_signed_pdf_url ? String(row.agreement_signed_pdf_url) : null,
    leadType: String(row.lead_type || ""),
    mailingAddress: String(row.mailing_address || ""),
    certifiedLetterRequested: Boolean(row.certified_letter_requested),
    canCertify: hasSeparateMailingAddress(String(row.property_address || ""), String(row.mailing_address || "")),
    badEmail: Boolean(row.bad_email),
    badPhone: Boolean(row.bad_phone),
    agentStatus: String(row.agent_status || ""),
    isMock: false,
    assignedAt: String(row.assigned_at || ""),
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
      surplusEstimated,
      defaultAmount: 0,
      noticeType: "",
    },
  }
}

/* ===== LEAD NOTES (persistent per lead + operator) ===== */

function LeadNotes({ leadId, pinId }: { leadId: string; pinId: string | null }) {
  const [notes, setNotes] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!pinId) { setLoaded(true); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/lead-notes?leadId=${leadId}&pinId=${pinId}`)
        const d = await res.json()
        if (!cancelled) {
          setNotes(d.notes || "")
          setSavedAt(d.updatedAt || null)
        }
      } catch { /* leave empty */ }
      finally { if (!cancelled) setLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [leadId, pinId])

  async function save() {
    if (!pinId) { setErr("Notes can't be saved for this account yet."); return }
    setSaving(true); setErr(null)
    try {
      const res = await fetch("/api/lead-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, pinId, notes }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Save failed")
      setDirty(false); setSavedAt(new Date().toISOString())
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">Your private notes for this lead</p>
        {savedAt && !dirty && (
          <span className="text-xs text-muted-foreground">Saved {new Date(savedAt).toLocaleString()}</span>
        )}
      </div>
      <textarea
        value={notes}
        disabled={!loaded}
        onChange={(e) => { setNotes(e.target.value); setDirty(true) }}
        onBlur={() => { if (dirty) save() }}
        placeholder={loaded ? "Call outcomes, next steps, claimant details, follow-up dates…" : "Loading…"}
        rows={8}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={saving || !dirty || !loaded}>
          {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Save note"}
        </Button>
        {dirty && !saving && <span className="text-xs text-amber-600">Unsaved changes — saves when you click Save or tab away.</span>}
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
      <p className="text-xs text-muted-foreground">Notes are private to your account and stay with this lead across sessions.</p>
    </div>
  )
}

/* ===== LEAD DROPDOWN (Matches Admin Leads Page) ===== */

function LeadDropdown({ lead, revealed, onReveal, onShowUpgrade, onEmailDraft, onSms, onCertifiedLetter, voiceDropSending, onVoiceDrop, hasSlybroadcast, hasTextbee, onNeedCreds, pinId, onFlag, onDelete, onAddContact, onDncCheck, onEmailTo, initialTab }: { initialTab?: "property" | "skipTrace" | "tax" | "foreclosure" | "map" | "notes"; lead: LeadData; revealed: boolean; onReveal: () => void; onShowUpgrade: () => void; onEmailDraft?: () => void; onSms?: () => void; onCertifiedLetter?: () => void; voiceDropSending?: boolean; onVoiceDrop?: (id: string) => void; hasSlybroadcast?: boolean; hasTextbee?: boolean; onNeedCreds?: (channel: "voice" | "sms") => void; pinId?: string | null; onFlag?: (leadId: string, field: "bad_email" | "bad_phone" | "agent_status" | "bad_phone_value" | "bad_email_value", value: boolean | string, contact?: string) => void; onDelete?: (leadId: string) => void; onAddContact?: (leadId: string, kind: "email" | "phone") => void; onDncCheck?: (leadId: string) => void; onEmailTo?: (email: string) => void }) {
  const [activeTab, setActiveTab] = useState<"property" | "skipTrace" | "tax" | "foreclosure" | "map" | "notes">(initialTab || "property")
  // Address-click deep link: adjust during render (not in an effect) when the
  // requested tab changes, so re-clicking the address re-focuses the Map tab.
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab)
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab)
    if (initialTab) setActiveTab(initialTab)
  }

  const tabs = [
    { id: "property" as const, label: "Property Details", icon: Home },
    { id: "foreclosure" as const, label: "Foreclosure", icon: Gavel },
    { id: "skipTrace" as const, label: "Skip Trace", icon: UserSearch },
    { id: "tax" as const, label: "Tax & Sales", icon: Receipt },
    { id: "map" as const, label: "Map", icon: MapPin },
    { id: "notes" as const, label: "Notes", icon: StickyNote },
  ]

  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      {/* Recovery Countdown Timer */}
      <RecoveryCountdown
        saleDate={lead.saleDate || null}
        stateAbbr={lead.stateAbbr}
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
          {!lead.isMock && (
            <button
              onClick={onReveal}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                revealed
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              )}
            >
              {revealed ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Reveal</>}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      {lead.onDnc ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">On Do Not Call list -- phone, SMS, and voice drop disabled</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {onVoiceDrop ? (
            <VoiceDropBtn lead={lead} sending={!!voiceDropSending} onSend={onVoiceDrop} hasSlybroadcast={hasSlybroadcast} onNeedCreds={() => onNeedCreds?.("voice")} />
          ) : (
            <ActionButton icon={Volume2} label="Voice Drop" color="emerald" onShowUpgrade={onShowUpgrade} />
          )}
          {onSms ? (
            <button
              onClick={(e) => { e.stopPropagation(); if (lead.isMock || hasTextbee) { onSms() } else { onNeedCreds?.("sms") } }}
              title={lead.isMock ? "See a sample text" : hasTextbee ? "Send SMS" : "Connect TextBee in My Account to activate"}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                hasTextbee ? "bg-violet-600 text-white hover:bg-violet-700 cursor-pointer" : "bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer"
              )}
            >
              <MessageSquare className="h-3 w-3" />
              SMS
            </button>
          ) : (
            <ActionButton icon={MessageSquare} label="SMS" color="violet" onShowUpgrade={onShowUpgrade} />
          )}
          <ActionButton icon={Mail} label="Email" color="indigo" onShowUpgrade={onEmailDraft || onShowUpgrade} />
          {onCertifiedLetter ? (
            <button
              onClick={(e) => { e.stopPropagation(); if (lead.canCertify && !lead.certifiedLetterRequested) onCertifiedLetter() }}
              title={!lead.canCertify ? "Certified mail only goes to a separate mailing address, never the foreclosed property" : undefined}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                lead.certifiedLetterRequested
                  ? "bg-amber-100 text-amber-700 cursor-default"
                  : !lead.canCertify
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
              )}
              disabled={lead.certifiedLetterRequested || !lead.canCertify}
            >
              <MailCheck className="h-3 w-3" />
              {lead.certifiedLetterRequested ? "Letter Requested" : !lead.canCertify ? "No Alt. Address" : "Certified Letter"}
            </button>
          ) : null}
        </div>
      )}

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
                <p className="text-xl font-bold text-blue-600">${fmt(lead.saleAmount)}</p>
                <p className="text-xs text-muted-foreground">Sale Amount</p>
              </div>
              {lead.taxData.marketValue > 0 && (
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">${fmt(lead.taxData.marketValue)}</p>
                  <p className="text-xs text-muted-foreground">Est. Market Value</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600">{surplusDisp(lead.foreclosureDetails)}</p>
                <p className="text-xs text-muted-foreground">Est. Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-700">{feeDisp(lead.foreclosureDetails)}</p>
                <p className="text-xs text-muted-foreground">30% Service Fee</p>
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
            {lead.skipTrace.age > 0 && <DataRow label="Age" value={lead.skipTrace.age} />}
            {lead.skipTrace.dob && <DataRow label="DOB" value={new Date(lead.skipTrace.dob).toLocaleDateString()} blurred revealed={revealed} />}
            {lead.skipTrace.ssn_last4 && <DataRow label="SSN Last 4" value={`***-**-${lead.skipTrace.ssn_last4}`} blurred revealed={revealed} />}
            {lead.skipTrace.aliases.length > 0 && (
              <DataRow label="Aliases" value={lead.skipTrace.aliases.join(", ")} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact Info</h4>
            {lead.skipTrace.phones.map((phone, i) => (
              <DataRow key={i} label={phone.type} value={`${phone.number}${phone.carrier ? ` (${phone.carrier})` : ""}`} icon={Phone} blurred revealed={revealed} />
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
              {lead.skipTrace.relatives.length > 0 ? lead.skipTrace.relatives.map((rel, i) => (
                <p key={i} className="text-sm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <BlurredText revealed={revealed}>{rel}</BlurredText>
                </p>
              )) : (
                <p className="text-sm text-muted-foreground">No relatives on file</p>
              )}
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
            <DataRow label="Assessed Value" value={`$${fmt(lead.taxData.assessedValue)}`} icon={DollarSign} />
            <DataRow label="Market Value" value={`$${fmt(lead.taxData.marketValue)}`} icon={DollarSign} />
            <DataRow label="Annual Taxes" value={`$${fmt(lead.taxData.annualTaxes)}`} icon={Receipt} />
            <DataRow label="Tax Status" value={lead.taxData.taxStatus} />
            {lead.taxData.lastTaxPayment && <DataRow label="Last Payment" value={new Date(lead.taxData.lastTaxPayment).toLocaleDateString()} icon={Calendar} />}
            {lead.taxData.taxDelinquent && (
              <DataRow label="Delinquent Amount" value={`$${fmt(lead.taxData.delinquentAmount)}`} />
            )}
            {lead.taxData.exemptions.length > 0 && (
              <DataRow label="Exemptions" value={lead.taxData.exemptions.join(", ")} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mortgage Info</h4>
            <DataRow label="Lender" value={lead.mortgageInfo.lender || "---"} icon={Landmark} />
            <DataRow label="Original Amount" value={`$${fmt(lead.mortgageInfo.originalAmount)}`} icon={DollarSign} />
            {lead.mortgageInfo.originationDate && <DataRow label="Origination" value={new Date(lead.mortgageInfo.originationDate).toLocaleDateString()} icon={Calendar} />}
            {lead.mortgageInfo.interestRate > 0 && <DataRow label="Interest Rate" value={`${lead.mortgageInfo.interestRate}%`} />}
            {lead.mortgageInfo.loanType && <DataRow label="Loan Type" value={lead.mortgageInfo.loanType} />}
            {lead.mortgageInfo.maturityDate && <DataRow label="Maturity" value={new Date(lead.mortgageInfo.maturityDate).toLocaleDateString()} />}
            {lead.mortgageInfo.secondMortgage && (
              <DataRow label="2nd Mortgage" value={`$${fmt(lead.mortgageInfo.secondAmount || 0)}`} />
            )}
          </div>
          {lead.saleHistory.length > 0 && (
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
                        <td className="py-2 font-medium">${fmt(sale.price)}</td>
                        <td className="py-2">{sale.type}</td>
                        <td className="py-2">{sale.buyer}</td>
                        <td className="py-2">{sale.seller}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Foreclosure Tab */}
      {activeTab === "foreclosure" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Filing Details</h4>
            <DataRow label="Case Number" value={lead.foreclosureDetails.caseNumber || "---"} icon={FileText} blurred revealed={revealed} />
            {lead.foreclosureDetails.filingDate && <DataRow label="Filing Date" value={new Date(lead.foreclosureDetails.filingDate).toLocaleDateString()} icon={Calendar} />}
            {lead.foreclosureDetails.noticeType && <DataRow label="Notice Type" value={lead.foreclosureDetails.noticeType} icon={Gavel} />}
            {lead.foreclosureDetails.courtName && <DataRow label="Court" value={lead.foreclosureDetails.courtName} icon={Scale} />}
            {lead.foreclosureDetails.trustee && <DataRow label="Trustee" value={lead.foreclosureDetails.trustee} />}
            <DataRow label="Foreclosure Type" value={lead.foreclosureType} />
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auction & Financials</h4>
            {lead.foreclosureDetails.auctionDate && <DataRow label="Auction Date" value={new Date(lead.foreclosureDetails.auctionDate).toLocaleDateString()} icon={Calendar} />}
            {lead.foreclosureDetails.auctionLocation && <DataRow label="Auction Location" value={lead.foreclosureDetails.auctionLocation} icon={MapPin} />}
            {lead.foreclosureDetails.openingBid > 0 && <DataRow label="Opening Bid" value={`$${fmt(lead.foreclosureDetails.openingBid)}`} icon={DollarSign} />}
            {lead.foreclosureDetails.defaultAmount > 0 && <DataRow label="Default Amount" value={`$${fmt(lead.foreclosureDetails.defaultAmount)}`} icon={DollarSign} />}
            <div className="pt-2 mt-2 border-t">
              <DataRow label="Estimated Surplus" value={surplusDisp(lead.foreclosureDetails)} icon={DollarSign} />
            </div>
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Recovery Opportunity</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{surplusDisp(lead.foreclosureDetails)}</p>
                <p className="text-xs text-muted-foreground">Estimated Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{feeDisp(lead.foreclosureDetails)}</p>
                <p className="text-xs text-muted-foreground">30% Service Fee</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{netDisp(lead.foreclosureDetails)}</p>
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
            {lead.source && (
              <div className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Source: {lead.source}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg border bg-muted/40">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Lead Designation</h4>
            <p className="text-xs text-muted-foreground mb-2">Re-designate this lead to sort it out of your active list. Bad / dead leads drop to the bottom of your inventory.</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onFlag?.(lead.id, "agent_status", "") }}
                className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors", !lead.agentStatus ? "bg-emerald-600 text-white border-emerald-700" : "bg-background hover:bg-muted")}
              >
                <CheckCircle2 className="h-3 w-3" /> Active
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onFlag?.(lead.id, "agent_status", "bad") }}
                className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors", lead.agentStatus === "bad" ? "bg-red-100 text-red-700 border-red-300" : "bg-background hover:bg-muted")}
              >
                <Flag className="h-3 w-3" /> Bad Lead
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onFlag?.(lead.id, "agent_status", "dead") }}
                className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors", lead.agentStatus === "dead" ? "bg-red-600 text-white border-red-700" : "bg-background hover:bg-muted")}
              >
                <Ban className="h-3 w-3" /> Dead
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onFlag?.(lead.id, "bad_phone", !lead.badPhone) }}
                className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors", lead.badPhone ? "bg-red-100 text-red-700 border-red-300" : "bg-background hover:bg-muted")}
              >
                <Phone className="h-3 w-3" /> {lead.badPhone ? "Phone marked bad - click to restore" : "Mark phone bad"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onFlag?.(lead.id, "bad_email", !lead.badEmail) }}
                className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors", lead.badEmail ? "bg-red-100 text-red-700 border-red-300" : "bg-background hover:bg-muted")}
              >
                <Mail className="h-3 w-3" /> {lead.badEmail ? "Email marked bad - click to restore" : "Mark email bad"}
              </button>
            </div>
          </div>
          <LeadNotes leadId={lead.id} pinId={pinId ?? null} />
        </div>
      )}

      {/* Data Source Footer */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
        {lead.assignedAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Assigned: {new Date(lead.assignedAt).toLocaleString()}</span>
          </div>
        )}
        {lead.source && (
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            <span>Source: {lead.source}</span>
          </div>
        )}
        {onAddContact && (
          <span className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onAddContact(lead.id, "email") }}
              className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700 transition-colors hover:bg-blue-100"
              title="Add an email you found for this claimant"
            >
              <Mail className="h-3.5 w-3.5" /> Add email
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAddContact(lead.id, "phone") }}
              className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700 transition-colors hover:bg-blue-100"
              title="Add a phone number you found for this claimant"
            >
              <Phone className="h-3.5 w-3.5" /> Add phone
            </button>
          </span>
        )}
        {onDncCheck && lead.primaryPhone && !lead.dncChecked && (
          <button
            onClick={(e) => { e.stopPropagation(); onDncCheck(lead.id) }}
            className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-700 transition-colors hover:bg-amber-100"
            title="Run a live Do-Not-Call check on this phone number (unlocks voice drops and texting if it clears)"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Run DNC check
          </button>
        )}
        {onEmailTo && revealed && lead.allEmails.length > 1 && (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400">Draft to:</span>
            {lead.allEmails.map((em) => {
              const emBad = lead.badEmails.includes(em.trim().toLowerCase())
              return (
                <span key={em} className="inline-flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!emBad) onEmailTo(em) }}
                    disabled={emBad}
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium transition-colors",
                      emBad
                        ? "border-red-200 bg-red-50 text-red-500 line-through cursor-not-allowed"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    )}
                    title={emBad ? "You marked this address bad" : `Create your claimant email draft addressed to ${em}`}
                  >
                    <Mail className="h-3 w-3" /> {em}
                  </button>
                  {/* Mark THIS address bad. Previously the only control was a single
                      bad_email boolean for the whole lead, so an agent could not
                      retire one address out of several — the button looked dead. */}
                  {onFlag && !lead.isMock && (
                    <button
                      title={emBad ? "Restore this address (mark good)" : "Mark THIS address bad"}
                      onClick={(e) => { e.stopPropagation(); onFlag(lead.id, "bad_email_value", !emBad, em) }}
                      className={cn("shrink-0 rounded p-0.5 hover:bg-muted", emBad ? "text-emerald-600" : "text-muted-foreground hover:text-red-600")}
                    >
                      {emBad ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                    </button>
                  )}
                </span>
              )
            })}
          </span>
        )}
        {lead.source?.startsWith("imported:") && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(lead.id) }}
            className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-600 transition-colors hover:bg-red-100"
            title="Delete this lead you imported"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete lead
          </button>
        )}
        {lead.scrapedAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Scraped: {new Date(lead.scrapedAt).toLocaleString()}</span>
          </div>
        )}
        {lead.parcelId && (
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            <span>APN: {lead.parcelId}</span>
          </div>
        )}
        {lead.county && (
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            <span>{lead.county} County, {lead.stateAbbr}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== SAMPLE COMMS (free-tier demo on the John & Mary Smith lead) ===== */
// Shows a free agent exactly what the email + SMS sent on their behalf look like,
// with their own name as the agent and our 888 number on extension 10.
const SAMPLE_EXT = "10"
const SAMPLE_PHONE = "(888) 545-8007"

function sampleEmailDraft(agentName: string, lang: "en" | "es") {
  const to = MOCK_LEAD.primaryEmail || "j.smith.example@email.com"
  const from = `${agentName} <yourname@usforeclosurerecovery.com>`
  if (lang === "es") {
    return {
      to,
      from,
      subject: "Fondos que se le adeudan -- 1234 Oak Valley Drive",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;line-height:1.6;">
  <div style="background:#1e3a5f;padding:18px 24px;"><span style="color:#fff;font-weight:700;font-size:18px;">Foreclosure Recovery Inc.</span></div>
  <div style="padding:24px;">
    <p>Estimados John y Mary Smith:</p>
    <p>Mi nombre es <strong>${agentName}</strong> y soy agente de recuperacion en <strong>Foreclosure Recovery Inc.</strong> Nuestros registros indican que es posible que se le adeuden <strong>fondos excedentes</strong> de la venta por ejecucion hipotecaria de su antigua propiedad en <strong>1234 Oak Valley Drive, Orlando, FL 32801</strong>.</p>
    <p>Cuando una propiedad se vende por mas de lo que se debia, el excedente le pertenece al antiguo propietario. En su caso, el excedente es de aproximadamente <strong>$93,000</strong>. Estos fondos estan retenidos y hay un plazo limitado para reclamarlos.</p>
    <p>Trabajamos por <strong>honorarios de contingencia</strong>: usted no paga nada por adelantado. Solo cobramos cuando usted cobra.</p>
    <p>Adjunto nuestro acuerdo de contingencia. Para empezar, firme la pagina 5, tome una foto y enviemela.</p>
    <p>Preguntas? Llameme o envieme un mensaje al <strong>${SAMPLE_PHONE} ext. ${SAMPLE_EXT}</strong>.</p>
    <p style="margin-top:24px;">Atentamente,<br><strong>${agentName}</strong><br>Agente de Recuperacion, Foreclosure Recovery Inc.<br>${SAMPLE_PHONE} ext. ${SAMPLE_EXT}</p>
  </div>
  <div style="background:#f1f5f9;padding:14px 24px;font-size:12px;color:#64748b;">Foreclosure Recovery Inc. &middot; Ejemplo del correo que se envia en su nombre.</div>
</div>`,
    }
  }
  return {
    to,
    from,
    subject: "Funds You May Be Owed -- 1234 Oak Valley Drive",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;line-height:1.6;">
  <div style="background:#1e3a5f;padding:18px 24px;"><span style="color:#fff;font-weight:700;font-size:18px;">Foreclosure Recovery Inc.</span></div>
  <div style="padding:24px;">
    <p>Dear John &amp; Mary Smith,</p>
    <p>My name is <strong>${agentName}</strong> and I am a recovery agent with <strong>Foreclosure Recovery Inc.</strong> I am reaching out because our research shows you may be owed <strong>excess equity proceeds</strong> from the foreclosure sale of your former property at <strong>1234 Oak Valley Drive, Orlando, FL 32801</strong>.</p>
    <p>When a property sells at foreclosure for more than what was owed, the surplus belongs to the former owner. Based on the sale records, the surplus in your case is approximately <strong>$93,000</strong>. These funds are being held now, and there is a limited window to claim them.</p>
    <p>We work on a <strong>contingency basis</strong> -- there is no upfront cost to you. We only get paid when you do, out of the recovered funds. Any costs we incur come out of our share, not yours.</p>
    <p>I have attached our contingency agreement for your review. To get started, sign page 5, take a photo, and send it back to me.</p>
    <p>Questions? Call or text me directly at <strong>${SAMPLE_PHONE} ext. ${SAMPLE_EXT}</strong>.</p>
    <p style="margin-top:24px;">Warm regards,<br><strong>${agentName}</strong><br>Recovery Agent, Foreclosure Recovery Inc.<br>${SAMPLE_PHONE} ext. ${SAMPLE_EXT}</p>
  </div>
  <div style="background:#f1f5f9;padding:14px 24px;font-size:12px;color:#64748b;">Foreclosure Recovery Inc. &middot; 30 N Gould St, Ste R, Sheridan, WY 82801 &middot; Sample of the email sent on your behalf.</div>
</div>`,
  }
}

function sampleSms(agentName: string) {
  const message = `Hi John, this is ${agentName} with Foreclosure Recovery Inc. Our records show about $93,000 in surplus funds may be owed to you from the sale of 1234 Oak Valley Drive in Orange County, FL. There is a deadline to claim it. Call or text me at ${SAMPLE_PHONE} ext ${SAMPLE_EXT}. Reply STOP to opt out.`
  return { phone: MOCK_LEAD.primaryPhone || "", message, charCount: message.length, segments: Math.ceil(message.length / 160) }
}

/* ===== MAIN PAGE ===== */

export function LeadsWorkspace({ importedOnly = false }: { importedOnly?: boolean }) {
  const { openAgentManager } = useAgentManager()
  const { isAdmin, pinId, accountType, isLoading: pinLoading, hasSlybroadcast, hasTextbee } = usePin()
  const { user } = useUser()
  const agentName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Your Name"
  const [commsGate, setCommsGate] = useState<null | "voice" | "sms">(null)
  const [guideSending, setGuideSending] = useState<null | "slybroadcast" | "textbee">(null)
  const [guideSent, setGuideSent] = useState<string | null>(null)
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLeads, setExpandedLeads] = useState<string[]>([])
  // County popup (same data as the foreclosure-map county click) + address->Map-tab deep link.
  const [countyDialog, setCountyDialog] = useState<{ state: string; county: string } | null>(null)
  const [focusMapLeadId, setFocusMapLeadId] = useState<string | null>(null)
  const [hiddenLeads, setHiddenLeads] = useState<string[]>([])
  const [resolvedPinId, setResolvedPinId] = useState<string | null>(null)

  // Fallback: fetch pinId directly from role API if pin-context doesn't provide it
  useEffect(() => {
    if (pinLoading) return
    if (pinId) {
      setResolvedPinId(pinId)
      return
    }
    // Pin context didn't resolve a pinId — fetch it directly
    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => {
        if (data.pinId) setResolvedPinId(data.pinId)
      })
      .catch(() => {})
  }, [pinId, pinLoading])

  // Lead request state
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestCount, setRequestCount] = useState(5)
  const [statePreference, setStatePreference] = useState("")
  const [requestNotes, setRequestNotes] = useState("")
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  // Upgrade popup
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  // "No email on file" notice (shown when a paid agent tries to email a lead with no email address)
  const [showNoEmailNotice, setShowNoEmailNotice] = useState(false)
  // Basic-tier lead-request upgrade modal
  const [showBasicUpgradeModal, setShowBasicUpgradeModal] = useState(false)
  // Buy More Leads (past the 125/week cap, $2.50 each -> invoice)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [buyQty, setBuyQty] = useState(25)
  const [buying, setBuying] = useState(false)
  const [buySuccess, setBuySuccess] = useState(false)
  const router = useRouter()

  // Admin view-as-user
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; package_type: string; account_type: string; is_active: boolean }[]>([])
  const [viewAsUserId, setViewAsUserId] = useState<string>("")
  const [viewAsLabel, setViewAsLabel] = useState<string>("")

  const activePinId = viewAsUserId || resolvedPinId || pinId
  const activeAccountType = viewAsUserId
    ? (allUsers.find((u) => u.id === viewAsUserId)?.account_type || "basic")
    : accountType
  const maxLeads = LEAD_LIMITS[activeAccountType] ?? 10

  // Fetch all users for admin dropdown
  useEffect(() => {
    if (!isAdmin) return
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/leads/users")
        if (res.ok) {
          const data = await res.json()
          setAllUsers(data.users || [])
        }
      } catch {
        // silently handle
      }
    }
    fetchUsers()
  }, [isAdmin])

  useEffect(() => {
    // Wait for pin resolution before deciding there are no leads
    if (pinLoading) return
    if (!activePinId) {
      setLoading(false)
      return
    }

    const fetchLeads = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/leads/assign?pinId=${activePinId}`)
        if (res.ok) {
          const data = await res.json()
          const mapped = (data.leads || []).map((row: Record<string, unknown>) => transformDbRow(row))
          setLeads(mapped)
        }
      } catch {
        // silently handle
      }
      setLoading(false)
    }

    fetchLeads()
  }, [activePinId, pinLoading])

  const toggleExpanded = (id: string) => {
    setExpandedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleReveal = (id: string) => {
    setHiddenLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const [requestError, setRequestError] = useState<string | null>(null)
  const submitLeadRequest = async () => {
    setRequesting(true)
    setRequestError(null)
    try {
      const res = await fetch("/api/leads/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadCount: requestCount,
          statePreference,
          notes: requestNotes,
        }),
      })
      if (res.ok) {
        setRequestSuccess(true)
      } else if (res.status === 429) {
        // Weekly 125-lead cap hit -> steer them to Buy More Leads.
        setShowRequestModal(false)
        setShowBuyModal(true)
        setBuySuccess(false)
      } else {
        // NEVER fail silently — a blocked agent must see why (Danny Sai
        // 2026-07-15: a tier-gate 403 showed nothing, he thought it sent).
        const data = await res.json().catch(() => ({}))
        setRequestError(data?.message || "Your request could not be submitted. Please contact support at (888) 907-3234.")
      }
    } catch {
      setRequestError("Connection problem - please try again.")
    }
    setRequesting(false)
  }

  const submitBuyExtra = async () => {
    setBuying(true)
    try {
      const res = await fetch("/api/leads/buy-extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: buyQty }),
      })
      if (res.ok) setBuySuccess(true)
    } catch {
      // silently handle
    }
    setBuying(false)
  }

  // Email draft state
  const [emailDraftModal, setEmailDraftModal] = useState<{ leadId: string; to: string; ownerName: string } | null>(null)
  const [emailPreview, setEmailPreview] = useState<{ subject: string; html: string; to: string; from: string; hispanicDetected?: boolean } | null>(null)
  const [emailPreviewES, setEmailPreviewES] = useState<{ subject: string; html: string; to: string; from: string } | null>(null)
  const [emailPreviewLang, setEmailPreviewLang] = useState<"en" | "es">("en")
  const [emailDraftLoading, setEmailDraftLoading] = useState(false)
  const [emailDraftResult, setEmailDraftResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)
  // Editable subject (body is edited in-place in the rendered iframe). Sending state.
  const [emailSubject, setEmailSubject] = useState("")
  // Contingency agreement control: the agent can download the exact file that will
  // be attached, replace it with their own edited copy, or reset to the generated one.
  const [agreementBusy, setAgreementBusy] = useState<null | "download" | "upload" | "reset">(null)
  const [agreementIsCustom, setAgreementIsCustom] = useState(false)
  const [agreementNote, setAgreementNote] = useState<string | null>(null)
  const agreementFileRef = useRef<HTMLInputElement>(null)

  const agreementAction = useCallback(async (act: "agreement" | "agreement_upload" | "agreement_reset", fileBase64?: string) => {
    if (!emailDraftModal) return
    setAgreementBusy(act === "agreement" ? "download" : act === "agreement_upload" ? "upload" : "reset")
    setAgreementNote(null)
    try {
      const res = await fetch("/api/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: emailDraftModal.leadId, action: act, operatorPinId: activePinId, fileBase64 }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setAgreementNote(j?.error || "That didn't work. Please try again."); return }
      if (act === "agreement") {
        const bin = atob(j.base64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }))
        const a = document.createElement("a")
        a.href = url; a.download = j.filename || "Contingency-Fee-Agreement.docx"
        document.body.appendChild(a); a.click(); a.remove()
        URL.revokeObjectURL(url)
        setAgreementIsCustom(!!j.isCustom)
        setAgreementNote(j.isCustom ? "Downloaded your uploaded version." : "Downloaded the agreement that will be attached.")
      } else {
        setAgreementIsCustom(!!j.isCustom)
        setAgreementNote(act === "agreement_upload"
          ? "Your version is saved — it will be the copy attached to this claimant's email."
          : "Reset. The standard agreement will be attached.")
      }
    } catch {
      setAgreementNote("That didn't work. Please try again.")
    } finally { setAgreementBusy(null) }
  }, [emailDraftModal, activePinId])
  const [emailSending, setEmailSending] = useState(false)
  const emailBodyRef = useRef<HTMLIFrameElement | null>(null)
  // The claimant email is a fixed 600px-wide branded template. On a phone the preview
  // pane is ~340px, so it rendered as an unreadable sliver. Render the iframe at its
  // true 600px and scale it down to whatever width we actually have.
  const [emailPreviewScale, setEmailPreviewScale] = useState(1)
  const EMAIL_PREVIEW_W = 600
  // Callback ref, NOT useRef + useEffect([]). This wrapper only exists while the
  // preview modal is open, so on mount the node is null — an effect with an empty
  // dep array bailed and never re-ran, leaving the scale pinned at 1. On a phone
  // that rendered the 600px email inside a ~340px pane, so the agent saw the left
  // sliver (mostly white margin) and reported the preview "won't open". Desktop
  // panes are >=600px, so scale 1 was already correct there and it looked fine.
  const roRef = useRef<ResizeObserver | null>(null)
  const emailPreviewWrapRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    roRef.current = null
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setEmailPreviewScale(Math.min(1, w / EMAIL_PREVIEW_W))
    }
    measure()
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure)
      ro.observe(el)
      roRef.current = ro
    }
  }, [])

  // One-time "you can send from here now" notice. Source of truth is the server
  // (user_activity action=email_send_notice_ack); localStorage is an instant cache.
  const NOTICE_KEY = "email_send_notice_ack"
  const [noticeAcked, setNoticeAcked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(NOTICE_KEY) === "1"
  })
  const [showSendNotice, setShowSendNotice] = useState(false)
  const [noticeChecked, setNoticeChecked] = useState(false)

  // Load the server-side ack so an acknowledged notice never reappears on any device.
  // Impersonation-aware: when an admin is viewing-as an agent (viewAsUserId), check
  // that AGENT's ack — and ignore the admin's own localStorage cache so the preview
  // reflects the agent's real state (they'll see the notice if they haven't acked).
  useEffect(() => {
    let cancelled = false
    const viewing = !!viewAsUserId
    if (viewing) setNoticeAcked(false)
    const url = `/api/user/ack-notice?action=${NOTICE_KEY}` + (viewing ? `&asPinId=${encodeURIComponent(viewAsUserId)}` : "")
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setNoticeAcked(!!d?.acknowledged)
        if (!viewing && d?.acknowledged) {
          try { localStorage.setItem(NOTICE_KEY, "1") } catch {}
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [viewAsUserId])

  // Keep the editable subject synced to whichever language preview is active.
  useEffect(() => {
    const active = emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview
    if (active) setEmailSubject(active.subject)
  }, [emailPreview, emailPreviewES, emailPreviewLang])

  const openEmailDraft = useCallback(async (leadId: string, to: string, ownerName: string) => {
    // Sample lead: show a client-side example draft (no real lead in the DB)
    if (leadId === MOCK_LEAD.id) {
      setEmailDraftModal({ leadId, to, ownerName })
      setEmailDraftResult(null)
      setEmailPreviewLang("en")
      setEmailPreview(sampleEmailDraft(agentName, "en"))
      setEmailPreviewES(sampleEmailDraft(agentName, "es"))
      setEmailDraftLoading(false)
      return
    }
    if (!activePinId) {
      setEmailDraftResult({ success: false, error: "Your agent profile is still loading. Please wait a moment and try again." })
      return
    }
    setEmailDraftModal({ leadId, to, ownerName })
    setEmailPreview(null)
    setEmailPreviewES(null)
    setEmailPreviewLang("en")
    setEmailDraftResult(null)
    setEmailDraftLoading(true)
    try {
      const [enRes, esRes] = await Promise.all([
        fetch("/api/email-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, action: "preview", operatorPinId: activePinId, toEmail: to }),
        }),
        fetch("/api/email-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, action: "preview_es", operatorPinId: activePinId, toEmail: to }),
        }),
      ])
      const enData = await enRes.json()
      if (!enRes.ok) throw new Error(enData.error || "Failed to load preview")
      setEmailPreview(enData)
      const esData = await esRes.json()
      if (esRes.ok) setEmailPreviewES(esData)
    } catch (err) {
      setEmailDraftResult({ success: false, error: err instanceof Error ? err.message : "Preview failed" })
    } finally {
      setEmailDraftLoading(false)
    }
  }, [activePinId, agentName])

  // Read the (possibly edited) rendered HTML back out of the preview iframe. The agent
  // edits the body in place (contentEditable); we serialize the whole document so the
  // full branded shell is preserved exactly and the edits ride along.
  const readEditedHtml = useCallback((): string => {
    const iframe = emailBodyRef.current
    const active = emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview
    const fallback = active?.html || ""
    try {
      const doc = iframe?.contentDocument
      if (doc?.documentElement) {
        return "<!DOCTYPE html>" + doc.documentElement.outerHTML
      }
    } catch {
      // cross-origin / not ready — fall back to the untouched preview HTML.
    }
    return fallback
  }, [emailPreview, emailPreviewES, emailPreviewLang])

  // Record the one-time notice acknowledgement (server = source of truth, localStorage = cache).
  const ackSendNotice = useCallback(async () => {
    setNoticeAcked(true)
    // Only cache in the admin's own browser when NOT impersonating (else the cache
    // would falsely mark the notice acked for the admin's real account).
    if (!viewAsUserId) { try { localStorage.setItem(NOTICE_KEY, "1") } catch {} }
    fetch("/api/user/ack-notice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: NOTICE_KEY, ...(viewAsUserId ? { asPinId: viewAsUserId } : {}) }),
    }).catch(() => {})
  }, [viewAsUserId])

  // Actually send the edited claimant email via the rotating warm-up domains.
  const sendEmailNow = useCallback(async () => {
    if (!emailDraftModal) return
    // Sample lead never sends for real.
    if (emailDraftModal.leadId === MOCK_LEAD.id) {
      setEmailDraftResult({ success: false, error: "This is a sample lead — nothing is actually sent. Upgrade to work real leads and send for real." })
      return
    }
    setEmailSending(true)
    setEmailDraftResult(null)
    try {
      const html = readEditedHtml()
      const res = await fetch("/api/email-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: emailDraftModal.leadId,
          toEmail: emailDraftModal.to,
          subject: emailSubject,
          html,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || "Send failed, please try again.")
      setEmailDraftResult({ success: true, message: data.message || `Email sent to ${emailDraftModal.to}.` })
      setLeads(prev => prev.map(l =>
        l.id === emailDraftModal.leadId
          ? { ...l, emailDraftCreated: true, status: ["new", "skip_traced"].includes(l.status) ? "contacted" : l.status }
          : l
      ))
    } catch (err) {
      setEmailDraftResult({ success: false, error: err instanceof Error ? err.message : "Send failed, please try again." })
    } finally {
      setEmailSending(false)
    }
  }, [emailDraftModal, emailSubject, readEditedHtml])

  // Send button click: first time ever, gate through the one-time notice modal.
  const handleSendClick = useCallback(() => {
    if (!noticeAcked) {
      setNoticeChecked(false)
      setShowSendNotice(true)
      return
    }
    sendEmailNow()
  }, [noticeAcked, sendEmailNow])

  // Voice drop state
  const [sendingVoiceDrop, setSendingVoiceDrop] = useState<Record<string, boolean>>({})

  const sendVoiceDrop = useCallback(async (leadId: string) => {
    if (!activePinId) return
    setSendingVoiceDrop(prev => ({ ...prev, [leadId]: true }))
    // Enqueue returns near-instantly; hold the "sending" state ~3s so the agent
    // perceives the drop actually triggering before it flips to "Sent".
    const minDelay = new Promise(resolve => setTimeout(resolve, 3000))
    try {
      const res = await fetch("/api/voice-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, operatorPinId: activePinId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Voice drop failed")
      await minDelay
      setLeads(prev => prev.map(l =>
        l.id === leadId
          ? { ...l, voicemailSent: true, voicemailSentAt: new Date().toISOString(), status: ["new", "skip_traced"].includes(l.status) ? "contacted" : l.status }
          : l
      ))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Voice drop failed"
      await minDelay
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, voicemailError: msg } : l
      ))
    } finally {
      setSendingVoiceDrop(prev => ({ ...prev, [leadId]: false }))
    }
  }, [activePinId])

  // SMS state
  const [smsModal, setSmsModal] = useState<{ leadId: string; phone: string; ownerName: string } | null>(null)
  const [smsPreview, setSmsPreview] = useState<{ phone: string; message: string; charCount: number; segments: number; signLink?: string | null } | null>(null)
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsResult, setSmsResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)
  const [smsEditMessage, setSmsEditMessage] = useState("")
  const [smsLang, setSmsLang] = useState<"en" | "es">("en")

  const openSmsPreview = useCallback(async (leadId: string, phone: string, ownerName: string) => {
    // Sample lead: show a client-side example text (no real lead in the DB)
    if (leadId === MOCK_LEAD.id) {
      setSmsModal({ leadId, phone, ownerName })
      setSmsResult(null)
      const s = sampleSms(agentName)
      setSmsPreview(s)
      setSmsEditMessage(s.message)
      setSmsLoading(false)
      return
    }
    if (!activePinId) {
      setSmsResult({ success: false, error: "Your agent profile is still loading. Please wait a moment and try again." })
      return
    }
    setSmsModal({ leadId, phone, ownerName })
    setSmsLang("en")
    setSmsPreview(null)
    setSmsResult(null)
    setSmsLoading(true)
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, action: "preview", operatorPinId: activePinId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load preview")
      setSmsPreview(data)
      setSmsEditMessage(data.message)
    } catch (err) {
      setSmsResult({ success: false, error: err instanceof Error ? err.message : "Preview failed" })
    } finally {
      setSmsLoading(false)
    }
  }, [activePinId, agentName])

  // Spanish option for the text step. The email step already had one; agents with
  // Spanish-speaking claimants had no equivalent here.
  const reloadSmsPreview = useCallback(async (nextLang: "en" | "es") => {
    if (!smsModal || !activePinId) return
    setSmsLang(nextLang)
    setSmsLoading(true)
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: smsModal.leadId, action: "preview", operatorPinId: activePinId, lang: nextLang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load preview")
      setSmsPreview(data)
      setSmsEditMessage(data.message)
    } catch (err) {
      setSmsResult({ success: false, error: err instanceof Error ? err.message : "Preview failed" })
    } finally {
      setSmsLoading(false)
    }
  }, [smsModal, activePinId])

  const sendSms = useCallback(async () => {
    if (!smsModal || !activePinId) return
    setSmsLoading(true)
    setSmsResult(null)
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: smsModal.leadId, action: "send", customMessage: smsEditMessage, operatorPinId: activePinId, lang: smsLang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "SMS send failed")
      setSmsResult({ success: true, message: data.message || "SMS sent" })
      setLeads(prev => prev.map(l =>
        l.id === smsModal.leadId
          ? { ...l, smsSent: true, status: ["new", "skip_traced"].includes(l.status) ? "contacted" : l.status }
          : l
      ))
    } catch (err) {
      setSmsResult({ success: false, error: err instanceof Error ? err.message : "SMS send failed" })
    } finally {
      setSmsLoading(false)
    }
  }, [smsModal, smsEditMessage, activePinId, smsLang])

  // Certified letter state
  const [certLetterModal, setCertLetterModal] = useState<{ leadId: string; ownerName: string; mailingAddress: string } | null>(null)
  const [certLetterNotes, setCertLetterNotes] = useState("")
  const [certLetterLoading, setCertLetterLoading] = useState(false)
  const [certLetterResult, setCertLetterResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)

  // Certified-letter weekly credits (5 free/week, reset Mon noon; extra = $10 each)
  const [showCertCredits, setShowCertCredits] = useState(false)
  const [credits, setCredits] = useState<{ freeLimit: number; freeUsed: number; freeRemaining: number; pricePerLetter: number; resetAt: string; isAdmin: boolean } | null>(null)
  const [creditQty, setCreditQty] = useState(1)
  const [creditReqLoading, setCreditReqLoading] = useState(false)
  const [creditReqResult, setCreditReqResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null)
  const [showCreditsExhausted, setShowCreditsExhausted] = useState<{ resetAt?: string; freeLimit?: number; reason?: string; pricePerLetter?: number; canPrintOwn?: boolean; leadId?: string; ownerName?: string } | null>(null)
  const [printingOwn, setPrintingOwn] = useState(false)

  const openCertCredits = useCallback(async () => {
    setShowCertCredits(true); setCreditReqResult(null); setCredits(null)
    try {
      const qs = activePinId ? `?pinId=${encodeURIComponent(activePinId)}` : ""
      const r = await fetch(`/api/cert-credits${qs}`)
      if (r.ok) setCredits(await r.json())
    } catch { /* shown as loading */ }
  }, [activePinId])

  const requestCredits = useCallback(async () => {
    setCreditReqLoading(true); setCreditReqResult(null)
    try {
      const r = await fetch("/api/cert-credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qty: creditQty, pinId: activePinId }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || "Request failed")
      setCreditReqResult({ ok: true, message: d.message })
    } catch (e) { setCreditReqResult({ error: e instanceof Error ? e.message : "Request failed" }) }
    finally { setCreditReqLoading(false) }
  }, [creditQty, activePinId])

  const openCertLetterModal = useCallback((leadId: string, ownerName: string, mailingAddress: string) => {
    setCertLetterModal({ leadId, ownerName, mailingAddress })
    setCertLetterNotes("")
    setCertLetterResult(null)
  }, [])

  const submitCertLetter = useCallback(async () => {
    if (!certLetterModal) return
    setCertLetterLoading(true)
    setCertLetterResult(null)
    try {
      const res = await fetch("/api/certified-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: certLetterModal.leadId, notes: certLetterNotes }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "NO_CREDITS") {
          const prev = certLetterModal
          setCertLetterModal(null)
          setShowCreditsExhausted({
            resetAt: data.resetAt, freeLimit: data.freeLimit, reason: data.reason,
            pricePerLetter: data.pricePerLetter, canPrintOwn: data.canPrintOwn,
            leadId: prev?.leadId, ownerName: prev?.ownerName,
          })
          return
        }
        throw new Error(data.error || "Request failed")
      }
      setCertLetterResult({ success: true, message: data.message || "Request submitted" })
      // Update local lead state
      setLeads(prev => prev.map(l =>
        l.id === certLetterModal.leadId ? { ...l, certifiedLetterRequested: true } : l
      ))
    } catch (err) {
      setCertLetterResult({ success: false, error: err instanceof Error ? err.message : "Request failed" })
    } finally {
      setCertLetterLoading(false)
    }
  }, [certLetterModal, certLetterNotes])

  // Print-your-own: download the 3 personalized documents (cover letter + contingency
  // agreement + limited POA) for this lead so the agent can print + mail them themselves.
  const printOwnLetters = useCallback(async (leadId?: string, ownerName?: string) => {
    if (!leadId) return
    setPrintingOwn(true)
    try {
      const res = await fetch("/api/certified-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, mode: "download" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not generate the documents.")
      for (const f of (data.files || []) as { name: string; b64: string }[]) {
        const bin = atob(f.b64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url; a.download = f.name
        document.body.appendChild(a); a.click(); a.remove()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not generate the documents.")
    } finally {
      setPrintingOwn(false)
    }
  }, [])

  // Agent marks a bad email/phone (red, skip) or marks the lead bad/dead (re-sorts to bottom).
  const flagLead = useCallback(async (
    leadId: string,
    field: "bad_email" | "bad_phone" | "agent_status" | "bad_phone_value" | "bad_email_value",
    value: boolean | string,
    contact?: string,
  ) => {
    const pkey = (p: string) => String(p || "").replace(/\D/g, "").slice(-10)
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l
      // Per-contact toggles operate on a list, not a boolean.
      if (field === "bad_phone_value" && contact) {
        const on = l.badPhones.some((p) => pkey(p) === pkey(contact))
        return { ...l, badPhones: on ? l.badPhones.filter((p) => pkey(p) !== pkey(contact)) : [...l.badPhones, contact] }
      }
      if (field === "bad_email_value" && contact) {
        const c = contact.trim().toLowerCase()
        const on = l.badEmails.includes(c)
        return { ...l, badEmails: on ? l.badEmails.filter((e) => e !== c) : [...l.badEmails, c] }
      }
      return {
        ...l,
        badEmail: field === "bad_email" ? Boolean(value) : l.badEmail,
        badPhone: field === "bad_phone" ? Boolean(value) : l.badPhone,
        agentStatus: field === "agent_status" ? String(value || "") : l.agentStatus,
      }
    }))
    if (!activePinId) return
    try {
      await fetch("/api/lead-flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, pinId: activePinId, field, value, contact }),
      })
    } catch { /* optimistic update already applied; next refresh reconciles */ }
  }, [activePinId])

  // Delete a lead the agent imported themselves (server enforces imported-only +
  // ownership; company leads can never be deleted here).
  const handleDeleteLead = useCallback(async (leadId: string) => {
    if (!activePinId) return
    if (typeof window !== "undefined" && !window.confirm("Delete this lead you imported? This can't be undone.")) return
    setLeads(prev => prev.filter(l => l.id !== leadId)) // optimistic
    try {
      const res = await fetch("/api/leads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, operatorPinId: activePinId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j?.error || "Could not delete this lead.")
        if (typeof window !== "undefined") window.location.reload()
      }
    } catch {
      if (typeof window !== "undefined") window.location.reload()
    }
  }, [activePinId])

  // Agent-found contact info: add an email/phone onto an assigned lead so
  // outreach can use it (server enforces ownership + blacklist + DNC-pending).
  const handleAddContact = useCallback(async (leadId: string, kind: "email" | "phone") => {
    if (typeof window === "undefined") return
    if (!activePinId) {
      alert("Your account is still loading — give it a moment and try again.")
      return
    }
    const value = window.prompt(kind === "email"
      ? "Enter the email address you found for this claimant:"
      : "Enter ONE 10-digit phone number for this claimant (add more one at a time):")
    if (!value?.trim()) return
    try {
      const res = await fetch("/api/leads/add-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, operatorPinId: activePinId, kind, value: value.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { alert(j?.error || "Could not add that contact."); return }
      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l,
        primaryEmail: kind === "email" ? (j.primaryEmail || l.primaryEmail) : l.primaryEmail,
        allEmails: kind === "email" ? Array.from(new Set([...l.allEmails, value.trim().toLowerCase()])) : l.allEmails,
        primaryPhone: kind === "phone" ? (j.primaryPhone || l.primaryPhone) : l.primaryPhone,
        // show the number immediately even when primary+secondary are already taken
        allPhones: kind === "phone"
          ? (() => {
              const key = (p: string) => p.replace(/\D/g, "").slice(-10)
              const added = value.trim()
              return l.allPhones.some((p) => key(p) === key(added)) ? l.allPhones : [...l.allPhones, added]
            })()
          : l.allPhones,
        dncChecked: kind === "phone" && j.dncPending ? false : l.dncChecked,
        canContact: kind === "phone" && j.dncPending ? false : l.canContact,
      } : l))
      alert(kind === "phone" && j.dncPending
        ? "Phone added. It will unlock for voice drops and texting after our Do-Not-Call check clears it."
        : "Added. Outreach can use it now.")
    } catch { alert("Could not add that contact. Please try again.") }
  }, [activePinId])

  // Live DNC check (Tracerfy) on a lead's phone — agent-triggered from the row.
  const [dncChecking, setDncChecking] = useState<Record<string, boolean>>({})
  const handleDncCheck = useCallback(async (leadId: string) => {
    if (!activePinId || dncChecking[leadId]) return
    setDncChecking(prev => ({ ...prev, [leadId]: true }))
    try {
      const res = await fetch("/api/leads/dnc-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, operatorPinId: activePinId }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { alert(j?.error || "DNC check failed. Please try again."); return }
      if (j.pending) { alert(j.message || "Still processing — try again in a minute."); return }
      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l, dncChecked: true, onDnc: !!j.onDnc, canContact: !!j.canContact,
      } : l))
      alert(j.isClean
        ? "Cleared! This number is NOT on the Do-Not-Call registry. Voice drops and texting are now unlocked."
        : "This number IS on the Do-Not-Call registry. Voice drops and texting stay locked — reach out by email or mail instead.")
    } catch { alert("DNC check failed. Please try again.") }
    finally { setDncChecking(prev => ({ ...prev, [leadId]: false })) }
  }, [activePinId, dncChecking])

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState("All States")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedOrigin, setSelectedOrigin] = useState("all") // all | issued | imported
  const [selectedLeadType, setSelectedLeadType] = useState("all") // all | foreclosure | tax_deed | pre_foreclosure
  const [selectedDesignation, setSelectedDesignation] = useState("all") // all | active | bad | dead
  const [sortBy, setSortBy] = useState("issued_newest")
  const [currentPage, setCurrentPage] = useState(1)
  const LEADS_PER_PAGE = 25

  // On the Import tab we only show the operator's own imported lists (tagged
  // source="imported:..."), and never the demo MOCK_LEAD.
  const sourceLeads = importedOnly
    ? leads.filter((l) => String(l.source || "").startsWith("imported:"))
    : leads
  const showingMock = !importedOnly && sourceLeads.length === 0
  const baseLeads = showingMock ? [MOCK_LEAD] : sourceLeads

  // Free accounts only see the sample lead — expand it by default so they can
  // immediately see the example email + SMS sent on their behalf.
  useEffect(() => {
    if (showingMock) {
      setExpandedLeads((prev) => (prev.includes(MOCK_LEAD.id) ? prev : [...prev, MOCK_LEAD.id]))
    }
  }, [showingMock])

  // Derive available states from leads
  const availableStates = useMemo(() => {
    const states = new Set(leads.map((l) => l.state).filter(Boolean))
    return ["All States", ...Array.from(states).sort()]
  }, [leads])

  // Derive status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of leads) {
      counts[l.status] = (counts[l.status] || 0) + 1
    }
    return counts
  }, [leads])

  // Origin counts: imported = leads the agent uploaded themselves (source
  // "imported:..."); issued = leads assigned to them from the company pipeline.
  const originCounts = useMemo(() => {
    let imported = 0
    for (const l of leads) if (String(l.source || "").startsWith("imported:")) imported++
    return { imported, issued: leads.length - imported }
  }, [leads])

  // Count leads by resolved outreach type (foreclosure / tax_deed / pre_foreclosure)
  const typeCounts = useMemo(() => {
    const c = { foreclosure: 0, tax_deed: 0, pre_foreclosure: 0 }
    for (const l of leads) c[leadTypeCopy(l.leadType, l.foreclosureType).key]++
    return c
  }, [leads])

  // Filter and sort
  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const filtered = baseLeads.filter((lead) => {
      const matchesSearch =
        query === "" ||
        lead.ownerName.toLowerCase().includes(query) ||
        lead.propertyAddress.toLowerCase().includes(query) ||
        lead.city.toLowerCase().includes(query) ||
        lead.county.toLowerCase().includes(query) ||
        lead.parcelId.toLowerCase().includes(query) ||
        (lead.primaryPhone || "").toLowerCase().includes(query) ||
        (lead.primaryEmail || "").toLowerCase().includes(query) ||
        lead.stateAbbr.toLowerCase().includes(query)

      const matchesState =
        selectedState === "All States" || lead.state === selectedState

      const matchesStatus =
        selectedStatus === "all" || lead.status === selectedStatus

      const isImported = String(lead.source || "").startsWith("imported:")
      const matchesOrigin =
        selectedOrigin === "all" ||
        (selectedOrigin === "imported" && isImported) ||
        (selectedOrigin === "issued" && !isImported)

      const matchesLeadType =
        selectedLeadType === "all" ||
        leadTypeCopy(lead.leadType, lead.foreclosureType).key === selectedLeadType

      const matchesDesignation =
        selectedDesignation === "all" ||
        (selectedDesignation === "active" && !lead.agentStatus) ||
        lead.agentStatus === selectedDesignation

      return matchesSearch && matchesState && matchesStatus && matchesOrigin && matchesLeadType && matchesDesignation
    })

    // Agent-marked bad/dead leads sink to the very bottom of the inventory.
    const statusRank = (s: string) => (s === "dead" ? 2 : s === "bad" ? 1 : 0)
    // Lead-type priority: completed foreclosures + tax deeds first, pre-foreclosure last.
    const typeRank = (lt: string) => {
      const t = (lt || "").toLowerCase()
      if (t.includes("pre")) return 2
      if (t.includes("foreclosure") || t.includes("tax")) return 0
      return 1
    }
    return filtered.sort((a, b) => {
      const sr = statusRank(a.agentStatus) - statusRank(b.agentStatus)
      if (sr !== 0) return sr
      const tr = typeRank(a.leadType) - typeRank(b.leadType)
      if (tr !== 0) return tr
      switch (sortBy) {
        case "issued_newest":
          return new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime()
        case "issued_oldest":
          return new Date(a.assignedAt || 0).getTime() - new Date(b.assignedAt || 0).getTime()
        case "surplus_high":
          return (b.overageAmount || 0) - (a.overageAmount || 0)
        case "surplus_low":
          return (a.overageAmount || 0) - (b.overageAmount || 0)
        case "name_az":
          return a.ownerName.localeCompare(b.ownerName)
        case "name_za":
          return b.ownerName.localeCompare(a.ownerName)
        case "newest":
          return new Date(b.scrapedAt || 0).getTime() - new Date(a.scrapedAt || 0).getTime()
        case "oldest":
          return new Date(a.scrapedAt || 0).getTime() - new Date(b.scrapedAt || 0).getTime()
        default:
          return 0
      }
    })
  }, [baseLeads, searchQuery, selectedState, selectedStatus, selectedOrigin, selectedLeadType, selectedDesignation, sortBy])

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedState, selectedStatus, selectedOrigin, selectedLeadType, selectedDesignation, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PER_PAGE))
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE
    return filteredLeads.slice(start, start + LEADS_PER_PAGE)
  }, [filteredLeads, currentPage])

  const statusColors: Record<string, string> = {
    new: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    skip_traced: "bg-blue-100 text-blue-800",
    contacted: "bg-purple-100 text-purple-800",
    converted: "bg-emerald-100 text-emerald-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileStack className="h-6 w-6" />
            {importedOnly ? "Your Imported Leads" : viewAsUserId ? `Viewing: ${viewAsLabel}` : "My Leads"}
          </h1>
          <p className="text-muted-foreground">
            {importedOnly
              ? "Lists you uploaded -- work them with SMS, email, certified mail & voicemail like any other lead"
              : viewAsUserId ? "Admin view-as-user mode" : "Your assigned foreclosure recovery leads"}{" "}
            {!importedOnly && (
              <>
                --{" "}
                <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {ACCOUNT_LABELS[activeAccountType] || "Basic"} Account
                </Badge>
              </>
            )}
          </p>
        </div>
        {!importedOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={openCertCredits}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Certified Credits
            </Button>
            <Button
              onClick={() => { setShowBuyModal(true); setBuySuccess(false) }}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy More Leads
            </Button>
            <Button
              onClick={() => {
                const basicTiers = ["basic", "free_webcast", "free"]
                if (basicTiers.includes(activeAccountType)) {
                  setShowBasicUpgradeModal(true)
                } else {
                  setShowRequestModal(true)
                  setRequestSuccess(false)
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md"
            >
              <Send className="h-4 w-4 mr-2" />
              Request Leads
            </Button>
          </div>
        )}
      </div>

      {!importedOnly && <LeadFAQ />}

      {/* Admin: View as User dropdown */}
      {isAdmin && allUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
              <Users className="h-4 w-4" />
              View as User:
            </div>
            <select
              value={viewAsUserId}
              onChange={(e) => {
                const uid = e.target.value
                setViewAsUserId(uid)
                if (uid) {
                  const user = allUsers.find((u) => u.id === uid)
                  setViewAsLabel(user?.email || "")
                } else {
                  setViewAsLabel("")
                }
              }}
              className="border border-amber-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1 max-w-md"
            >
              <option value="">-- My Account (Admin) --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} ({ACCOUNT_LABELS[u.account_type] || u.account_type}) {!u.is_active ? "[Inactive]" : ""}
                </option>
              ))}
            </select>
            {viewAsUserId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setViewAsUserId(""); setViewAsLabel("") }}
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <X className="h-3 w-3 mr-1" />
                Back to My View
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Basic-tier lead-request upgrade modal */}
      {showBasicUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowBasicUpgradeModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 ring-4 ring-amber-200/50">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-white">Please upgrade to unlock leads</h3>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Lead delivery isn&apos;t included on your <strong className="text-white">Free tier</strong>. Become a certified <strong className="text-white">Asset Recovery Agent</strong> to unlock exclusive leads + outreach.
            </p>
            <button
              onClick={() => { setShowBasicUpgradeModal(false); openAgentManager() }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md text-sm mb-3 w-full justify-center"
            >
              Become an Asset Recovery Agent
            </button>
            <button
              onClick={() => setShowBasicUpgradeModal(false)}
              className="text-sm text-slate-400 hover:text-white mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* No-email-on-file notice (paid agents) */}
      {showNoEmailNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowNoEmailNotice(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 ring-4 ring-amber-200/50">
              <Mail className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">No email on file</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This lead doesn&apos;t have an email address yet, so there&apos;s nothing to email. Reach this homeowner by <strong>phone</strong>, <strong>SMS</strong>, or <strong>certified mail</strong> instead.
            </p>
            <button
              onClick={() => setShowNoEmailNotice(false)}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md text-sm w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Popup */}
      {showUpgradePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowUpgradePopup(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 ring-4 ring-amber-200/50">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Owner Operator Feature</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Email, SMS, Voice Drop, and AI Call functions are available only to Owner Operators and Admins.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              If you are an Owner Operator, please request activation by emailing us:
            </p>
            <a
              href="mailto:support@usforeclosureleads.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md text-sm mb-3"
            >
              <Mail className="h-4 w-4" />
              support@usforeclosureleads.com
            </a>
            <div className="mt-2">
              <a
                href="tel:+18885458007"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <Phone className="h-4 w-4" />
                (888) 545-8007
              </a>
            </div>
            <br />
            <button onClick={() => setShowUpgradePopup(false)} className="text-sm text-muted-foreground hover:text-foreground mt-2">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Lead Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowRequestModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {requestSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2 text-white">Request Submitted</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Your lead request is in. We&rsquo;ll issue your leads within 24 hours based on availability, matching any state preference you set. If a state or lead type is thin, we send the closest alternatives. Check your email for confirmation.
                </p>
                <Button onClick={() => setShowRequestModal(false)} variant="outline">Close</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Request Leads</h3>
                  <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  As a <strong className="text-emerald-400">{ACCOUNT_LABELS[activeAccountType] || "Basic"}</strong> account, you can request up to <strong className="text-white">{maxLeads}</strong> leads per week.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">Number of Leads</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={maxLeads}
                        value={requestCount}
                        onChange={(e) => setRequestCount(Number(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                      <span className="text-2xl font-bold text-blue-400 w-12 text-center">{requestCount}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Max: {maxLeads} leads per week{activeAccountType === "junior_owner_operator" ? " — state-specific requests welcome in the notes below" : ""}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">State Preference (optional)</label>
                    <Input value={statePreference} onChange={(e) => setStatePreference(e.target.value)} placeholder="e.g., Florida, Texas, Ohio" className="!text-white !bg-slate-800 !border-slate-600 placeholder:!text-slate-400" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">Notes (optional)</label>
                    <textarea
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      placeholder="Any specific requirements..."
                      rows={2}
                      className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                  </div>
                  {requestError && (
                    <div className="rounded-lg bg-red-950/60 border border-red-800 px-3 py-2.5 text-sm text-red-200">
                      {requestError}
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 text-foreground" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={submitLeadRequest} disabled={requesting}>
                      {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit Request
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Buy More Leads (past the 125/week cap, $2.50 each -> invoice) */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowBuyModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {buySuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2 text-white">Invoice On Its Way</h3>
                <p className="text-sm text-slate-300 mb-1">
                  We're sending an invoice for <strong className="text-white">{buyQty} extra leads</strong> (${(buyQty * 2.5).toFixed(2)}) to your email.
                </p>
                <p className="text-sm text-slate-400 mb-4">Once it's paid, your extra leads are issued within 24 hours.</p>
                <Button onClick={() => setShowBuyModal(false)} variant="outline">Close</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-emerald-400" /> Buy More Leads</h3>
                  <button onClick={() => setShowBuyModal(false)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="rounded-lg bg-emerald-950/60 border border-emerald-800 px-4 py-3 mb-4">
                  <p className="text-sm text-emerald-200 leading-relaxed">
                    Already went through your up to <strong>125 weekly leads</strong> and want more? Buy extra leads here at <strong>$2.50 each</strong>. We'll email you an invoice, and your leads are issued within 24 hours of payment.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">How many extra leads?</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={buyQty}
                        onChange={(e) => setBuyQty(Number(e.target.value))}
                        className="flex-1 accent-emerald-600"
                      />
                      <span className="text-2xl font-bold text-emerald-400 w-12 text-center">{buyQty}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 rounded-lg bg-slate-800 px-4 py-3">
                      <span className="text-sm text-slate-300">{buyQty} leads &times; $2.50</span>
                      <span className="text-xl font-bold text-white">${(buyQty * 2.5).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" className="flex-1 text-foreground" onClick={() => setShowBuyModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" onClick={submitBuyExtra} disabled={buying}>
                      {buying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                      Send My Invoice
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info Banner */}
      {showingMock && (
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Sample Lead Preview
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Below is a sample lead showing exactly what your assigned leads will look like.
                Click the lead bar to expand and see full details including property data, contact info,
                foreclosure details, tax records, skip trace data, and the Google Maps location.
                Click <strong>&ldquo;Request Leads&rdquo;</strong> to get your leads assigned.
                Your <strong>{ACCOUNT_LABELS[activeAccountType] || "Basic"}</strong> account allows up to <strong>{maxLeads} leads</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      {!showingMock && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, address, phone, email, state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {availableStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status ({leads.length})</option>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ({count})
                  </option>
                ))}
              </select>
              {!importedOnly && (
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Sources ({leads.length})</option>
                  <option value="issued">Issued ({originCounts.issued})</option>
                  <option value="imported">Imported ({originCounts.imported})</option>
                </select>
              )}
              <select
                value={selectedLeadType}
                onChange={(e) => setSelectedLeadType(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                title="Filter by lead type (controls outreach wording)"
              >
                <option value="all">All Types ({leads.length})</option>
                <option value="tax_deed">Tax Sale ({typeCounts.tax_deed})</option>
                <option value="pre_foreclosure">Pre-Foreclosure ({typeCounts.pre_foreclosure})</option>
                <option value="foreclosure">Foreclosure ({typeCounts.foreclosure})</option>
              </select>
              <select
                value={selectedDesignation}
                onChange={(e) => setSelectedDesignation(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                title="Filter by how you designated the lead"
              >
                <option value="all">All Leads ({leads.length})</option>
                <option value="active">Active ({leads.filter(l => !l.agentStatus).length})</option>
                <option value="bad">Marked Bad ({leads.filter(l => l.agentStatus === "bad").length})</option>
                <option value="dead">Dead ({leads.filter(l => l.agentStatus === "dead").length})</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="issued_newest">Issued: Newest First</option>
                <option value="issued_oldest">Issued: Oldest First</option>
                <option value="surplus_high">Surplus: High to Low</option>
                <option value="surplus_low">Surplus: Low to High</option>
                <option value="name_az">Name: A-Z</option>
                <option value="name_za">Name: Z-A</option>
                <option value="newest">Scraped: Newest First</option>
                <option value="oldest">Scraped: Oldest First</option>
              </select>
            </div>
            {(searchQuery || selectedState !== "All States" || selectedStatus !== "all" || selectedLeadType !== "all" || selectedDesignation !== "all") && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <span>{filteredLeads.length} of {leads.length} leads</span>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedState("All States"); setSelectedStatus("all"); setSelectedLeadType("all"); setSelectedDesignation("all") }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Total Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-emerald-600">{leads.filter((l) => l.canContact && !l.onDnc && !!l.primaryPhone).length}</p>
            <p className="text-xs text-muted-foreground">DNC Cleared</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-blue-600">{leads.filter((l) => l.primaryPhone).length}</p>
            <p className="text-xs text-muted-foreground">Have Phone</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-purple-600">{leads.filter((l) => l.primaryEmail).length}</p>
            <p className="text-xs text-muted-foreground">Have Email</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-red-600">{leads.filter((l) => l.onDnc).length}</p>
            <p className="text-xs text-muted-foreground">On DNC List</p>
          </CardContent>
        </Card>
      </div>

      {/* DNC Legend */}
      {!showingMock && (
        <div className="flex flex-wrap items-center gap-4 px-1 text-sm">
          <span className="font-medium text-muted-foreground">DNC Status:</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-700 font-medium">Clear</span>
            <span className="text-muted-foreground">-- OK to contact</span>
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 font-medium">DNC</span>
            <span className="text-muted-foreground">-- Do Not Call list</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-700 font-medium">Pending</span>
            <span className="text-muted-foreground">-- DNC check not yet run</span>
          </span>
        </div>
      )}

      {/* Pagination Top */}
      {!showingMock && filteredLeads.length > LEADS_PER_PAGE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1}-{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? "bg-blue-600 text-white" : ""}
                >
                  {page}
                </Button>
              )
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {(showingMock ? baseLeads : paginatedLeads).map((lead) => {
            const isExpanded = expandedLeads.includes(lead.id)
            const isRevealed = lead.isMock || !hiddenLeads.includes(lead.id)

            return (
              <Card
                key={lead.id}
                className={cn(
                  "transition-colors",
                  lead.isMock && "border-dashed border-blue-300 dark:border-blue-700",
                  isExpanded && "ring-1 ring-emerald-500/30"
                )}
              >
                <CardContent className="p-4">
                  {/* Lead Bar - Desktop */}
                  <div
                    className="hidden lg:grid grid-cols-12 gap-4 items-start cursor-pointer"
                    onClick={() => toggleExpanded(lead.id)}
                  >
                    {/* State Badge */}
                    <div className="col-span-1">
                      <div className="w-14 h-14 rounded-lg bg-green-600 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="font-bold text-lg leading-none text-white">{lead.stateAbbr || "--"}</span>
                        <Home className="h-3 w-3 mt-0.5 text-white/70" />
                      </div>
                      {lead.isMock && (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] mt-1">SAMPLE</Badge>
                      )}
                    </div>

                    {/* Owner + APN */}
                    <div className="col-span-2">
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCountyDialog({ state: lead.stateAbbr, county: lead.county })
                          }}
                          title="View county lead counts, contacts & court filing info"
                          className="mt-1 text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                        >
                          {lead.county} County
                        </button>
                      )}
                    </div>

                    {/* Address */}
                    <div className="col-span-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!expandedLeads.includes(lead.id)) toggleExpanded(lead.id)
                              setFocusMapLeadId(lead.id)
                            }}
                            title="Open this property on the lead's Map tab"
                            className="block w-full truncate text-left font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                          >
                            <BlurredText revealed={isRevealed}>{lead.propertyAddress}</BlurredText>
                          </button>
                          <div className="text-sm text-muted-foreground">
                            {lead.city}, {lead.stateAbbr} {lead.zipCode}
                          </div>
                          <ZipLocalTime zipCode={lead.zipCode} stateAbbr={lead.stateAbbr} className="mt-0.5" />
                          {(lead.property.sqft > 0 || lead.property.bedrooms > 0) && (
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-1">
                              {lead.property.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="h-3 w-3" />{lead.property.bedrooms}</span>}
                              {lead.property.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{lead.property.bathrooms}</span>}
                              {lead.property.sqft > 0 && <span className="flex items-center gap-0.5"><Ruler className="h-3 w-3" />{lead.property.sqft.toLocaleString()} sf</span>}
                            </div>
                          )}
                          {lead.property.yearBuilt > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Built {lead.property.yearBuilt}{lead.property.lotSize && ` -- ${lead.property.lotSize} lot`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial */}
                    <div className="col-span-2">
                      {lead.saleAmount > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">${fmt(lead.saleAmount)}</span>
                        </div>
                      )}
                      {lead.taxData.marketValue > 0 && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <TrendingUp className="h-3 w-3" />
                          MV: ${fmt(lead.taxData.marketValue)}
                        </div>
                      )}
                      {lead.overageAmount > 0 && (
                        <>
                          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <DollarSign className="h-3 w-3" />
                            ${fmt(lead.overageAmount)} surplus
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <TrendingUp className="h-3 w-3" />
                            ${fmt(lead.overageAmount * 0.30)} fee
                          </div>
                        </>
                      )}
                      {lead.saleDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Sale: {new Date(lead.saleDate).toLocaleDateString()}
                        </div>
                      )}
                      {lead.assignedAt && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <FileStack className="h-3 w-3" />
                          Issued: {new Date(lead.assignedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Contact + Actions */}
                    <div className="col-span-3">
                      {lead.primaryPhone ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <DncStatusIcon lead={lead} />
                            <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            {lead.onDnc ? (
                              <span className="text-sm font-medium text-red-400 line-through cursor-not-allowed" title="On Do Not Call list - all contact disabled">
                                <BlurredText revealed={isRevealed}>{lead.primaryPhone}</BlurredText>
                              </span>
                            ) : lead.badPhone ? (
                              <span className="text-sm font-medium text-red-500 line-through cursor-not-allowed" title="You marked this phone as bad - skip it">
                                <BlurredText revealed={isRevealed}>{lead.primaryPhone}</BlurredText>
                              </span>
                            ) : (
                              <button
                                className="text-sm font-medium text-emerald-700 hover:underline cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); if (lead.isMock) { openSmsPreview(lead.id, lead.primaryPhone, lead.ownerName); return } if (!isRevealed) return; if (hasTextbee) { openSmsPreview(lead.id, lead.primaryPhone, lead.ownerName) } else { setCommsGate("sms") } }}
                              >
                                <BlurredText revealed={isRevealed}>{lead.primaryPhone}</BlurredText>
                              </button>
                            )}
                            {!lead.onDnc && isRevealed && !lead.isMock && (
                              <button
                                title={lead.badPhone ? "Restore phone (mark good)" : "Mark phone as bad"}
                                onClick={(e) => { e.stopPropagation(); flagLead(lead.id, "bad_phone", !lead.badPhone) }}
                                className={cn("ml-0.5 shrink-0 rounded p-0.5 hover:bg-muted", lead.badPhone ? "text-emerald-600" : "text-muted-foreground hover:text-red-600")}
                              >
                                {lead.badPhone ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                          {/* Every OTHER number on the lead. Previously only primary and
                              secondary ever rendered, so a third number an agent added
                              (a relative, a gatekeeper) was saved but never shown again. */}
                          {isRevealed && lead.allPhones.filter((p) => p.replace(/\D/g, "").slice(-10) !== lead.primaryPhone.replace(/\D/g, "").slice(-10)).map((p) => {
                            const isBad = lead.badPhones.some((b) => b.replace(/\D/g, "").slice(-10) === p.replace(/\D/g, "").slice(-10))
                            return (
                              <div key={p} className="flex items-center gap-1.5 pl-5">
                                <Phone className={cn("h-3 w-3 shrink-0", isBad ? "text-red-400" : "text-emerald-600/70")} />
                                {isBad ? (
                                  <span className="text-xs font-medium text-red-500 line-through" title="You marked this number bad - outreach skips it">{p}</span>
                                ) : (
                                  <button
                                    className="text-xs font-medium text-emerald-700 hover:underline cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); if (hasTextbee) { openSmsPreview(lead.id, p, lead.ownerName) } else { setCommsGate("sms") } }}
                                    title="Also on this lead - click to text this number"
                                  >
                                    {p}
                                  </button>
                                )}
                                <span className="text-[10px] text-muted-foreground">also on file</span>
                                {!lead.isMock && (
                                  <button
                                    title={isBad ? "Restore this number (mark good)" : "Mark THIS number bad"}
                                    onClick={(e) => { e.stopPropagation(); flagLead(lead.id, "bad_phone_value", !isBad, p) }}
                                    className={cn("shrink-0 rounded p-0.5 hover:bg-muted", isBad ? "text-emerald-600" : "text-muted-foreground hover:text-red-600")}
                                  >
                                    {isBad ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                  </button>
                                )}
                              </div>
                            )
                          })}
                          {!lead.onDnc && !lead.badPhone && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <VoiceDropBtn lead={lead} sending={!!sendingVoiceDrop[lead.id]} onSend={sendVoiceDrop} hasSlybroadcast={hasSlybroadcast} onNeedCreds={() => setCommsGate("voice")} />
                            </div>
                          )}
                          {lead.onDnc && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              DNC - All contact disabled
                            </Badge>
                          )}
                          {lead.primaryEmail && (
                            <div className="flex items-center gap-1">
                              {lead.badEmail ? (
                                <span className="flex items-center gap-1.5 px-1 -mx-1" title="You marked this email as bad - skip it">
                                  <Mail className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-500 line-through truncate max-w-[140px]">
                                    <BlurredText revealed={isRevealed}>{lead.primaryEmail}</BlurredText>
                                  </span>
                                </span>
                              ) : (
                                <button
                                  className="flex items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950 rounded px-1 -mx-1 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); if (isRevealed) openEmailDraft(lead.id, lead.primaryEmail!, lead.ownerName) }}
                                >
                                  <Mail className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-blue-600 truncate max-w-[140px]">
                                    <BlurredText revealed={isRevealed}>{lead.primaryEmail}</BlurredText>
                                  </span>
                                </button>
                              )}
                              {isRevealed && !lead.isMock && (
                                <button
                                  title={lead.badEmail ? "Restore email (mark good)" : "Mark email as bad"}
                                  onClick={(e) => { e.stopPropagation(); flagLead(lead.id, "bad_email", !lead.badEmail) }}
                                  className={cn("shrink-0 rounded p-0.5 hover:bg-muted", lead.badEmail ? "text-emerald-600" : "text-muted-foreground hover:text-red-600")}
                                >
                                  {lead.badEmail ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                </button>
                              )}
                            </div>
                          )}
                          {!lead.primaryEmail && !lead.isMock && (
                            /* Has a phone but no email — let the agent add one inline. */
                            <div onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleAddContact(lead.id, "email")}
                                className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                title="Add an email you found for this claimant"
                              >
                                <Mail className="h-3 w-3" /> Add email
                              </button>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-1">
                            <LeadTypeBadge lead={lead} />
                            {lead.agentStatus === "dead" && <Badge className="bg-red-600 text-white border-red-700 text-[10px] px-1.5 py-0">Dead</Badge>}
                            {lead.agentStatus === "bad" && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">Bad Lead</Badge>}
                          </div>
                          <OutreachStatus lead={lead} />
                        </div>
                      ) : (
                        /* No phone on file. This used to be a dead end — no way to add a
                           phone OR an email (the email block lives in the has-phone branch),
                           which is why imported leads looked un-editable. Give the agent the
                           add actions right here where they look for the contact info. */
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="text-xs">No phone on file</span>
                          </div>
                          {lead.primaryEmail && (
                            <button
                              className="flex items-center gap-1.5 rounded px-1 -mx-1 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950"
                              onClick={(e) => { e.stopPropagation(); if (isRevealed) openEmailDraft(lead.id, lead.primaryEmail!, lead.ownerName) }}
                            >
                              <Mail className="h-3 w-3 text-blue-600" />
                              <span className="max-w-[140px] truncate text-xs text-blue-600">
                                <BlurredText revealed={isRevealed}>{lead.primaryEmail}</BlurredText>
                              </span>
                            </button>
                          )}
                          {!lead.isMock && (
                            <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleAddContact(lead.id, "phone")}
                                className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                title="Add a phone number you found for this claimant"
                              >
                                <Phone className="h-3 w-3" /> Add phone
                              </button>
                              {!lead.primaryEmail && (
                                <button
                                  onClick={() => handleAddContact(lead.id, "email")}
                                  className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                  title="Add an email you found for this claimant"
                                >
                                  <Mail className="h-3 w-3" /> Add email
                                </button>
                              )}
                            </div>
                          )}
                          <LeadTypeBadge lead={lead} />
                        </div>
                      )}
                    </div>

                    {/* Status + Countdown */}
                    <div className="col-span-1 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Badge className={statusColors[lead.status] || "bg-gray-100 text-gray-800"}>
                          {lead.status.replaceAll("_", " ")}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <RecoveryCountdown saleDate={lead.saleDate || null} stateAbbr={lead.stateAbbr} compact />
                    </div>
                  </div>

                  {/* Lead Bar - Mobile */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => toggleExpanded(lead.id)}>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-600 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="font-bold text-base leading-none text-white">{lead.stateAbbr || "--"}</span>
                          <Home className="h-2.5 w-2.5 mt-0.5 text-white/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            <BlurredText revealed={isRevealed}>{lead.ownerName}</BlurredText>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {lead.city}, {lead.stateAbbr}
                          </div>
                          <ZipLocalTime zipCode={lead.zipCode} stateAbbr={lead.stateAbbr} className="mt-0.5" />
                          {lead.overageAmount > 0 && (
                            <div className="text-xs font-semibold text-emerald-600 mt-0.5">
                              ${fmt(lead.overageAmount)} surplus
                            </div>
                          )}
                          {lead.assignedAt && (
                            <div className="text-xs text-blue-600 font-medium mt-0.5">
                              Issued: {new Date(lead.assignedAt).toLocaleDateString()}
                            </div>
                          )}
                          {lead.isMock && <Badge className="bg-blue-100 text-blue-700 text-[10px] mt-1">SAMPLE</Badge>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={statusColors[lead.status] || "bg-gray-100 text-gray-800"}>
                          {lead.status.replaceAll("_", " ")}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <RecoveryCountdown saleDate={lead.saleDate || null} stateAbbr={lead.stateAbbr} compact />
                  </div>

                  {/* Expanded Detail Section */}
                  {isExpanded && (
                    <LeadDropdown
                      lead={lead}
                      initialTab={focusMapLeadId === lead.id ? "map" : undefined}
                      revealed={isRevealed}
                      onReveal={() => toggleReveal(lead.id)}
                      onShowUpgrade={() => setShowUpgradePopup(true)}
                      onEmailDraft={() => {
                        if (!isRevealed) { toggleReveal(lead.id); return }
                        if (!lead.primaryEmail) { setShowNoEmailNotice(true); return }
                        openEmailDraft(lead.id, lead.primaryEmail, lead.ownerName)
                      }}
                      onSms={lead.primaryPhone && isRevealed && !lead.onDnc ? () => openSmsPreview(lead.id, lead.primaryPhone, lead.ownerName) : undefined}
                      onCertifiedLetter={lead.mailingAddress && lead.mailingAddress.toLowerCase().trim() !== lead.propertyAddress.toLowerCase().trim() && isRevealed ? () => openCertLetterModal(lead.id, lead.ownerName, lead.mailingAddress) : undefined}
                      voiceDropSending={sendingVoiceDrop[lead.id]}
                      onVoiceDrop={sendVoiceDrop}
                      hasSlybroadcast={hasSlybroadcast}
                      hasTextbee={hasTextbee}
                      onNeedCreds={(ch) => setCommsGate(ch)}
                      pinId={activePinId}
                      onFlag={flagLead}
                      onDelete={handleDeleteLead}
                      onAddContact={handleAddContact}
                      onDncCheck={handleDncCheck}
                      onEmailTo={(em) => openEmailDraft(lead.id, em, lead.ownerName)}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination Bottom */}
      {!showingMock && filteredLeads.length > LEADS_PER_PAGE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1}-{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? "bg-blue-600 text-white" : ""}
                >
                  {page}
                </Button>
              )
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* No Results */}
      {importedOnly && !loading && filteredLeads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileStack className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No imported leads yet</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV above and your leads will appear here -- ready for SMS, email,
              certified mail, and ringless voicemail.
            </p>
          </CardContent>
        </Card>
      )}

      {!importedOnly && !showingMock && !loading && filteredLeads.length === 0 && leads.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No matching leads</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Try adjusting your search or filters.
            </p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(""); setSelectedState("All States"); setSelectedStatus("all"); setSelectedDesignation("all") }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Email Draft Preview Modal */}
      {emailDraftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEmailDraftModal(null)}>
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Draft Preview
                {emailPreview?.hispanicDetected && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 rounded-full">
                    Hispanic Name Detected
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Draft for <strong>{emailDraftModal.ownerName}</strong> &rarr; {emailDraftModal.to}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden space-y-3">
              {emailDraftLoading && !emailPreview && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading preview...</span>
                </div>
              )}
              {emailPreview && (
                <>
                  <div className="flex gap-1 border rounded-lg p-1 bg-slate-100 w-fit">
                    <button
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${emailPreviewLang === "en" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      onClick={() => setEmailPreviewLang("en")}
                    >
                      English
                    </button>
                    <button
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${emailPreviewLang === "es" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      onClick={() => setEmailPreviewLang("es")}
                    >
                      Espanol
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 text-sm border rounded-lg p-3 bg-slate-50">
                    <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{agentName} &middot; Foreclosure Recovery</span></div>
                    <div><span className="text-muted-foreground">Replies to:</span> <span className="font-medium">{(emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview).from}</span> <span className="text-xs text-muted-foreground">(sent through our secure delivery service)</span></div>
                    {/* Recipient is EDITABLE. It used to be read-only text, so an agent
                        who needed to send to a second address on the lead (a relative or
                        gatekeeper forwarding to the claimant) had no way to change it —
                        the only switcher was behind the PIN-reveal gate on the row and
                        was invisible until the PIN was entered. */}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground whitespace-nowrap">To:</span>
                      <select
                        value={emailDraftModal.to}
                        onChange={(e) => setEmailDraftModal((m) => (m ? { ...m, to: e.target.value } : m))}
                        className="h-8 flex-1 min-w-0 rounded-md border border-input bg-white px-2 text-sm font-medium"
                      >
                        {Array.from(
                          new Set(
                            [
                              emailDraftModal.to,
                              ...((leads.find((l) => l.id === emailDraftModal.leadId)?.allEmails) || []),
                            ].filter(Boolean)
                          )
                        ).map((em) => (
                          <option key={em} value={em}>{em}</option>
                        ))}
                      </select>
                    </div>
                    {(leads.find((l) => l.id === emailDraftModal.leadId)?.allEmails || []).length > 1 && (
                      <p className="text-xs text-muted-foreground -mt-1">
                        This claimant has more than one address on file — pick who this goes to.
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground whitespace-nowrap">Subject:</span>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="h-8 text-sm font-medium bg-white"
                        placeholder="Email subject"
                      />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                    Click directly on any wording in the message below and type to change it. Scroll
                    inside the message to read all of it, including the part under the agreement note.
                  </p>

                  {/* Contingency agreement — full agent control before anything goes out */}
                  {emailDraftModal.leadId !== MOCK_LEAD.id && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-700" />
                        <span className="text-sm font-semibold text-amber-900">
                          Contingency agreement {agreementIsCustom && <span className="font-normal">(your uploaded copy)</span>}
                        </span>
                        <span className="text-xs text-amber-800">attached automatically when you send</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" disabled={!!agreementBusy}
                          onClick={() => agreementAction("agreement")}
                          className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                          {agreementBusy === "download" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                          Download &amp; review
                        </Button>
                        <Button size="sm" variant="outline" disabled={!!agreementBusy}
                          onClick={() => agreementFileRef.current?.click()}
                          className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                          {agreementBusy === "upload" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                          Upload edited version
                        </Button>
                        {agreementIsCustom && (
                          <Button size="sm" variant="outline" disabled={!!agreementBusy}
                            onClick={() => agreementAction("agreement_reset")}
                            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                            {agreementBusy === "reset" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
                            Use standard again
                          </Button>
                        )}
                        <input
                          ref={agreementFileRef}
                          type="file"
                          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0]
                            e.target.value = ""
                            if (!f) return
                            const buf = await f.arrayBuffer()
                            let bin = ""
                            const bytes = new Uint8Array(buf)
                            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
                            await agreementAction("agreement_upload", btoa(bin))
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-amber-800">
                        Download it to check the numbers and wording first. Need a change? Edit the file and upload it —
                        your copy gets attached to this claimant instead of the standard one.
                      </p>
                      {agreementNote && <p className="mt-1.5 text-xs font-medium text-amber-900">{agreementNote}</p>}
                    </div>
                  )}
                  <div
                    ref={emailPreviewWrapRef}
                    // 42vh on desktop cut the message off so the agent could not reach the
                    // text under the agreement block; give it real room on both sizes.
                    className="border-2 border-blue-200 rounded-lg overflow-auto max-h-[70vh] sm:max-h-[68vh] bg-white"
                    style={{ height: `${Math.round(900 * emailPreviewScale)}px` }}
                  >
                    <iframe
                      key={emailPreviewLang}
                      ref={emailBodyRef}
                      srcDoc={(emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview).html}
                      className="border-0"
                      style={{
                        width: `${EMAIL_PREVIEW_W}px`,
                        height: "900px",
                        transform: `scale(${emailPreviewScale})`,
                        transformOrigin: "0 0",
                      }}
                      title="Email preview"
                      sandbox="allow-same-origin"
                      onLoad={(e) => {
                        // Make the body editable in place so the agent can tweak the wording.
                        // contentEditable alone was not reliably taking (agents reported "it
                        // will not let me click and edit anything"), so also set designMode
                        // and give the caret something to land on. Belt and braces.
                        try {
                          const doc = (e.currentTarget as HTMLIFrameElement).contentDocument
                          if (!doc?.body) return
                          doc.body.contentEditable = "true"
                          doc.body.style.outline = "none"
                          doc.body.style.cursor = "text"
                          try { doc.designMode = "on" } catch { /* some browsers refuse */ }
                          doc.body.addEventListener("click", () => {
                            try { doc.body.focus() } catch { /* ignore */ }
                          })
                        } catch { /* ignore */ }
                      }}
                    />
                  </div>
                </>
              )}
              {emailDraftResult && (
                <div className={`p-3 rounded-lg text-sm ${emailDraftResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                  {emailDraftResult.success ? (
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {emailDraftResult.message}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" />
                      {emailDraftResult.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="flex flex-wrap items-center justify-end gap-2 p-6 pt-0">
              {emailDraftModal.leadId === MOCK_LEAD.id && (
                <p className="mr-auto text-xs text-muted-foreground">
                  This is a sample of the email sent on your behalf. Your name and extension fill in automatically once you upgrade.
                </p>
              )}
              <Button variant="outline" onClick={() => { setEmailDraftModal(null); setEmailDraftResult(null) }}>
                Close
              </Button>
              {emailPreview && !emailDraftResult?.success && (
                <Button
                  onClick={handleSendClick}
                  disabled={emailSending || !emailSubject.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {emailSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Email
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* One-time "you can send from here now" notice — shows the first time an agent
          hits Send, then never again once acknowledged (persisted server-side). */}
      {showSendNotice && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowSendNotice(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                New: send claimant emails right here
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Good news &mdash; you no longer need to log into your business email to send a homeowner&rsquo;s
                first-touch email. Review and edit your message here, hit Send, and it goes out for you automatically
                from the dashboard. You can still log into your business email anytime to correspond with a homeowner
                directly &mdash; only these first-touch claimant emails now send from here instead of your business
                email Drafts folder.
              </p>
              <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noticeChecked}
                  onChange={(e) => setNoticeChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span>I understand this change and don&rsquo;t need to see this notice again.</span>
              </label>
            </CardContent>
            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowSendNotice(false)}>
                Close
              </Button>
              <Button
                onClick={async () => {
                  // Always sends. The checkbox only decides whether the notice is
                  // dismissed for good — unchecked sends this time but shows again next.
                  if (noticeChecked) await ackSendNotice()
                  setShowSendNotice(false)
                  sendEmailNow()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Got it, send my email
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Outreach not-connected popup */}
      {commsGate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCommsGate(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {commsGate === "voice" ? <Volume2 className="h-5 w-5 text-emerald-600" /> : <MessageSquare className="h-5 w-5 text-violet-600" />}
                {commsGate === "voice" ? "Ringless voicemail not connected" : "SMS not connected"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This button activates once you connect your {commsGate === "voice" ? "SlyBroadcast (ringless voicemail)" : "TextBee (SMS)"} account.
                Go to <strong>My Account &rarr; Outreach Integrations</strong> and save your credentials to turn it on for every lead.
                Until then you can still call and text manually, and create email drafts.
              </p>
              {/* The blocking step for SlyBroadcast lives on slybroadcast.com (API
                  access must be enabled there), so "Go to My Account" alone never
                  unblocked anyone. Put the guide one click away at the exact moment
                  they hit the wall. */}
              <Button
                variant="outline"
                className="w-full border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                disabled={guideSending !== null}
                onClick={async () => {
                  const which = commsGate === "voice" ? "slybroadcast" : "textbee"
                  setGuideSending(which)
                  try {
                    const r = await fetch("/api/user/send-guide", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ guide: which }),
                    })
                    const j = await r.json().catch(() => ({}))
                    setGuideSent(r.ok ? (j.to || "your email") : null)
                    if (!r.ok) alert(j?.error || "Could not send the guide. Please try again.")
                  } catch {
                    alert("Could not send the guide. Please try again.")
                  } finally {
                    setGuideSending(null)
                  }
                }}
              >
                {guideSending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="h-4 w-4 mr-2" /> Send me the {commsGate === "voice" ? "SLY" : "TextBee"} Connection Guide</>
                )}
              </Button>
              {guideSent && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  Sent to <strong>{guideSent}</strong>. Check your inbox — the full step-by-step is attached as a PDF.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setCommsGate(null); setGuideSent(null) }}>Close</Button>
                <Button onClick={() => { setCommsGate(null); window.location.href = "/dashboard/settings" }}>Go to My Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SMS Preview Modal */}
      {smsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSmsModal(null); setSmsResult(null) }}>
          <Card className="w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                SMS Preview
              </CardTitle>
              <CardDescription>
                To <strong>{smsModal.ownerName}</strong> at {smsModal.phone}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {smsLoading && !smsPreview && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading preview...</span>
                </div>
              )}
              {smsPreview && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Language</span>
                    <div className="inline-flex rounded-md border overflow-hidden">
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs font-medium ${smsLang === "en" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                        onClick={() => smsLang !== "en" && reloadSmsPreview("en")}
                        disabled={smsLoading || !!smsResult?.success}
                      >English</button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs font-medium border-l ${smsLang === "es" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                        onClick={() => smsLang !== "es" && reloadSmsPreview("es")}
                        disabled={smsLoading || !!smsResult?.success}
                      >Espa&ntilde;ol</button>
                    </div>
                    {smsLang === "es" && (
                      <span className="text-[11px] text-muted-foreground">Spanish text for a Spanish-speaking claimant</span>
                    )}
                  </div>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    rows={6}
                    value={smsEditMessage}
                    onChange={(e) => setSmsEditMessage(e.target.value)}
                    disabled={smsLoading || !!smsResult?.success}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{smsEditMessage.length} characters</span>
                    <span>{Math.ceil(smsEditMessage.length / 160)} SMS segment{Math.ceil(smsEditMessage.length / 160) !== 1 ? "s" : ""}</span>
                  </div>
                  {/* Agreement e-sign link — same link the email uses, so the claimant
                      can review and sign right from their phone. */}
                  {smsPreview.signLink && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-700" />
                        <span className="text-sm font-semibold text-emerald-900">Agreement sign link included</span>
                      </div>
                      <p className="mt-1 break-all font-mono text-[11px] text-emerald-800">{smsPreview.signLink}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline"
                          className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
                          onClick={() => { navigator.clipboard?.writeText(smsPreview.signLink || "") }}>
                          Copy link
                        </Button>
                        {smsEditMessage.includes(smsPreview.signLink) ? (
                          <Button size="sm" variant="outline"
                            className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
                            onClick={() => setSmsEditMessage(smsEditMessage.replace(new RegExp("\\n*Review & sign your agreement here: " + smsPreview.signLink!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "").trim())}>
                            Remove from text
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline"
                            className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
                            onClick={() => setSmsEditMessage(`${smsEditMessage}\n\nReview & sign your agreement here: ${smsPreview.signLink}`)}>
                            Add back to text
                          </Button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-emerald-800">
                        This is the same agreement link the email sends — the claimant can review and sign on their phone.
                      </p>
                    </div>
                  )}
                </>
              )}
              {smsResult && (
                <div className={`p-3 rounded-lg text-sm ${smsResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                  {smsResult.success ? (
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {smsResult.message}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" />
                      {smsResult.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              {smsModal.leadId === MOCK_LEAD.id && (
                <p className="mr-auto text-xs text-muted-foreground">
                  This is a sample of the text sent on your behalf. Your name fills in automatically once you upgrade.
                </p>
              )}
              <Button variant="outline" onClick={() => { setSmsModal(null); setSmsResult(null) }}>
                Close
              </Button>
              {smsPreview && !smsResult?.success && smsModal.leadId !== MOCK_LEAD.id && (
                <Button
                  onClick={sendSms}
                  disabled={smsLoading || !smsEditMessage.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {smsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Approve &amp; Send
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Certified Letter Modal */}
      {showCertCredits && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCertCredits(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-orange-600" />Certified Letter Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>Each week you get <strong>{credits?.freeLimit ?? 5} free certified letters</strong> — we print and mail them to your claimants at no cost. Beyond that, certified letters are <strong>${credits?.pricePerLetter ?? 10} each</strong> (print + certified mailing), or you can wait for your free credits to reset <strong>Monday at noon</strong>.</p>
              {credits ? (
                <div className="rounded-lg border p-3 bg-orange-50/50 space-y-1">
                  <div className="flex justify-between"><span>Free used this week</span><span className="font-semibold">{credits.isAdmin ? "Unlimited (admin)" : `${credits.freeUsed} / ${credits.freeLimit}`}</span></div>
                  <div className="flex justify-between"><span>Free remaining</span><span className="font-bold text-orange-700">{credits.isAdmin ? "∞" : credits.freeRemaining}</span></div>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>Free credits reset</span><span>{new Date(credits.resetAt).toLocaleString()}</span></div>
                </div>
              ) : <p className="text-muted-foreground">Loading your credits…</p>}
              <div className="border-t pt-3">
                <p className="font-medium mb-2">Need to mail more this week? Request paid certified letters:</p>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={500} value={creditQty} onChange={(e) => setCreditQty(Math.max(1, Number(e.target.value) || 1))} className="w-24 border rounded px-2 py-1" />
                  <span className="text-muted-foreground">× ${credits?.pricePerLetter ?? 10} = <strong>${((credits?.pricePerLetter ?? 10) * creditQty).toFixed(2)}</strong></span>
                </div>
                <Button disabled={creditReqLoading} onClick={requestCredits} className="mt-3 bg-orange-600 hover:bg-orange-700 text-white">
                  {creditReqLoading ? "Sending…" : "Request & Get Invoice"}
                </Button>
                {creditReqResult?.ok && <p className="text-emerald-600 mt-2">{creditReqResult.message}</p>}
                {creditReqResult?.error && <p className="text-red-600 mt-2">{creditReqResult.error}</p>}
                <p className="text-xs text-muted-foreground mt-2">We email you an invoice for the total. Once paid, we print and mail those certified letters to your leads&apos; current addresses.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCreditsExhausted && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreditsExhausted(null)}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <MailCheck className="h-5 w-5" />
                {showCreditsExhausted.reason === "free_month_over" ? "Free Certified Letters Used Up" : "Out of Free Certified Letters This Week"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {showCreditsExhausted.reason === "free_month_over" ? (
                <p>
                  Your <strong>free month of certified letters</strong> (5 per week for your first
                  month) is used up. To keep having us print &amp; mail them, it&apos;s{" "}
                  <strong>${(showCreditsExhausted.pricePerLetter ?? 12.5).toFixed(2)} per letter</strong>{" "}
                  for shipping &amp; handling. Or print and mail your own for free — see below.
                </p>
              ) : (
                <p>
                  You&apos;ve used all <strong>{showCreditsExhausted.freeLimit ?? 5} free certified letters</strong> for
                  this week. Your free credits reset <strong>Monday at noon</strong>
                  {showCreditsExhausted.resetAt ? ` (${new Date(showCreditsExhausted.resetAt).toLocaleDateString()})` : ""}.
                  You can also print and mail your own now — see below.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => { setShowCreditsExhausted(null); openCertCredits() }} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {showCreditsExhausted.reason === "free_month_over" ? `Pay $${(showCreditsExhausted.pricePerLetter ?? 12.5).toFixed(2)}/letter` : "Purchase Credits"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreditsExhausted(null)}>
                  {showCreditsExhausted.reason === "free_month_over" ? "Close" : "Wait Until Monday"}
                </Button>
              </div>

              {/* Print-your-own alternative + steps */}
              {showCreditsExhausted.canPrintOwn && showCreditsExhausted.leadId && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="font-semibold text-emerald-800">Or print &amp; mail your own — free</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[13px] text-slate-700">
                    <li>Click <strong>Download my letters</strong> below. You&apos;ll get 3 files: the cover letter, the contingency agreement, and the limited power of attorney — all personalized for {showCreditsExhausted.ownerName || "this claimant"} under your name.</li>
                    <li>Print all three on your own printer.</li>
                    <li>Mail them to the claimant&apos;s <strong>mailing address</strong> (not the foreclosed property) via USPS Certified Mail at the post office, and keep the tracking receipt.</li>
                  </ol>
                  <Button
                    onClick={() => printOwnLetters(showCreditsExhausted.leadId, showCreditsExhausted.ownerName)}
                    disabled={printingOwn}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {printingOwn ? "Preparing…" : "Download my letters"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {certLetterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setCertLetterModal(null); setCertLetterResult(null) }}>
          <Card className="w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MailCheck className="h-5 w-5 text-orange-600" />
                Request Certified Letter
              </CardTitle>
              <CardDescription>
                Mail certified letter to <strong>{certLetterModal.ownerName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 border text-sm space-y-1">
                <div><span className="font-medium text-muted-foreground">Mailing Address:</span></div>
                <div className="font-medium">{certLetterModal.mailingAddress}</div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes (optional)</label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50"
                  rows={3}
                  placeholder="Any special instructions for this certified letter..."
                  value={certLetterNotes}
                  onChange={(e) => setCertLetterNotes(e.target.value)}
                  disabled={certLetterLoading || !!certLetterResult?.success}
                />
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
                <strong>Documents included:</strong> Outreach Letter, Contingency Fee Agreement (pre-filled), Limited Power of Attorney. All will be printed and mailed via USPS Certified Mail within 24 hours.
              </div>
              {certLetterResult && (
                <div className={`p-3 rounded-lg text-sm ${certLetterResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                  {certLetterResult.success ? (
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {certLetterResult.message}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" />
                      {certLetterResult.error}
                    </div>
                  )}
                </div>
              )}
              {!certLetterResult?.success && (
                <p className="text-xs text-muted-foreground">
                  Prefer to mail it yourself? Use <strong>Print my own</strong> to download the cover
                  letter, contingency agreement, and limited power of attorney — print all three and
                  mail them to the claimant&apos;s mailing address via USPS Certified Mail.
                </p>
              )}
            </CardContent>
            <div className="flex flex-wrap justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => { setCertLetterModal(null); setCertLetterResult(null) }}>
                Close
              </Button>
              {!certLetterResult?.success && (
                <Button
                  variant="outline"
                  onClick={() => printOwnLetters(certLetterModal.leadId, certLetterModal.ownerName)}
                  disabled={printingOwn}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {printingOwn ? "Preparing…" : "Print my own"}
                </Button>
              )}
              {!certLetterResult?.success && (
                <Button
                  onClick={submitCertLetter}
                  disabled={certLetterLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {certLetterLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MailCheck className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Bottom CTA */}
      {showingMock && (
        <Card className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="pt-6 pb-6 text-center">
            <h3 className="text-lg font-bold mb-2">Ready to Start Recovering Funds?</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Request your leads now and start connecting foreclosed homeowners with their unclaimed surplus funds.
              Your {ACCOUNT_LABELS[activeAccountType] || "Basic"} account includes up to {maxLeads} leads.
            </p>
            <Button
              onClick={() => { setShowRequestModal(true); setRequestSuccess(false) }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-md"
            >
              <Send className="h-4 w-4 mr-2" />
              Request My {maxLeads} Leads
            </Button>
          </CardContent>
        </Card>
      )}

      {/* County popup — same data the foreclosure-map county click shows */}
      {countyDialog && (
        <CountyInfoDialog
          stateAbbr={countyDialog.state}
          countyName={countyDialog.county}
          open
          onClose={() => setCountyDialog(null)}
          isOwnerOperator={isAdmin || ["owner_operator", "junior_owner_operator", "partnership"].includes(activeAccountType)}
        />
      )}
    </div>
  )
}

export default function MyLeadsPage() {
  const { openAgentManager } = useAgentManager()
  return <LeadsWorkspace />
}
