import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendAdminNotification } from "@/lib/email"
import { getSocialSetting } from "@/lib/social-link"

export const dynamic = "force-dynamic"

// Per-agent social-media link that can be auto-appended to outgoing SMS + email so
// claimants can see the real person behind the messages. Stored in user_activity
// (action "social_link_setting") keyed by the agent's email — no schema change.

export async function GET() {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ enabled: false, link: "", consent: false }, { status: 401 })
  return NextResponse.json(await getSocialSetting(email))
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const enabled = !!body.enabled
  const link = String(body.link || "").trim().slice(0, 300)
  const consent = !!body.consent

  // A link can only be turned on with consent and a valid https URL.
  if (enabled) {
    if (!consent) return NextResponse.json({ error: "Check the consent box to add your social link." }, { status: 400 })
    if (!/^https?:\/\/.+\..+/i.test(link)) return NextResponse.json({ error: "Enter a full link starting with https://" }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from("user_activity").insert({
    user_id: email,
    action: "social_link_setting",
    details: { enabled, link, consent, at: new Date().toISOString() },
  })
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })

  // Notify the team (both admin inboxes) that an agent saved a social link + consent.
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email
  sendAdminNotification(
    `Agent social link ${enabled ? "enabled" : "updated"}: ${name}`,
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
      <p><strong>${name}</strong> (${email}) saved their social-media setting for outgoing communications.</p>
      <p>Enabled: ${enabled ? "Yes" : "No"}<br/>Consent: ${consent ? "Yes" : "No"}<br/>Link: ${link ? `<a href="${link}">${link}</a>` : "(none)"}</p>
    </div>`
  ).catch(() => {})

  return NextResponse.json({ enabled, link, consent })
}
