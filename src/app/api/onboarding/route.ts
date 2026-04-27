import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendEmail, sendAdminNotification } from "@/lib/email"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

function buildAdminNotificationHtml(data: Record<string, string | null | boolean>): string {
  const rows = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;width:200px">${k}</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${v}</td></tr>`
    )
    .join("")

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
<div style="background:#1E3A5F;padding:20px 24px;color:#fff">
<h2 style="margin:0;font-size:18px">New Business Onboarding Submission</h2>
</div>
<div style="padding:24px">
<p style="margin:0 0 16px;color:#475569">A new agent has submitted their business onboarding form.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
<p style="margin:16px 0 0;color:#64748b;font-size:12px">Review and follow up to confirm the agent's payment plan and set up case-earnings disbursement.</p>
</div></div></body></html>`
}

function buildWelcomeEmailHtml(firstName: string, businessName: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
<div style="background:#1E3A5F;padding:20px 24px;text-align:center">
<img src="https://assetrecoverybusiness.com/images/email/us-foreclosure-leads-logo.png" alt="US Foreclosure Leads" style="max-width:200px;height:auto" />
</div>
<div style="padding:24px">
<h2 style="color:#1E3A5F;margin:0 0 16px">Thanks, ${firstName}!</h2>
<p style="color:#475569;line-height:1.6">Thanks for submitting your business onboarding form for <strong>${businessName}</strong>. We will bill the business directly and pay case earnings into your business bank account in lieu of a 1099, once we have confirmed your details.</p>
<h3 style="color:#1E3A5F;margin:24px 0 12px">What Happens Next</h3>
<ol style="color:#475569;line-height:1.8;padding-left:20px">
<li><strong>Verification</strong> -- Our team will review your submission and confirm your business details.</li>
<li><strong>Disbursement Setup</strong> -- We will set up case-earnings disbursement to the business bank account you provided.</li>
<li><strong>Tax Documentation</strong> -- You'll receive any required tax forms (W-9 or equivalent) for your records.</li>
<li><strong>Confirmation</strong> -- You'll get a confirmation email once your business profile is active in the dashboard.</li>
</ol>
<div style="background:#fef9f0;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:24px 0">
<p style="margin:0;color:#92400e;font-size:14px"><strong>Expected Timeline:</strong> 3-5 business days for verification. You will receive updates via email.</p>
</div>
<p style="color:#475569;line-height:1.6">In the meantime, log into your <a href="https://usforeclosureleads.com/dashboard/my-leads" style="color:#2563eb">dashboard</a> to view your assigned leads and continue working the program.</p>
<p style="color:#475569;margin-top:24px">If you have any questions, reply to this email or call us at <a href="tel:8885458007" style="color:#2563eb">(888) 545-8007</a>.</p>
<p style="color:#475569;margin-top:24px">Best regards,<br/><strong>The Foreclosure Recovery Inc. Team</strong></p>
</div>
<div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0">
<p style="color:#94a3b8;font-size:11px;margin:8px 0 0">(888) 545-8007 | support@usforeclosureleads.com</p>
</div></div></body></html>`
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase()

  const emailFilter = request.nextUrl.searchParams.get("email")

  const selectFields = isAdmin
    ? "*"
    : "id, business_name, owner_first_name, owner_last_name, current_email, status, created_at"

  let query = supabaseAdmin
    .from("business_onboarding")
    .select(selectFields)
    .order("created_at", { ascending: false })

  if (!isAdmin && emailFilter) {
    query = query.eq("email", emailFilter)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }

  return NextResponse.json({ submissions: data || [] })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const {
    userPinId,
    email,
    businessName,
    websiteUrl,
    ownerFirstName,
    ownerLastName,
    ssnLast4,
    dateOfBirth,
    creditProfile,
    businessPhone,
    callForwardingPhone,
    currentBestPhone,
    currentEmail,
    businessAddress,
    ownerHomeAddress,
    businessEmailPrefix,
    emailForwarding,
    termsAgreed,
  } = body

  if (!businessName || !ownerFirstName || !ownerLastName || !currentBestPhone || !currentEmail) {
    return NextResponse.json(
      { error: "Required fields: businessName, ownerFirstName, ownerLastName, currentBestPhone, currentEmail" },
      { status: 400 }
    )
  }

  if (!termsAgreed) {
    return NextResponse.json({ error: "You must agree to the terms" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("business_onboarding")
    .insert({
      user_pin_id: userPinId || null,
      email: email || currentEmail,
      business_name: businessName,
      website_url: websiteUrl || null,
      owner_first_name: ownerFirstName,
      owner_last_name: ownerLastName,
      ssn_last4: ssnLast4 || null,
      date_of_birth: dateOfBirth || null,
      credit_profile: creditProfile || "not_sure",
      business_phone: businessPhone || null,
      call_forwarding_phone: callForwardingPhone || null,
      current_best_phone: currentBestPhone,
      current_email: currentEmail,
      business_address: businessAddress || null,
      owner_home_address: ownerHomeAddress || null,
      business_email_prefix: businessEmailPrefix || null,
      email_forwarding: emailForwarding || null,
      terms_agreed: true,
      status: "pending",
    })
    .select("id")
    .single()

  if (error) {
    console.error("Onboarding insert error:", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }

  const notificationData: Record<string, string | null | boolean> = {
    "Business Name": businessName,
    "Website": websiteUrl,
    "Owner": `${ownerFirstName} ${ownerLastName}`,
    "SSN Last 4": ssnLast4 ? `****${ssnLast4}` : null,
    "Date of Birth": dateOfBirth,
    "Credit Profile": creditProfile,
    "Business Phone": businessPhone,
    "Call Forwarding": callForwardingPhone,
    "Best Phone": currentBestPhone,
    "Email": currentEmail,
    "Business Address": businessAddress,
    "Home Address": ownerHomeAddress,
    "Email Prefix": businessEmailPrefix,
    "Email Forwarding": emailForwarding,
    "Terms Agreed": termsAgreed,
  }

  const adminResult = await sendAdminNotification(
    `New Business Onboarding: ${businessName} - ${ownerFirstName} ${ownerLastName}`,
    buildAdminNotificationHtml(notificationData)
  )
  console.log(`[ONBOARDING] Admin notification: ${adminResult.success ? "SENT" : "FAILED"} - ${adminResult.error || adminResult.messageId}`)

  const welcomeResult = await sendEmail(
    currentEmail,
    `Business onboarding received -- ${businessName}`,
    buildWelcomeEmailHtml(ownerFirstName, businessName)
  )
  console.log(`[ONBOARDING] Welcome email to ${currentEmail}: ${welcomeResult.success ? "SENT" : "FAILED"} - ${welcomeResult.error || welcomeResult.messageId}`)

  return NextResponse.json({ success: true, id: data.id })
}
