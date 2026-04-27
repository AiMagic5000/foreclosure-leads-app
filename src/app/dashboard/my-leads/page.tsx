"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { RecoveryCountdown } from "@/components/recovery-countdown"
import { ZipLocalTime } from "@/components/zip-local-time"
import {
  FileStack,
  Loader2,
  Phone,
  Mail,
  MapPin,
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
  primaryEmail: string | null
  secondaryEmail: string | null
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
  mailingAddress: string
  certifiedLetterRequested: boolean
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
  primaryEmail: "j.smith.example@email.com",
  secondaryEmail: null,
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
  mailingAddress: "5678 Elm Street, Tampa, FL 33602",
  certifiedLetterRequested: false,
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
    defaultAmount: 32000,
    noticeType: "Lis Pendens",
  },
  saleHistory: [
    { date: "2003-08-01", price: 198000, type: "Purchase", buyer: "John & Mary Smith", seller: "DR Horton Inc." },
  ],
}

const LEAD_LIMITS: Record<string, number> = {
  basic: 10,
  free_webcast: 10,
  partnership: 25,
  owner_operator: 50,
  admin: 9999,
}

const ACCOUNT_LABELS: Record<string, string> = {
  basic: "Basic",
  partnership: "Partnership",
  owner_operator: "Owner Operator",
  admin: "Admin",
}

/* ===== UTILITY COMPONENTS ===== */

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

function VoiceDropBtn({ lead, sending, onSend }: { lead: LeadData; sending: boolean; onSend: (id: string) => void }) {
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
  const marketValue = Number(row.estimated_market_value) || 0
  const dbOverage = Number(row.overage_amount) || 0

  let estimatedSurplus = dbOverage
  if (!estimatedSurplus && saleAmount > 0) {
    if (mortgageAmount > 0 && saleAmount > mortgageAmount) {
      estimatedSurplus = saleAmount - mortgageAmount
    } else if (marketValue > 0 && saleAmount > marketValue * 0.8) {
      estimatedSurplus = Math.round(saleAmount - marketValue * 0.8)
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
    mailingAddress: String(row.mailing_address || ""),
    certifiedLetterRequested: Boolean(row.certified_letter_requested),
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
      defaultAmount: 0,
      noticeType: "",
    },
  }
}

/* ===== LEAD DROPDOWN (Matches Admin Leads Page) ===== */

function LeadDropdown({ lead, revealed, onReveal, onShowUpgrade, onEmailDraft, onSms, onCertifiedLetter, voiceDropSending, onVoiceDrop }: { lead: LeadData; revealed: boolean; onReveal: () => void; onShowUpgrade: () => void; onEmailDraft?: () => void; onSms?: () => void; onCertifiedLetter?: () => void; voiceDropSending?: boolean; onVoiceDrop?: (id: string) => void }) {
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
            <VoiceDropBtn lead={lead} sending={!!voiceDropSending} onSend={onVoiceDrop} />
          ) : (
            <ActionButton icon={Volume2} label="Voice Drop" color="emerald" onShowUpgrade={onShowUpgrade} />
          )}
          {onSms ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSms() }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 cursor-pointer transition-colors"
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
              onClick={(e) => { e.stopPropagation(); onCertifiedLetter() }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                lead.certifiedLetterRequested
                  ? "bg-amber-100 text-amber-700 cursor-default"
                  : "bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
              )}
              disabled={lead.certifiedLetterRequested}
            >
              <MailCheck className="h-3 w-3" />
              {lead.certifiedLetterRequested ? "Letter Requested" : "Certified Letter"}
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
                <p className="text-xl font-bold text-emerald-600">${fmt(lead.foreclosureDetails.estimatedSurplus)}</p>
                <p className="text-xs text-muted-foreground">Est. Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-700">${fmt(lead.foreclosureDetails.estimatedSurplus * 0.30)}</p>
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
              <DataRow label="Estimated Surplus" value={`$${fmt(lead.foreclosureDetails.estimatedSurplus)}`} icon={DollarSign} />
            </div>
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Recovery Opportunity</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${fmt(lead.foreclosureDetails.estimatedSurplus)}</p>
                <p className="text-xs text-muted-foreground">Estimated Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${fmt(lead.foreclosureDetails.estimatedSurplus * 0.30)}</p>
                <p className="text-xs text-muted-foreground">30% Service Fee</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${fmt(lead.foreclosureDetails.estimatedSurplus * 0.30 * 0.85)}</p>
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

/* ===== MAIN PAGE ===== */

export default function MyLeadsPage() {
  const { isAdmin, pinId, accountType, isLoading: pinLoading } = usePin()
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLeads, setExpandedLeads] = useState<string[]>([])
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

  // Admin view-as-user
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; package_type: string; account_type: string; is_active: boolean }[]>([])
  const [viewAsUserId, setViewAsUserId] = useState<string>("")
  const [viewAsLabel, setViewAsLabel] = useState<string>("")

  const activePinId = viewAsUserId || resolvedPinId || pinId
  const activeAccountType = viewAsUserId
    ? (allUsers.find((u) => u.id === viewAsUserId)?.account_type || "basic")
    : accountType
  const maxLeads = LEAD_LIMITS[activeAccountType] || 10

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

  const submitLeadRequest = async () => {
    setRequesting(true)
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
      }
    } catch {
      // silently handle
    }
    setRequesting(false)
  }

  // Email draft state
  const [emailDraftModal, setEmailDraftModal] = useState<{ leadId: string; to: string; ownerName: string } | null>(null)
  const [emailPreview, setEmailPreview] = useState<{ subject: string; html: string; to: string; from: string; hispanicDetected?: boolean } | null>(null)
  const [emailPreviewES, setEmailPreviewES] = useState<{ subject: string; html: string; to: string; from: string } | null>(null)
  const [emailPreviewLang, setEmailPreviewLang] = useState<"en" | "es">("en")
  const [emailDraftLoading, setEmailDraftLoading] = useState(false)
  const [emailDraftResult, setEmailDraftResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)

  const openEmailDraft = useCallback(async (leadId: string, to: string, ownerName: string) => {
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
          body: JSON.stringify({ leadId, action: "preview", operatorPinId: activePinId }),
        }),
        fetch("/api/email-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, action: "preview_es", operatorPinId: activePinId }),
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
  }, [activePinId])

  const createEmailDraft = useCallback(async (draftAction: "create_draft_en" | "create_draft_es" | "create_draft_both" = "create_draft_en") => {
    if (!emailDraftModal) return
    if (!activePinId) {
      setEmailDraftResult({ success: false, error: "Your agent profile is still loading. Please wait a moment and try again." })
      return
    }
    setEmailDraftLoading(true)
    setEmailDraftResult(null)
    try {
      const res = await fetch("/api/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: emailDraftModal.leadId, action: draftAction, operatorPinId: activePinId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Draft creation failed")
      setEmailDraftResult({ success: true, message: data.message || "Draft created" })
    } catch (err) {
      setEmailDraftResult({ success: false, error: err instanceof Error ? err.message : "Draft creation failed" })
    } finally {
      setEmailDraftLoading(false)
    }
  }, [emailDraftModal, activePinId])

  // Voice drop state
  const [sendingVoiceDrop, setSendingVoiceDrop] = useState<Record<string, boolean>>({})

  const sendVoiceDrop = useCallback(async (leadId: string) => {
    if (!activePinId) return
    setSendingVoiceDrop(prev => ({ ...prev, [leadId]: true }))
    try {
      const res = await fetch("/api/voice-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, operatorPinId: activePinId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Voice drop failed")
      setLeads(prev => prev.map(l =>
        l.id === leadId
          ? { ...l, voicemailSent: true, voicemailSentAt: new Date().toISOString() }
          : l
      ))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Voice drop failed"
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, voicemailError: msg } : l
      ))
    } finally {
      setSendingVoiceDrop(prev => ({ ...prev, [leadId]: false }))
    }
  }, [activePinId])

  // SMS state
  const [smsModal, setSmsModal] = useState<{ leadId: string; phone: string; ownerName: string } | null>(null)
  const [smsPreview, setSmsPreview] = useState<{ phone: string; message: string; charCount: number; segments: number } | null>(null)
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsResult, setSmsResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)
  const [smsEditMessage, setSmsEditMessage] = useState("")

  const openSmsPreview = useCallback(async (leadId: string, phone: string, ownerName: string) => {
    if (!activePinId) {
      setSmsResult({ success: false, error: "Your agent profile is still loading. Please wait a moment and try again." })
      return
    }
    setSmsModal({ leadId, phone, ownerName })
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
  }, [activePinId])

  const sendSms = useCallback(async () => {
    if (!smsModal || !activePinId) return
    setSmsLoading(true)
    setSmsResult(null)
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: smsModal.leadId, action: "send", customMessage: smsEditMessage, operatorPinId: activePinId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "SMS send failed")
      setSmsResult({ success: true, message: data.message || "SMS sent" })
    } catch (err) {
      setSmsResult({ success: false, error: err instanceof Error ? err.message : "SMS send failed" })
    } finally {
      setSmsLoading(false)
    }
  }, [smsModal, smsEditMessage, activePinId])

  // Certified letter state
  const [certLetterModal, setCertLetterModal] = useState<{ leadId: string; ownerName: string; mailingAddress: string } | null>(null)
  const [certLetterNotes, setCertLetterNotes] = useState("")
  const [certLetterLoading, setCertLetterLoading] = useState(false)
  const [certLetterResult, setCertLetterResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)

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
      if (!res.ok) throw new Error(data.error || "Request failed")
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

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState("All States")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("issued_newest")
  const [currentPage, setCurrentPage] = useState(1)
  const LEADS_PER_PAGE = 25

  const showingMock = leads.length === 0
  const baseLeads = showingMock ? [MOCK_LEAD] : leads

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

      return matchesSearch && matchesState && matchesStatus
    })

    return filtered.sort((a, b) => {
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
  }, [baseLeads, searchQuery, selectedState, selectedStatus, sortBy])

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedState, selectedStatus, sortBy])

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
            {viewAsUserId ? `Viewing: ${viewAsLabel}` : "My Leads"}
          </h1>
          <p className="text-muted-foreground">
            {viewAsUserId ? "Admin view-as-user mode" : "Your assigned foreclosure recovery leads"} --{" "}
            <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {ACCOUNT_LABELS[activeAccountType] || "Basic"} Account
            </Badge>
          </p>
        </div>
        <Button
          onClick={() => { setShowRequestModal(true); setRequestSuccess(false) }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md"
        >
          <Send className="h-4 w-4 mr-2" />
          Request Leads
        </Button>
      </div>

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
          <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {requestSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Request Submitted</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your lead request has been sent to our team. We will assign leads to your account within 1-2 business days.
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
                  As a <strong className="text-emerald-400">{ACCOUNT_LABELS[activeAccountType] || "Basic"}</strong> account, you can request up to <strong className="text-white">{maxLeads}</strong> leads.
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
                    <p className="text-xs text-slate-400 mt-1">Max: {maxLeads} leads</p>
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
                Click <strong>"Request Leads"</strong> to get your leads assigned.
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
            {(searchQuery || selectedState !== "All States" || selectedStatus !== "all") && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <span>{filteredLeads.length} of {leads.length} leads</span>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedState("All States"); setSelectedStatus("all") }}
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
                        <div className="text-xs text-muted-foreground mt-1">{lead.county} County</div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="col-span-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            <BlurredText revealed={isRevealed}>{lead.propertyAddress}</BlurredText>
                          </div>
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
                            ) : (
                              <button
                                className="text-sm font-medium text-emerald-700 hover:underline cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); if (isRevealed) openSmsPreview(lead.id, lead.primaryPhone, lead.ownerName) }}
                              >
                                <BlurredText revealed={isRevealed}>{lead.primaryPhone}</BlurredText>
                              </button>
                            )}
                          </div>
                          {!lead.onDnc && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <VoiceDropBtn lead={lead} sending={!!sendingVoiceDrop[lead.id]} onSend={sendVoiceDrop} />
                            </div>
                          )}
                          {lead.onDnc && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              DNC - All contact disabled
                            </Badge>
                          )}
                          {lead.primaryEmail && (
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-xs">No phone on file</span>
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
                      revealed={isRevealed}
                      onReveal={() => toggleReveal(lead.id)}
                      onShowUpgrade={() => setShowUpgradePopup(true)}
                      onEmailDraft={lead.primaryEmail && isRevealed ? () => openEmailDraft(lead.id, lead.primaryEmail!, lead.ownerName) : undefined}
                      onSms={lead.primaryPhone && isRevealed && !lead.onDnc ? () => openSmsPreview(lead.id, lead.primaryPhone, lead.ownerName) : undefined}
                      onCertifiedLetter={lead.mailingAddress && lead.mailingAddress.toLowerCase().trim() !== lead.propertyAddress.toLowerCase().trim() && isRevealed ? () => openCertLetterModal(lead.id, lead.ownerName, lead.mailingAddress) : undefined}
                      voiceDropSending={sendingVoiceDrop[lead.id]}
                      onVoiceDrop={sendVoiceDrop}
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
      {!showingMock && !loading && filteredLeads.length === 0 && leads.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No matching leads</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Try adjusting your search or filters.
            </p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(""); setSelectedState("All States"); setSelectedStatus("all") }}
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
                  <div className="flex flex-col gap-1 text-sm border rounded-lg p-3 bg-slate-50">
                    <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{(emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview).from}</span></div>
                    <div><span className="text-muted-foreground">To:</span> <span className="font-medium">{(emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview).to}</span></div>
                    <div><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{(emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview).subject}</span></div>
                  </div>
                  <div className="border rounded-lg overflow-auto max-h-[45vh] bg-white">
                    <iframe
                      srcDoc={(emailPreviewLang === "es" && emailPreviewES ? emailPreviewES : emailPreview).html}
                      className="w-full min-h-[400px] border-0"
                      title="Email preview"
                      sandbox="allow-same-origin"
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
            <div className="flex flex-wrap justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => { setEmailDraftModal(null); setEmailDraftResult(null) }}>
                Close
              </Button>
              {emailPreview && !emailDraftResult?.success && (
                <>
                  <Button
                    onClick={() => createEmailDraft("create_draft_en")}
                    disabled={emailDraftLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {emailDraftLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    English Draft
                  </Button>
                  <Button
                    onClick={() => createEmailDraft("create_draft_es")}
                    disabled={emailDraftLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {emailDraftLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    Spanish Draft
                  </Button>
                  <Button
                    onClick={() => createEmailDraft("create_draft_both")}
                    disabled={emailDraftLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {emailDraftLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Both
                  </Button>
                </>
              )}
            </div>
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
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => { setSmsModal(null); setSmsResult(null) }}>
                Close
              </Button>
              {smsPreview && !smsResult?.success && (
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
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => { setCertLetterModal(null); setCertLetterResult(null) }}>
                Close
              </Button>
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
    </div>
  )
}
