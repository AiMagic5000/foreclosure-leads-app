import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveOperatorConfig, isCommsAuthorized, configToAgentProfile } from "@/lib/operator-config"
import type { AgentProfile } from "@/lib/operator-config"
import * as tls from "tls"
import * as fs from "fs"
import * as path from "path"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

const IMAP_HOST = "imap.hostinger.com"
const IMAP_PORT = 993
const DEFAULT_IMAP_PASS = process.env.IMAP_CLAIM_PASSWORD || "Thepassword#1234"

// Template paths
const AGREEMENT_EN_PATH = path.join(process.cwd(), "documents", "Contingency-Fee-Agreement-V1.docx")
const AGREEMENT_ES_PATH = path.join(process.cwd(), "documents", "Acuerdo-de-Honorarios-Contingentes-ES.docx")

// Hispanic/Latino surname detection
const HISPANIC_SURNAMES = new Set([
  "garcia","rodriguez","martinez","hernandez","lopez","gonzalez","gonzales","perez",
  "sanchez","ramirez","torres","flores","rivera","gomez","diaz","reyes","morales",
  "jimenez","ruiz","alvarez","mendoza","gutierrez","ortiz","castillo","romero",
  "chavez","vasquez","vazquez","medina","herrera","guerrero","mendez","vargas",
  "aguilar","contreras","sandoval","delgado","cruz","salazar","soto","ramos",
  "dominguez","silva","figueroa","moreno","estrada","cordero","acosta","mejia",
  "nunez","campos","maldonado","padilla","miranda","cervantes","vega","trujillo",
  "espinoza","cabrera","fuentes","cardenas","leon","solis","pacheco","avila",
  "rosales","barrera","pena","villanueva","lozano","bautista","rojas","valdez",
  "molina","navarro","valenzuela","santiago","ocampo","marquez","serrano","ibarra",
  "mata","zuniga","duran","montes","velasquez","salinas","orozco","carrillo",
  "cortez","bravo","arellano","aguirre","macias","luna","camacho","rangel",
  "guzman","quintero","rios","huerta","gallegos","zamora","cisneros","palacios",
  "ojeda","esquivel","tovar","coronado","lara","nava","paredes","jaramillo",
  "escobar","juarez","bermudez","villarreal","balderas","tellez","meza","montoya",
  "delacruz","delarosa","dejesus","delapaz",
])

const HISPANIC_FIRST_NAMES = new Set([
  "jose","juan","carlos","luis","miguel","francisco","jorge","pedro","rafael",
  "alejandro","fernando","ricardo","eduardo","antonio","roberto","manuel","jesus",
  "daniel","mario","cesar","hector","alfredo","enrique","raul","oscar","sergio",
  "arturo","armando","gabriel","ramon","pablo","guillermo","andres","felipe",
  "gerardo","jaime","ernesto","javier","marcos","ruben","gustavo","hugo","ignacio",
  "maria","rosa","carmen","guadalupe","patricia","martha","luz","ana","elena",
  "margarita","leticia","isabel","teresa","alicia","irma","beatriz","adriana",
  "gabriela","silvia","yolanda","claudia","veronica","lorena","diana","laura",
  "maricela","pilar","dolores","lourdes","esperanza","socorro","consuelo",
  "concepcion","graciela","rocio","alejandra","blanca","esmeralda","catalina",
])

function isHispanicName(ownerName: string): boolean {
  if (!ownerName) return false
  const parts = ownerName.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean)
  for (const part of parts) {
    if (HISPANIC_SURNAMES.has(part)) return true
    if (HISPANIC_FIRST_NAMES.has(part)) return true
  }
  // Check compound surnames like "DE LA CRUZ" -> "delacruz"
  const joined = parts.join("")
  for (const surname of HISPANIC_SURNAMES) {
    if (joined.includes(surname)) return true
  }
  return false
}

function generateFilledAgreementEN(leadData: Record<string, string>): Buffer {
  const fullName = [leadData.first_name, leadData.last_name].filter(Boolean).join(" ") || leadData.owner_name || ""
  const address = leadData.property_address || leadData.mailing_address || ""
  const city = leadData.city || ""
  const state = leadData.state || ""
  const zip = leadData.zip_code || ""
  const cityStateZip = [city, state].filter(Boolean).join(", ") + (zip ? `  ${zip}` : "")
  const phone = leadData.primary_phone || ""
  const overage = parseFloat(leadData.overage_amount) || parseFloat(leadData.estimated_surplus) || 0
  const formattedOverage = "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(overage)

  const content = fs.readFileSync(AGREEMENT_EN_PATH)
  const zip_ = new PizZip(content)
  const doc = new Docxtemplater(zip_, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render({
    "Claimant Full Name": fullName,
    "Street Address": address,
    "City, State  ZIP": cityStateZip,
    "Phone Number": phone,
    "$XX,XXX": formattedOverage,
  })

  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer
}

function generateFilledAgreementES(leadData: Record<string, string>): Buffer {
  const fullName = [leadData.first_name, leadData.last_name].filter(Boolean).join(" ") || leadData.owner_name || ""
  const address = leadData.property_address || leadData.mailing_address || ""
  const city = leadData.city || ""
  const state = leadData.state || ""
  const zip = leadData.zip_code || ""
  const cityStateZip = [city, state].filter(Boolean).join(", ") + (zip ? `  ${zip}` : "")
  const phone = leadData.primary_phone || ""
  const overage = parseFloat(leadData.overage_amount) || parseFloat(leadData.estimated_surplus) || 0
  const formattedOverage = "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(overage)

  const content = fs.readFileSync(AGREEMENT_ES_PATH)
  const zip_ = new PizZip(content)
  const doc = new Docxtemplater(zip_, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render({
    "Nombre Completo del Reclamante": fullName,
    "Dirección": address,
    "Ciudad, Estado  CP": cityStateZip,
    "Número de Teléfono": phone,
    "$XX,XXX": formattedOverage,
  })

  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function formatDateES(): string {
  return new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

const STATE_CLAIM_WINDOWS: Record<string, number> = {
  AL: 1, AK: 1, AZ: 1, AR: 2, CA: 1, CO: 1, CT: 1, DE: 2, FL: 1, GA: 1,
  HI: 1, ID: 1, IL: 1, IN: 1, IA: 2, KS: 2, KY: 1, LA: 1, ME: 1, MD: 3,
  MA: 3, MI: 1, MN: 1, MS: 1, MO: 2, MT: 1, NE: 2, NV: 1, NH: 1, NJ: 2,
  NM: 1, NY: 5, NC: 1, ND: 2, OH: 2, OK: 2, OR: 2, PA: 2, RI: 1, SC: 1,
  SD: 1, TN: 1, TX: 2, UT: 1, VT: 1, VA: 1, WA: 1, WV: 1, WI: 1, WY: 1, DC: 2,
}

function getStateName(abbr: string): string {
  const names: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
    KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
    MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
    NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
    OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
  }
  return names[abbr.toUpperCase()] || abbr
}

function calculateDeadline(saleDate: string, stateAbbr: string): { daysRemaining: number; deadlineDate: string; urgency: string; stateName: string; claimYears: number } | null {
  if (!saleDate) return null
  const sale = new Date(saleDate)
  if (isNaN(sale.getTime())) return null
  const stateKey = (stateAbbr || "").toUpperCase()
  const claimYears = STATE_CLAIM_WINDOWS[stateKey] || 1
  const deadline = new Date(sale)
  deadline.setFullYear(deadline.getFullYear() + claimYears)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (daysRemaining < 0) return null
  const deadlineDate = deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const urgency = daysRemaining <= 60 ? "critical" : daysRemaining <= 120 ? "high" : "standard"
  const stateName = getStateName(stateKey)
  return { daysRemaining, deadlineDate, urgency, stateName, claimYears }
}

function buildLeadVars(lead: Record<string, string>) {
  const firstName = lead.first_name || lead.owner_name?.split(" ")[0] || "Homeowner"
  const lastName = lead.last_name || lead.owner_name?.split(" ").slice(1).join(" ") || ""
  const rawPropertyAddress = lead.property_address || ""
  const rawMailingAddress = lead.mailing_address || ""
  const city = lead.city || ""
  const state = lead.state || ""
  const fullAddress = rawPropertyAddress
    ? (city && state ? `${rawPropertyAddress}, ${city}, ${state}` : rawPropertyAddress)
    : rawMailingAddress || "your property"
  const county = lead.county || ""
  const apn = lead.apn_number || lead.parcel_id || ""
  const propertyType = lead.property_type || "Residential"
  const caseNumber = lead.case_number || ""
  const estimatedSurplus = parseFloat(lead.overage_amount) || parseFloat(lead.estimated_surplus) || 0
  const deadlineInfo = calculateDeadline(lead.sale_date, lead.state)
  const stateKey = (lead.state || "").toUpperCase()
  const claimYears = STATE_CLAIM_WINDOWS[stateKey] || 1
  const stateName = stateKey ? getStateName(stateKey) : ""
  return { firstName, lastName, fullAddress, county, apn, propertyType, caseNumber, estimatedSurplus, deadlineInfo, stateKey, claimYears, stateName, state }
}

function buildEmailHead(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
@media only screen and (max-width: 620px) {
.email-container { width: 100% !important; max-width: 100% !important; }
.padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
.property-box { padding: 18px 16px !important; }
}
</style>
</head>`
}

function buildPropertyBox(v: ReturnType<typeof buildLeadVars>): string {
  return `<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;">
<table style="border: 1px solid #dce1e8; border-radius: 6px; border-left: 4px solid #09274C;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td class="property-box" style="padding: 22px 24px;">
<p style="margin: 0 0 12px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Property on Record</p>
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">Address:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${v.fullAddress}</td></tr>
${v.county ? `<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">County:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${v.county}</td></tr>` : ""}
${v.apn ? `<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">APN:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${v.apn}</td></tr>` : ""}
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">State:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${v.state}</td></tr>
<tr><td style="padding: 5px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top;" width="110">Property Type:</td><td style="padding: 5px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${v.propertyType}</td></tr>
${v.estimatedSurplus > 0 ? `<tr><td style="padding: 8px 0 5px; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif; vertical-align: top; border-top: 1px solid #e2e6eb;" width="110">Est. Surplus:</td><td style="padding: 8px 0 5px; font-size: 16px; color: #1a7a3a; font-weight: 700; font-family: 'Inter Tight', sans-serif; border-top: 1px solid #e2e6eb;">${formatCurrency(v.estimatedSurplus)}</td></tr>` : ""}
</tbody>
</table>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>`
}

function buildDeadlineBox(v: ReturnType<typeof buildLeadVars>, lang: "en" | "es" = "en"): string {
  const di = v.deadlineInfo
  if (di) {
    const bgColor = di.urgency === "critical" ? "#fff5f5" : di.urgency === "high" ? "#fffbeb" : "#f0f9ff"
    const borderColor = di.urgency === "critical" ? "#D82221" : di.urgency === "high" ? "#d97706" : "#09274c"
    const labelColor = di.urgency === "critical" ? "#D82221" : "#09274c"
    const daysColor = di.urgency === "critical" ? "#D82221" : "#5a6d82"
    const urgentLabel = di.urgency === "critical" ? (lang === "es" ? "URGENTE" : "URGENT") : (lang === "es" ? "IMPORTANTE" : "IMPORTANT")
    const deadlineLabel = lang === "es" ? "Plazo Legal Estatal" : `${di.stateName} Statutory Deadline`
    const bodyText = lang === "es"
      ? `Segun la ley de ${di.stateName}, los antiguos propietarios tienen <strong style="color: #09274c;">${di.claimYears} ano${di.claimYears > 1 ? "s" : ""}</strong> desde la fecha de la venta por ejecucion hipotecaria para reclamar los fondos excedentes. Su fecha limite es <strong style="color: ${labelColor};">${di.deadlineDate}</strong>.`
      : `Under ${di.stateName} law, former property owners have <strong style="color: #09274c;">${di.claimYears} year${di.claimYears > 1 ? "s" : ""}</strong> from the date of the foreclosure sale to claim surplus funds. Your deadline is <strong style="color: ${labelColor};">${di.deadlineDate}</strong>.`
    const daysText = lang === "es"
      ? `${di.urgency === "critical" ? "URGENTE -- " : ""}${di.daysRemaining} dias restantes para iniciar su reclamo`
      : `${di.urgency === "critical" ? "URGENT -- " : ""}${di.daysRemaining} days remaining to initiate your claim`
    return `<table style="background-color: ${bgColor}; border-radius: 6px; border-left: 4px solid ${borderColor};" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 4px; font-size: 11px; color: ${labelColor}; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">${urgentLabel} -- ${deadlineLabel}</p>
<p style="margin: 0 0 6px; font-size: 15px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight', sans-serif;">${bodyText}</p>
<p style="margin: 0; font-size: 14px; color: ${daysColor}; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${daysText}</p>
</td></tr></tbody>
</table>
<div style="height: 18px;">&nbsp;</div>`
  }
  // No sale date - show generic urgent box
  const bodyText = lang === "es"
    ? `Segun la ley de ${v.stateName || "su estado"}, los antiguos propietarios tienen <strong style="color: #09274c;">${v.claimYears} ano${v.claimYears > 1 ? "s" : ""}</strong> desde la fecha de la venta por ejecucion hipotecaria para reclamar fondos excedentes. Este es un asunto urgente y le recomendamos responder a la mayor brevedad posible.`
    : `Under ${v.stateName || "state"} law, former property owners have <strong style="color: #09274c;">${v.claimYears} year${v.claimYears > 1 ? "s" : ""}</strong> from the date of the foreclosure sale to claim surplus funds. This is a time-sensitive matter and we strongly encourage you to respond at your earliest convenience to preserve your position within the applicable timeframe.`
  const actText = lang === "es" ? "Actue ahora -- su plazo legal es limitado" : "Act now -- your statutory window is limited"
  return `<table style="background-color: #fff5f5; border-radius: 6px; border-left: 4px solid #D82221;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 4px; font-size: 11px; color: #D82221; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">${lang === "es" ? "URGENTE" : "URGENT"} -- ${lang === "es" ? "Plazo Legal Estatal" : `${v.stateName || "State"} Statutory Deadline`}</p>
<p style="margin: 0 0 6px; font-size: 15px; color: #2c3e50; line-height: 24px; font-family: 'Inter Tight', sans-serif;">${bodyText}</p>
<p style="margin: 0; font-size: 14px; color: #D82221; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${actText}</p>
</td></tr></tbody>
</table>
<div style="height: 18px;">&nbsp;</div>`
}

function buildFooter(senderEmail: string, a: AgentProfile): string {
  const companyAddr = a.companyAddress
  const companyName = a.companyName
  const privacyUrl = a.privacyPolicyUrl
  return `<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px 0;"><div style="border-top: 2px solid #D82221; width: 60px;">&nbsp;</div></td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 20px 40px 30px;">
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight', sans-serif;">${companyAddr}</p>
<p style="margin: 0 0 10px; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight', sans-serif;">This correspondence pertains to the property and individual(s) named above. Recovery of foreclosure surplus proceeds is subject to individual case evaluation and applicable state statutes. ${companyName} is not a law firm and does not provide legal counsel. Estimated timelines may vary based on state regulations and third-party response times.</p>
<p style="margin: 0; font-size: 11px; color: #8a96a5; line-height: 17px; font-family: 'Inter Tight', sans-serif;">&copy; 2026 ${companyName} All rights reserved.&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="${privacyUrl}">Privacy Policy</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a style="color: #7a8a9e; text-decoration: underline;" href="#">Unsubscribe</a></p>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</div>
</center>
</body>
</html>`
}

function populateTemplate(lead: Record<string, string>, senderEmail: string, agent: AgentProfile): { subject: string; html: string } {
  const v = buildLeadVars(lead)
  const a = agent
  const subject = `Re: Property Equity Distribution -- ${v.fullAddress}`
  const html = `${buildEmailHead()}
<body>
<center style="width: 100%; background-color: #f4f5f7;">
<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">Re: Forwarding address needed -- Property at ${v.fullAddress} -- Please respond at your earliest convenience.</div>
<div class="email-container" style="max-width: 600px; margin: 0 auto;">
<!--[if mso]><table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"><tr><td><![endif]-->
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 20px;">
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td align="left" valign="middle" width="55%"><a style="text-decoration: none;" href="${a.websiteUrl}" target="_blank" rel="noopener"><img style="display: block; max-width: 185px; height: auto;" src="${a.logoUrl}" alt="${a.logoAlt}" width="185" /></a></td>
<td align="right" valign="middle" width="45%">
<p style="margin: 0; font-size: 12px; color: #7a8a9e; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 18px;">${formatDate()}${v.caseNumber ? `<br /><span style="color: #09274c; font-weight: 600;">Ref: <span style="color: #0a0a0a; font-size: 14px; font-weight: 500;">${v.caseNumber}</span></span>` : ""}</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;"><div style="border-top: 1px solid #e2e6eb;">&nbsp;</div></td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 10px 40px 0;">
<p style="margin: 0 0 6px; font-size: 11px; color: #7a8a9e; text-transform: uppercase; letter-spacing: 1.2px; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 600;">Re: Property Equity Distribution</p>
<h1 style="margin: 0 0 24px; font-size: 21px; color: #09274c; font-weight: bold; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 28px;">Forwarding Address Required for<br />Fund Distribution</h1>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Dear ${v.firstName} ${v.lastName},</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">I recently left a voicemail regarding this matter and wanted to follow up in writing. ${a.introEN}</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">We are writing to inform you that the property referenced below has been identified as having <strong style="color: #09274c;">excess equity proceeds</strong> associated with the <strong style="color: #09274c;">foreclosure sale</strong>. After the lending institution has been satisfied from the auction, the remaining balance is to be distributed to the former owner of record.</p>
</td>
</tr></tbody>
</table>
${buildPropertyBox(v)}
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 24px 40px 0;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">To ensure the proceeds are directed to the correct recipient, we need to confirm your <strong style="color: #09274c;">current forwarding address</strong>. This allows us to coordinate distribution once the lending institution has been made whole and the remaining balance is ready for release.</p>
${buildDeadlineBox(v, "en")}
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;">
<table style="background-color: #f7f9fb; border-radius: 6px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 14px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">How to Respond</p>
<table style="margin-bottom: 12px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9742;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">By Phone</strong><br /><span style="color: #2c3e50;">${a.byPhoneEN}</span></p></td>
</tr></tbody>
</table>
<table style="margin-bottom: 12px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9993;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">By Email</strong><br /><span style="color: #2c3e50;">Reply to this email or write to </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="mailto:${senderEmail}">${senderEmail}</a></p></td>
</tr></tbody>
</table>
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9635;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">Online</strong><br /><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="${a.claimPageUrl}">${a.websiteDisplay}</a></p></td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 22px 40px 0;">
<table style="background-color: #fef9f0; border: 1px solid #f0e0c0; border-radius: 6px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 10px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">Ready to Get Started?</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight', sans-serif;">We have attached our <strong style="color: #09274c;">Contingency Fee Agreement</strong> for your review. This is a no-risk, no-upfront-cost arrangement -- you only pay if we successfully recover your funds.</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight', sans-serif;">If you would like to get started right away, simply <strong style="color: #09274c;">print page 5</strong> of the attached agreement, sign it, take a photo, and send it back to us by replying to this email or texting it to <strong style="color: #09274c;">${a.phoneDisplay}</strong>. We will begin working on your claim immediately.</p>
<p style="margin: 0; font-size: 13px; color: #5a6d82; line-height: 20px; font-family: 'Inter Tight', sans-serif;">No upfront costs. No risk to you. We only get paid when you do.</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 12px;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">If this message has reached a family member or someone at this address, we kindly ask that you pass this information along to ${v.firstName} ${v.lastName} as soon as possible.</p>
<p style="margin: 0 0 24px; font-size: 15px; color: #2c3e50; line-height: 26px;">We appreciate your prompt attention to this matter.</p>
<table style="border-top: 1px solid #e2e6eb; padding-top: 20px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 20px;">
<p style="margin: 0 0 2px; font-size: 15px; color: #09274c; font-weight: bold; font-family: 'Inter Tight', sans-serif;">${a.name}</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;">${a.signatureTitleEN}</p>
${a.onBehalfEN ? `<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;">${a.onBehalfEN}</p>` : ""}
<p style="margin: 8px 0 0; font-size: 13px; font-family: 'Inter Tight', sans-serif;"><a style="color: #09274c; text-decoration: none;" href="${a.phoneHref}">${a.phoneDisplay}</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color: #09274c; text-decoration: none;" href="mailto:${senderEmail}">${senderEmail}</a></p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
${buildFooter(senderEmail, a)}`
  return { subject, html }
}

function populateTemplateES(lead: Record<string, string>, senderEmail: string, agent: AgentProfile): { subject: string; html: string } {
  const v = buildLeadVars(lead)
  const a = agent
  const subject = `Re: Distribucion de Fondos Excedentes de la Propiedad -- ${v.fullAddress}`
  const html = `${buildEmailHead()}
<body>
<center style="width: 100%; background-color: #f4f5f7;">
<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">Re: Se necesita direccion de envio -- Propiedad en ${v.fullAddress} -- Por favor responda a la brevedad posible.</div>
<div class="email-container" style="max-width: 600px; margin: 0 auto;">
<!--[if mso]><table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"><tr><td><![endif]-->
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 20px;">
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td align="left" valign="middle" width="55%"><a style="text-decoration: none;" href="${a.websiteUrl}" target="_blank" rel="noopener"><img style="display: block; max-width: 185px; height: auto;" src="${a.logoUrl}" alt="${a.logoAlt}" width="185" /></a></td>
<td align="right" valign="middle" width="45%">
<p style="margin: 0; font-size: 12px; color: #7a8a9e; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 18px;">${formatDateES()}${v.caseNumber ? `<br /><span style="color: #09274c; font-weight: 600;">Ref: <span style="color: #0a0a0a; font-size: 14px; font-weight: 500;">${v.caseNumber}</span></span>` : ""}</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;"><div style="border-top: 1px solid #e2e6eb;">&nbsp;</div></td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 10px 40px 0;">
<p style="margin: 0 0 6px; font-size: 11px; color: #7a8a9e; text-transform: uppercase; letter-spacing: 1.2px; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 600;">Re: Distribucion de Fondos Excedentes</p>
<h1 style="margin: 0 0 24px; font-size: 21px; color: #09274c; font-weight: bold; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 28px;">Se Requiere Direccion de Envio para<br />la Distribucion de Fondos</h1>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Estimado/a ${v.firstName} ${v.lastName},</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Recientemente le deje un mensaje de voz sobre este asunto y queria darle seguimiento por escrito. ${a.introES}</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Le escribimos para informarle que la propiedad que se menciona a continuacion ha sido identificada como poseedora de <strong style="color: #09274c;">fondos excedentes</strong> asociados con la <strong style="color: #09274c;">venta por ejecucion hipotecaria</strong>. Una vez que la institucion crediticia haya sido satisfecha con el producto de la subasta, el saldo restante debe ser distribuido al antiguo propietario registrado.</p>
</td>
</tr></tbody>
</table>
${buildPropertyBox(v)}
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 24px 40px 0;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Para asegurar que los fondos sean dirigidos al destinatario correcto, necesitamos confirmar su <strong style="color: #09274c;">direccion de envio actual</strong>. Esto nos permite coordinar la distribucion una vez que la institucion crediticia haya sido satisfecha y el saldo restante este listo para su entrega.</p>
${buildDeadlineBox(v, "es")}
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;">
<table style="background-color: #f7f9fb; border-radius: 6px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 14px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">Como Responder</p>
<table style="margin-bottom: 12px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9742;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">Por Telefono</strong><br /><span style="color: #2c3e50;">${a.byPhoneES}</span></p></td>
</tr></tbody>
</table>
<table style="margin-bottom: 12px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9993;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">Por Correo Electronico</strong><br /><span style="color: #2c3e50;">Responda a este correo o escriba a </span><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="mailto:${senderEmail}">${senderEmail}</a></p></td>
</tr></tbody>
</table>
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 2px;" valign="top" width="32"><div style="width: 26px; height: 26px; border-radius: 50%; background-color: #09274c; color: #ffffff; text-align: center; line-height: 26px; font-size: 13px;">&#9635;</div></td>
<td style="padding-left: 10px;"><p style="margin: 0; font-size: 14px; line-height: 22px; font-family: 'Inter Tight', sans-serif;"><strong style="color: #09274c;">En Linea</strong><br /><a style="color: #09274c; font-weight: 600; text-decoration: none;" href="${a.claimPageUrl}">${a.websiteDisplay}</a></p></td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 22px 40px 0;">
<table style="background-color: #fef9f0; border: 1px solid #f0e0c0; border-radius: 6px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 22px 24px;">
<p style="margin: 0 0 10px; font-size: 13px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; font-family: 'Inter Tight', sans-serif;">Listo/a para Comenzar?</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight', sans-serif;">Hemos adjuntado nuestro <strong style="color: #09274c;">Acuerdo de Honorarios Contingentes</strong> para su revision. Este es un acuerdo sin riesgo y sin costo inicial -- usted solo paga si recuperamos sus fondos exitosamente.</p>
<p style="margin: 0 0 12px; font-size: 14px; color: #2c3e50; line-height: 22px; font-family: 'Inter Tight', sans-serif;">Si desea comenzar de inmediato, simplemente <strong style="color: #09274c;">imprima la pagina 5</strong> del acuerdo adjunto, firmelo, tome una foto y envienosla respondiendo a este correo o enviando un mensaje de texto al <strong style="color: #09274c;">${a.phoneDisplay}</strong>. Comenzaremos a trabajar en su reclamo de inmediato.</p>
<p style="margin: 0; font-size: 13px; color: #5a6d82; line-height: 20px; font-family: 'Inter Tight', sans-serif;">Sin costos iniciales. Sin riesgo para usted. Solo cobramos cuando usted recibe su dinero.</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 12px;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">Si este mensaje ha llegado a un familiar o a alguien en esta direccion, le pedimos amablemente que transmita esta informacion a ${v.firstName} ${v.lastName} lo antes posible.</p>
<p style="margin: 0 0 24px; font-size: 15px; color: #2c3e50; line-height: 26px;">Agradecemos su pronta atencion a este asunto.</p>
<table style="border-top: 1px solid #e2e6eb; padding-top: 20px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-top: 20px;">
<p style="margin: 0 0 2px; font-size: 15px; color: #09274c; font-weight: bold; font-family: 'Inter Tight', sans-serif;">${a.name}</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;">${a.signatureTitleES}</p>
${a.onBehalfES ? `<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;">${a.onBehalfES}</p>` : ""}
<p style="margin: 8px 0 0; font-size: 13px; font-family: 'Inter Tight', sans-serif;"><a style="color: #09274c; text-decoration: none;" href="${a.phoneHref}">${a.phoneDisplay}</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color: #09274c; text-decoration: none;" href="mailto:${senderEmail}">${senderEmail}</a></p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
${buildFooter(senderEmail, a)}`
  return { subject, html }
}

function imapAppendDraft(emailContent: string, imapUser: string, imapPass: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: "IMAP connection timed out" })
    }, 15000)

    let buffer = ""
    let state = "connecting"
    let tagCounter = 1
    let resolved = false

    const done = (result: { success: boolean; error?: string }) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      try { socket.destroy() } catch (_e) { /* ignore */ }
      resolve(result)
    }

    const socket = tls.connect(
      { host: IMAP_HOST, port: IMAP_PORT, rejectUnauthorized: false },
      () => { /* connected */ }
    )

    socket.setEncoding("utf8")

    socket.on("data", (data: string) => {
      buffer += data
      const lines = buffer.split("\r\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (state === "connecting" && line.startsWith("* OK")) {
          state = "login"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGIN ${imapUser} ${imapPass}\r\n`)
        } else if (state === "login" && /^A\d+ OK/.test(line)) {
          state = "append"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "login" && /^A\d+ (NO|BAD)/.test(line)) {
          done({ success: false, error: "IMAP login failed: " + line })
        } else if (state === "append" && line.startsWith("+")) {
          state = "appending"
          socket.write(emailContent + "\r\n")
        } else if (state === "append" && /^A\d+ NO/.test(line)) {
          state = "append2"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "INBOX.Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "appending" && /^A\d+ OK/.test(line)) {
          state = "logout"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGOUT\r\n`)
        } else if (state === "appending" && /^A\d+ NO/.test(line)) {
          state = "append2"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "INBOX.Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "append2" && line.startsWith("+")) {
          state = "appending2"
          socket.write(emailContent + "\r\n")
        } else if (state === "appending2" && /^A\d+ OK/.test(line)) {
          state = "logout"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGOUT\r\n`)
        } else if (state === "appending2" && /^A\d+ NO/.test(line)) {
          done({ success: false, error: "Could not append to Drafts: " + line })
        } else if (state === "logout") {
          done({ success: true })
        } else if (/^A\d+ (NO|BAD)/.test(line) && state !== "appending" && state !== "appending2") {
          done({ success: false, error: "IMAP error: " + line })
        }
      }
    })

    socket.on("error", (err: Error) => {
      done({ success: false, error: err.message })
    })
  })
}

function toBase64Lines(buf: Buffer): string[] {
  const b64 = buf.toString("base64")
  const lines: string[] = []
  for (let i = 0; i < b64.length; i += 76) {
    lines.push(b64.slice(i, i + 76))
  }
  return lines
}

function buildMimeEmail(opts: {
  from: string
  to: string
  subject: string
  html: string
  leadId: string
  senderName?: string
  attachments: { filename: string; base64Lines: string[] }[]
}): string {
  const mixedBoundary = "mixed_" + Date.now()
  const altBoundary = "alt_" + Date.now()
  const date = new Date().toUTCString()
  const fromDomain = opts.from.split("@")[1] || "usforeclosurerecovery.com"
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${fromDomain}>`
  const fromName = opts.senderName || "Foreclosure Recovery Inc."

  const parts = [
    `From: ${fromName} <${opts.from}>`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    `X-Lead-ID: ${opts.leadId}`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    "Please view this email in an HTML-capable email client.",
    "",
    `--${altBoundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    opts.html,
    "",
    `--${altBoundary}--`,
  ]

  for (const att of opts.attachments) {
    parts.push(
      "",
      `--${mixedBoundary}`,
      `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document; name="${att.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${att.filename}"`,
      "",
      ...att.base64Lines,
    )
  }

  parts.push("", `--${mixedBoundary}--`, "")
  return parts.join("\r\n")
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()

    if (!userEmail || !(await isCommsAuthorized(userEmail))) {
      return NextResponse.json({ error: "Access required" }, { status: 403 })
    }

    const body = await request.json()
    const { leadId, action, operatorPinId } = body

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const recipientEmail = lead.primary_email
    if (!recipientEmail) {
      return NextResponse.json({ error: "Lead has no email address" }, { status: 400 })
    }

    const config = await resolveOperatorConfig({
      clerkEmail: userEmail,
      operatorPinId: operatorPinId || null,
      leadId,
    })

    // CRITICAL GUARD: Never send emails with admin info for non-admin users.
    // If config resolved to admin defaults (no pinId found), reject the request.
    const ADMIN_EMAIL_LOWER = "coreypearsonemail@gmail.com"
    if (!config.pinId && userEmail?.toLowerCase() !== ADMIN_EMAIL_LOWER) {
      console.error("[email-draft] Blocked: non-admin user resolved to admin defaults", { userEmail, operatorPinId, leadId })
      return NextResponse.json(
        { error: "Could not resolve your agent profile. Please refresh the page and try again. If this persists, contact admin." },
        { status: 422 }
      )
    }

    const senderEmail = config.senderEmail
    // IMAP credentials: use Vercel env vars for agent-specific passwords (set in Vercel dashboard).
    // DB imap_password is fallback only. Vercel env vars are the source of truth for IMAP.
    const IMAP_PASSWORD_MAP: Record<string, string> = {
      "rebecca@usforeclosurerecovery.com": process.env.IMAP_REBECCA_PASSWORD || config.imapPassword || DEFAULT_IMAP_PASS,
      "joshua@usforeclosurerecovery.com": process.env.IMAP_JOSHUA_PASSWORD || config.imapPassword || DEFAULT_IMAP_PASS,
      "claim@usforeclosurerecovery.com": process.env.IMAP_CLAIM_PASSWORD || DEFAULT_IMAP_PASS,
      "contact@premiersurplusclaims.com": process.env.IMAP_AMARIYON_PASSWORD || config.imapPassword || "Amariyonpass$100",
    }
    const IMAP_USER = senderEmail
    const IMAP_PASS = IMAP_PASSWORD_MAP[senderEmail] || config.imapPassword || DEFAULT_IMAP_PASS
    const agentProfile = configToAgentProfile(config)

    const leadData: Record<string, string> = {
      owner_name: String(lead.owner_name || ""),
      first_name: String(lead.owner_name || "").split(" ")[0] || "",
      last_name: String(lead.owner_name || "").split(" ").slice(1).join(" ") || "",
      property_address: String(lead.property_address || ""),
      mailing_address: String(lead.mailing_address || ""),
      city: String(lead.city || ""),
      state: String(lead.state || lead.state_abbr || ""),
      county: String(lead.county || ""),
      apn_number: String(lead.apn_number || ""),
      parcel_id: String(lead.parcel_id || ""),
      case_number: String(lead.case_number || ""),
      property_type: String(lead.property_type || "Residential"),
      primary_email: recipientEmail,
      primary_phone: String(lead.primary_phone || ""),
      zip_code: String(lead.zip_code || ""),
      overage_amount: String(lead.overage_amount || "0"),
      estimated_surplus: String(lead.estimated_surplus || "0"),
      sale_date: String(lead.sale_date || ""),
    }

    const hispanicDetected = isHispanicName(leadData.owner_name)
    const firstName = leadData.first_name || "Claimant"
    const lastName = leadData.last_name || ""

    // Preview English
    if (action === "preview") {
      const { subject, html } = populateTemplate(leadData, senderEmail, agentProfile)
      return NextResponse.json({ success: true, subject, html, to: recipientEmail, from: senderEmail, hispanicDetected })
    }

    // Preview Spanish
    if (action === "preview_es") {
      const { subject, html } = populateTemplateES(leadData, senderEmail, agentProfile)
      return NextResponse.json({ success: true, subject, html, to: recipientEmail, from: senderEmail, hispanicDetected })
    }

    // Create English draft
    if (action === "create_draft" || action === "create_draft_en") {
      const { subject, html } = populateTemplate(leadData, senderEmail, agentProfile)
      let agreementBuf: Buffer
      try {
        agreementBuf = generateFilledAgreementEN(leadData)
      } catch (e) {
        return NextResponse.json({ error: `Agreement generation failed: ${e instanceof Error ? e.message : "Unknown"}` }, { status: 500 })
      }

      const attachmentFilename = `Contingency-Fee-Agreement-${firstName}-${lastName}.docx`.replace(/\s+/g, "-")
      const emailRaw = buildMimeEmail({
        from: senderEmail,
        to: recipientEmail,
        subject,
        html,
        leadId,
        senderName: config.companyName,
        attachments: [{ filename: attachmentFilename, base64Lines: toBase64Lines(agreementBuf) }],
      })

      const imapResult = await imapAppendDraft(emailRaw, IMAP_USER, IMAP_PASS)
      if (!imapResult.success) {
        return NextResponse.json({ error: `Draft creation failed: ${imapResult.error}` }, { status: 500 })
      }

      await supabaseAdmin.from("foreclosure_leads").update({ email_draft_created: true, email_draft_created_at: new Date().toISOString() }).eq("id", leadId)
      return NextResponse.json({ success: true, message: `English draft created in ${senderEmail}`, to: recipientEmail, subject })
    }

    // Create Spanish draft
    if (action === "create_draft_es") {
      const { subject, html } = populateTemplateES(leadData, senderEmail, agentProfile)
      let agreementBuf: Buffer
      try {
        agreementBuf = generateFilledAgreementES(leadData)
      } catch (e) {
        return NextResponse.json({ error: `Spanish agreement generation failed: ${e instanceof Error ? e.message : "Unknown"}` }, { status: 500 })
      }

      const attachmentFilename = `Acuerdo-Honorarios-Contingentes-${firstName}-${lastName}.docx`.replace(/\s+/g, "-")
      const emailRaw = buildMimeEmail({
        from: senderEmail,
        to: recipientEmail,
        subject,
        html,
        leadId,
        senderName: config.companyName,
        attachments: [{ filename: attachmentFilename, base64Lines: toBase64Lines(agreementBuf) }],
      })

      const imapResult = await imapAppendDraft(emailRaw, IMAP_USER, IMAP_PASS)
      if (!imapResult.success) {
        return NextResponse.json({ error: `Spanish draft creation failed: ${imapResult.error}` }, { status: 500 })
      }

      await supabaseAdmin.from("foreclosure_leads").update({ email_draft_created: true, email_draft_created_at: new Date().toISOString() }).eq("id", leadId)
      return NextResponse.json({ success: true, message: `Spanish draft created in ${senderEmail}`, to: recipientEmail, subject })
    }

    // Create both English + Spanish drafts (two separate emails in Drafts)
    if (action === "create_draft_both") {
      const enResult = populateTemplate(leadData, senderEmail, agentProfile)
      const esResult = populateTemplateES(leadData, senderEmail, agentProfile)
      let enAgreement: Buffer, esAgreement: Buffer
      try {
        enAgreement = generateFilledAgreementEN(leadData)
        esAgreement = generateFilledAgreementES(leadData)
      } catch (e) {
        return NextResponse.json({ error: `Agreement generation failed: ${e instanceof Error ? e.message : "Unknown"}` }, { status: 500 })
      }

      const enFilename = `Contingency-Fee-Agreement-${firstName}-${lastName}.docx`.replace(/\s+/g, "-")
      const esFilename = `Acuerdo-Honorarios-Contingentes-${firstName}-${lastName}.docx`.replace(/\s+/g, "-")

      // English draft
      const enEmail = buildMimeEmail({
        from: senderEmail, to: recipientEmail, subject: enResult.subject, html: enResult.html, leadId,
        senderName: config.companyName,
        attachments: [{ filename: enFilename, base64Lines: toBase64Lines(enAgreement) }],
      })
      const enImap = await imapAppendDraft(enEmail, IMAP_USER, IMAP_PASS)
      if (!enImap.success) {
        return NextResponse.json({ error: `English draft failed: ${enImap.error}` }, { status: 500 })
      }

      // Spanish draft
      const esEmail = buildMimeEmail({
        from: senderEmail, to: recipientEmail, subject: esResult.subject, html: esResult.html, leadId,
        senderName: config.companyName,
        attachments: [{ filename: esFilename, base64Lines: toBase64Lines(esAgreement) }],
      })
      const esImap = await imapAppendDraft(esEmail, IMAP_USER, IMAP_PASS)
      if (!esImap.success) {
        return NextResponse.json({ error: `Spanish draft failed: ${esImap.error}` }, { status: 500 })
      }

      await supabaseAdmin.from("foreclosure_leads").update({ email_draft_created: true, email_draft_created_at: new Date().toISOString() }).eq("id", leadId)
      return NextResponse.json({ success: true, message: `Both EN + ES drafts created in ${senderEmail}`, to: recipientEmail })
    }

    return NextResponse.json({ error: "Invalid action. Use: preview, preview_es, create_draft, create_draft_es, create_draft_both" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
