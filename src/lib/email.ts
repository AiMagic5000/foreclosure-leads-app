import nodemailer from "nodemailer"

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

const ADMIN_EMAILS = [
  "xscore10@protonmail.com",
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
