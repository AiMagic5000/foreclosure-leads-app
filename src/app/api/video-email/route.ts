import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveOperatorConfig, isCommsAuthorized, configToAgentProfile } from "@/lib/operator-config"
import * as tls from "tls"

const IMAP_HOST = "imap.hostinger.com"
const IMAP_PORT = 993
const DEFAULT_IMAP_PASS = process.env.IMAP_CLAIM_PASSWORD || "Thepassword#1234"
const ADMIN_EMAIL_LOWER = "coreypearsonemail@gmail.com"

// Animated "video playing" GIFs of the two owner avatars (Corey = male, Allie = female).
// Both link to the single shared "Meet Your Agents" landing page.
// Swap these for the hosted GIF URLs once the avatar clips are exported.
const OWNER_GIF: Record<"male" | "female", string> = {
  male: process.env.MEET_AGENT_GIF_MALE || "https://usforeclosureleads.com/assets/meet/meet-corey.gif",
  female: process.env.MEET_AGENT_GIF_FEMALE || "https://usforeclosureleads.com/assets/meet/meet-allie.gif",
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function buildVideoEmailHtml(opts: {
  firstName: string
  propertyAddress: string
  overage: number
  gifUrl: string
  meetUrl: string
  agentName: string
  agentTitle: string
  phoneDisplay: string
  phoneHref: string
}): string {
  const { firstName, propertyAddress, overage, gifUrl, meetUrl, agentName, agentTitle, phoneDisplay, phoneHref } = opts
  const overageLine = overage > 0
    ? `surplus funds of approximately <strong>${formatCurrency(overage)}</strong> that are legally yours`
    : `surplus funds that are legally yours`
  const propertyLine = propertyAddress
    ? ` from the foreclosure sale of your property at <strong>${propertyAddress}</strong>`
    : ` from the foreclosure sale of your property`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;padding:24px 18px;">
    <p style="font-size:16px;line-height:1.6;margin:0 0 14px;">Hi ${firstName || "there"},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px;color:#334155;">
      I recorded a short message for you about the ${overageLine}${propertyLine}. Tap below to meet the team handling your case.
    </p>

    <!-- GIF that looks like a playing video, linked to the Meet Your Agents page -->
    <a href="${meetUrl}" style="text-decoration:none;display:block;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,.22);">
      <img src="${gifUrl}" alt="Meet your agents at Foreclosure Recovery Inc." width="524" style="width:100%;height:auto;display:block;border:0;" />
    </a>

    <div style="text-align:center;margin:18px 0 6px;">
      <a href="${meetUrl}" style="display:inline-block;background:#D4A84B;color:#1E3A5F;font-weight:800;font-size:18px;text-decoration:none;padding:15px 34px;border-radius:12px;">&#9654;&nbsp; Meet Your Agents</a>
    </div>
    <p style="text-align:center;font-size:13px;color:#64748b;margin:6px 0 22px;">A real recovery specialist, here to help you claim what is yours.</p>

    <p style="font-size:15px;line-height:1.6;margin:0 0 6px;color:#334155;">
      Everything is explained in the message and in the contingency agreement we sent you. We do not get paid until you get paid, and you stay in control the whole way through. If anything is unclear, call me directly.
    </p>

    <div style="border-top:1px solid #e2e8f0;margin-top:22px;padding-top:16px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#1E3A5F;">${agentName}</p>
      <p style="margin:2px 0 0;font-size:14px;color:#64748b;">${agentTitle}</p>
      <p style="margin:6px 0 0;font-size:15px;"><a href="${phoneHref}" style="color:#2563eb;text-decoration:none;font-weight:600;">${phoneDisplay}</a></p>
    </div>
  </div>
</body>
</html>`
}

function buildMimeEmail(opts: { from: string; fromName: string; to: string; subject: string; html: string; leadId: string }): string {
  const altBoundary = "alt_" + Date.now()
  const date = new Date().toUTCString()
  const fromDomain = opts.from.split("@")[1] || "usforeclosurerecovery.com"
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${fromDomain}>`
  return [
    `From: ${opts.fromName} <${opts.from}>`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    `X-Lead-ID: ${opts.leadId}`,
    "",
    `--${altBoundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Please view this email in an HTML-capable email client.",
    "",
    `--${altBoundary}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    opts.html,
    "",
    `--${altBoundary}--`,
    "",
  ].join("\r\n")
}

function imapAppendDraft(emailContent: string, imapUser: string, imapPass: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ success: false, error: "IMAP connection timed out" }), 15000)
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
    const socket = tls.connect({ host: IMAP_HOST, port: IMAP_PORT, rejectUnauthorized: false }, () => { /* connected */ })
    socket.setEncoding("utf8")
    socket.on("data", (data: string) => {
      buffer += data
      const lines = buffer.split("\r\n")
      buffer = lines.pop() || ""
      for (const line of lines) {
        if (state === "connecting" && line.startsWith("* OK")) {
          state = "login"
          socket.write(`A${tagCounter++} LOGIN ${imapUser} ${imapPass}\r\n`)
        } else if (state === "login" && /^A\d+ OK/.test(line)) {
          state = "append"
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`A${tagCounter++} APPEND "INBOX.Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "login" && /^A\d+ (NO|BAD)/.test(line)) {
          done({ success: false, error: "IMAP login failed: " + line })
        } else if (state === "append" && line.startsWith("+")) {
          state = "appending"
          socket.write(emailContent + "\r\n")
        } else if (state === "append" && /^A\d+ NO/.test(line)) {
          // Folder name fallback: retry with "Drafts"
          state = "append2"
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`A${tagCounter++} APPEND "Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "append2" && line.startsWith("+")) {
          state = "appending"
          socket.write(emailContent + "\r\n")
        } else if (state === "appending" && /^A\d+ OK/.test(line)) {
          state = "logout"
          socket.write(`A${tagCounter++} LOGOUT\r\n`)
        } else if (state === "appending" && /^A\d+ (NO|BAD)/.test(line)) {
          done({ success: false, error: "Could not append to Drafts: " + line })
        } else if (state === "logout") {
          done({ success: true })
        }
      }
    })
    socket.on("error", (err: Error) => done({ success: false, error: err.message }))
  })
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    if (!userEmail || !(await isCommsAuthorized(userEmail))) {
      return NextResponse.json({ error: "Access required" }, { status: 403 })
    }

    const { leadId, action, operatorPinId } = await request.json()
    if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 })

    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single()
    if (fetchError || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

    const recipientEmail = lead.primary_email
    if (!recipientEmail) return NextResponse.json({ error: "Lead has no email address" }, { status: 400 })

    const config = await resolveOperatorConfig({ clerkEmail: userEmail, operatorPinId: operatorPinId || null, leadId })

    // CRITICAL GUARD: never send with admin defaults for a non-admin user.
    if (!config.pinId && userEmail !== ADMIN_EMAIL_LOWER) {
      return NextResponse.json(
        { error: "Could not resolve your agent profile. Refresh and try again." },
        { status: 422 }
      )
    }

    const agent = configToAgentProfile(config)
    const firstName = String(lead.owner_name || "").split(" ")[0] || ""
    const html = buildVideoEmailHtml({
      firstName,
      propertyAddress: String(lead.property_address || ""),
      overage: Number(lead.overage_amount || lead.estimated_surplus || 0),
      gifUrl: OWNER_GIF[config.gender],
      meetUrl: config.meetAgentUrl,
      agentName: agent.name,
      agentTitle: `${config.title}, ${config.companyName}`,
      phoneDisplay: config.phoneDisplay,
      phoneHref: config.phoneHref,
    })
    const subject = `A quick video message from ${agent.name} at ${config.companyName}`

    if (action === "preview" || !action) {
      return NextResponse.json({ subject, html, to: recipientEmail, from: config.senderEmail, gender: config.gender })
    }

    if (action === "create_draft") {
      const IMAP_PASSWORD_MAP: Record<string, string> = {
        "rebecca@usforeclosurerecovery.com": process.env.IMAP_REBECCA_PASSWORD || config.imapPassword || DEFAULT_IMAP_PASS,
        "joshua@usforeclosurerecovery.com": process.env.IMAP_JOSHUA_PASSWORD || config.imapPassword || DEFAULT_IMAP_PASS,
        "claim@usforeclosurerecovery.com": process.env.IMAP_CLAIM_PASSWORD || DEFAULT_IMAP_PASS,
        "contact@premiersurplusclaims.com": process.env.IMAP_AMARIYON_PASSWORD || config.imapPassword || "Amariyonpass$100",
      }
      const imapPass = IMAP_PASSWORD_MAP[config.senderEmail] || config.imapPassword || DEFAULT_IMAP_PASS
      const mime = buildMimeEmail({ from: config.senderEmail, fromName: config.companyName, to: recipientEmail, subject, html, leadId })
      const result = await imapAppendDraft(mime, config.senderEmail, imapPass)
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Draft creation failed" }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: `Video email draft created in ${config.senderEmail} Drafts` })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
