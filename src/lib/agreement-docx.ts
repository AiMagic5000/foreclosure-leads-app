// Contingency-agreement DOCX generation, shared by the draft-builder and the
// direct-send path so the claimant gets the same attachment either way.
// Every claimant-facing value comes from the single-source MergeContext, so the
// agreement can never disagree with the outreach email (same surplus, same
// state, venue = property state).
import * as fs from "fs"
import * as path from "path"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import type { MergeContext } from "@/lib/surplus/types"

const AGREEMENT_EN_PATH = path.join(process.cwd(), "templates", "FRI-Contingency-Fee-Agreement-TEMPLATE.docx")

// Format a date string for claimant-facing documents.
export function formatDateValue(raw: string): string {
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export function generateFilledAgreementEN(ctx: MergeContext): Buffer {
  const venue = ctx.rule?.venue_text
    || (ctx.propertyState ? `the courts of ${ctx.rule?.state_name || ctx.propertyState}` : "the courts of the property's state")

  const content = fs.readFileSync(AGREEMENT_EN_PATH)
  const zip_ = new PizZip(content)
  const doc = new Docxtemplater(zip_, {
    delimiters: { start: "[[", end: "]]" },
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render({
    CLAIMANT_NAME: ctx.claimantName,
    CLAIMANT_ADDRESS: ctx.claimantAddress,
    CLAIMANT_PHONE: ctx.claimantPhone || "(on file)",
    PROPERTY_ADDRESS: ctx.propertyAddress,
    PROPERTY_STATE: ctx.propertyState,
    SALE_DATE: ctx.saleDate ? formatDateValue(ctx.saleDate) : "Not specified",
    ESTIMATED_SURPLUS: ctx.estimatedSurplusFormatted,
    FEE_PCT: `up to ${ctx.feePct}%`,
    VENUE_COUNTY: venue,
  })

  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer
}

// Filename the claimant sees on the attachment.
export function agreementFilename(claimantName: string): string {
  const parts = (claimantName || "").trim().split(/\s+/)
  const first = parts[0] || "Claimant"
  const last = parts.length > 1 ? parts[parts.length - 1] : ""
  return `Contingency-Fee-Agreement-${first}-${last}.docx`.replace(/-+\.docx$/, ".docx").replace(/\s+/g, "-")
}
