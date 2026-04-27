import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

const PRIMARY_ADMIN_EMAIL = 'coreypearsonemail@gmail.com'
const SUPPORT_EMAIL = 'support@usforeclosureleads.com'
const IMAP_HOST = 'imap.hostinger.com'
const IMAP_PORT = 993
const SUPPORT_PASS = process.env.SUPPORT_EMAIL_PASSWORD || 'Thepassword#123'

const TEMPLATE_HTML = `<center style="width:100%;background-color:#f4f5f7;">
<div style="max-width:600px;margin:0 auto;">
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:28px 40px 20px;text-align:center;">
<img src="https://usforeclosureleads.com/us-foreclosure-leads-logo.png" alt="US Foreclosure Leads" style="max-width:220px;height:auto;border:0;" />
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:0 40px;">
<div style="border-top:1px solid #e2e6eb;">&nbsp;</div>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:20px 40px;">
<p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">Hi [Name],</p>
<p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">Thank you for reaching out to us. We appreciate your question and want to make sure you get the help you need.</p>
<p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">[Your response here]</p>
<p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">If you have any additional questions, feel free to reply to this email or give us a call at <strong style="color:#09274c;">(888) 545-8007</strong>. We are here to help you every step of the way.</p>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:0 40px 24px;">
<table style="border-top:1px solid #e2e6eb;width:100%;" border="0" cellspacing="0" cellpadding="0">
<tr><td style="padding-top:20px;">
<p style="margin:0 0 2px;font-size:15px;color:#09274c;font-weight:bold;font-family:'Inter Tight','Segoe UI',sans-serif;">US Foreclosure Leads Support Team</p>
<p style="margin:0 0 2px;font-size:13px;color:#5a6d82;font-family:'Inter Tight','Segoe UI',sans-serif;">Foreclosure Recovery Inc.</p>
<p style="margin:8px 0 0;font-size:13px;font-family:'Inter Tight','Segoe UI',sans-serif;">
<a style="color:#09274c;text-decoration:none;" href="tel:+18885458007">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;
<a style="color:#09274c;text-decoration:none;" href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:20px 40px 30px;">
<p style="margin:0 0 10px;font-size:11px;color:#8a96a5;line-height:17px;font-family:'Inter Tight','Segoe UI',sans-serif;">Foreclosure Recovery Inc. -- 30 N Gould St, Ste R -- Sheridan, WY 82801</p>
<p style="margin:0;font-size:11px;color:#8a96a5;line-height:17px;font-family:'Inter Tight','Segoe UI',sans-serif;">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.</p>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</div>
</center>`

export async function POST() {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = user.emailAddresses[0]?.emailAddress
  const isAdmin = email === PRIMARY_ADMIN_EMAIL
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const tls = await import('tls')

    const mimeMessage = [
      `From: "US Foreclosure Leads Support" <${SUPPORT_EMAIL}>`,
      `To: ${SUPPORT_EMAIL}`,
      `Subject: [Template] Default Support Reply`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      TEMPLATE_HTML,
    ].join('\r\n')

    const saved = await new Promise<boolean>((resolve) => {
      const socket = tls.connect(IMAP_PORT, IMAP_HOST, { rejectUnauthorized: false }, () => {
        let step = 0
        let buffer = ''
        const byteLength = Buffer.byteLength(mimeMessage, 'utf-8')

        const commands = [
          `A1 LOGIN ${SUPPORT_EMAIL} ${SUPPORT_PASS}\r\n`,
          `A2 SELECT "INBOX.Drafts"\r\n`,
          `A3 APPEND "INBOX.Drafts" (\\Draft) {${byteLength}}\r\n`,
        ]

        socket.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          if (step === 0 && buffer.includes('* OK')) {
            socket.write(commands[0])
            step = 1
            buffer = ''
          } else if (step === 1 && buffer.includes('A1 OK')) {
            socket.write(commands[1])
            step = 2
            buffer = ''
          } else if (step === 2 && (buffer.includes('A2 OK') || buffer.includes('A2 NO'))) {
            if (buffer.includes('A2 NO')) {
              socket.write(`A2B SELECT "Drafts"\r\nA3 APPEND "Drafts" (\\Draft) {${byteLength}}\r\n`)
            } else {
              socket.write(commands[2])
            }
            step = 3
            buffer = ''
          } else if (step === 3 && buffer.includes('+')) {
            socket.write(mimeMessage + '\r\n')
            step = 4
            buffer = ''
          } else if (step === 4 && buffer.includes('A3 OK')) {
            socket.write('A4 LOGOUT\r\n')
            step = 5
            buffer = ''
          } else if (step === 4 && buffer.includes('A3 NO')) {
            socket.write('A4 LOGOUT\r\n')
            resolve(false)
          } else if (step === 5) {
            resolve(true)
          }
        })

        socket.on('error', () => resolve(false))
        socket.on('end', () => {
          if (step >= 5) resolve(true)
        })
        setTimeout(() => { socket.destroy(); resolve(false) }, 20000)
      })
    })

    if (saved) {
      return NextResponse.json({ success: true, message: 'Template saved to Drafts folder' })
    }
    return NextResponse.json({ error: 'Failed to save template via IMAP' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: 'IMAP connection failed' }, { status: 500 })
  }
}
