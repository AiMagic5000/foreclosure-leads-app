"use client"

import { PartnershipLeadsPage, PartnershipLead, PartnershipConfig } from "@/components/dashboard/partnership-leads-page"

function mapInvestorRow(row: Record<string, unknown>): PartnershipLead {
  return {
    id: String(row.id || ""),
    name: String(row.investor_name || row.company_name || "Unknown"),
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
      investorType: row.investor_type,
      monthlyPurchases: row.monthly_purchases,
    },
  }
}

const config: PartnershipConfig = {
  type: "investor",
  title: "Real Estate Investor Leads",
  subtitle: "Outreach pipeline for real estate investors buying foreclosed properties",
  tableName: "real_estate_investor_leads",
  nameField: "investor_name",
  companyField: "company_name",
  referralFee: "8%",
  accentColor: "bg-orange-600",
  badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
  emailEndpoint: "/api/partnership-email",
  mapDbRow: mapInvestorRow,
}

export default function RealEstateLeadsPage() {
  return <PartnershipLeadsPage config={config} />
}
