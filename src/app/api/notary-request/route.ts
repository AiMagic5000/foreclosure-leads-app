import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"

export const maxDuration = 20

// An agent tells us a claimant is ready for signature verification. Once a
// claimant signs (DocuSeal or a physical doc), we dispatch a notary to their
// home / a public meeting place, or run an online notary session. This creates
// the request; the R740xd notifier SMTP-alerts the team so we can schedule it.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await currentUser()
  const callerEmail = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress)

  const body = await request.json().catch(() => ({}))
  const pinId = String(body?.operatorPinId || "").trim()
  const claimantName = String(body?.claimantName || "").trim()
  const claimantPhone = String(body?.claimantPhone || "").trim()
  const claimantAddress = String(body?.claimantAddress || "").trim()
  const leadRef = String(body?.leadRef || "").trim()
  const notaryType = body?.notaryType === "online" ? "online" : "in_person"
  const signedVia = String(body?.signedVia || "").trim() // "docuseal" | "physical" | ""
  const notes = String(body?.notes || "").trim().slice(0, 1000)

  if (!claimantName) {
    return NextResponse.json({ error: "Claimant name is required." }, { status: 400 })
  }

  // agent display name from their pin (best-effort)
  let agentName = ""
  if (pinId) {
    const { data: pin } = await supabaseAdmin.from("user_pins").select("display_name, email").eq("id", pinId).single()
    agentName = pin?.display_name || ""
  }

  const { error } = await supabaseAdmin.from("notary_requests").insert({
    agent_pin_id: pinId || null,
    agent_email: callerEmail || null,
    agent_name: agentName || null,
    claimant_name: claimantName,
    claimant_phone: claimantPhone || null,
    claimant_address: claimantAddress || null,
    lead_ref: leadRef || null,
    notary_type: notaryType,
    signed_via: signedVia || null,
    notes: notes || null,
  })
  if (error) {
    console.error("[notary-request] insert error:", error)
    return NextResponse.json({ error: "Could not submit your request. Please try again." }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message:
      notaryType === "online"
        ? "Online notary requested — our team will email the claimant a secure video-notary link and copy you."
        : "In-person notary requested — our team will schedule a notary at the claimant's location and update you.",
  })
}
