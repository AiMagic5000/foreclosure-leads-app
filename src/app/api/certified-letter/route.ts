import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import * as fs from "fs"
import * as path from "path"
import * as nodemailer from "nodemailer"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const CLAIM_EMAIL = "claim@usforeclosurerecovery.com"
const SMTP_HOST = "smtp.hostinger.com"
const SMTP_PORT = 465
const SMTP_USER = "support@usforeclosurerecovery.com"
const SMTP_PASS = process.env.IMAP_SUPPORT_PASSWORD || "Thepassword#1234"

const ALLOWED_EMAILS = new Set([
  ADMIN_EMAIL,
  "beckymaguire74@gmail.com",
  "jaywaylst@gmail.com",
])

interface AgentInfo {
  name: string
  title: string
  phoneDisplay: string
  textNumber: string
  email: string
}

const DEFAULT_AGENT: AgentInfo = {
  name: "Corey Pearson",
  title: "Director",
  phoneDisplay: "(888) 545-8007",
  textNumber: "725-287-7791",
  email: CLAIM_EMAIL,
}

const AGENT_PROFILES: Record<string, AgentInfo> = {
  "rebecca@usforeclosurerecovery.com": {
    name: "Rebecca Maguire",
    title: "Asset Recovery Agent",
    phoneDisplay: "(888) 545-8007 ext. 6",
    textNumber: "725-287-7791",
    email: "rebecca@usforeclosurerecovery.com",
  },
  "joshua@usforeclosurerecovery.com": {
    name: "Joshua Goc-ong",
    title: "Asset Recovery Agent",
    phoneDisplay: "(888) 545-8007 ext. 7",
    textNumber: "725-287-7791",
    email: "joshua@usforeclosurerecovery.com",
  },
}

const AGREEMENT_EN_PATH = path.join(process.cwd(), "documents", "Contingency-Fee-Agreement-V1.docx")
const LOGO_PATH = path.join(process.cwd(), "public", "logo-fri.png")

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function generateAgreement(lead: Record<string, unknown>): Buffer {
  const ownerName = String(lead.owner_name || "")
  const address = String(lead.property_address || lead.mailing_address || "")
  const city = String(lead.city || "")
  const state = String(lead.state || "")
  const zip = String(lead.zip_code || "")
  const cityStateZip = [city, state].filter(Boolean).join(", ") + (zip ? `  ${zip}` : "")
  const phone = String(lead.primary_phone || "")
  const overage = Number(lead.overage_amount) || 0
  const formattedOverage = formatCurrency(overage)

  const content = fs.readFileSync(AGREEMENT_EN_PATH)
  const zipFile = new PizZip(content)
  const doc = new Docxtemplater(zipFile, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render({
    "Claimant Full Name": ownerName,
    "Street Address": address,
    "City, State  ZIP": cityStateZip,
    "Phone Number": phone,
    "$XX,XXX": formattedOverage,
  })

  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer
}

function generateCertifiedLetter(lead: Record<string, unknown>, agent: AgentInfo): Buffer {
  const ownerName = String(lead.owner_name || "")
  const firstName = ownerName.split(" ")[0] || "Homeowner"
  const propertyAddress = String(lead.property_address || "")
  const mailingAddress = String(lead.mailing_address || "")
  const stateAbbr = String(lead.state_abbr || lead.state || "").toUpperCase().substring(0, 2)
  const stateName = getStateName(stateAbbr)
  const overage = Number(lead.overage_amount) || 0
  const formattedOverage = formatCurrency(overage)
  const claimYears = STATE_CLAIM_WINDOWS[stateAbbr] || 1
  const saleDate = lead.sale_date ? new Date(String(lead.sale_date)) : null
  let deadlineStr = ""
  if (saleDate && !isNaN(saleDate.getTime())) {
    const deadline = new Date(saleDate)
    deadline.setFullYear(deadline.getFullYear() + claimYears)
    deadlineStr = deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // Build docx using docxtemplater with a simple template
  const zip = new PizZip()

  // Create a minimal .docx with proper XML structure
  const letterBody = buildLetterXml({
    date: formatDate(),
    recipientName: ownerName,
    recipientAddress: mailingAddress || propertyAddress,
    firstName,
    propertyAddress,
    stateName,
    formattedOverage,
    deadlineStr,
    claimYears,
    agentName: agent.name,
    agentTitle: agent.title,
    agentPhone: agent.phoneDisplay,
    agentTextNumber: agent.textNumber,
  })

  // Read logo image for embedding
  const logoBuffer = fs.readFileSync(LOGO_PATH)

  // Header XML with logo image (centered, ~2 inches wide = 1828800 EMUs, proportional height ~914400 EMUs)
  const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:p>
    <w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="1828800" cy="914400"/>
          <wp:docPr id="1" name="Logo"/>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic>
                <pic:nvPicPr><pic:cNvPr id="1" name="logo-fri.png"/><pic:cNvPicPr/></pic:nvPicPr>
                <pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
                <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>
  </w:p>
</w:hdr>`

  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>')
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  zip.file("word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/></Relationships>')
  zip.file("word/_rels/header1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo-fri.png"/></Relationships>')
  zip.file("word/media/logo-fri.png", logoBuffer)
  zip.file("word/header1.xml", headerXml)
  zip.file("word/document.xml", letterBody)

  return zip.generate({ type: "nodebuffer" }) as Buffer
}

function buildLetterXml(data: {
  date: string
  recipientName: string
  recipientAddress: string
  firstName: string
  propertyAddress: string
  stateName: string
  formattedOverage: string
  deadlineStr: string
  claimYears: number
  agentName: string
  agentTitle: string
  agentPhone: string
  agentTextNumber: string
}): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const deadlineLine = data.deadlineStr
    ? `Under ${esc(data.stateName)} law, you have ${data.claimYears} year${data.claimYears > 1 ? "s" : ""} from the date of sale to claim these funds. Your deadline is ${esc(data.deadlineStr)}.`
    : `Under ${esc(data.stateName)} law, the window to claim these funds is limited to ${data.claimYears} year${data.claimYears > 1 ? "s" : ""} from the date of sale.`

  const paragraphs = [
    data.date,
    "",
    esc(data.recipientName),
    esc(data.recipientAddress),
    "",
    `Dear ${esc(data.firstName)},`,
    "",
    `We are writing to inform you that our forensic audit has identified excess funds that are owed to you following the foreclosure of your property at ${esc(data.propertyAddress)}.`,
    "",
    `Our records indicate that a surplus of approximately ${esc(data.formattedOverage)} remains in a state-held account from the foreclosure sale proceeds. These funds belong to you as the former property owner.`,
    "",
    deadlineLine,
    "",
    "Foreclosure Recovery Inc. specializes in helping former homeowners recover these funds. We work on a contingency basis -- there are no upfront costs to you. Our fee is only collected if we successfully recover your funds.",
    "",
    "Enclosed with this letter you will find:",
    "  1. Contingency Fee Agreement -- Please review, sign page 5, and text/email back to us",
    "  2. Limited Power of Attorney -- This authorizes us to conduct the forensic audit of your funds distribution on your behalf",
    "",
    "To get started, please:",
    "  - Review and sign the enclosed documents",
    `  - Take a photo of both signature pages and text them to ${esc(data.agentTextNumber)} or email them to us at claim@usforeclosurerecovery.com`,
    `  - Or call ${esc(data.agentName)} directly at ${esc(data.agentPhone)}`,
    "",
    "Time is of the essence. The state will not hold these funds indefinitely, and your right to claim them has a strict deadline.",
    "",
    "If you have any questions, do not hesitate to reach out. We are here to help you recover what is rightfully yours.",
    "",
    "Sincerely,",
    "",
    esc(data.agentName),
    esc(data.agentTitle),
    "Foreclosure Recovery Inc.",
    `${esc(data.agentPhone)}`,
    "claim@usforeclosurerecovery.com",
    "https://usforeclosurerecovery.com",
  ]

  const xmlParagraphs = paragraphs.map((line) => {
    if (line === "") {
      return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>'
    }
    const bold = line === data.date || line.startsWith("Dear ") || line === "Sincerely," || line === esc(data.agentName) || line.startsWith("Enclosed") || line.startsWith("To get started")
    const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : ""
    return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${line}</w:t></w:r></w:p>`
  }).join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${xmlParagraphs}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="2160" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

function generatePOA(lead: Record<string, unknown>, agent: AgentInfo): Buffer {
  const ownerName = String(lead.owner_name || "")
  const propertyAddress = String(lead.property_address || "")
  const mailingAddress = String(lead.mailing_address || "")
  const stateAbbr = String(lead.state_abbr || "").toUpperCase()
  const stateName = getStateName(stateAbbr)
  const city = String(lead.city || "")
  const zip = String(lead.zip_code || "")
  const fullPropertyAddress = propertyAddress + (city ? `, ${city}` : "") + (stateAbbr ? `, ${stateAbbr}` : "") + (zip ? ` ${zip}` : "")

  const zip_ = new PizZip()

  // Page 1: Body content (title through DURATION)
  const page1Paragraphs = [
    { text: "LIMITED POWER OF ATTORNEY", bold: true, center: true, size: 28 },
    { text: "Forensic Audit Authorization", bold: true, center: true, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: `Date: ${formatDate()}`, bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: `I, ${esc(ownerName)}, residing at ${esc(mailingAddress || fullPropertyAddress)}, hereby grant a Limited Power of Attorney to Foreclosure Recovery Inc., and its authorized agents, to act on my behalf for the sole purpose described below.`, bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "SCOPE OF AUTHORITY", bold: true, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: `This Limited Power of Attorney authorizes Foreclosure Recovery Inc. to conduct a forensic audit of the funds distribution related to the foreclosure of the property located at: ${esc(fullPropertyAddress)}`, bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "Specifically, the agent is authorized to:", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: `1. Request, obtain, and review all records related to the foreclosure sale proceeds from the state of ${esc(stateName)} and any relevant state agencies or financial institutions.`, bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "2. Communicate with state agencies, courts, trustees, and financial institutions regarding surplus funds from the foreclosure sale.", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "3. Review the distribution of all proceeds to identify any surplus, excess, or overage amounts owed to the Principal.", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "4. Prepare and submit claims or petitions for surplus fund recovery on behalf of the Principal.", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "LIMITATIONS", bold: true, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "This Power of Attorney is LIMITED to the forensic audit and recovery of surplus foreclosure funds only. It does NOT authorize the agent to sell, transfer, or encumber any property, enter into financial obligations, or take any action beyond the scope described above.", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "DURATION", bold: true, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "This Limited Power of Attorney shall remain in effect for a period of one (1) year from the date of execution, or until the surplus fund recovery process is completed, whichever occurs first. The Principal may revoke this Power of Attorney at any time by providing written notice.", bold: false, center: false, size: 22 },
  ]

  // Page 2: Signature Page
  const page2Paragraphs = [
    { text: "LIMITED POWER OF ATTORNEY -- SIGNATURE PAGE", bold: true, center: true, size: 28 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "PRINCIPAL (Property Owner)", bold: true, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: `Printed Name: ${esc(ownerName)}`, bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: `Property Address: ${esc(fullPropertyAddress)}`, bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "Signature: ________________________________________", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "Date: ________________________________________", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "WITNESS", bold: true, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "Signature: ________________________________________", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "Printed Name: ________________________________________", bold: false, center: false, size: 22 },
    { text: "", bold: false, center: false, size: 22 },
    { text: "Date: ________________________________________", bold: false, center: false, size: 22 },
  ]

  function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }

  function renderParagraphs(paragraphs: Array<{ text: string; bold: boolean; center: boolean; size: number }>): string {
    return paragraphs.map((p) => {
      if (p.text === "") {
        return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>'
      }
      const alignment = p.center ? "<w:jc w:val=\"center\"/>" : ""
      const bPr = p.bold ? "<w:b/>" : ""
      const szPr = p.size ? `<w:sz w:val="${p.size}"/><w:szCs w:val="${p.size}"/>` : ""
      return `<w:p><w:pPr>${alignment}</w:pPr><w:r><w:rPr>${bPr}${szPr}</w:rPr><w:t xml:space="preserve">${esc(p.text)}</w:t></w:r></w:p>`
    }).join("")
  }

  const page1Xml = renderParagraphs(page1Paragraphs)
  const page2Xml = renderParagraphs(page2Paragraphs)

  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:t xml:space="preserve">Page </w:t></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:instrText> PAGE </w:instrText></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:t>1</w:t></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:t xml:space="preserve"> of </w:t></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:instrText> NUMPAGES </w:instrText></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:t>2</w:t></w:r>
    <w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:ftr>`

  // Page break between page 1 and page 2
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${page1Xml}
    ${pageBreak}
    ${page2Xml}
    <w:sectPr>
      <w:footerReference w:type="default" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`

  zip_.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>')
  zip_.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  zip_.file("word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>')
  zip_.file("word/footer1.xml", footerXml)
  zip_.file("word/document.xml", docXml)

  return zip_.generate({ type: "nodebuffer" }) as Buffer
}

function buildNotificationHtml(lead: Record<string, unknown>, agent: AgentInfo, agentNotes: string): string {
  const ownerName = String(lead.owner_name || "")
  const propertyAddress = String(lead.property_address || "")
  const mailingAddress = String(lead.mailing_address || "")
  const stateAbbr = String(lead.state_abbr || "")
  const overage = Number(lead.overage_amount) || 0
  const formattedOverage = formatCurrency(overage)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #09274c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 22px;">Certified Mail Request</h1>
    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Foreclosure Recovery Inc.</p>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 16px;"><strong>Requesting Agent:</strong> ${agent.name} (${agent.email})</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: 600; width: 140px;">Claimant</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${ownerName}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: 600;">Property Address</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${propertyAddress}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: 600;">Mailing Address</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${mailingAddress}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: 600;">State</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${stateAbbr}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: 600;">Surplus Amount</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #059669; font-weight: 600;">${formattedOverage}</td></tr>
    </table>
    ${agentNotes ? `<div style="background: #fef9f0; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-bottom: 16px;"><strong>Agent Notes:</strong><br>${agentNotes}</div>` : ""}
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px;">
      <strong>Attached Documents (Print &amp; Mail via Certified Mail):</strong>
      <ol style="margin: 8px 0 0; padding-left: 20px;">
        <li>Outreach Letter to Claimant</li>
        <li>Contingency Fee Agreement (pre-filled)</li>
        <li>Limited Power of Attorney (Forensic Audit Authorization)</li>
      </ol>
    </div>
    <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">This request will be processed within 24 hours. All three documents will be printed and sent via USPS Certified Mail to the mailing address above.</p>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    if (!userEmail || !ALLOWED_EMAILS.has(userEmail)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { leadId, notes } = body

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    // Fetch lead
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Verify mailing address differs from property address
    const propertyAddr = String(lead.property_address || "").toLowerCase().trim()
    const mailingAddr = String(lead.mailing_address || "").toLowerCase().trim()

    if (!mailingAddr || mailingAddr === propertyAddr) {
      return NextResponse.json({ error: "Lead does not have a separate mailing address" }, { status: 400 })
    }

    // Determine agent profile
    const agentEmail = String(lead.agent_email || "")
    const agent = AGENT_PROFILES[agentEmail] || DEFAULT_AGENT

    // Generate all three documents
    const letterBuffer = generateCertifiedLetter(lead, agent)
    const agreementBuffer = generateAgreement(lead)
    const poaBuffer = generatePOA(lead, agent)

    const ownerName = String(lead.owner_name || "Unknown")
    const sanitizedName = ownerName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-")
    const agentNotes = String(notes || "").trim()

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })

    const subject = `Certified Mail Request - ${ownerName} - ${String(lead.state_abbr || "")} - ${formatCurrency(Number(lead.overage_amount) || 0)}`
    const htmlBody = buildNotificationHtml(lead, agent, agentNotes)

    // Send to claim@ with all attachments
    await transporter.sendMail({
      from: `"Foreclosure Recovery Inc." <${SMTP_USER}>`,
      to: CLAIM_EMAIL,
      subject,
      html: htmlBody,
      attachments: [
        { filename: `Letter-${sanitizedName}.docx`, content: letterBuffer },
        { filename: `Agreement-${sanitizedName}.docx`, content: agreementBuffer },
        { filename: `POA-${sanitizedName}.docx`, content: poaBuffer },
      ],
    })

    // Send notification to agent email (no attachments, just notification)
    if (agent.email !== CLAIM_EMAIL) {
      await transporter.sendMail({
        from: `"Foreclosure Recovery Inc." <${SMTP_USER}>`,
        to: agent.email,
        subject: `Certified Mail Request Submitted - ${ownerName}`,
        html: htmlBody,
      })
    }

    // Also notify requesting agent's personal email
    const agentPersonalEmails: Record<string, string> = {
      "rebecca@usforeclosurerecovery.com": "beckymaguire74@gmail.com",
      "joshua@usforeclosurerecovery.com": "jaywaylst@gmail.com",
    }
    const personalEmail = agentPersonalEmails[agentEmail]
    if (personalEmail && personalEmail !== userEmail) {
      await transporter.sendMail({
        from: `"Foreclosure Recovery Inc." <${SMTP_USER}>`,
        to: personalEmail,
        subject: `Certified Mail Request Submitted - ${ownerName}`,
        html: htmlBody,
      })
    }

    // Update lead status
    await supabaseAdmin
      .from("foreclosure_leads")
      .update({
        certified_letter_requested: true,
        certified_letter_requested_at: new Date().toISOString(),
        certified_letter_notes: agentNotes || null,
      })
      .eq("id", leadId)

    return NextResponse.json({
      success: true,
      message: `Certified mail request submitted for ${ownerName}. Documents sent to ${CLAIM_EMAIL}. Request will be processed within 24 hours.`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
