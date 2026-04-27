import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as tls from "tls"
import * as net from "net"

const IMAP_HOST = "imap.hostinger.com"
const IMAP_PORT = 993
const SMTP_HOST = "smtp.hostinger.com"
const SMTP_PORT = 465

// Both accounts use the same password
const EMAIL_PASSWORD = process.env.IMAP_CLAIM_PASSWORD || "Thepassword#1234"

const ACCOUNTS: Record<string, { email: string; name: string }> = {
  info: {
    email: "info@usforeclosurerecovery.com",
    name: "Foreclosure Recovery Inc.",
  },
  claim: {
    email: "claim@usforeclosurerecovery.com",
    name: "Foreclosure Recovery Inc.",
  },
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function buildThankYouHtml(params: {
  countyName: string
  stateName: string
  recipientName: string
  customMessage: string
  senderAccount: string
}): string {
  const { countyName, stateName, recipientName, customMessage, senderAccount } = params
  const account = ACCOUNTS[senderAccount] || ACCOUNTS.info
  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Records Office,"

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
@media only screen and (max-width: 620px) {
.email-container { width: 100% !important; max-width: 100% !important; }
.padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body>
<center style="width: 100%; background-color: #f4f5f7;">
<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">Thank you for your response regarding ${countyName}, ${stateName} public records.</div>
<div class="email-container" style="max-width: 600px; margin: 0 auto;">
<!--[if mso]><table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"><tr><td><![endif]-->
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 28px 40px 20px;">
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td align="left" valign="middle" width="55%"><a style="text-decoration: none;" href="https://usforeclosurerecovery.com" target="_blank" rel="noopener"><img style="display: block; max-width: 185px; height: auto;" src="https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png" alt="Foreclosure Recovery Inc." width="185" /></a></td>
<td align="right" valign="middle" width="45%">
<p style="margin: 0; font-size: 12px; color: #7a8a9e; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 18px;">${formatDate()}</p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td class="padding-mobile" style="background-color: #ffffff; padding: 0 40px;"><div style="border-top: 1px solid #e2e6eb;">&nbsp;</div></td></tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 10px 40px 0;">
<p style="margin: 0 0 6px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.2px; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 600;">Re: Public Records Request</p>
<h1 style="margin: 0 0 24px; font-size: 21px; color: #09274c; font-weight: bold; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 28px;">Thank You -- ${countyName}, ${stateName}</h1>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">${greeting}</p>
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">${customMessage}</p>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 8px 40px 0;">
<table style="border: 1px solid #dce1e8; border-radius: 6px; border-left: 4px solid #09274C; background-color: #f8fafb;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding: 18px 22px;">
<p style="margin: 0 0 8px; font-size: 11px; color: #09274c; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Request Reference</p>
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr><td style="padding: 4px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif;" width="100">County:</td><td style="padding: 4px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${countyName}</td></tr>
<tr><td style="padding: 4px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif;" width="100">State:</td><td style="padding: 4px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">${stateName}</td></tr>
<tr><td style="padding: 4px 0; font-size: 13px; color: #7a8a9e; font-family: 'Inter Tight', sans-serif;" width="100">Type:</td><td style="padding: 4px 0; font-size: 14px; color: #09274c; font-weight: 600; font-family: 'Inter Tight', sans-serif;">Excess Proceeds / Surplus Funds List</td></tr>
</tbody>
</table>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 24px 40px 0;">
<p style="margin: 0 0 18px; font-size: 15px; color: #2c3e50; line-height: 26px;">We are committed to following up promptly and appreciate any guidance your office has provided. If there is anything further you need from us, please do not hesitate to reach out.</p>
<p style="margin: 0 0 4px; font-size: 15px; color: #2c3e50; line-height: 26px;">Best regards,</p>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr>
<td class="padding-mobile" style="background-color: #ffffff; padding: 12px 40px 28px;">
<table role="presentation" border="0" cellspacing="0" cellpadding="0">
<tbody><tr>
<td style="padding-right: 16px; border-right: 2px solid #09274c;" valign="top">
<p style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #09274c; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Corey Pearson</p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;">Data Department</p>
<p style="margin: 0; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif; font-weight: 600;">Foreclosure Recovery Inc.</p>
</td>
<td style="padding-left: 16px;" valign="top">
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;"><a style="color: #09274c; text-decoration: none;" href="tel:+18885458007">(888) 545-8007</a></p>
<p style="margin: 0 0 2px; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;"><a style="color: #09274c; text-decoration: none;" href="mailto:${account.email}">${account.email}</a></p>
<p style="margin: 0; font-size: 13px; color: #5a6d82; font-family: 'Inter Tight', sans-serif;"><a style="color: #09274c; text-decoration: none;" href="https://usforeclosurerecovery.com">usforeclosurerecovery.com</a></p>
</td>
</tr></tbody>
</table>
</td>
</tr></tbody>
</table>
<table style="max-width: 600px;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
<tbody><tr><td style="background-color: #09274c; padding: 16px 40px;">
<p style="margin: 0; font-size: 11px; color: #8fa3b8; text-align: center; font-family: 'Inter Tight', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 18px;">Foreclosure Recovery Inc. -- Helping former homeowners recover surplus funds<br /><a style="color: #8fa3b8; text-decoration: underline;" href="https://usforeclosurerecovery.com">usforeclosurerecovery.com</a></p>
</td></tr></tbody>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</div>
</center>
</body>
</html>`
}

// SMTP send via TLS
async function sendSmtpEmail(params: {
  from: string
  fromName: string
  to: string
  subject: string
  html: string
  inReplyTo?: string
}): Promise<void> {
  const { from, fromName, to, subject, html, inReplyTo } = params

  return new Promise((resolve, reject) => {
    const socket = tls.connect(SMTP_PORT, SMTP_HOST, { rejectUnauthorized: false }, () => {
      let step = 0
      let buffer = ""

      const send = (cmd: string) => {
        socket.write(cmd + "\r\n")
      }

      socket.on("data", (data: Buffer) => {
        buffer += data.toString()
        if (!buffer.includes("\r\n")) return
        const lines = buffer.split("\r\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line) continue
          const code = parseInt(line.substring(0, 3))

          if (step === 0 && code === 220) {
            send(`EHLO usforeclosurerecovery.com`)
            step = 1
          } else if (step === 1 && code === 250) {
            send(`AUTH LOGIN`)
            step = 2
          } else if (step === 2 && code === 334) {
            send(Buffer.from(from).toString("base64"))
            step = 3
          } else if (step === 3 && code === 334) {
            send(Buffer.from(EMAIL_PASSWORD).toString("base64"))
            step = 4
          } else if (step === 4 && code === 235) {
            send(`MAIL FROM:<${from}>`)
            step = 5
          } else if (step === 5 && code === 250) {
            send(`RCPT TO:<${to}>`)
            step = 6
          } else if (step === 6 && code === 250) {
            send(`DATA`)
            step = 7
          } else if (step === 7 && code === 354) {
            const boundary = `----=_Part_${Date.now()}`
            const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@usforeclosurerecovery.com>`
            let headers = `From: "${fromName}" <${from}>\r\n`
            headers += `To: ${to}\r\n`
            headers += `Subject: ${subject}\r\n`
            headers += `Message-ID: ${msgId}\r\n`
            if (inReplyTo) {
              headers += `In-Reply-To: ${inReplyTo}\r\n`
              headers += `References: ${inReplyTo}\r\n`
            }
            headers += `Date: ${new Date().toUTCString()}\r\n`
            headers += `MIME-Version: 1.0\r\n`
            headers += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`
            headers += `\r\n`

            const plainText = `Thank you for your response regarding our public records request. We appreciate your time and assistance. - Foreclosure Recovery Inc.`
            let body = `--${boundary}\r\n`
            body += `Content-Type: text/plain; charset=utf-8\r\n\r\n`
            body += plainText + `\r\n`
            body += `--${boundary}\r\n`
            body += `Content-Type: text/html; charset=utf-8\r\n\r\n`
            body += html + `\r\n`
            body += `--${boundary}--\r\n`

            send(headers + body + "\r\n.")
            step = 8
          } else if (step === 8 && code === 250) {
            send(`QUIT`)
            step = 9
          } else if (step === 9) {
            socket.end()
            resolve()
          } else if (code >= 400) {
            socket.end()
            reject(new Error(`SMTP error at step ${step}: ${line}`))
          }
        }
      })

      socket.on("error", reject)
      socket.on("close", () => {
        if (step < 9) reject(new Error("Connection closed prematurely"))
      })
    })
  })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    action,
    recipientEmail,
    countyName,
    stateName,
    recipientName,
    customMessage,
    senderAccount,
    inReplyTo,
  } = body

  if (!countyName || !stateName || !recipientEmail) {
    return NextResponse.json(
      { error: "countyName, stateName, and recipientEmail are required" },
      { status: 400 }
    )
  }

  const account = ACCOUNTS[senderAccount] || ACCOUNTS.info

  const defaultMessage = `Thank you so much for your timely response and for taking the time to direct us to the appropriate resources regarding ${countyName}, ${stateName}. We truly appreciate your guidance and will follow up with the office you recommended.`

  const html = buildThankYouHtml({
    countyName,
    stateName,
    recipientName: recipientName || "",
    customMessage: customMessage || defaultMessage,
    senderAccount: senderAccount || "info",
  })

  const subject = `Re: Thank You - Public Records Request - ${countyName}, ${stateName}`

  if (action === "preview") {
    return NextResponse.json({ html, subject, from: account.email })
  }

  if (action === "send") {
    try {
      await sendSmtpEmail({
        from: account.email,
        fromName: account.name,
        to: recipientEmail,
        subject,
        html,
        inReplyTo,
      })

      return NextResponse.json({
        success: true,
        message: `Thank you email sent to ${recipientEmail} from ${account.email}`,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error"
      return NextResponse.json({ error: `Failed to send: ${msg}` }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "action must be 'preview' or 'send'" }, { status: 400 })
}
