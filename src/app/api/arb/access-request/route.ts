import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Public endpoint for the assetrecoverybusiness.com/access form.
//
// That site is static (nginx, no PHP), so the form has to post cross-origin to
// something that can write to the DB and kick off the follow-up automations.
// This is that endpoint. It is deliberately unauthenticated — the visitor has
// already paid on Lemon Squeezy and is only telling us who they are — so it is
// validated tightly and rate-limited by (email, 60s) at the DB level.

const ALLOWED_ORIGINS = new Set([
  "https://www.assetrecoverybusiness.com",
  "https://assetrecoverybusiness.com",
])

const RESEND_KEY = process.env.RESEND_API_KEY || ""
const NOTIFY_TO = "support@usforeclosureleads.com"

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://www.assetrecoverybusiness.com"
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

export async function POST(request: NextRequest) {
  const headers = cors(request.headers.get("origin"))
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    const fullName = String(body.full_name || "").trim().slice(0, 120)
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160)
    const phoneRaw = String(body.phone || "").trim().slice(0, 40)
    const orderNumber = String(body.order_number || "").trim().slice(0, 80)
    // Honeypot: a real person never fills this, bots fill everything.
    if (String(body.company || "").trim()) {
      return NextResponse.json({ ok: true }, { headers })
    }

    if (fullName.length < 2 || !fullName.includes(" ")) {
      return NextResponse.json({ error: "Please enter your first and last name." }, { status: 400, headers })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400, headers })
    }
    const digits = phoneRaw.replace(/\D/g, "")
    if (digits.length < 10) {
      return NextResponse.json({ error: "Please enter a phone number with area code." }, { status: 400, headers })
    }
    const phone = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits
    const phoneFmt = phone.length === 10 ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}` : phoneRaw

    // Soft dedupe: same email inside 60s is a double-click, not a second request.
    const { data: recent } = await supabaseAdmin
      .from("arb_access_requests")
      .select("id, created_at")
      .ilike("email", email)
      .gte("created_at", new Date(Date.now() - 60_000).toISOString())
      .limit(1)
    if (recent && recent.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true }, { headers })
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("arb_access_requests")
      .insert({
        full_name: fullName,
        email,
        phone: phoneFmt,
        order_number: orderNumber || null,
        source: "assetrecoverybusiness.com/access",
        status: "new",
        user_agent: (request.headers.get("user-agent") || "").slice(0, 300),
        ip: (request.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 60),
      })
      .select("id")
      .single()

    if (error) {
      console.error("[arb/access-request] insert failed", error.message)
      return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500, headers })
    }

    // Fire the automations. Never let an email failure lose the saved request —
    // the row is already in the DB and can be worked by hand.
    if (RESEND_KEY) {
      const ua = { "User-Agent": "Mozilla/5.0", Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" }
      const prior = orderNumber ? `<tr><td><strong>Order #</strong></td><td>${orderNumber}</td></tr>` : ""
      const adminHtml =
        `<h2 style="font-family:Arial">New Asset Recovery Library access request</h2>` +
        `<table style="font-family:Arial;font-size:14px;border-collapse:collapse" cellpadding="6">` +
        `<tr><td><strong>Name</strong></td><td>${fullName}</td></tr>` +
        `<tr><td><strong>Email</strong></td><td>${email}</td></tr>` +
        `<tr><td><strong>Phone</strong></td><td>${phoneFmt}</td></tr>${prior}` +
        `<tr><td><strong>Source</strong></td><td>assetrecoverybusiness.com/access</td></tr></table>` +
        `<p style="font-family:Arial;font-size:13px;color:#64748b">Match this email against the Lemon Squeezy order, then open their access.</p>`

      const buyerHtml =
        `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#334155;line-height:1.7">` +
        `<p>Hi ${fullName.split(" ")[0]},</p>` +
        `<p>We have your access request for the <strong>Asset Recovery Agent Library</strong> and we are matching it to your payment now.</p>` +
        `<p>You will get a follow-up with your materials. Requests are handled 9:00 AM to 5:00 PM Pacific, seven days a week, so if you sent this in the evening it will be picked up the next morning.</p>` +
        `<p>What you are getting: all 32 documents across 7 study sections - the quick start guides, the phone and closing scripts, the contract and claim form templates, the standard operating procedures, the foreclosure law reference, the state research directories and the lead management tools.</p>` +
        `<p>When you get in, start with the Asset Recovery Agent Quick Start Guide. It explains the work end to end before you open anything else.</p>` +
        `<p>Nothing further to pay. This is only the step where we match your payment to you.</p>` +
        `<p>Asset Recovery Business<br><a href="https://www.assetrecoverybusiness.com">assetrecoverybusiness.com</a></p></div>`

      await Promise.allSettled([
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: ua,
          body: JSON.stringify({
            from: "Asset Recovery Business <support@usforeclosureleads.com>",
            to: [NOTIFY_TO],
            reply_to: email,
            subject: `Access request - ${fullName} (${email})`,
            html: adminHtml,
          }),
        }),
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: ua,
          body: JSON.stringify({
            from: "Asset Recovery Business <support@usforeclosureleads.com>",
            to: [email],
            subject: "We have your access request - Asset Recovery Agent Library",
            html: buyerHtml,
          }),
        }),
      ])

      await supabaseAdmin
        .from("arb_access_requests")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", inserted.id)
    }

    return NextResponse.json({ ok: true, id: inserted.id }, { headers })
  } catch (err) {
    console.error("[arb/access-request]", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500, headers })
  }
}
