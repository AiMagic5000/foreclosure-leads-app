import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { resolveCallerEmails, resolvePinForEmails } from "@/lib/caller-identity"
import * as fs from "fs"
import * as path from "path"

// Emails a setup guide to the signed-in agent, on demand, from the popup that
// tells them a channel is not connected. Agents kept getting stuck on the
// SlyBroadcast API-enable step — it lives on slybroadcast.com, not in our
// dashboard, so nothing we change on our side unblocks them. Putting the guide
// one click away at the moment they hit the wall is the fix.
const GUIDES: Record<string, { file: string; filename: string; subject: string; blurb: string; bodyFile?: string }> = {
  slybroadcast: {
    file: "SlyBroadcast-Connection-Guide.pdf",
    filename: "SlyBroadcast Connection Guide.pdf",
    subject: "Your SlyBroadcast setup guide (ringless voicemail)",
    // Body is the SlyBroadcast walkthrough lifted verbatim from the 3-step
    // onboarding email (src/content/sly-step2.html) so an agent sees the exact
    // same wording and screenshots they were sent on day one, including the
    // API-enable screenshot. Kept as a file so re-syncing from the onboarding
    // master is a copy, not a rewrite.
    blurb: "",
    bodyFile: "sly-step2.html",
  },
  textbee: {
    file: "TextBee-SMS-Setup-Android.pdf",
    filename: "TextBee SMS Setup Guide.pdf",
    subject: "Your TextBee SMS Setup Guide",
    blurb:
      "<p>Here is the full guide for connecting TextBee so you can text your claimants from your own phone.</p>" +
      "<p>Two things worth knowing before you start: use the <strong>sideloaded APK</strong> from textbee.dev/download rather than the Play Store version, " +
      "and turn <strong>off battery optimization</strong> for the app so your phone does not put it to sleep and silently stop sending.</p>" +
      "<p>Your claimants' replies land in your own TextBee app on your phone. We never see them.</p>",
  },
}

export async function POST(request: NextRequest) {
  const user = await currentUser()
  const callerEmails = resolveCallerEmails(user)
  const email = callerEmails[0]
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const guide = GUIDES[String((body as { guide?: string })?.guide || "").toLowerCase()]
  if (!guide) return NextResponse.json({ error: "Unknown guide" }, { status: 400 })

  const pin = await resolvePinForEmails(callerEmails, "id, email, full_name, package_type, is_active, slybroadcast_email, textbee_api_key")
  const firstName = String((pin?.full_name as string) || "").trim().split(/\s+/)[0] || "there"

  let attachment: string
  let extra: string | null = null
  try {
    attachment = fs.readFileSync(path.join(process.cwd(), "documents", guide.file)).toString("base64")
    // Send the full troubleshooting SOP alongside it. The canonical guide covers
    // every other wall an agent hits, but its SlyBroadcast section omits the
    // API-enable step entirely — which is exactly why agents follow our own SOP
    // and still end up stuck. The focused guide above supplies that step.
    try {
      extra = fs.readFileSync(path.join(process.cwd(), "documents", "Agent-Troubleshooting-Guide.pdf")).toString("base64")
    } catch { /* optional */ }
  } catch (e) {
    console.error("[send-guide] missing asset", guide.file, e)
    return NextResponse.json({ error: "That guide is temporarily unavailable. Reply to support and we will send it." }, { status: 500 })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: "Mail is not configured" }, { status: 500 })

  let sectionHtml = guide.blurb
  if (guide.bodyFile) {
    try {
      sectionHtml = fs.readFileSync(path.join(process.cwd(), "src", "content", guide.bodyFile), "utf8")
    } catch (e) {
      console.error("[send-guide] body file missing", guide.bodyFile, e)
    }
  }

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#334155;line-height:1.7">` +
    `<p>Hi ${firstName}, here is the full walkthrough for connecting your ringless voicemail. ` +
    `The step-by-step is also attached as a PDF you can keep.</p>${sectionHtml}` +
    `<p>Any questions, reply here.</p>` +
    `<p>Corey Pearson<br>US Foreclosure Leads</p></div>`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({
      from: "US Foreclosure Leads <support@usforeclosureleads.com>",
      to: [email],
      subject: guide.subject,
      html,
      attachments: [
        { filename: guide.filename, content: attachment },
        ...(extra ? [{ filename: "Agent Troubleshooting Guide.pdf", content: extra }] : []),
      ],
    }),
  })
  if (!res.ok) {
    console.error("[send-guide] resend failed", res.status, await res.text().catch(() => ""))
    return NextResponse.json({ error: "Could not send it just now. Please try again." }, { status: 502 })
  }
  return NextResponse.json({ sent: true, to: email })
}
