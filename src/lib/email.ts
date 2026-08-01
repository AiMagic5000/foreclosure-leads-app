

// Primary sender - used for external recipients (clients, ProtonMail, etc.)
const SMTP_USER = "support@usforeclosureleads.com"

// Relay sender - used ONLY for delivering to support@usforeclosureleads.com
// Hostinger silently drops self-addressed emails (same FROM and TO),
// so we use a different account to relay notifications to the support inbox.

// Single admin recipient: xscore10 DIRECT. The old route (support@ + Hostinger
// forward -> xscore10) silently broke 2026-07-07: the relay now delivers via
// Resend and Hostinger junk-files those notices — and Hostinger does NOT
// forward Junk-classified mail, so xscore10 stopped receiving them. Sending
// straight to xscore10 removes the forward from the chain entirely. Do NOT add
// support@ back here — if its forward fires again you get doubles.
// xscore10's copy of NEW-LEAD notices is delivered by the R740xd lead-notifier
// cron (/opt/lead-notifier, plain SMTP — the path that verifiably lands). This
// app-side list keeps support@ as the archive copy only. Do NOT add xscore10
// here — that would double it against the notifier.
const ADMIN_EMAILS = [
  "support@usforeclosureleads.com",
  // Owner copy DIRECT to Gmail: the support@ copy is self-addressed (from support@ ->
  // to support@) and MXRoute junk-files it, so upload/consent/activity notices were
  // invisible for weeks (agents' avatar photos sat unnoticed). Resend -> external
  // Gmail lands clean. Do NOT add xscore10 here (lead notices would double against
  // the R740xd lead-notifier).
  "coreypearsonemail@gmail.com",
]

// SURE PATH (2026-07-22): sends now go through Resend, not the nodemailer relay shim.
// The shim was silently throwing (same failure that stranded the webcast drip), and
// because every caller here swallows errors, account-activity notifications died
// invisibly for weeks (Bobby/Samantha setup events never reached the owner).
// api.resend.com sits behind Cloudflare — the browser User-Agent is required (err 1010).
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn"
const RESEND_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: Buffer }[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": RESEND_UA,
      },
      body: JSON.stringify({
        from: `US Foreclosure Leads <${SMTP_USER}>`,
        to: [to],
        subject,
        html,
        ...(attachments && attachments.length
          ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })) }
          : {}),
      }),
    })
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 200)
      console.error(`[EMAIL] Resend ${res.status} to ${to}: ${errText}`)
      return { success: false, error: `Resend ${res.status}: ${errText}` }
    }
    const j = (await res.json()) as { id?: string }
    return { success: true, messageId: j.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[EMAIL] Failed to send to ${to}:`, message)
    return { success: false, error: message }
  }
}

export async function sendAdminNotification(
  subject: string,
  html: string,
  attachments?: { filename: string; content: Buffer }[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const results = await Promise.allSettled(
    ADMIN_EMAILS.map((email) => sendEmail(email, subject, html, attachments))
  )

  const firstSuccess = results.find(
    (r) => r.status === "fulfilled" && r.value.success
  )

  if (firstSuccess && firstSuccess.status === "fulfilled") {
    return firstSuccess.value
  }

  const firstResult = results[0]
  if (firstResult.status === "fulfilled") {
    return firstResult.value
  }

  return { success: false, error: "All admin notification emails failed" }
}

// Notify admins when a user uploads a file or adds data anywhere in their account.
// Best-effort and fire-and-forget — never block the user action on email delivery.
export async function notifyAccountActivity(
  email: string,
  action: string,
  detail?: string,
  attachment?: { filename: string; content: Buffer },
  actorEmail?: string
): Promise<void> {
  try {
    const when = new Date().toLocaleString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    })
    // "Performed by" identifies WHO actually did it — shown only when it differs from the
    // account owner (i.e. an admin/team member did it on the agent's behalf via view-as).
    const performedBy =
      actorEmail && actorEmail.toLowerCase() !== (email || "").toLowerCase() ? actorEmail : null
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1E3A5F, #2563eb); padding: 18px 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Account Activity</h2>
          <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">usforeclosureleads.com</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 20px 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 100px;">Account</td><td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${email}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Performed by</td><td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${performedBy ? `${performedBy} <span style="color:#b45309;font-weight:600">(team, on their behalf)</span>` : `${email} <span style="color:#059669;font-weight:600">(the agent)</span>`}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Action</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${action}</td></tr>
            ${detail ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Detail</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${detail}</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Time</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${when}</td></tr>
          </table>
        </div>
      </div>`
    await sendAdminNotification(
      `Account activity: ${action} — ${email}${performedBy ? ` (by ${performedBy})` : ""}`,
      html,
      attachment ? [attachment] : undefined
    )
  } catch {
    // never throw from a notification
  }
}
