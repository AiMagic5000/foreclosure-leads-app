import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import nodemailer from "nodemailer";

const SMTP_HOST = "smtp.hostinger.com";
const SMTP_PORT = 465;
const SMTP_USER = "support@usforeclosureleads.com";
const SMTP_PASS = process.env.SMTP_USFR_LEADS_PASSWORD || "Thepassword#123";
const FROM_NAME = "Foreclosure Recovery Inc.";

const PDF_GUIDE_URL = 'https://www.assetrecoverybusiness.com/Foreclosure-Recovery-Business-Programs-Guide.pdf';
const PARTNERSHIP_URL = 'https://www.usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business';
const SIGNUP_URL = 'https://usforeclosureleads.com/';
const LOGO_URL = 'https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png';

function buildWelcomeEmail(name: string): string {
  const firstName = (name.split(" ")[0] || name || "there").trim();
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Surplus Funds Overages Guide</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Your Surplus Funds Overages Guide is ready &mdash; download, sign up, and start training</div>
<center style="width:100%;background-color:#f4f5f7;">
<div style="max-width:600px;margin:0 auto;">

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:28px 40px 20px;">
      <table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
        <td style="width:55%;" align="left" valign="middle">
          <a style="text-decoration:none;" href="https://usforeclosurerecovery.com" target="_blank" rel="noopener noreferrer">
            <img style="display:block;max-width:185px;height:auto;border:0;" src="${LOGO_URL}" alt="Foreclosure Recovery Inc." width="185" />
          </a>
        </td>
        <td style="width:45%;" align="right" valign="middle">
          <p style="margin:0;font-size:12px;color:#7a8a9e;line-height:18px;">${today}<br><span style="color:#09274c;font-weight:600;">Welcome &mdash; Your Free Guide</span></p>
        </td>
      </tr></tbody></table>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:0 40px;"><div style="border-top:1px solid #e2e6eb;font-size:0;line-height:0;">&nbsp;</div></td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:18px 40px 0;">
      <p style="margin:0 0 6px;font-size:11px;color:#1a7a3a;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;">Your Guide Is Ready</p>
      <h1 style="margin:0 0 20px;font-size:22px;color:#09274c;font-weight:bold;line-height:30px;">Surplus Funds Overages Guide<br>&mdash; Become an Asset Recovery Agent</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;line-height:26px;">Hello ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;line-height:26px;">Thanks for grabbing the free guide. It walks you through how surplus funds recovery works, the Asset Recovery Agent Partnership ($995 total, 50/50 commission on every recovery), payment options, and exactly how to start closing claims.</p>
      <p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;">Download the PDF below, then take five minutes to create your free training account on the dashboard.</p>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:0 40px 20px;" align="center">
      <table border="0" cellspacing="0" cellpadding="0"><tbody><tr>
        <td style="background-color:#1a7a3a;border-radius:6px;padding:14px 32px;" align="center">
          <a style="display:inline-block;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;" href="${PDF_GUIDE_URL}" target="_blank" rel="noopener noreferrer">
            &#9660;&nbsp; Download Your Guide (PDF)
          </a>
        </td>
      </tr></tbody></table>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:0 40px;">
      <table style="background-color:#f0fff4;border-radius:6px;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#09274c;line-height:20px;"><strong>&#9989; Next Step:</strong> Create your free account at <a style="color:#1a7a3a;text-decoration:underline;" href="${SIGNUP_URL}" target="_blank" rel="noopener noreferrer">usforeclosureleads.com</a> &mdash; use <strong style="color:#1a7a3a;">Sign in with Google</strong> for one-click access. You will be on your dashboard in seconds.</p>
        </td>
      </tr></tbody></table>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:28px 40px 0;">
      <h2 style="margin:0 0 10px;font-size:17px;color:#09274c;font-weight:bold;">Once You Are In: Start Closing Training</h2>
      <p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;">After you land on your dashboard, look at the <strong style="color:#09274c;">left-side menu</strong> and click <strong style="color:#1a7a3a;">"Closing Training"</strong>. Everything you need before you start working cases lives there.</p>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:0 40px 4px;">
      <table style="border:1px solid #dce1e8;border-radius:6px;border-left:4px solid #1a7a3a;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr>
        <td style="padding:22px 24px;">
          <p style="margin:0 0 14px;font-size:11px;color:#1a7a3a;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Your Quick-Start Checklist</p>
          <table style="width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody>
            <tr>
              <td style="padding:6px 0;width:30px;" valign="top"><div style="width:22px;height:22px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:22px;font-size:12px;font-weight:bold;">1</div></td>
              <td style="padding:6px 0 6px 10px;font-size:14px;color:#2c3e50;line-height:21px;"><strong style="color:#09274c;">Download the guide</strong> using the button above</td>
            </tr>
            <tr>
              <td style="padding:6px 0;width:30px;" valign="top"><div style="width:22px;height:22px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:22px;font-size:12px;font-weight:bold;">2</div></td>
              <td style="padding:6px 0 6px 10px;font-size:14px;color:#2c3e50;line-height:21px;"><strong style="color:#09274c;">Create your free account</strong> at <a style="color:#1a7a3a;text-decoration:underline;" href="${SIGNUP_URL}" target="_blank" rel="noopener noreferrer">usforeclosureleads.com</a> (Google one-click)</td>
            </tr>
            <tr>
              <td style="padding:6px 0;width:30px;" valign="top"><div style="width:22px;height:22px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:22px;font-size:12px;font-weight:bold;">3</div></td>
              <td style="padding:6px 0 6px 10px;font-size:14px;color:#2c3e50;line-height:21px;"><strong style="color:#09274c;">Click "Closing Training"</strong> in the left-side menu</td>
            </tr>
            <tr>
              <td style="padding:6px 0;width:30px;" valign="top"><div style="width:22px;height:22px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:22px;font-size:12px;font-weight:bold;">4</div></td>
              <td style="padding:6px 0 6px 10px;font-size:14px;color:#2c3e50;line-height:21px;"><strong style="color:#09274c;">Complete each training module</strong> and mark them as finished</td>
            </tr>
            <tr>
              <td style="padding:6px 0;width:30px;" valign="top"><div style="width:22px;height:22px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:22px;font-size:12px;font-weight:bold;">5</div></td>
              <td style="padding:6px 0 6px 10px;font-size:14px;color:#2c3e50;line-height:21px;"><strong style="color:#09274c;">Book your live training call</strong> to finalize onboarding</td>
            </tr>
          </tbody></table>
        </td>
      </tr></tbody></table>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:24px 40px 0;">
      <table style="border:1px solid #dce1e8;border-radius:6px;border-left:4px solid #09274c;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr>
        <td style="padding:22px 24px;">
          <p style="margin:0 0 12px;font-size:11px;color:#09274c;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Ready to Activate Your Partnership?</p>
          <p style="margin:0 0 14px;font-size:14px;color:#2c3e50;line-height:22px;">When you are ready to lock in your spot and start receiving leads, visit the link below and <strong style="color:#09274c;">scroll down</strong> to the <strong style="color:#1a7a3a;">Asset Recovery Agent Partnership Package</strong>.</p>
          <table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
            <td style="padding-top:4px;" align="center">
              <a style="display:inline-block;padding:12px 28px;background-color:#09274c;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;" href="${PARTNERSHIP_URL}" target="_blank" rel="noopener noreferrer">
                &#128179;&nbsp; View Partnership Packages
              </a>
            </td>
          </tr></tbody></table>
        </td>
      </tr></tbody></table>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:24px 40px 0;">
      <table style="background-color:#f0f7ff;border-radius:6px;border-left:4px solid #09274c;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr>
        <td style="padding:20px 24px;text-align:center;">
          <p style="margin:0 0 10px;font-size:15px;color:#09274c;font-weight:600;">Need Help? We Are Here For You</p>
          <p style="margin:0 0 14px;font-size:14px;color:#2c3e50;line-height:22px;">Our team is available to answer any questions. Reach out anytime.</p>
          <p style="margin:0 0 14px;font-size:14px;"><a style="color:#09274c;font-weight:600;text-decoration:none;" href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a></p>
          <a style="display:inline-block;padding:12px 28px;background-color:#09274c;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;" href="tel:+18885458007" target="_blank" rel="noopener noreferrer">&#128222;&nbsp; (888) 545-8007</a>
        </td>
      </tr></tbody></table>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:28px 40px 12px;">
      <table style="border-top:1px solid #e2e6eb;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr>
        <td style="padding-top:20px;">
          <p style="margin:0 0 2px;font-size:15px;color:#09274c;font-weight:bold;">Corey Pearson</p>
          <p style="margin:0 0 2px;font-size:13px;color:#5a6d82;">Director, Recovery Agent Partnerships</p>
          <p style="margin:0 0 2px;font-size:13px;color:#5a6d82;">Foreclosure Recovery Inc.</p>
          <p style="margin:8px 0 0;font-size:13px;"><a style="color:#09274c;text-decoration:none;" href="tel:+18885458007" target="_blank" rel="noopener noreferrer">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color:#09274c;text-decoration:none;" href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a></p>
        </td>
      </tr></tbody></table>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:0 40px;"><div style="border-top:2px solid #1a7a3a;width:60px;font-size:0;line-height:0;">&nbsp;</div></td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#ffffff;padding:20px 40px 30px;">
      <p style="margin:0 0 10px;font-size:11px;color:#8a96a5;line-height:17px;">Foreclosure Recovery Inc. &middot; 30 N Gould St, Ste R &middot; Sheridan, WY 82801</p>
      <p style="margin:0;font-size:11px;color:#8a96a5;line-height:17px;">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a style="color:#7a8a9e;text-decoration:underline;" href="https://usforeclosurerecovery.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>&nbsp;&nbsp;<a style="color:#7a8a9e;text-decoration:underline;" href="https://usforeclosurerecovery.com/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms</a></p>
    </td>
  </tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr>
    <td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td>
  </tr></tbody></table>

</div>
</center>
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
  let body: { name?: string; email?: string; phone?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { name = "", email = "", phone = "", source = "hero_form" } = body;
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Valid email required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Upsert subscriber (ignore duplicate)
  const subRow: Record<string, string> = { email: trimmedEmail, name: trimmedName, source };
  if (trimmedPhone) subRow.phone = trimmedPhone;
  const { error: dbError } = await supabaseAdmin
    .from("email_subscribers")
    .upsert(subRow, { onConflict: "email", ignoreDuplicates: true });

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
      subject: "Your Surplus Funds Overages Guide is ready -- download inside",
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
      text: `Name: ${trimmedName || "Not provided"}\nEmail: ${trimmedEmail}\nPhone: ${trimmedPhone || "Not provided"}\nSource: ${source}\nTime: ${new Date().toISOString()}`,
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
