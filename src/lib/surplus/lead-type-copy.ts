// Per-lead-type wording for claimant outreach (voicemail, email, SMS).
// One source of truth so a tax-deed overage, a pre-foreclosure, and a completed
// mortgage foreclosure each read correctly. Used by voice-drop, email-draft, send-sms.
//
// lead_type values seen in foreclosure_leads come from TWO places:
//   - scrapers: "tax_overage", "tax_excess", "pre_foreclosure", etc.
//   - the Import tab labels: "Tax Deed Surplus", "Pre-Foreclosure", "Foreclosure Surplus",
//     "Probate", "General / Other".
// Anything not clearly tax or pre-foreclosure falls back to the completed-foreclosure copy
// (refined by foreclosure_type === 'tax' => tax-deed).

export type LeadTypeKey = "foreclosure" | "tax_deed" | "pre_foreclosure";

export interface LeadTypeCopy {
  key: LeadTypeKey;
  // Voicemail (voice-drop generateScript)
  vmAudit: string;        // "...we are legally required to inform you that {vmAudit}." -- {ADDR} placeholder
  vmSurplusSource: string; // surplus clause: "...overages -- from {vmSurplusSource}."
  vmLien: string;          // optional follow-up sentence (lien note) or ""
  // Email (email-draft)
  emailSaleNoun: string;   // "foreclosure sale" | "tax sale" | "upcoming foreclosure sale"
  emailSurplusSource: string;
  emailIntroSale: string;  // "a foreclosure or tax sale" style intro phrase
  // SMS (send-sms buildSmsMessage)
  smsSaleRef: string;      // "the foreclosure of your property" | "the tax sale of your property" | ...
}

function norm(leadType?: string | null): "tax" | "pre" | "fc" | "" {
  const t = (leadType || "").trim().toLowerCase();
  if (!t) return "";
  if (t.includes("tax")) return "tax";            // tax_overage, tax_excess, tax_deed, "tax deed surplus"
  if (t.includes("pre")) return "pre";            // pre_foreclosure, "pre-foreclosure"
  if (t.includes("foreclosure")) return "fc";     // "foreclosure surplus"
  return "";                                       // probate, general/other, unknown
}

const FORECLOSURE: LeadTypeCopy = {
  key: "foreclosure",
  vmAudit: "a forensic audit has been completed on the property located at {ADDR}",
  vmSurplusSource: "the equity in your property that exceed the lender's claim from the foreclosure sale",
  vmLien: "If there were any liens or encumbrances on the property at the time of foreclosure, please know that those obligations are accounted for within the surplus -- and there are still remaining funds that require distribution to the primary deed holder or their heirs.",
  emailSaleNoun: "foreclosure sale",
  emailSurplusSource: "the equity in your property that exceed the lender's claim from the foreclosure sale",
  emailIntroSale: "a foreclosure sale",
  smsSaleRef: "the foreclosure of your property",
};

const TAX_DEED: LeadTypeCopy = {
  key: "tax_deed",
  vmAudit: "a review of the county tax-sale records has been completed for the property located at {ADDR}",
  vmSurplusSource: "what your property sold for at the county tax sale, above the back taxes that were owed",
  vmLien: "These surplus funds are held by the county after the taxes were satisfied, and they legally belong to the former owner or their heirs.",
  emailSaleNoun: "tax sale",
  emailSurplusSource: "what your property sold for at the county tax sale, above the back taxes that were owed",
  emailIntroSale: "a county tax sale",
  smsSaleRef: "the tax sale of your property",
};

const PRE_FORECLOSURE: LeadTypeCopy = {
  key: "pre_foreclosure",
  vmAudit: "the property located at {ADDR} is scheduled for an upcoming foreclosure sale",
  vmSurplusSource: "the equity in your property that could be lost once the foreclosure sale is completed",
  vmLien: "Acting before the sale gives you the best chance to protect that equity, even if there are liens or other obligations on the property.",
  emailSaleNoun: "upcoming foreclosure sale",
  emailSurplusSource: "the equity in your property that could be lost once the foreclosure sale is completed",
  emailIntroSale: "an upcoming foreclosure sale",
  smsSaleRef: "the upcoming foreclosure of your property",
};

/**
 * Resolve the outreach copy for a lead.
 * @param leadType  foreclosure_leads.lead_type (scraper value or import label)
 * @param foreclosureType  foreclosure_leads.foreclosure_type ('tax' refines fallback)
 */
export function leadTypeCopy(leadType?: string | null, foreclosureType?: string | null): LeadTypeCopy {
  const n = norm(leadType);
  if (n === "tax") return TAX_DEED;
  if (n === "pre") return PRE_FORECLOSURE;
  if (n === "fc") return FORECLOSURE;
  // fallback for probate / general / null
  if ((foreclosureType || "").trim().toLowerCase() === "tax") return TAX_DEED;
  return FORECLOSURE;
}
