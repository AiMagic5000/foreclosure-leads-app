import fs from "fs"
import path from "path"
import { BRAND_HEADER, BRAND_FOOTER } from "@/lib/email-brand"

// Auto-sends the 1099 contractor paperwork (W-9 + blank Independent Contractor Agreement)
// to an agent right after they submit the onboarding form. Personalized greeting; the
// agreement is blank so each agent writes their own name (avoids name mix-ups). Sent via
// Resend (supports attachments + bypasses the Hostinger/MailChannels relay).

const RESEND_KEY = process.env.RESEND_API_KEY || "re_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn"
const W9_PATH = path.join(process.cwd(), "documents", "IRS-Form-W9.pdf")
const ICA_PATH = path.join(process.cwd(), "documents", "Independent-Contractor-Agreement.pdf")
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

function p(t: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#2f3b4a;line-height:1.6;">${t}</p>`
}

function build1099Html(firstName: string): string {
  const name = (firstName || "").trim() || "there"
  const body = `
<table style="max-width:600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center"><tbody>
<tr><td style="background-color:#ffffff;padding:32px 40px 8px;">
${p(`Hi ${name},`)}
${p("Thanks for completing your Asset Recovery Agent onboarding. Here is the 1099 paperwork we need from you.")}
${p("You do <strong>not</strong> need an LLC. As a 1099 independent contractor you are a sole proprietor, which keeps this short.")}
<p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#09274c;">Two documents are attached</p>
<ol style="margin:0 0 16px;padding-left:22px;font-size:15px;color:#2f3b4a;line-height:1.7;">
<li style="margin-bottom:10px;"><strong>IRS Form W-9.</strong> Fill it out as an individual:
  <ul style="margin:6px 0 0;padding-left:20px;">
    <li>Line 1: your legal name</li>
    <li>Line 3: check <strong>&ldquo;Individual/sole proprietor&rdquo;</strong></li>
    <li>Part I: your <strong>Social Security Number</strong> (no EIN or LLC needed)</li>
    <li>Part II: sign and date</li>
  </ul>
</li>
<li><strong>Independent Contractor Agreement.</strong> Print it, write your name on the Contractor line, sign and date, and send it back. We countersign and return a copy for your records.</li>
</ol>
${p("There are no employee forms (no W-4, no I-9). The W-9 is all the IRS paperwork required, and we issue your 1099-NEC at tax time.")}
${p("Send both back by replying to this email, or text photos to (888) 545-8007 &mdash; whatever is easier.")}
<p style="margin:16px 0 24px;font-size:15px;color:#2f3b4a;line-height:1.6;">Best,<br/>Corey &amp; Allie Pearson</p>
</td></tr></tbody></table>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#eef1f5;">
<table border="0" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef1f5;padding:16px 0;"><tbody><tr><td>
${BRAND_HEADER}${body}${BRAND_FOOTER}
</td></tr></tbody></table></body></html>`
}

export async function send1099Docs(
  toEmail: string,
  firstName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!toEmail) return { success: false, error: "no recipient" }
    const w9 = fs.readFileSync(W9_PATH).toString("base64")
    const ica = fs.readFileSync(ICA_PATH).toString("base64")
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({
        from: "Corey & Allie Pearson <support@usforeclosureleads.com>",
        to: [toEmail],
        reply_to: "support@usforeclosureleads.com",
        subject: "Your 1099 contractor paperwork (W-9 + agreement)",
        html: build1099Html(firstName),
        text: "Thanks for onboarding. Attached: IRS Form W-9 (complete as individual/sole proprietor with your SSN) and a blank Independent Contractor Agreement. Sign and return both.",
        attachments: [
          { filename: "IRS-Form-W9.pdf", content: w9 },
          { filename: "Independent-Contractor-Agreement.pdf", content: ica },
        ],
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!res.ok) return { success: false, error: data.message || `Resend ${res.status}` }
    return { success: true, messageId: data.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
