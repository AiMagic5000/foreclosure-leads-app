// DocuSeal e-sign: create a per-claimant signing link for the contingency
// agreement, prefilled with the lead's merge data. Self-hosted Community edition
// (sign.usforeclosurerecovery.com) can't create templates via API, so we use ONE
// fixed template (DOCUSEAL_TEMPLATE_ID) with placed fields and prefill the merge
// values per submission. The claimant signs online; the emailed DOCX attachment
// stays identical. Graceful: any failure returns null so the email still sends.

const DOCUSEAL_URL = process.env.DOCUSEAL_URL || "https://sign.usforeclosurerecovery.com"
const DOCUSEAL_API_TOKEN = process.env.DOCUSEAL_API_TOKEN || ""
const DOCUSEAL_TEMPLATE_ID = process.env.DOCUSEAL_TEMPLATE_ID || ""

// The 9 merge fields placed on the DocuSeal template (must match field names).
export interface DocusealMergeValues {
  CLAIMANT_NAME: string
  CLAIMANT_ADDRESS: string
  CLAIMANT_PHONE: string
  PROPERTY_ADDRESS: string
  PROPERTY_STATE: string
  SALE_DATE: string
  ESTIMATED_SURPLUS: string
  FEE_PCT: string
  VENUE_COUNTY: string
}

export interface SigningLink {
  url: string
  submissionId: number
  slug: string
}

// Phone-only claimants still need a signable link (the agent texts it). DocuSeal
// requires a submitter email, so route those submissions to a per-lead address on
// our own domain: nothing is sent to it (send_email:false) and any DocuSeal
// completion notice lands with us rather than bouncing off a made-up domain.
function submitterEmail(leadId: string, claimantEmail: string): string {
  const given = (claimantEmail || "").trim()
  return given || `claimant+${leadId}@usforeclosureleads.com`
}

// Create a prefilled signing submission and return the claimant's sign URL.
// Returns null on any failure (missing config, timeout, API error) — the caller
// must degrade gracefully and still deliver the email.
export async function createSigningLink(
  leadId: string,
  claimantEmail: string,
  claimantName: string,
  values: DocusealMergeValues,
): Promise<SigningLink | null> {
  if (!DOCUSEAL_API_TOKEN || !DOCUSEAL_TEMPLATE_ID || !leadId) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(`${DOCUSEAL_URL}/api/submissions`, {
      method: "POST",
      headers: {
        "X-Auth-Token": DOCUSEAL_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: Number(DOCUSEAL_TEMPLATE_ID),
        send_email: false,
        submitters: [
          {
            role: "Claimant",
            email: submitterEmail(leadId, claimantEmail),
            name: claimantName || undefined,
            external_id: leadId,
            values,
          },
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error(`[docuseal] submission failed ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return null
    }
    const data = await res.json()
    const s0 = Array.isArray(data) ? data[0] : data?.submitters?.[0]
    if (!s0?.slug) return null
    return {
      url: `${DOCUSEAL_URL}/s/${s0.slug}`,
      submissionId: s0.submission_id ?? s0.id ?? 0,
      slug: s0.slug,
    }
  } catch (err) {
    console.error("[docuseal] createSigningLink error:", err instanceof Error ? err.message : err)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// Branded "Review & Sign Online" button block for injection into the outreach
// email HTML (English). Placed above the standard footer.
// Rebuild a claimant's signing URL from the slug stored on the lead
// (foreclosure_leads.agreement_docuseal_id). Lets SMS reuse the exact same link
// the email sent, so a claimant can sign from their phone.
export function signUrlFromSlug(slug: string): string {
  return `${DOCUSEAL_URL}/s/${slug}`
}

export function signButtonHtmlEN(url: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td align="center" style="padding:14px 0;">
  <div style="background:#f0fdf4;border:1.5px solid #16a34a;border-radius:12px;padding:18px 20px;max-width:520px;margin:0 auto;">
    <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#14532d;font-weight:bold;">Prefer to sign online? Review &amp; sign your agreement in about 2 minutes.</p>
    <a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:16px;text-decoration:none;padding:14px 30px;border-radius:8px;">Review &amp; Sign Online</a>
    <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">The attached copy is identical &mdash; signing online lets us start your claim right away.</p>
  </div>
</td></tr></table>`
}

// Spanish variant.
export function signButtonHtmlES(url: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td align="center" style="padding:14px 0;">
  <div style="background:#f0fdf4;border:1.5px solid #16a34a;border-radius:12px;padding:18px 20px;max-width:520px;margin:0 auto;">
    <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#14532d;font-weight:bold;">&iquest;Prefiere firmar en l&iacute;nea? Revise y firme su acuerdo en unos 2 minutos.</p>
    <a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:16px;text-decoration:none;padding:14px 30px;border-radius:8px;">Revisar y Firmar en L&iacute;nea</a>
    <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">La copia adjunta es id&eacute;ntica &mdash; firmar en l&iacute;nea nos permite comenzar su reclamo de inmediato.</p>
  </div>
</td></tr></table>`
}
