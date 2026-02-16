"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Volume2,
  Loader2,
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export interface PartnershipLead {
  id: string
  name: string
  companyOrFirm: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  stateAbbr: string
  county: string
  status: string
  source: string
  emailSent: boolean
  emailSentAt: string | null
  smsSent: boolean
  smsSentAt: string | null
  voicemailSent: boolean
  voicemailSentAt: string | null
  voicemailError: string | null
  notes: string
  scrapedAt: string
  createdAt: string
  extra: Record<string, unknown>
}

export interface PartnershipConfig {
  type: "title" | "investor" | "attorney"
  title: string
  subtitle: string
  tableName: string
  nameField: string
  companyField: string
  referralFee: string
  accentColor: string
  badgeColor: string
  emailEndpoint: string
  mapDbRow: (row: Record<string, unknown>) => PartnershipLead
}

const LEADS_PER_PAGE = 25

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "partnership_signed", label: "Partnership Signed" },
  { value: "declined", label: "Declined" },
  { value: "no_response", label: "No Response" },
]

const TOP_CITIES = [
  "All Cities",
  "Lakeland, FL",
  "Columbia, SC",
  "Chico, CA",
  "Cleveland, OH",
  "Ocala, FL",
  "Las Vegas, NV",
  "Jacksonville, FL",
  "Houston, TX",
  "Orlando, FL",
  "Miami, FL",
]

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 border-blue-200",
    contacted: "bg-amber-100 text-amber-700 border-amber-200",
    interested: "bg-emerald-100 text-emerald-700 border-emerald-200",
    partnership_signed: "bg-green-100 text-green-800 border-green-200",
    declined: "bg-red-100 text-red-700 border-red-200",
    no_response: "bg-gray-100 text-gray-600 border-gray-200",
  }
  const labels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    interested: "Interested",
    partnership_signed: "Signed",
    declined: "Declined",
    no_response: "No Response",
  }
  return (
    <Badge className={cn("text-xs", styles[status] || styles.new)}>
      {labels[status] || status}
    </Badge>
  )
}

function OutreachIcons({ lead }: { lead: PartnershipLead }) {
  return (
    <div className="flex items-center gap-1.5">
      {lead.emailSent && (
        <span title={`Email sent ${lead.emailSentAt ? new Date(lead.emailSentAt).toLocaleDateString() : ""}`}>
          <Mail className="h-3.5 w-3.5 text-emerald-500" />
        </span>
      )}
      {lead.smsSent && (
        <span title={`SMS sent ${lead.smsSentAt ? new Date(lead.smsSentAt).toLocaleDateString() : ""}`}>
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
        </span>
      )}
      {lead.voicemailSent && (
        <span title={`Voice drop sent ${lead.voicemailSentAt ? new Date(lead.voicemailSentAt).toLocaleDateString() : ""}`}>
          <Volume2 className="h-3.5 w-3.5 text-purple-500" />
        </span>
      )}
    </div>
  )
}

export function PartnershipLeadsPage({ config }: { config: PartnershipConfig }) {
  const [leads, setLeads] = useState<PartnershipLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCity, setSelectedCity] = useState("All Cities")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({})
  const [sendingSms, setSendingSms] = useState<Record<string, boolean>>({})
  const [sendingVd, setSendingVd] = useState<Record<string, boolean>>({})
  const [emailModal, setEmailModal] = useState<{ leadId: string; name: string; email: string } | null>(null)
  const [emailPreview, setEmailPreview] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailResult, setEmailResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [smsModal, setSmsModal] = useState<{ leadId: string; name: string; phone: string } | null>(null)
  const [smsText, setSmsText] = useState("")
  const [smsResult, setSmsResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({})

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await (supabase
      .from(config.tableName) as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (error) {
      setLoading(false)
      return
    }

    const mapped = (data || []).map((row: Record<string, unknown>) => config.mapDbRow(row))
    setLeads(mapped)
    setLoading(false)
  }, [config])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (selectedStatus !== "all" && lead.status !== selectedStatus) return false
      if (selectedCity !== "All Cities") {
        const [city, stAbbr] = selectedCity.split(", ")
        if (lead.city?.toLowerCase() !== city.toLowerCase() || lead.stateAbbr !== stAbbr) return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          lead.name.toLowerCase().includes(q) ||
          lead.companyOrFirm.toLowerCase().includes(q) ||
          lead.email?.toLowerCase().includes(q) ||
          lead.city?.toLowerCase().includes(q) ||
          lead.county?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [leads, selectedStatus, selectedCity, searchQuery])

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * LEADS_PER_PAGE,
    currentPage * LEADS_PER_PAGE
  )

  const stats = useMemo(() => {
    const total = leads.length
    const contacted = leads.filter((l) => l.status === "contacted" || l.emailSent || l.smsSent || l.voicemailSent).length
    const interested = leads.filter((l) => l.status === "interested").length
    const signed = leads.filter((l) => l.status === "partnership_signed").length
    return { total, contacted, interested, signed }
  }, [leads])

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    setUpdatingStatus((prev) => ({ ...prev, [leadId]: true }))
    const { error } = await (supabase
      .from(config.tableName) as any)
      .update({ status: newStatus })
      .eq("id", leadId)

    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      )
    }
    setUpdatingStatus((prev) => ({ ...prev, [leadId]: false }))
  }

  const openEmailDraft = async (lead: PartnershipLead) => {
    setEmailModal({ leadId: lead.id, name: lead.name, email: lead.email })
    setEmailPreview(null)
    setEmailResult(null)
    setEmailLoading(true)

    try {
      const res = await fetch("/api/partnership-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          type: config.type,
          action: "preview",
          leadData: {
            name: lead.name,
            companyOrFirm: lead.companyOrFirm,
            email: lead.email,
            city: lead.city,
            state: lead.state,
            stateAbbr: lead.stateAbbr,
            county: lead.county,
          },
        }),
      })
      const data = await res.json()
      if (data.html) {
        setEmailPreview(data.html)
      } else {
        setEmailResult({ error: data.error || "Failed to generate preview" })
      }
    } catch {
      setEmailResult({ error: "Network error" })
    }
    setEmailLoading(false)
  }

  const createEmailDraft = async () => {
    if (!emailModal) return
    setEmailLoading(true)
    setEmailResult(null)

    try {
      const lead = leads.find((l) => l.id === emailModal.leadId)
      if (!lead) return

      const res = await fetch("/api/partnership-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          type: config.type,
          action: "create_draft",
          leadData: {
            name: lead.name,
            companyOrFirm: lead.companyOrFirm,
            email: lead.email,
            city: lead.city,
            state: lead.state,
            stateAbbr: lead.stateAbbr,
            county: lead.county,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEmailResult({ success: true })
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, emailSent: true, emailSentAt: new Date().toISOString(), status: l.status === "new" ? "contacted" : l.status }
              : l
          )
        )
        await (supabase
          .from(config.tableName) as any)
          .update({ email_sent: true, email_sent_at: new Date().toISOString(), status: lead.status === "new" ? "contacted" : lead.status })
          .eq("id", lead.id)
      } else {
        setEmailResult({ error: data.error || "Failed to create draft" })
      }
    } catch {
      setEmailResult({ error: "Network error" })
    }
    setEmailLoading(false)
  }

  const openSmsModal = (lead: PartnershipLead) => {
    const firstName = lead.name.split(" ")[0]
    const defaultText = config.type === "title"
      ? `Hi ${firstName}, this is Corey from Foreclosure Recovery Inc. We help title companies earn 5% referral fees on surplus fund recoveries from foreclosure closings. No extra work on your end. Interested in learning more? Reply YES or call (888) 545-8007.`
      : config.type === "investor"
      ? `Hi ${firstName}, this is Corey from Foreclosure Recovery Inc. As a real estate investor, you can earn $4K+ per referral helping former homeowners recover surplus funds. Takes 1 minute. Interested? Reply YES or call (888) 545-8007.`
      : `Hi ${firstName}, this is Corey from Foreclosure Recovery Inc. We help attorneys earn 10% referral fees by referring foreclosure clients for surplus fund recovery. No conflict of interest. Interested? Reply YES or call (888) 545-8007.`

    setSmsModal({ leadId: lead.id, name: lead.name, phone: lead.phone })
    setSmsText(defaultText)
    setSmsResult(null)
  }

  const sendSms = async () => {
    if (!smsModal) return
    setSendingSms((prev) => ({ ...prev, [smsModal.leadId]: true }))
    setSmsResult(null)

    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: smsModal.phone,
          message: smsText,
          action: "send",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSmsResult({ success: true })
        setLeads((prev) =>
          prev.map((l) =>
            l.id === smsModal.leadId
              ? { ...l, smsSent: true, smsSentAt: new Date().toISOString(), status: l.status === "new" ? "contacted" : l.status }
              : l
          )
        )
        await (supabase
          .from(config.tableName) as any)
          .update({ sms_sent: true, sms_sent_at: new Date().toISOString(), status: leads.find(l => l.id === smsModal.leadId)?.status === "new" ? "contacted" : undefined })
          .eq("id", smsModal.leadId)
      } else {
        setSmsResult({ error: data.error || "Failed to send SMS" })
      }
    } catch {
      setSmsResult({ error: "Network error" })
    }
    setSendingSms((prev) => ({ ...prev, [smsModal.leadId]: false }))
  }

  const sendVoiceDrop = async (lead: PartnershipLead) => {
    if (!lead.phone) return
    setSendingVd((prev) => ({ ...prev, [lead.id]: true }))

    try {
      const res = await fetch("/api/voice-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          phone: lead.phone,
          partnershipType: config.type,
          name: lead.name,
          companyOrFirm: lead.companyOrFirm,
          city: lead.city,
          stateAbbr: lead.stateAbbr,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, voicemailSent: true, voicemailSentAt: new Date().toISOString() }
              : l
          )
        )
        await (supabase
          .from(config.tableName) as any)
          .update({ voicemail_sent: true, voicemail_sent_at: new Date().toISOString() })
          .eq("id", lead.id)
      }
    } catch {
      // silent fail
    }
    setSendingVd((prev) => ({ ...prev, [lead.id]: false }))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted/50 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-sm py-1 px-3", config.badgeColor)}>
            {config.referralFee} Referral Fee
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-2xl font-bold text-amber-600">{stats.contacted}</p>
            <p className="text-xs text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.interested}</p>
            <p className="text-xs text-muted-foreground">Interested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-2xl font-bold text-green-700">{stats.signed}</p>
            <p className="text-xs text-muted-foreground">Partnerships Signed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="pl-9"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={selectedCity}
          onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        >
          {TOP_CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedLeads.length} of {filteredLeads.length} leads
        {filteredLeads.length !== leads.length && ` (${leads.length} total)`}
      </div>

      {/* Lead List */}
      <div className="space-y-3">
        {paginatedLeads.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {leads.length === 0
                ? "No leads yet. Run the scraper to populate this pipeline."
                : "No leads match your current filters."}
            </CardContent>
          </Card>
        )}

        {paginatedLeads.map((lead) => (
          <Card
            key={lead.id}
            className={cn(
              "transition-all cursor-pointer hover:shadow-md",
              expandedLead === lead.id && "ring-2 ring-emerald-500/50"
            )}
          >
            <CardContent className="p-4">
              {/* Lead Row */}
              <div
                className="flex items-center gap-4"
                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
              >
                {/* Icon */}
                <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", config.accentColor)}>
                  {config.type === "title" ? (
                    <Building2 className="h-5 w-5 text-white" />
                  ) : config.type === "investor" ? (
                    <Building2 className="h-5 w-5 text-white" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>

                {/* Name & Company */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{lead.name}</p>
                    <StatusBadge status={lead.status} />
                    <OutreachIcons lead={lead} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.companyOrFirm && `${lead.companyOrFirm} -- `}
                    {lead.city}{lead.stateAbbr ? `, ${lead.stateAbbr}` : ""}
                    {lead.county ? ` (${lead.county})` : ""}
                  </p>
                </div>

                {/* Contact Info - Clickable */}
                <div className="hidden md:flex items-center gap-4 text-xs" onClick={(e) => e.stopPropagation()}>
                  {lead.email && (
                    <button
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      onClick={() => openEmailDraft(lead)}
                      title="Click to create email draft"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="max-w-[180px] truncate">{lead.email}</span>
                    </button>
                  )}
                  {lead.phone && (
                    <button
                      className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 hover:underline transition-colors"
                      onClick={() => openSmsModal(lead)}
                      title="Click to send SMS"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {lead.email && (
                    <button
                      onClick={() => openEmailDraft(lead)}
                      disabled={sendingEmail[lead.id]}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      title="Create email draft"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </button>
                  )}
                  {lead.phone && (
                    <>
                      <button
                        onClick={() => openSmsModal(lead)}
                        disabled={sendingSms[lead.id]}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        title="Send SMS"
                      >
                        <MessageSquare className="h-3 w-3" />
                        SMS
                      </button>
                      <button
                        onClick={() => sendVoiceDrop(lead)}
                        disabled={sendingVd[lead.id] || lead.voicemailSent}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                          lead.voicemailSent
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : sendingVd[lead.id]
                            ? "bg-purple-400 text-white cursor-wait"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        )}
                        title={lead.voicemailSent ? "Voice drop already sent" : "Send voice drop"}
                      >
                        {sendingVd[lead.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                        {lead.voicemailSent ? "Sent" : "VD"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedLead === lead.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact Details */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Contact Details</h4>
                      <div className="space-y-1 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <button onClick={() => openEmailDraft(lead)} className="text-blue-600 hover:underline text-sm text-left">
                              {lead.email}
                            </button>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                              {lead.website} <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{lead.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Outreach */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Status & Outreach</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          disabled={updatingStatus[lead.id]}
                          className="border rounded px-2 py-1 text-xs bg-background"
                        >
                          {statusOptions.filter((o) => o.value !== "all").map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {updatingStatus[lead.id] && <Loader2 className="h-3 w-3 animate-spin" />}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          Email: {lead.emailSent ? (
                            <span className="text-emerald-600">Sent {lead.emailSentAt ? new Date(lead.emailSentAt).toLocaleDateString() : ""}</span>
                          ) : (
                            <span>Not sent</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          SMS: {lead.smsSent ? (
                            <span className="text-emerald-600">Sent {lead.smsSentAt ? new Date(lead.smsSentAt).toLocaleDateString() : ""}</span>
                          ) : (
                            <span>Not sent</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-3 w-3" />
                          Voice Drop: {lead.voicemailSent ? (
                            <span className="text-emerald-600">Sent {lead.voicemailSentAt ? new Date(lead.voicemailSentAt).toLocaleDateString() : ""}</span>
                          ) : (
                            <span>Not sent</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Added: {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          Source: {lead.source}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">{lead.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Email Draft Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEmailModal(null)}>
          <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">Email Draft</h3>
                <p className="text-xs text-muted-foreground">To: {emailModal.name} ({emailModal.email})</p>
              </div>
              <button onClick={() => setEmailModal(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {emailLoading && !emailPreview && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Generating preview...</span>
                </div>
              )}
              {emailPreview && (
                <iframe
                  srcDoc={emailPreview}
                  className="w-full h-[400px] border rounded"
                  sandbox="allow-same-origin"
                />
              )}
              {emailResult?.error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{emailResult.error}</div>
              )}
              {emailResult?.success && (
                <div className="text-emerald-600 text-sm bg-emerald-50 p-3 rounded flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Draft created in mailbox
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setEmailModal(null)}>Cancel</Button>
              {emailPreview && !emailResult?.success && (
                <Button size="sm" onClick={createEmailDraft} disabled={emailLoading}>
                  {emailLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                  Create Draft in Mailbox
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {smsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSmsModal(null)}>
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">Send SMS</h3>
                <p className="text-xs text-muted-foreground">To: {smsModal.name} ({smsModal.phone})</p>
              </div>
              <button onClick={() => setSmsModal(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={5}
                className="w-full border rounded-lg p-3 text-sm resize-none"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{smsText.length} chars</span>
                <span>{Math.ceil(smsText.length / 160)} SMS segment{Math.ceil(smsText.length / 160) > 1 ? "s" : ""}</span>
              </div>
              {smsResult?.error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{smsResult.error}</div>
              )}
              {smsResult?.success && (
                <div className="text-emerald-600 text-sm bg-emerald-50 p-3 rounded flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  SMS sent successfully
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setSmsModal(null)}>Cancel</Button>
              {!smsResult?.success && (
                <Button size="sm" onClick={sendSms} disabled={sendingSms[smsModal.leadId]}>
                  {sendingSms[smsModal.leadId] ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                  Send SMS
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
