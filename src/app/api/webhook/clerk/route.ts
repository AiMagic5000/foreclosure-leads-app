import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { Webhook } from "svix"
import { supabaseAdmin } from "@/lib/supabase"
import { sendEmail, sendAdminNotification } from "@/lib/email"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!

interface ClerkWebhookEvent {
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    phone_numbers?: Array<{
      phone_number: string
      id: string
    }>
    first_name: string | null
    last_name: string | null
    image_url?: string | null
    primary_email_address_id: string
    created_at?: number
  }
  type: string
}

async function sendSmtpEmail(to: string, subject: string, html: string): Promise<boolean> {
  const result = await sendEmail(to, subject, html)
  if (result.success) {
    console.log(`Email sent to ${to}: ${result.messageId}`)
  }
  return result.success
}

export async function POST(request: NextRequest) {
  const headersList = await headers()
  const svixId = headersList.get("svix-id")
  const svixTimestamp = headersList.get("svix-timestamp")
  const svixSignature = headersList.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    )
  }

  const payload = await request.text()

  const wh = new Webhook(webhookSecret)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error("Webhook verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "user.created": {
        await handleUserCreated(event.data)
        break
      }

      case "user.updated": {
        await handleUserUpdated(event.data)
        break
      }

      case "user.deleted": {
        await handleUserDeleted(event.data.id)
        break
      }

      default:
        console.log(`Unhandled Clerk event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Clerk webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleUserCreated(data: ClerkWebhookEvent["data"]) {
  const primaryEmail = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id
  )

  if (!primaryEmail) {
    console.error("No primary email found for user")
    return
  }

  const fullName = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ") || null

  const { error } = await supabaseAdmin.from("users").insert({
    clerk_id: data.id,
    email: primaryEmail.email_address,
    full_name: fullName,
    subscription_tier: "free",
    subscription_status: "active",
  })

  if (error) {
    console.error("Error creating user in database:", error)
    throw error
  }

  console.log(`[CLERK WEBHOOK] New user created: ${primaryEmail.email_address} (${fullName || "no name"})`)

  // Send signup notification
  const phone = data.phone_numbers?.[0]?.phone_number || "Not provided"
  const signupTime = data.created_at
    ? new Date(data.created_at).toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", timeZoneName: "short",
      })
    : new Date().toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", timeZoneName: "short",
      })

  const notifyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1E3A5F, #2563eb); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New User Signup</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">usforeclosureleads.com</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 130px;">Name</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${fullName || "Not provided"}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${primaryEmail.email_address}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Signed Up</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">${signupTime}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Clerk ID</td><td style="padding: 8px 0; color: #6b7280; font-size: 12px; font-family: monospace;">${data.id}</td></tr>
        </table>
      </div>
    </div>
  `

  const notifyResult = await sendAdminNotification(
    `New USFR Signup: ${fullName || primaryEmail.email_address}`,
    notifyHtml
  )
  const notifySent = notifyResult.success
  console.log(`[CLERK WEBHOOK] Admin notification email ${notifySent ? "SENT" : "FAILED"} for ${primaryEmail.email_address}`)

  // Send welcome email to the new user
  const firstName = data.first_name || "there"
  const welcomeHtml = buildWelcomeEmail(firstName)
  const welcomeSent = await sendSmtpEmail(
    primaryEmail.email_address,
    "Welcome to US Foreclosure Leads - Your Account Is Ready",
    welcomeHtml
  )
  console.log(`[CLERK WEBHOOK] Welcome email ${welcomeSent ? "SENT" : "FAILED"} to ${primaryEmail.email_address}`)
}

function buildWelcomeEmail(firstName: string): string {
  return `<center style="width:100%;background-color:#f4f5f7;">
<div style="max-width:600px;margin:0 auto;">
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:28px 40px 20px;">
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tr>
<td align="left" valign="middle"><img src="https://usforeclosureleads.com/us-foreclosure-leads-logo.png" alt="US Foreclosure Leads" style="display:block;max-width:200px;height:auto;border:0;" /></td>
<td align="right" valign="middle"><p style="margin:0;font-size:12px;color:#7a8a9e;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:18px;">Welcome Aboard<br/><span style="color:#09274c;font-weight:600;">Your Account Is Ready</span></p></td>
</tr>
</table>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:0 40px;"><div style="border-top:1px solid #e2e6eb;font-size:0;line-height:0;">&nbsp;</div></td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:20px 40px 0;">
<p style="margin:0 0 6px;font-size:11px;color:#1a7a3a;text-transform:uppercase;letter-spacing:1.2px;font-family:'Inter Tight','Segoe UI',sans-serif;font-weight:600;">Welcome to the Platform</p>
<h1 style="margin:0 0 24px;font-size:22px;color:#09274c;font-weight:bold;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:30px;">Hey ${firstName}, your account is all set!</h1>
<p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">Thank you for signing up with <strong style="color:#09274c;">US Foreclosure Leads</strong>. You now have access to our platform where you can view foreclosure surplus fund leads, state law information, and training resources.</p>
<p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">We built this platform to help asset recovery agents like you find, contact, and help former homeowners claim the surplus funds they are owed after a foreclosure sale. Every tool you need is inside your dashboard.</p>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:0 40px 20px;">
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tr><td align="center">
<a style="display:inline-block;padding:14px 32px;background-color:#1a7a3a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;font-family:'Inter Tight','Segoe UI',sans-serif;text-align:center;" href="https://usforeclosureleads.com/dashboard" target="_blank" rel="noopener noreferrer">Access Your Dashboard</a>
</td></tr>
</table>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:0 40px;">
<table style="border:1px solid #dce1e8;border-radius:6px;border-left:4px solid #1a7a3a;width:100%;" border="0" cellspacing="0" cellpadding="0">
<tr><td style="padding:22px 24px;">
<p style="margin:0 0 14px;font-size:11px;color:#1a7a3a;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;font-family:'Inter Tight','Segoe UI',sans-serif;">What You Can Do Now</p>
<table border="0" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:5px 0;font-size:14px;color:#2c3e50;line-height:22px;font-family:'Inter Tight','Segoe UI',sans-serif;">&#10003;&nbsp; <strong style="color:#09274c;">Browse Foreclosure Leads</strong> -- View surplus fund opportunities across multiple states</td></tr>
<tr><td style="padding:5px 0;font-size:14px;color:#2c3e50;line-height:22px;font-family:'Inter Tight','Segoe UI',sans-serif;">&#10003;&nbsp; <strong style="color:#09274c;">State Law Reference</strong> -- Check foreclosure statutes, claim windows, and filing methods</td></tr>
<tr><td style="padding:5px 0;font-size:14px;color:#2c3e50;line-height:22px;font-family:'Inter Tight','Segoe UI',sans-serif;">&#10003;&nbsp; <strong style="color:#09274c;">Closing Training</strong> -- Step-by-step video modules on surplus fund recovery</td></tr>
<tr><td style="padding:5px 0;font-size:14px;color:#2c3e50;line-height:22px;font-family:'Inter Tight','Segoe UI',sans-serif;">&#10003;&nbsp; <strong style="color:#09274c;">Export & Outreach</strong> -- Download data and reach claimants directly</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:24px 40px 0;">
<h2 style="margin:0 0 16px;font-size:17px;color:#09274c;font-weight:bold;font-family:'Inter Tight','Segoe UI',sans-serif;">Getting Started</h2>
<table style="margin-bottom:18px;width:100%;" border="0" cellspacing="0" cellpadding="0">
<tr>
<td style="padding-top:2px;width:36px;" valign="top"><div style="width:28px;height:28px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:28px;font-size:14px;font-weight:bold;">1</div></td>
<td style="padding-left:12px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#09274c;font-family:'Inter Tight','Segoe UI',sans-serif;">Log Into Your Dashboard</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#2c3e50;font-family:'Inter Tight','Segoe UI',sans-serif;">Head to <a href="https://usforeclosureleads.com/dashboard" style="color:#1a7a3a;text-decoration:underline;">usforeclosureleads.com/dashboard</a> and sign in with the same email you used to register.</p>
</td>
</tr>
</table>
<table style="margin-bottom:18px;width:100%;" border="0" cellspacing="0" cellpadding="0">
<tr>
<td style="padding-top:2px;width:36px;" valign="top"><div style="width:28px;height:28px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:28px;font-size:14px;font-weight:bold;">2</div></td>
<td style="padding-left:12px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#09274c;font-family:'Inter Tight','Segoe UI',sans-serif;">Start Your Training</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#2c3e50;font-family:'Inter Tight','Segoe UI',sans-serif;">Go through the Closing Training modules to understand how surplus fund recovery works. Mark each module complete as you finish.</p>
</td>
</tr>
</table>
<table style="margin-bottom:18px;width:100%;" border="0" cellspacing="0" cellpadding="0">
<tr>
<td style="padding-top:2px;width:36px;" valign="top"><div style="width:28px;height:28px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:28px;font-size:14px;font-weight:bold;">3</div></td>
<td style="padding-left:12px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#09274c;font-family:'Inter Tight','Segoe UI',sans-serif;">Explore Your Leads</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#2c3e50;font-family:'Inter Tight','Segoe UI',sans-serif;">Browse the foreclosure leads database. Filter by state, view property details, and start connecting with claimants who are owed surplus funds.</p>
</td>
</tr>
</table>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:8px 40px 0;">
<table style="background-color:#f0f7ff;border-radius:6px;border-left:4px solid #09274c;width:100%;" border="0" cellspacing="0" cellpadding="0">
<tr><td style="padding:20px 24px;text-align:center;">
<p style="margin:0 0 10px;font-size:15px;color:#09274c;font-weight:600;font-family:'Inter Tight','Segoe UI',sans-serif;">Need Help? We Are Here For You</p>
<p style="margin:0 0 14px;font-size:14px;color:#2c3e50;line-height:22px;font-family:'Inter Tight','Segoe UI',sans-serif;">Our support team is available to answer any questions. Reach out anytime and we will get back to you quickly.</p>
<p style="margin:0 0 6px;font-size:14px;font-family:'Inter Tight','Segoe UI',sans-serif;"><a style="color:#09274c;font-weight:600;text-decoration:none;" href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a></p>
<a style="display:inline-block;padding:12px 28px;background-color:#09274c;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;font-family:'Inter Tight','Segoe UI',sans-serif;text-align:center;" href="tel:+18885458007" target="_blank" rel="noopener noreferrer">(888) 545-8007</a>
</td></tr>
</table>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:28px 40px 12px;">
<table style="border-top:1px solid #e2e6eb;width:100%;" border="0" cellspacing="0" cellpadding="0">
<tr><td style="padding-top:20px;">
<p style="margin:0 0 2px;font-size:15px;color:#09274c;font-weight:bold;font-family:'Inter Tight','Segoe UI',sans-serif;">The US Foreclosure Leads Team</p>
<p style="margin:0 0 2px;font-size:13px;color:#5a6d82;font-family:'Inter Tight','Segoe UI',sans-serif;">Foreclosure Recovery Inc.</p>
<p style="margin:8px 0 0;font-size:13px;font-family:'Inter Tight','Segoe UI',sans-serif;"><a style="color:#09274c;text-decoration:none;" href="tel:+18885458007">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color:#09274c;text-decoration:none;" href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:0 40px;"><div style="border-top:2px solid #1a7a3a;width:60px;font-size:0;line-height:0;">&nbsp;</div></td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#ffffff;padding:20px 40px 30px;">
<p style="margin:0 0 10px;font-size:11px;color:#8a96a5;line-height:17px;font-family:'Inter Tight','Segoe UI',sans-serif;">Foreclosure Recovery Inc. -- 30 N Gould St, Ste R -- Sheridan, WY 82801</p>
<p style="margin:0;font-size:11px;color:#8a96a5;line-height:17px;font-family:'Inter Tight','Segoe UI',sans-serif;">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a style="color:#7a8a9e;text-decoration:underline;" href="https://usforeclosureleads.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>&nbsp;&nbsp;<a style="color:#7a8a9e;text-decoration:underline;" href="https://usforeclosureleads.com/terms" target="_blank" rel="noopener noreferrer">Terms</a></p>
</td></tr>
</table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center">
<tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</div>
</center>`
}

async function handleUserUpdated(data: ClerkWebhookEvent["data"]) {
  const primaryEmail = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id
  )

  if (!primaryEmail) {
    console.error("No primary email found for user")
    return
  }

  const fullName = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ") || null

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      email: primaryEmail.email_address,
      full_name: fullName,
    })
    .eq("clerk_id", data.id)

  if (error) {
    console.error("Error updating user in database:", error)
    throw error
  }
}

async function handleUserDeleted(clerkId: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("clerk_id", clerkId)

  if (error) {
    console.error("Error deleting user from database:", error)
    throw error
  }
}
