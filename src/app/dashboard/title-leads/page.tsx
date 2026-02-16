"use client"

import { PartnershipLeadsPage, PartnershipLead, PartnershipConfig } from "@/components/dashboard/partnership-leads-page"

function mapTitleRow(row: Record<string, unknown>): PartnershipLead {
  return {
    id: String(row.id || ""),
    name: String(row.contact_name || row.company_name || "Unknown"),
    companyOrFirm: String(row.company_name || ""),
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    website: String(row.website || ""),
    address: String(row.address || ""),
    city: String(row.city || ""),
    state: String(row.state || ""),
    stateAbbr: String(row.state_abbr || ""),
    county: String(row.county || ""),
    status: String(row.status || "new"),
    source: String(row.source || ""),
    emailSent: Boolean(row.email_sent),
    emailSentAt: row.email_sent_at ? String(row.email_sent_at) : null,
    smsSent: Boolean(row.sms_sent),
    smsSentAt: row.sms_sent_at ? String(row.sms_sent_at) : null,
    voicemailSent: Boolean(row.voicemail_sent),
    voicemailSentAt: row.voicemail_sent_at ? String(row.voicemail_sent_at) : null,
    voicemailError: row.voicemail_error ? String(row.voicemail_error) : null,
    notes: String(row.notes || ""),
    scrapedAt: String(row.scraped_at || new Date().toISOString()),
    createdAt: String(row.created_at || new Date().toISOString()),
    extra: {
      specialty: row.specialty,
      monthlyVolume: row.monthly_volume,
    },
  }
}

const config: PartnershipConfig = {
  type: "title",
  title: "Title Company Leads",
  subtitle: "Outreach pipeline for title companies processing foreclosure closings",
  tableName: "title_company_leads",
  nameField: "contact_name",
  companyField: "company_name",
  referralFee: "5%",
  accentColor: "bg-cyan-600",
  badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
  emailEndpoint: "/api/partnership-email",
  mapDbRow: mapTitleRow,
}

export default function TitleLeadsPage() {
  return <PartnershipLeadsPage config={config} />
}
