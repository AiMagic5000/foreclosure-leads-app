import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import nodemailer from "nodemailer";

const SMTP_HOST = "smtp.hostinger.com";
const SMTP_PORT = 465;
const SMTP_USER = "support@usforeclosureleads.com";
const SMTP_PASS = process.env.SMTP_USFR_LEADS_PASSWORD || "Thepassword#123";
const FROM_NAME = "Foreclosure Recovery Inc.";

const PDF_GUIDE_URL = 'https://docs.google.com/document/d/1YieU6qg4eFAAhsNSbrhC2Vg43YhHSg_s/export?format=pdf';
const STATES_GUIDE_URL = 'https://usforeclosureleads.com/states-guide';

function buildWelcomeEmail(name: string): string {
  const firstName = name.split(" ")[0] || name;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free Recovery Guides</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#1e3a5f;padding:28px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Foreclosure Recovery Inc.</h1>
          <p style="margin:6px 0 0;color:#90aac8;font-size:13px;">(888) 545-8007 -- Asset Recovery Lead Platform</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:20px;">${firstName}, your guides are ready</h2>
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
            Thanks for signing up. We put together two resources to help you get started in surplus fund recovery right away.
          </p>

          <!-- Guide 1: Asset Recovery Agent Partnership Program Guide PDF -->
          <div style="background:#f0f4ff;border:1px solid #1e3a5f;border-radius:8px;padding:20px;margin-bottom:20px;">
            <h3 style="margin:0 0 8px;color:#1e3a5f;font-size:16px;">Program Guide (PDF Download)</h3>
            <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.6;">
              Full breakdown of the Asset Recovery Agent Partnership -- $995 total, what's included, commission structure (50/50 on the recovery fee), payment options (pay in full, three monthly payments of $331, or in-house financing), and how to get started.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);border-radius:6px;padding:12px 28px;">
                <a href="${PDF_GUIDE_URL}" style="color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;">
                  Download Program Guide (PDF)
                </a>
              </td></tr>
            </table>
          </div>

          <!-- Guide 2: 50 States Guide -->
          <div style="background:#f0fdf4;border:1px solid #10b981;border-radius:8px;padding:20px;margin-bottom:24px;">
            <h3 style="margin:0 0 8px;color:#065f46;font-size:16px;">50 States Surplus Funds Guide</h3>
            <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.6;">
              State-by-state claim windows, fee caps, judicial vs. non-judicial breakdown, and which states are easiest for recovery agents.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="background:#10b981;border-radius:6px;padding:12px 28px;">
                <a href="${STATES_GUIDE_URL}" style="color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;">
                  View 50 States Guide Online
                </a>
              </td></tr>
            </table>
          </div>

          <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.7;">
            We provide daily-updated, skip-traced surplus fund leads across 30+ non-judicial states, ready for outreach. Every lead comes with phone numbers, emails, and mailing addresses already verified.
          </p>

          <!-- CTA to webcast -->
          <div style="background:#fffbeb;border:2px solid #d4a84b;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0 0 12px;color:#1e3a5f;font-size:15px;font-weight:700;">
              Want to see the business model in action?
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="background:linear-gradient(135deg,#d4a84b 0%,#b8922f 100%);border-radius:6px;padding:14px 32px;">
                <a href="https://usforeclosureleads.com/webcast" style="color:#09274c;font-weight:700;font-size:16px;text-decoration:none;">
                  Join a Live Training Session
                </a>
              </td></tr>
            </table>
            <p style="margin:10px 0 0;color:#92400e;font-size:12px;">Sessions run every 30 minutes, 24/7</p>
          </div>

          <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
            Questions? Reply to this email or call us at <strong>(888) 545-8007</strong>.
          </p>
          <p style="margin:16px 0 0;color:#374151;font-size:15px;">
            -- Corey Pearson<br>
            Founder, Foreclosure Recovery Inc.
          </p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;background:#f9fafb;">
          <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
            Foreclosure Recovery Inc. -- (888) 545-8007 -- support@usforeclosureleads.com<br>
            You received this because you requested the free recovery guides.<br>
            <a href="https://usforeclosureleads.com" style="color:#1e3a5f;">usforeclosureleads.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`.trim();
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.assetrecoverybusiness.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { name = "", email = "", source = "hero_form" } = body;
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Valid email required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Upsert subscriber (ignore duplicate)
  const { error: dbError } = await supabaseAdmin
    .from("email_subscribers")
    .upsert(
      { email: trimmedEmail, name: trimmedName, source },
      { onConflict: "email", ignoreDuplicates: true }
    );

  if (dbError) {
    console.error("Subscribe DB error:", dbError);
    // Don't block on DB errors — still try to send email
  }

  // Send welcome email via SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to: trimmedEmail,
      subject: "Your free recovery guides are ready -- download now",
      html: buildWelcomeEmail(trimmedName || trimmedEmail),
    });

    // Mark welcome sent
    await supabaseAdmin
      .from("email_subscribers")
      .update({ welcome_sent: true, welcome_sent_at: new Date().toISOString() })
      .eq("email", trimmedEmail);
  } catch (emailErr) {
    console.error("Welcome email error:", emailErr);
    // Still return success — subscriber is saved
  }

  // Notify admin of new signup
  try {
    const notifyTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await notifyTransporter.sendMail({
      from: `"USFL Signup Alert" <${SMTP_USER}>`,
      to: "xscore10@protonmail.com",
      subject: `New signup: ${trimmedName || "No name"} (${source})`,
      text: `Name: ${trimmedName || "Not provided"}\nEmail: ${trimmedEmail}\nSource: ${source}\nTime: ${new Date().toISOString()}`,
    });
  } catch (notifyErr) {
    console.error("Admin notification error:", notifyErr);
  }

  // Enroll in webcast email drip sequence
  try {
    const { data: lead } = await supabaseAdmin
      .from("webcast_leads")
      .upsert(
        {
          first_name: trimmedName.split(" ")[0] || trimmedName,
          last_name: trimmedName.split(" ").slice(1).join(" ") || null,
          email: trimmedEmail,
          status: "registered",
          utm_source: source,
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (lead) {
      const sessionTime = new Date();
      const delays = [
        { step: 1, hoursAfter: 2 },
        { step: 2, hoursAfter: 24 },
        { step: 3, hoursAfter: 72 },
        { step: 4, hoursAfter: 120 },
        { step: 5, hoursAfter: 168 },
      ];
      const rows = delays.map((d) => ({
        lead_id: lead.id,
        step_number: d.step,
        scheduled_at: new Date(
          sessionTime.getTime() + d.hoursAfter * 3600000
        ).toISOString(),
        status: "pending",
      }));
      await supabaseAdmin.from("webcast_email_drip_queue").insert(rows);
    }
  } catch (dripErr) {
    console.error("Drip enrollment error:", dripErr);
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
