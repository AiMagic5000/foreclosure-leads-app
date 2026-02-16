"use client"

import { PartnershipLeadsPage, PartnershipLead, PartnershipConfig } from "@/components/dashboard/partnership-leads-page"

function mapAttorneyRow(row: Record<string, unknown>): PartnershipLead {
  return {
    id: String(row.id || ""),
    name: String(row.attorney_name || row.firm_name || "Unknown"),
    companyOrFirm: String(row.firm_name || ""),
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
      barNumber: row.bar_number,
      practiceAreas: row.practice_areas,
    },
  }
}

const config: PartnershipConfig = {
  type: "attorney",
  title: "Attorney Leads",
  subtitle: "Outreach pipeline for bankruptcy and foreclosure attorneys",
  tableName: "attorney_leads",
  nameField: "attorney_name",
  companyField: "firm_name",
  referralFee: "10%",
  accentColor: "bg-violet-600",
  badgeColor: "bg-violet-100 text-violet-700 border-violet-200",
  emailEndpoint: "/api/partnership-email",
  mapDbRow: mapAttorneyRow,
}

export default function AttorneyLeadsPage() {
  return <PartnershipLeadsPage config={config} />
}
