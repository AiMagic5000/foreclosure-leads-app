"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { usePin } from "@/lib/pin-context"
import {
  Search, ChevronLeft, ChevronRight, Loader2, ExternalLink, Calendar, MapPin,
  DollarSign, Download, TrendingUp, AlertTriangle, Landmark, Clock, Info,
  Printer, MessageSquare, Mail, Voicemail, FileSignature, ChevronDown,
  Home, UserSearch, Gavel, X, Copy, Check, AlertCircle, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TaxDeedLead {
  id: string
  owner_name: string | null
  property_address: string | null
  city: string | null
  state_abbr: string | null
  zip_code: string | null
  county: string | null
  parcel_id: string | null
  certificate_number: string | null
  case_number: string | null
  sale_date: string | null
  opening_bid: number | null
  sold_amount: number | null
  surplus_amount: number | null
  assessed_value: number | null
  claim_deadline: string | null
  status: string
  source: string | null
  property_url: string | null
  primary_phone: string | null
  primary_email: string | null
  owner_type: string | null
  tier: string | null
  gold_score: number | null
  created_at: string
}

type SortField = "owner_name" | "county" | "sale_date" | "surplus_amount" | "claim_deadline" | "gold_score" | "created_at"
const PAGE_SIZE = 25
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

const TIER_META: Record<string, { label: string; cls: string; ring: string }> = {
  diamond: { label: "Diamond", cls: "bg-violet-100 text-violet-700", ring: "ring-violet-300" },
  gold: { label: "Gold", cls: "bg-amber-100 text-amber-800", ring: "ring-amber-300" },
  silver: { label: "Silver", cls: "bg-slate-200 text-slate-700", ring: "ring-slate-300" },
  bronze: { label: "Bronze", cls: "bg-orange-100 text-orange-700", ring: "ring-orange-300" },
  unranked: { label: "Unranked", cls: "bg-gray-100 text-gray-400", ring: "ring-gray-200" },
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700", skip_traced: "bg-sky-100 text-sky-700",
  surplus_found: "bg-emerald-100 text-emerald-700", contacted: "bg-amber-100 text-amber-700",
  agreement_signed: "bg-green-100 text-green-700", claimed: "bg-green-100 text-green-700",
  no_surplus: "bg-gray-100 text-gray-500", expired: "bg-red-100 text-red-600",
}

function fmt(val: number | null): string {
  if (!val) return "--"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val)
}
function fmtDate(d: string | null): string {
  if (!d) return "--"
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } catch { return d }
}
function fullAddress(l: TaxDeedLead): string {
  return [l.property_address, l.city, l.state_abbr, l.zip_code].filter(Boolean).join(", ")
}
function streetViewUrl(addr: string): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=620x260&location=${encodeURIComponent(addr)}&fov=80&key=${MAPS_KEY}`
}
function staticMapUrl(addr: string): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(addr)}&zoom=16&size=620x220&markers=color:0x059669%7C${encodeURIComponent(addr)}&key=${MAPS_KEY}`
}
function outreach(l: TaxDeedLead): { subject: string; body: string } {
  const name = (l.owner_name || "").split(/\s+/)[0] || "there"
  const amt = l.surplus_amount ? `$${l.surplus_amount.toLocaleString()}` : "surplus funds"
  const prop = l.property_address ? ` at ${l.property_address}` : ""
  return {
    subject: `Surplus funds may be owed to you - ${l.county || ""} County tax sale`,
    body: `Hello ${name},\n\nOur records show you may be owed ${amt} in surplus funds from the tax-deed sale of your former property${prop} in ${l.county || ""} County. These funds belong to you and there is a deadline to claim them.\n\nWe help former owners recover these funds on a contingency basis - no upfront cost. Reply or call to confirm your claim.\n\nForeclosure Recovery Inc.\n(888) 545-8007`,
  }
}

// Countdown to claim deadline
function Countdown({ deadline }: { deadline: string | null }) {
  if (!deadline) {
    return <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500"><Clock className="h-4 w-4" /> Claim deadline not yet posted</div>
  }
  const now = Date.now()
  const end = new Date(deadline).getTime()
  const days = Math.ceil((end - now) / 86400000)
  if (isNaN(end)) return null
  const expired = days < 0
  const color = expired ? "red" : days <= 30 ? "red" : days <= 90 ? "amber" : "emerald"
  const cls = { red: "border-red-200 bg-red-50 text-red-700", amber: "border-amber-200 bg-amber-50 text-amber-700", emerald: "border-emerald-200 bg-emerald-50 text-emerald-700" }[color]
  return (
    <div className={cn("flex items-center justify-between rounded-lg border px-3 py-2", cls)}>
      <span className="flex items-center gap-2 text-sm font-semibold">
        {expired ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        {expired ? "Claim window EXPIRED" : `${days.toLocaleString()} days to claim`}
      </span>
      <span className="text-xs opacity-80">Deadline {fmtDate(deadline)}</span>
    </div>
  )
}

function printLead(l: TaxDeedLead) {
  const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string))
  const row = (k: string, v: string) => `<tr><td style="padding:5px 14px 5px 0;color:#6b7280;white-space:nowrap">${esc(k)}</td><td style="padding:5px 0;color:#111827;font-weight:600">${esc(v) || "--"}</td></tr>`
  const html = `<!doctype html><html><head><title>Tax Deed Lead - ${esc(l.owner_name || l.parcel_id || l.id)}</title>
  <style>body{font-family:Arial,sans-serif;color:#111827;padding:32px;max-width:720px}h1{font-size:20px;color:#065f46;margin:0 0 2px}.sub{color:#6b7280;font-size:13px;margin:0 0 18px}.box{border:1px solid #e5e7eb;border-radius:10px;padding:18px 22px;margin-bottom:16px}.box h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#059669;margin:0 0 10px}table{width:100%;border-collapse:collapse;font-size:13px}.big{font-size:24px;font-weight:800;color:#059669}</style></head><body>
  <h1>Foreclosure Recovery Inc. - Tax Deed Surplus Lead</h1><p class="sub">${esc(l.county || "")} County, ${esc(l.state_abbr || "")} &middot; printed ${esc(new Date().toLocaleDateString())}</p>
  <div class="box"><h2>Surplus</h2><div class="big">${l.surplus_amount ? "$" + l.surplus_amount.toLocaleString() : "--"}</div><table>${row("Tier", (l.tier || "").toUpperCase())}${row("Gold Score", String(l.gold_score ?? "--"))}${row("Claim Deadline", fmtDate(l.claim_deadline))}</table></div>
  <div class="box"><h2>Former Owner</h2><table>${row("Name", l.owner_name || "")}${row("Type", l.owner_type || "")}${row("Phone", l.primary_phone || "")}${row("Email", l.primary_email || "")}</table></div>
  <div class="box"><h2>Property</h2><table>${row("Address", fullAddress(l))}${row("County", l.county || "")}${row("Parcel / Folio", l.parcel_id || "")}${row("Assessed Value", l.assessed_value ? "$" + l.assessed_value.toLocaleString() : "")}</table></div>
  <div class="box"><h2>Tax Sale</h2><table>${row("Sale Date", fmtDate(l.sale_date))}${row("Opening Bid", l.opening_bid ? "$" + l.opening_bid.toLocaleString() : "")}${row("Sold Amount", l.sold_amount ? "$" + l.sold_amount.toLocaleString() : "")}${row("Certificate #", l.certificate_number || "")}${row("Case #", l.case_number || "")}${row("Source", l.source || "")}</table></div>
  <p style="font-size:11px;color:#9ca3af">Surplus figures from county clerk records are exact; computed figures (sold minus opening) are estimates. Verify unclaimed status before contacting.</p>
  </body></html>`
  const w = window.open("", "_blank", "width=760,height=900")
  if (!w) return
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => w.print(), 350)
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="space-y-0.5"><dt className="text-xs text-gray-400">{label}</dt><dd className="text-sm font-medium text-gray-800 break-words">{value || "--"}</dd></div>
}

function ActionBtn({ icon: Icon, label, color, disabled, onClick, title, href }: { icon: React.ElementType; label: string; color: string; disabled?: boolean; onClick?: () => void; title?: string; href?: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    violet: "bg-violet-600 hover:bg-violet-700 text-white",
    indigo: "bg-[#1E3A5F] hover:opacity-90 text-white",
    orange: "bg-orange-600 hover:bg-orange-700 text-white",
    gray: "border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white",
  }
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
  if (disabled) return <button disabled title={title} className={cn(base, "bg-gray-100 text-gray-400 cursor-not-allowed")}><Icon className="h-3.5 w-3.5" />{label}</button>
  if (href) return <a href={href} onClick={(e) => e.stopPropagation()} title={title} className={cn(base, colors[color])}><Icon className="h-3.5 w-3.5" />{label}</a>
  return <button onClick={(e) => { e.stopPropagation(); onClick?.() }} title={title} className={cn(base, colors[color])}><Icon className="h-3.5 w-3.5" />{label}</button>
}

function LeadCard({ lead, expanded, onToggle, onEmail }: { lead: TaxDeedLead; expanded: boolean; onToggle: () => void; onEmail: (l: TaxDeedLead) => void }) {
  const [tab, setTab] = useState<"property" | "sale" | "contact" | "map">("property")
  const tier = TIER_META[lead.tier || "unranked"]
  const addr = fullAddress(lead)
  return (
    <div className={cn("rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md", expanded ? "ring-1 " + tier.ring : "border-gray-200")}>
      {/* Collapsed line */}
      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center gap-4">
        <ChevronDown className={cn("h-4 w-4 flex-none text-gray-300 transition-transform", expanded && "rotate-180 text-emerald-500")} />
        <span className={cn("inline-flex flex-none px-2.5 py-1 rounded-full text-xs font-bold ring-1", tier.cls, tier.ring)}>{tier.label}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{lead.owner_name || <span className="text-amber-600 italic text-sm">needs owner lookup</span>}{lead.owner_type && !["individual", "unknown"].includes(lead.owner_type) && <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">{lead.owner_type}</span>}</p>
          <p className="text-xs text-gray-500 truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{addr || (lead.parcel_id ? `Parcel ${lead.parcel_id}` : lead.county) || "--"} &middot; {lead.county} Co.</p>
        </div>
        <div className="hidden sm:block flex-none text-right">
          <p className="text-lg font-bold text-emerald-600">{fmt(lead.surplus_amount)}</p>
          <p className="text-[11px] text-gray-400">surplus</p>
        </div>
        <div className="flex-none text-right w-16">
          <p className="text-sm font-bold text-gray-700">{lead.gold_score ?? "--"}</p>
          <p className="text-[11px] text-gray-400">score</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          <Countdown deadline={lead.claim_deadline} />

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {([["property", "Property", Home], ["sale", "Tax Sale", Gavel], ["contact", "Contact", UserSearch], ["map", "Map", MapPin]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
            <div className="ml-auto">
              <ActionBtn icon={Printer} label="Print" color="gray" onClick={() => printLead(lead)} title="Print lead sheet" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-1.5">
            <ActionBtn icon={Voicemail} label="Voice Drop" color="emerald" disabled={!lead.primary_phone} title={lead.primary_phone ? "Ringless voicemail" : "Needs a phone - run skip-trace"} />
            <ActionBtn icon={MessageSquare} label="SMS" color="violet" disabled={!lead.primary_phone} href={lead.primary_phone ? `sms:${lead.primary_phone}?body=${encodeURIComponent(outreach(lead).body)}` : undefined} title={lead.primary_phone ? "Text the owner" : "Needs a phone - run skip-trace"} />
            <ActionBtn icon={Mail} label="Email" color="indigo" disabled={!lead.primary_email} onClick={() => onEmail(lead)} title={lead.primary_email ? "Draft email" : "Needs an email - run skip-trace"} />
            <ActionBtn icon={FileSignature} label="Certified Letter" color="orange" disabled={!lead.property_address} title={lead.property_address ? "Mail certified letter" : "Needs a mailing address"} />
            {lead.property_url && <ActionBtn icon={ExternalLink} label="Source" color="gray" href={lead.property_url} title="View source record" />}
          </div>

          {/* Tab content */}
          {tab === "property" && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3">
              <Field label="Former Owner" value={lead.owner_name} />
              <Field label="Owner Type" value={lead.owner_type} />
              <Field label="Property Address" value={addr} />
              <Field label="County" value={lead.county} />
              <Field label="Parcel / Folio" value={lead.parcel_id} />
              <Field label="Assessed Value" value={fmt(lead.assessed_value)} />
            </dl>
          )}
          {tab === "sale" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs text-gray-500">Sold For</p><p className="text-xl font-bold text-blue-600">{fmt(lead.sold_amount)}</p></div>
                <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs text-gray-500">Opening Bid (taxes)</p><p className="text-xl font-bold text-gray-700">{fmt(lead.opening_bid)}</p></div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Surplus Owed</p><p className="text-xl font-bold text-emerald-600">{fmt(lead.surplus_amount)}</p></div>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3 mt-3">
                <Field label="Sale Date" value={fmtDate(lead.sale_date)} />
                <Field label="Certificate #" value={lead.certificate_number} />
                <Field label="Case #" value={lead.case_number} />
                <Field label="Claim Deadline" value={fmtDate(lead.claim_deadline)} />
                <Field label="Source" value={lead.source} />
                <Field label="Status" value={lead.status?.replace(/_/g, " ")} />
              </dl>
            </>
          )}
          {tab === "contact" && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3">
              <Field label="Phone" value={lead.primary_phone} />
              <Field label="Email" value={lead.primary_email} />
              <Field label="Mailing Address" value={addr} />
              {!lead.primary_phone && !lead.primary_email && (
                <div className="col-span-2 sm:col-span-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <AlertCircle className="h-4 w-4 flex-none" /> No contact on file yet. Run skip-trace to add phone + email, then the Voice Drop / SMS / Email buttons activate and this lead can climb to Gold/Diamond.
                </div>
              )}
            </dl>
          )}
          {tab === "map" && (
            MAPS_KEY && addr ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={streetViewUrl(addr)} alt="Street view" className="w-full rounded-lg border border-gray-200 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={staticMapUrl(addr)} alt="Map" className="w-full rounded-lg border border-gray-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
              </div>
            ) : <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">{addr ? "Map key not configured" : "No property address on file for a map"}</div>
          )}
        </div>
      )}
    </div>
  )
}

function EmailDraftModal({ lead, onClose }: { lead: TaxDeedLead; onClose: () => void }) {
  const { subject, body } = outreach(lead)
  const [copied, setCopied] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Mail className="h-4 w-4 text-[#1E3A5F]" /> Email Draft</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div><p className="text-xs text-gray-400">To</p><p className="text-sm font-medium">{lead.primary_email}</p></div>
          <div><p className="text-xs text-gray-400">Subject</p><p className="text-sm font-medium">{subject}</p></div>
          <div><p className="text-xs text-gray-400">Message</p><textarea readOnly value={body} className="mt-1 w-full h-44 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 resize-none" /></div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <button onClick={() => { navigator.clipboard?.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">{copied ? <><Check className="h-4 w-4 text-emerald-600" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}</button>
          <a href={`mailto:${lead.primary_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"><Mail className="h-4 w-4" />Open in Mail</a>
        </div>
      </div>
    </div>
  )
}

function LockedCard({ lead }: { lead: TaxDeedLead }) {
  const tier = TIER_META[lead.tier || "unranked"]
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-4 py-3 flex items-center gap-4">
        <Lock className="h-4 w-4 flex-none text-gray-300" />
        <span className={cn("inline-flex flex-none px-2.5 py-1 rounded-full text-xs font-bold ring-1", tier.cls, tier.ring)}>{tier.label}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate blur-sm select-none">{lead.owner_name || "Former Owner"}</p>
          <p className="text-xs text-gray-500 truncate blur-sm select-none">{fullAddress(lead) || "Property address on file"} &middot; {lead.county} Co.</p>
        </div>
        <div className="flex-none text-right blur-sm select-none">
          <p className="text-lg font-bold text-emerald-600">{fmt(lead.surplus_amount)}</p>
          <p className="text-[11px] text-gray-400">surplus</p>
        </div>
      </div>
    </div>
  )
}

function TaxDeedsContent() {
  const { isOwnerOperator, isAdmin } = usePin()
  const canView = isOwnerOperator || isAdmin
  const [leads, setLeads] = useState<TaxDeedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("surplus_amount")
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [emailLead, setEmailLead] = useState<TaxDeedLead | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("tax_deed_leads").select("*").order("created_at", { ascending: false }).limit(5000)
    if (!error && data) setLeads(data as TaxDeedLead[])
    setLoading(false)
  }, [])
  useEffect(() => { fetchLeads() }, [fetchLeads])

  const states = useMemo(() => Array.from(new Set(leads.map((l) => l.state_abbr).filter(Boolean) as string[])).sort(), [leads])

  const filtered = useMemo(() => {
    let r = leads
    if (search) {
      const q = search.toLowerCase()
      r = r.filter((l) => l.owner_name?.toLowerCase().includes(q) || l.property_address?.toLowerCase().includes(q) || l.county?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.parcel_id?.toLowerCase().includes(q))
    }
    if (statusFilter !== "all") r = r.filter((l) => l.status === statusFilter)
    if (stateFilter !== "all") r = r.filter((l) => l.state_abbr === stateFilter)
    if (tierFilter !== "all") r = r.filter((l) => (l.tier || "unranked") === tierFilter)
    const contactRank = (l: TaxDeedLead) => ((l.primary_phone ? 1 : 0) + (l.primary_email ? 1 : 0))
    r = [...r].sort((a, b) => {
      // Default (Gold Score): most-contactable + most-actionable first
      if (sortField === "gold_score" && !sortAsc) {
        const ca = contactRank(a), cb = contactRank(b)
        if (ca !== cb) return cb - ca
        return (b.gold_score ?? 0) - (a.gold_score ?? 0)
      }
      const av = a[sortField], bv = b[sortField]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return r
  }, [leads, search, statusFilter, stateFilter, tierFilter, sortField, sortAsc])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const stats = useMemo(() => ({
    total: leads.length,
    upcoming: leads.filter((l) => l.sale_date && new Date(l.sale_date) >= new Date()).length,
    totalSurplus: leads.reduce((s, l) => s + (l.surplus_amount || 0), 0),
    withSurplus: leads.filter((l) => (l.surplus_amount || 0) > 0).length,
  }), [leads])

  const handleExport = () => {
    const headers = ["Owner", "Address", "City", "State", "Zip", "County", "Parcel", "Certificate", "Case", "Sale Date", "Opening Bid", "Sold Amount", "Surplus", "Claim Deadline", "Tier", "Score", "Status", "Source", "Phone", "Email"]
    const rows = filtered.map((l) => [l.owner_name || "", l.property_address || "", l.city || "", l.state_abbr || "", l.zip_code || "", l.county || "", l.parcel_id || "", l.certificate_number || "", l.case_number || "", l.sale_date || "", l.opening_bid || "", l.sold_amount || "", l.surplus_amount || "", l.claim_deadline || "", l.tier || "", l.gold_score ?? "", l.status, l.source || "", l.primary_phone || "", l.primary_email || ""])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `tax-deed-leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  const SortBtn = ({ f, label }: { f: SortField; label: string }) => (
    <button onClick={() => { setSortField(f); setSortAsc(sortField === f ? !sortAsc : false); setPage(0) }} className={cn("px-2.5 py-1 rounded-md text-xs font-medium", sortField === f ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>{label}{sortField === f ? (sortAsc ? " ↑" : " ↓") : ""}</button>
  )

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Training videos */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
          <video controls preload="metadata" poster="/videos/tax-deed-followup-poster.jpg" className="w-full">
            <source src="/videos/tax-deed-followup-16x9.mp4" type="video/mp4" />
          </video>
          <p className="bg-white px-3 py-2 text-sm font-semibold text-[#0f172a]">Part 1 &middot; Tax Deed Follow-Up Mastery <span className="font-normal text-gray-500">- find them, reach them, sign them</span></p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
          <video controls preload="metadata" poster="/videos/tax-deed-closing-poster.jpg" className="w-full">
            <source src="/videos/tax-deed-closing-16x9.mp4" type="video/mp4" />
          </video>
          <p className="bg-white px-3 py-2 text-sm font-semibold text-[#0f172a]">Part 2 &middot; Tax Deed Closing <span className="font-normal text-gray-500">- verify, sign, file, get paid</span></p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Deed Surplus Leads</h1>
          <p className="text-sm text-gray-500 mt-1">A separate pipeline from foreclosure overages - former owners owed money after a county tax-deed sale.</p>
        </div>
        {canView && <Button onClick={handleExport} variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>}
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 flex-none text-emerald-600 mt-0.5" />
          <div className="text-sm text-emerald-900 space-y-1.5">
            <p><strong>What is a tax deed surplus?</strong> When a county sells a property at a tax-deed auction to recover unpaid property taxes, it often sells for <em>more</em> than the taxes owed. That surplus belongs to the former owner. Find them, tell them, sign them on contingency.</p>
            <p className="text-emerald-700"><strong>Tiers reflect a lead&apos;s value AND how workable it is</strong> - a lead only reaches Gold/Diamond once it has an owner <em>and</em> a phone or email. Big surplus with no contact sits at Silver/Bronze until skip-trace fills it in.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><Landmark className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p><p className="text-xs text-gray-500">Tax Deed Leads</p></div></div></div>
        <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><Calendar className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.upcoming.toLocaleString()}</p><p className="text-xs text-gray-500">Upcoming Sales</p></div></div></div>
        <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><DollarSign className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-gray-900">{fmt(stats.totalSurplus)}</p><p className="text-xs text-gray-500">Total Surplus</p></div></div></div>
        <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100"><TrendingUp className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.withSurplus.toLocaleString()}</p><p className="text-xs text-gray-500">With Surplus</p></div></div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search owner, address, county, parcel..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
        </div>
        <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(0) }} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="all">All Tiers</option><option value="diamond">Diamond</option><option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option><option value="unranked">Unranked</option>
        </select>
        <select value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); setPage(0) }} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="all">All States</option>{states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="all">All Statuses</option><option value="new">New</option><option value="skip_traced">Skip Traced</option><option value="contacted">Contacted</option><option value="agreement_signed">Agreement Signed</option><option value="claimed">Claimed</option>
        </select>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5"><span className="text-xs text-gray-400 mr-1">Sort:</span><SortBtn f="gold_score" label="Gold Score" /><SortBtn f="surplus_amount" label="Surplus" /><SortBtn f="claim_deadline" label="Deadline" /><SortBtn f="sale_date" label="Sale Date" /></div>
        <span className="text-sm text-gray-500">{filtered.length.toLocaleString()} leads &middot; page {page + 1}/{Math.max(1, totalPages)}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Tax Deed Leads</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">No leads match the current filters.</p>
        </div>
      ) : canView ? (
        <div className="space-y-2.5">
          {paged.map((lead) => (
            <LeadCard key={lead.id} lead={lead} expanded={expandedId === lead.id} onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)} onEmail={setEmailLead} />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 flex-none text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">{filtered.length.toLocaleString()} tax deed leads &mdash; {fmt(stats.totalSurplus)} in surplus &mdash; locked</p>
                <p className="text-sm text-amber-800/90">Owner Operators get full access: owner names, contact info, maps, and one-click outreach. Upgrade to unlock every lead.</p>
              </div>
            </div>
            <a href="/dashboard/owner-operator" className="inline-flex flex-none items-center justify-center gap-2 rounded-lg bg-[#D82221] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">Become an Owner Operator</a>
          </div>
          {paged.map((lead) => <LockedCard key={lead.id} lead={lead} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="gap-1"><ChevronLeft className="h-4 w-4" /> Previous</Button>
          <span className="text-sm text-gray-500">{page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="gap-1">Next <ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {emailLead && <EmailDraftModal lead={emailLead} onClose={() => setEmailLead(null)} />}
    </div>
  )
}

export default function TaxDeedsPage() {
  return <TaxDeedsContent />
}
