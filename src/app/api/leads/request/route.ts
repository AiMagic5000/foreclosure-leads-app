import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendAdminNotification, sendEmail } from "@/lib/email"
import { canonicalEmail } from "@/lib/email-alias"
import { BRAND_HEADER, BRAND_FOOTER } from "@/lib/email-brand"

const APP_URL = "https://usforeclosureleads.com"
const SUPPORT_PHONE = "(888) 907-3234"

// Auto-confirmation sent to the requester the moment they submit a lead request.
// Sets the 24-hour expectation, promises closest-alternative matches when a
// jurisdiction or lead type is thin, and points them at the self-import guide so
// they can start working immediately instead of waiting. Wrapped in the canonical
// brand header + FULL footer (signature, network logos, legal) from email-brand.
function buildRequesterConfirmationHtml(
  firstName: string,
  leadCount: number,
  statePreference: string
): string {
  const pref =
    statePreference && statePreference.trim() && !/no preference/i.test(statePreference)
      ? statePreference.trim()
      : ""
  const prefLine = pref
    ? `We noted your preference for <strong>${pref}</strong> and will match it as closely as inventory allows.`
    : `We'll pull from the freshest inventory we have on hand.`
  const body = `<table style="max-width: 600px;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #ffffff; padding: 30px 40px 10px; font-size: 15.5px; color: #2f3b4a; line-height: 1.7; font-family: Arial,Helvetica,sans-serif;">
<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Got it &mdash; your request for <strong>${leadCount} leads</strong> is in. Here's what happens now.</p>
<p style="margin:0 0 16px">We issue your leads <strong>within 24 hours</strong>, based on what's available. ${prefLine} If a specific state or lead type is running low, we send the closest alternatives so you're never sitting idle waiting on one jurisdiction.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#f0f6ff;border:1px solid #cfe0f5;border-radius:10px">
<tbody><tr><td style="padding:16px 18px;font-size:14.5px;color:#1e3a5f;line-height:1.75">
<strong>Don't want to wait?</strong> You can bring in your own leads too. The <strong>&ldquo;From Zero to Signed Contracts&rdquo;</strong> guide &mdash; Module 4 in the <strong>Free Training</strong> tab &mdash; walks you step by step through finding and importing them yourself.</td></tr></tbody></table>
<p style="margin:0 0 22px;text-align:center">
<a href="${APP_URL}/dashboard/closing-training" style="display:inline-block;background:#09274c;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 30px;border-radius:8px">Open Free Training &rarr;</a></p>
<p style="margin:0 0 18px">Questions before your leads land? Call ${SUPPORT_PHONE} or just reply to this email.</p>
</td></tr></tbody></table>`
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif">${BRAND_HEADER}${body}${BRAND_FOOTER}</body></html>`
}

const LEAD_LIMITS: Record<string, number> = {
  basic: 10,
  partnership: 25,
  owner_operator: 50,
  admin: 9999,
}

function buildLeadRequestHtml(
  userEmail: string,
  userName: string,
  accountType: string,
  leadCount: number,
  statePreference: string,
  notes: string
): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
<div style="background:#1E3A5F;padding:20px 24px;color:#fff">
<h2 style="margin:0;font-size:18px">New Lead Request Submitted</h2>
</div>
<div style="padding:24px">
<p style="margin:0 0 16px;color:#475569">A user has submitted a lead request from the dashboard.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;width:180px">User Email</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${userEmail}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">User Name</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${userName || "N/A"}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">Account Type</td><td style="padding:8px 12px;border:1px solid #e2e8f0"><strong style="color:#059669">${accountType.replace("_", " ").toUpperCase()}</strong></td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">Leads Requested</td><td style="padding:8px 12px;border:1px solid #e2e8f0"><strong style="color:#2563eb;font-size:18px">${leadCount}</strong></td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">State Preference</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${statePreference || "No preference"}</td></tr>
${notes ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">Notes</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${notes}</td></tr>` : ""}
</table>
<div style="margin-top:20px;padding:16px;background:#fef9f0;border:1px solid #f59e0b;border-radius:8px">
<p style="margin:0;color:#92400e;font-size:14px"><strong>Action Required:</strong> Assign ${leadCount} leads to this user via the Admin panel > Lead Assignment.</p>
</div>
</div></div></body></html>`
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  const userEmail = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress) || "unknown"
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || ""

  const body = await request.json()
  const { leadCount, statePreference, notes } = body

  // Tier resolution: clerk_id first (fast path). If that misses — e.g. a merged
  // 2nd login whose Clerk id has no users row — fall back to the canonical email
  // so a paid agent on their alternate login is never wrongly gated to "basic".
  let dbUser: { account_type?: string | null; subscription_tier?: string | null } | null = null
  {
    const byClerk = await supabaseAdmin
      .from("users")
      .select("account_type, subscription_tier")
      .eq("clerk_id", userId)
      .maybeSingle()
    dbUser = byClerk.data
    if (!dbUser) {
      const { data: byEmail } = await supabaseAdmin
        .from("users")
        .select("account_type, subscription_tier")
        .ilike("email", userEmail)
        .limit(1)
      dbUser = byEmail?.[0] || null
    }
  }

  const accountType = dbUser?.account_type || "basic"
  const subTier = dbUser?.subscription_tier || "free"

  // Hard gate: free/basic tiers cannot request leads — must upgrade to a paid plan.
  // (Frontend shows the upgrade modal; this enforces it server-side so the request
  // can never be created via a stale build or a direct API call.)
  // A PAID account_type always passes on its own: onboarding sets account_type
  // to partnership but sometimes leaves subscription_tier at its "free" default,
  // and that combination silently 403'd paid agents (Danny Sai, 2026-07-15).
  const FREE_TIERS = ["basic", "free", "free_webcast"]
  if (FREE_TIERS.includes(accountType) && FREE_TIERS.includes(subTier)) {
    return NextResponse.json(
      { error: "upgrade_required", message: "Lead requests require a paid plan. Upgrade in My Account to unlock lead delivery." },
      { status: 403 }
    )
  }

  const maxLeads = LEAD_LIMITS[accountType] || 10

  let requestedCount = Math.min(Math.max(1, Number(leadCount) || 1), maxLeads)

  // Weekly cap: 125 free leads per agent, Monday 00:00 -> Sunday 23:59 (UTC week).
  // Past the cap they buy extras at $2.50 via the Buy More Leads flow. We count
  // requested_count from this week's lead_requests (the control point for issuance).
  const WEEKLY_CAP = 125
  const now = new Date()
  const weekStart = new Date(now)
  const dow = (weekStart.getUTCDay() + 6) % 7 // 0 = Monday
  weekStart.setUTCDate(weekStart.getUTCDate() - dow)
  weekStart.setUTCHours(0, 0, 0, 0)
  let usedThisWeek = 0
  try {
    const { data: wk } = await supabaseAdmin
      .from("lead_requests")
      .select("requested_count")
      .eq("clerk_id", userId)
      .gte("created_at", weekStart.toISOString())
      .neq("status", "rejected")
    usedThisWeek = (wk || []).reduce(
      (s: number, r: { requested_count?: number | null }) => s + (Number(r?.requested_count) || 0),
      0
    )
  } catch { /* best-effort; fail open so a query hiccup never blocks a paid agent */ }

  const remaining = Math.max(0, WEEKLY_CAP - usedThisWeek)
  if (remaining <= 0) {
    return NextResponse.json(
      {
        error: "weekly_cap_reached",
        message: `You've used all ${WEEKLY_CAP} of your weekly leads. Buy more at $2.50 each with the Buy More Leads button.`,
        cap: WEEKLY_CAP,
        usedThisWeek,
      },
      { status: 429 }
    )
  }
  // Trim this request to whatever is left in the weekly allowance.
  requestedCount = Math.min(requestedCount, remaining)

  // Persist the request so it shows in Admin > Fresh Leads as a reviewable queue.
  let operatorPinId: string | null = null
  try {
    const { data: pin } = await supabaseAdmin
      .from("user_pins")
      .select("id")
      .ilike("email", userEmail)
      .eq("is_active", true)
      .maybeSingle()
    operatorPinId = (pin as { id?: string } | null)?.id || null
  } catch { /* pin lookup best-effort */ }

  try {
    await supabaseAdmin.from("lead_requests").insert({
      clerk_id: userId,
      operator_pin_id: operatorPinId,
      user_email: userEmail,
      user_name: userName,
      account_type: accountType,
      requested_count: requestedCount,
      state_preference: statePreference || null,
      notes: notes || null,
      status: "pending",
    })
  } catch (e) {
    console.error("Lead request persist failed (continuing to email):", e)
  }

  const result = await sendAdminNotification(
    `Lead Request: ${requestedCount} leads - ${userEmail} (${accountType})`,
    buildLeadRequestHtml(userEmail, userName, accountType, requestedCount, statePreference || "", notes || "")
  )

  if (!result.success) {
    console.error("Lead request email failed:", result.error)
    // request is already persisted; don't hard-fail the user over the email
  }

  // Auto-confirmation to the requester. Best-effort, fire-and-forget: never block
  // or fail the request over this email. Skipped for unknown/self addresses.
  if (userEmail.includes("@") && userEmail !== "unknown") {
    const firstName = (userName || "").trim().split(/\s+/)[0] || "there"
    sendEmail(
      userEmail,
      "We got your lead request - here's what happens next",
      buildRequesterConfirmationHtml(firstName, requestedCount, statePreference || "")
    ).catch((e) => console.error("Requester confirmation email failed:", e))
  }

  return NextResponse.json({
    success: true,
    message: `Lead request for ${requestedCount} leads has been submitted. We'll issue them within 24 hours based on availability.`,
    requested: requestedCount,
  })
}
