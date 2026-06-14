import nodemailer from '@/lib/nodemailer-relay-shim'

const SMTP_HOST = "smtp.hostinger.com"
const SMTP_PORT = 465

// Primary sender - used for external recipients (clients, ProtonMail, etc.)
const SMTP_USER = "support@usforeclosureleads.com"
const SMTP_PASS = (process.env.SMTP_SUPPORT_PASSWORD || "Thepassword#123").trim()

// Relay sender - used ONLY for delivering to support@usforeclosureleads.com
// Hostinger silently drops self-addressed emails (same FROM and TO),
// so we use a different account to relay notifications to the support inbox.
const RELAY_USER = "info@tradelinejet.com"
const RELAY_PASS = (process.env.SMTP_RELAY_PASSWORD || "Thepassword#123").trim()

// Single admin recipient. xscore10@protonmail.com is reached via the Hostinger
// forward on this mailbox (support@usforeclosureleads.com -> xscore10), so
// listing xscore10 here too would double every notice. Route through support@
// only; the forward delivers exactly one copy to xscore10.
const ADMIN_EMAILS = [
  "support@usforeclosureleads.com",
]

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
})

const relayTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: RELAY_USER,
    pass: RELAY_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
})

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // If sending to the same address as our primary sender, use relay to avoid self-send block
    const isSelfSend = to.toLowerCase() === SMTP_USER.toLowerCase()
    const mailer = isSelfSend ? relayTransporter : transporter
    const from = isSelfSend
      ? `"US Foreclosure Leads" <${RELAY_USER}>`
      : `"US Foreclosure Leads" <${SMTP_USER}>`

    const info = await mailer.sendMail({
      from,
      to,
      subject,
      html,
      text: subject,
    })
    return { success: true, messageId: info.messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[EMAIL] Failed to send to ${to}:`, message)
    return { success: false, error: message }
  }
}

export async function sendAdminNotification(
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const results = await Promise.allSettled(
    ADMIN_EMAILS.map((email) => sendEmail(email, subject, html))
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
  detail?: string
): Promise<void> {
  try {
    const when = new Date().toLocaleString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    })
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1E3A5F, #2563eb); padding: 18px 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Account Activity</h2>
          <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">usforeclosureleads.com</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 20px 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 90px;">User</td><td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${email}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Action</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${action}</td></tr>
            ${detail ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Detail</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${detail}</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Time</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${when}</td></tr>
          </table>
        </div>
      </div>`
    await sendAdminNotification(`Account activity: ${action} — ${email}`, html)
  } catch {
    // never throw from a notification
  }
}
