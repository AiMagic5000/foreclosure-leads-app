import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import * as tls from "tls"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const SENDER_EMAIL = "partnerships@usforeclosurerecovery.com"
const SENDER_NAME = "Foreclosure Recovery Inc."
const IMAP_HOST = "imap.hostinger.com"
const IMAP_PORT = 993
const IMAP_USER = "claim@usforeclosurerecovery.com"
const IMAP_PASS = process.env.IMAP_CLAIM_PASSWORD || "Thepassword#123"

const LOGO_URL = "https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png"

interface PartnershipLeadData {
  name: string
  companyOrFirm: string
  email: string
  city: string
  state: string
  stateAbbr: string
  county: string
}

function generateTitleCompanyEmail(lead: PartnershipLeadData): { subject: string; html: string } {
  const companyName = lead.companyOrFirm || lead.name
  const countyName = lead.county || lead.city

  const subject = `Revenue Opportunity: Foreclosure Surplus Referrals for ${companyName}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2c3e50;line-height:1.6;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">

<div style="background:linear-gradient(135deg,#09274c 0%,#1a3a5f 100%);padding:25px 30px;text-align:center;">
  <img src="${LOGO_URL}" alt="Foreclosure Recovery Inc." style="max-width:200px;height:auto;" />
</div>

<div style="padding:35px 30px;">
  <h1 style="font-size:24px;color:#09274c;margin:0 0 18px;line-height:1.3;">Revenue Opportunity for Title Companies: Foreclosure Surplus Referrals</h1>

  <p style="font-size:17px;color:#d4af37;font-weight:600;margin:0 0 18px;">Turn Your Existing Foreclosure Data Into Passive Income</p>

  <p style="font-size:15px;margin:0 0 16px;">Dear ${companyName},</p>

  <p style="font-size:15px;margin:0 0 16px;">My name is <strong style="color:#09274c;">Corey Pearson</strong>, Director at <strong style="color:#09274c;">Foreclosure Recovery Inc.</strong> I'm reaching out to title companies in <strong style="color:#09274c;">${countyName}</strong> with a partnership opportunity that generates referral income from data you already process -- with zero additional work on your end.</p>

  <p style="font-size:15px;margin:0 0 16px;">As a title company handling foreclosure closings, you have access to something valuable: <strong style="color:#09274c;">property addresses and former owner names</strong> from foreclosure sales. In 84% of these cases, surplus funds exist that legally belong to the former homeowner -- but they never get claimed because no one tells them.</p>

  <div style="background:#f7f9fb;border-left:4px solid #1a7a3a;padding:18px;margin:22px 0;border-radius:6px;">
    <p style="margin:0;font-size:16px;line-height:1.7;"><strong style="color:#1a7a3a;">Here's the opportunity:</strong> Refer former homeowners to us for surplus fund recovery, and earn a <strong>5% referral fee</strong> on every successful recovery -- typically $2,350 to $4,250 per case. You simply provide us with names and property addresses from foreclosures you've already closed. We handle everything else.</p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin:22px 0;">
    <tr>
      <td style="text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;width:25%;">
        <div style="font-size:28px;font-weight:700;color:#1a7a3a;">84%</div>
        <div style="font-size:12px;color:#5a6d82;text-transform:uppercase;letter-spacing:0.5px;">Have Surplus</div>
      </td>
      <td style="width:3%;"></td>
      <td style="text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;width:25%;">
        <div style="font-size:28px;font-weight:700;color:#1a7a3a;">$47K-$85K</div>
        <div style="font-size:12px;color:#5a6d82;text-transform:uppercase;letter-spacing:0.5px;">Avg Recovery</div>
      </td>
      <td style="width:3%;"></td>
      <td style="text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;width:22%;">
        <div style="font-size:28px;font-weight:700;color:#1a7a3a;">5%</div>
        <div style="font-size:12px;color:#5a6d82;text-transform:uppercase;letter-spacing:0.5px;">Your Fee</div>
      </td>
      <td style="width:3%;"></td>
      <td style="text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;width:22%;">
        <div style="font-size:28px;font-weight:700;color:#1a7a3a;">$0</div>
        <div style="font-size:12px;color:#5a6d82;text-transform:uppercase;letter-spacing:0.5px;">Your Cost</div>
      </td>
    </tr>
  </table>

  <h2 style="font-size:18px;color:#09274c;margin:25px 0 12px;">How the Partnership Works</h2>

  <p style="font-size:15px;margin:0 0 12px;"><strong>Step 1: You Submit Basic Info</strong><br>After closing a foreclosure, you provide us with the former owner's name and property address (data you already have).</p>
  <p style="font-size:15px;margin:0 0 12px;"><strong>Step 2: We Handle the Recovery</strong><br>We verify surplus eligibility, locate the former owner, obtain their signed agreement, and file all claims.</p>
  <p style="font-size:15px;margin:0 0 12px;"><strong>Step 3: You Get Paid</strong><br>When funds are recovered (typically 8-16 weeks), you receive a 5% referral fee. Zero effort after the initial submission.</p>

  <div style="height:1px;background:#e2e6eb;margin:22px 0;"></div>

  <h2 style="font-size:18px;color:#09274c;margin:25px 0 12px;">Let's Start with a Free Trial</h2>

  <p style="font-size:15px;margin:0 0 16px;">Submit 5-10 recent foreclosure files (just names and addresses) and we'll verify surplus eligibility at no cost. If we find recoverable funds, we'll process those cases under our standard 5% referral agreement. Zero risk.</p>

  <div style="text-align:center;margin:25px 0;">
    <a href="mailto:partnerships@usforeclosurerecovery.com?subject=Title Company Partnership Inquiry - ${encodeURIComponent(companyName)}" style="display:inline-block;background:#1a7a3a;color:white;padding:14px 32px;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">Schedule a Call</a>
  </div>

  <p style="font-size:15px;margin:0 0 16px;">Or simply reply to this email with your availability.</p>

  <div style="height:1px;background:#e2e6eb;margin:22px 0;"></div>

  <p style="font-size:15px;margin:0 0 4px;"><strong style="color:#09274c;">Corey Pearson</strong></p>
  <p style="font-size:13px;color:#5a6d82;margin:0 0 2px;">Director, Strategic Partnerships</p>
  <p style="font-size:13px;color:#5a6d82;margin:0 0 2px;">Foreclosure Recovery Inc.</p>
  <p style="font-size:13px;margin:0;"><a href="tel:+18885458007" style="color:#1a7a3a;text-decoration:none;">(888) 545-8007</a> | <a href="mailto:partnerships@usforeclosurerecovery.com" style="color:#1a7a3a;text-decoration:none;">partnerships@usforeclosurerecovery.com</a></p>
</div>

<div style="background:#f7f9fb;padding:25px 30px;text-align:center;font-size:12px;color:#7a8a9e;">
  <p style="margin:0 0 10px;"><strong>Foreclosure Recovery Inc.</strong> | 30 N Gould St, Ste R | Sheridan, WY 82801</p>
  <p style="margin:0;line-height:1.5;">This partnership arrangement complies with applicable real estate referral regulations. Referral fees are paid for business development services only.</p>
</div>

</div>
</body>
</html>`

  return { subject, html }
}

function generateInvestorEmail(lead: PartnershipLeadData): { subject: string; html: string } {
  const investorName = lead.name
  const firstName = investorName.split(" ")[0]

  const subject = `Earn $4,000+ Per Referral: Foreclosure Surplus Recovery Program`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2c3e50;line-height:1.6;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">

<div style="background:linear-gradient(135deg,#09274c 0%,#1a3a5f 100%);padding:25px 30px;text-align:center;">
  <img src="${LOGO_URL}" alt="Foreclosure Recovery Inc." style="max-width:200px;height:auto;" />
  <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Investor Referral Program</p>
</div>

<div style="padding:35px 30px;">
  <h1 style="font-size:24px;color:#09274c;margin:0 0 18px;">Earn $4,000+ Per Referral Helping Former Homeowners</h1>

  <p style="font-size:15px;margin:0 0 16px;">Dear ${firstName},</p>

  <p style="font-size:15px;margin:0 0 16px;">As a real estate investor buying foreclosed properties, you have unique access to something valuable: <strong style="color:#09274c;">former homeowners who may be owed tens of thousands of dollars</strong> in surplus funds from their foreclosure sale.</p>

  <p style="font-size:15px;margin:0 0 12px;">Most former owners have no idea this money exists. By referring them to us for recovery assistance, you can:</p>

  <ul style="margin:12px 0;padding-left:25px;font-size:15px;">
    <li style="margin-bottom:8px;">Help them recover funds they legally own</li>
    <li style="margin-bottom:8px;">Build goodwill (easier future negotiations, positive reputation)</li>
    <li style="margin-bottom:8px;">Earn an <strong>8% referral fee</strong> ($4,000+ per case on average)</li>
  </ul>

  <div style="background:#f0f7ff;border-left:4px solid #1a7a3a;padding:18px;margin:22px 0;border-radius:6px;">
    <p style="margin:0;font-size:16px;"><strong style="color:#1a7a3a;">How It Works:</strong> When you buy a foreclosed property at auction, simply give the former owner our contact info. If they have surplus funds, we handle the recovery. When funds are distributed, you earn 8% of the recovered amount -- typically $4,000-$6,800 per referral.</p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin:22px 0;">
    <tr>
      <td style="text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;width:31%;">
        <div style="font-size:28px;font-weight:700;color:#1a7a3a;">84%</div>
        <div style="font-size:12px;color:#5a6d82;text-transform:uppercase;">Have Surplus</div>
      </td>
      <td style="width:3%;"></td>
      <td style="text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;width:31%;">
        <div style="font-size:28px;font-weight:700;color:#1a7a3a;">$50K+</div>
        <div style="font-size:12px;color:#5a6d82;text-transform:uppercase;">Avg Recovery</div>
      </td>
      <td style="width:3%;"></td>
      <td style="text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;width:31%;">
        <div style="font-size:28px;font-weight:700;color:#1a7a3a;">8%</div>
        <div style="font-size:12px;color:#5a6d82;text-transform:uppercase;">Your Fee</div>
      </td>
    </tr>
  </table>

  <h2 style="font-size:18px;color:#09274c;margin:25px 0 12px;">Simple Referral Process</h2>

  <p style="font-size:15px;margin:0 0 10px;"><strong>Step 1:</strong> After buying a property, hand the former owner our business card or text them our info.</p>
  <p style="font-size:15px;margin:0 0 10px;"><strong>Step 2:</strong> Mention you found out they may have surplus funds and we can help recover them.</p>
  <p style="font-size:15px;margin:0 0 10px;"><strong>Step 3:</strong> We handle everything -- verification, paperwork, filing, recovery.</p>
  <p style="font-size:15px;margin:0 0 16px;"><strong>Step 4:</strong> You get paid 8% when funds are recovered (typically 8-12 weeks).</p>

  <p style="font-size:15px;margin:0 0 16px;background:#fff9e6;padding:15px;border-radius:8px;border-left:4px solid #d4af37;">
    <strong>Example:</strong> Former owner had $52,000 surplus from their foreclosure. We recovered it. Your referral fee: <strong>$4,160</strong>. Zero work after a 30-second conversation.
  </p>

  <div style="text-align:center;margin:25px 0;">
    <a href="mailto:partnerships@usforeclosurerecovery.com?subject=Investor Referral Program - ${encodeURIComponent(investorName)}" style="display:inline-block;background:#1a7a3a;color:white;padding:14px 32px;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">Join Referral Program</a>
  </div>

  <p style="font-size:15px;margin:0 0 16px;">If you buy 2-5 foreclosed properties per month, this could add $8K-$25K to your annual income with almost zero effort.</p>

  <p style="font-size:15px;margin:0 0 16px;">Reply to this email or call <strong>(888) 545-8007</strong> to get started.</p>

  <div style="height:1px;background:#e2e6eb;margin:22px 0;"></div>

  <p style="font-size:15px;margin:0 0 4px;"><strong style="color:#09274c;">Corey Pearson</strong></p>
  <p style="font-size:13px;color:#5a6d82;margin:0 0 2px;">Director, Investor Partnerships</p>
  <p style="font-size:13px;color:#5a6d82;margin:0 0 2px;">Foreclosure Recovery Inc.</p>
  <p style="font-size:13px;margin:0;">(888) 545-8007 | partnerships@usforeclosurerecovery.com</p>
</div>

<div style="background:#f7f9fb;padding:25px 30px;text-align:center;font-size:12px;color:#7a8a9e;">
  <p style="margin:0 0 10px;"><strong>Foreclosure Recovery Inc.</strong> | 30 N Gould St, Ste R | Sheridan, WY 82801</p>
  <p style="margin:0;">© 2026 Foreclosure Recovery Inc.</p>
</div>

</div>
</body>
</html>`

  return { subject, html }
}

function generateAttorneyEmail(lead: PartnershipLeadData): { subject: string; html: string } {
  const attorneyName = lead.name
  const countyName = lead.county || lead.city

  const subject = `Attorney Partnership: Foreclosure Surplus Recovery Referrals`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#2c3e50;line-height:1.6;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">

<div style="background-color:#09274c;height:4px;"></div>

<div style="padding:25px 35px 18px;">
  <table style="width:100%;" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="left" valign="middle" width="55%">
        <img src="${LOGO_URL}" alt="Foreclosure Recovery Inc." style="max-width:185px;height:auto;" />
      </td>
      <td align="right" valign="middle" width="45%">
        <p style="margin:0;font-size:12px;color:#7a8a9e;line-height:18px;">
          ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}<br />
          <span style="color:#09274c;font-weight:600;">Confidential Attorney Partnership</span>
        </p>
      </td>
    </tr>
  </table>
</div>

<div style="padding:0 35px;">
  <div style="border-top:1px solid #e2e6eb;"></div>
</div>

<div style="padding:15px 35px 0;">
  <p style="margin:0 0 6px;font-size:11px;color:#7a8a9e;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;">Attorney Partnership Opportunity</p>

  <h1 style="margin:0 0 20px;font-size:20px;color:#09274c;font-weight:bold;line-height:28px;">
    Add Value for Your Foreclosure Clients<br />While Earning Referral Income
  </h1>

  <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;line-height:24px;">Dear ${attorneyName},</p>

  <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;line-height:24px;">My name is <strong style="color:#09274c;">Corey Pearson</strong>, Director at <strong style="color:#09274c;">Foreclosure Recovery Inc.</strong> I'm reaching out to bankruptcy and foreclosure attorneys in <strong style="color:#09274c;">${countyName}</strong> with a partnership opportunity that helps your clients recover funds they may not know exist -- while generating referral income for your practice.</p>

  <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;line-height:24px;">When a foreclosed property sells at auction for more than the outstanding mortgage and fees, the surplus funds legally belong to the former homeowner. However, <strong style="color:#09274c;">84% of foreclosure cases with surplus funds go unclaimed</strong> because homeowners don't know about them.</p>
</div>

<div style="padding:0 35px;">
  <table style="border:1px solid #dce1e8;border-radius:6px;border-left:4px solid #1a7a3a;width:100%;" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding:20px 22px;">
        <p style="margin:0 0 10px;font-size:11px;color:#1a7a3a;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">Why Partner With Us?</p>
        <table border="0" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#7a8a9e;" width="150">Average Recovery:</td>
            <td style="padding:4px 0;font-size:15px;color:#1a7a3a;font-weight:700;">$47,000 - $85,000</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#7a8a9e;">Your Referral Fee:</td>
            <td style="padding:4px 0;font-size:15px;color:#1a7a3a;font-weight:700;">10% of Recovered Amount</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#7a8a9e;">Your Upfront Cost:</td>
            <td style="padding:4px 0;font-size:15px;color:#09274c;font-weight:700;">$0 (We pay all fees)</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#7a8a9e;">Conflict Risk:</td>
            <td style="padding:4px 0;font-size:14px;color:#09274c;font-weight:600;">None -- You refer, we recover</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>

<div style="padding:20px 35px 0;">
  <h2 style="margin:0 0 14px;font-size:17px;color:#09274c;font-weight:bold;">How the Partnership Works</h2>

  <table border="0" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;">
    <tr>
      <td style="padding-top:2px;" valign="top" width="36">
        <div style="width:26px;height:26px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:26px;font-size:13px;font-weight:bold;">1</div>
      </td>
      <td style="padding-left:10px;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#09274c;">You Refer the Client</p>
        <p style="margin:0;font-size:14px;line-height:21px;color:#2c3e50;">When you identify a former client with a foreclosed property, you refer them to us via phone, email, or our secure portal.</p>
      </td>
    </tr>
  </table>

  <table border="0" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;">
    <tr>
      <td style="padding-top:2px;" valign="top" width="36">
        <div style="width:26px;height:26px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:26px;font-size:13px;font-weight:bold;">2</div>
      </td>
      <td style="padding-left:10px;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#09274c;">We Handle Everything</p>
        <p style="margin:0;font-size:14px;line-height:21px;color:#2c3e50;">We research the property, verify surplus eligibility, file all claims, and manage the entire recovery process.</p>
      </td>
    </tr>
  </table>

  <table border="0" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;">
    <tr>
      <td style="padding-top:2px;" valign="top" width="36">
        <div style="width:26px;height:26px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:26px;font-size:13px;font-weight:bold;">3</div>
      </td>
      <td style="padding-left:10px;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#09274c;">Funds Recovered & Distributed</p>
        <p style="margin:0;font-size:14px;line-height:21px;color:#2c3e50;">Once funds are released, your client receives their share and you receive a 10% referral fee.</p>
      </td>
    </tr>
  </table>
</div>

<div style="padding:0 35px;">
  <table style="background-color:#f0f7ff;border-radius:6px;border-left:4px solid #09274C;width:100%;" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding:18px 22px;text-align:center;">
        <p style="margin:0 0 10px;font-size:15px;color:#09274c;font-weight:600;">Ready to add value for your clients?</p>
        <p style="margin:0 0 14px;font-size:14px;color:#2c3e50;line-height:21px;">Let's start with 1-2 test cases -- completely free -- to prove the system works.</p>
        <a href="mailto:partnerships@usforeclosurerecovery.com?subject=Attorney Partnership Inquiry - ${encodeURIComponent(attorneyName)}" style="display:inline-block;padding:12px 28px;background-color:#09274c;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Schedule a Call</a>
      </td>
    </tr>
  </table>
</div>

<div style="padding:22px 35px 10px;">
  <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;line-height:24px;">I'd welcome the opportunity to discuss how this partnership can benefit your practice and your clients.</p>

  <div style="border-top:1px solid #e2e6eb;padding-top:16px;">
    <p style="margin:0 0 2px;font-size:15px;color:#09274c;font-weight:bold;">Corey Pearson</p>
    <p style="margin:0 0 2px;font-size:13px;color:#5a6d82;">Director, Attorney Partnerships</p>
    <p style="margin:0 0 2px;font-size:13px;color:#5a6d82;">Foreclosure Recovery Inc.</p>
    <p style="margin:6px 0 0;font-size:13px;">
      <a style="color:#09274c;text-decoration:none;" href="tel:+18885458007">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color:#09274c;text-decoration:none;" href="mailto:partnerships@usforeclosurerecovery.com">partnerships@usforeclosurerecovery.com</a>
    </p>
  </div>
</div>

<div style="padding:0 35px;">
  <div style="border-top:2px solid #1a7a3a;width:60px;"></div>
</div>

<div style="padding:16px 35px 25px;">
  <p style="margin:0 0 8px;font-size:11px;color:#8a96a5;line-height:16px;">Foreclosure Recovery Inc. -- 30 N Gould St, Ste R -- Sheridan, WY 82801</p>
  <p style="margin:0 0 8px;font-size:11px;color:#8a96a5;line-height:16px;">This correspondence is confidential and intended for licensed attorneys only. Referral fees are subject to compliance with applicable bar association rules.</p>
  <p style="margin:0;font-size:11px;color:#8a96a5;">© 2026 Foreclosure Recovery Inc.</p>
</div>

<div style="background-color:#09274c;height:4px;"></div>

</div>
</body>
</html>`

  return { subject, html }
}

function imapAppendDraft(emailContent: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: "IMAP connection timed out" })
    }, 15000)

    let buffer = ""
    let state = "connecting"
    let tagCounter = 1
    let resolved = false

    const done = (result: { success: boolean; error?: string }) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      try { socket.destroy() } catch (_e) { /* ignore */ }
      resolve(result)
    }

    const socket = tls.connect(
      { host: IMAP_HOST, port: IMAP_PORT, rejectUnauthorized: false },
      () => { /* connected */ }
    )

    socket.setEncoding("utf8")

    socket.on("data", (data: string) => {
      buffer += data
      const lines = buffer.split("\r\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (state === "connecting" && line.startsWith("* OK")) {
          state = "login"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGIN ${IMAP_USER} ${IMAP_PASS}\r\n`)
        } else if (state === "login" && /^A\d+ OK/.test(line)) {
          state = "append"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "login" && /^A\d+ (NO|BAD)/.test(line)) {
          done({ success: false, error: "IMAP login failed: " + line })
        } else if (state === "append" && line.startsWith("+")) {
          state = "appending"
          socket.write(emailContent + "\r\n")
        } else if (state === "append" && /^A\d+ NO/.test(line)) {
          state = "append2"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "INBOX.Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "appending" && /^A\d+ OK/.test(line)) {
          state = "logout"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGOUT\r\n`)
        } else if (state === "appending" && /^A\d+ NO/.test(line)) {
          state = "append2"
          const tag = "A" + tagCounter++
          const size = Buffer.byteLength(emailContent, "utf8")
          socket.write(`${tag} APPEND "INBOX.Drafts" (\\Draft \\Seen) {${size}}\r\n`)
        } else if (state === "append2" && line.startsWith("+")) {
          state = "appending2"
          socket.write(emailContent + "\r\n")
        } else if (state === "appending2" && /^A\d+ OK/.test(line)) {
          state = "logout"
          const tag = "A" + tagCounter++
          socket.write(`${tag} LOGOUT\r\n`)
        } else if (state === "appending2" && /^A\d+ NO/.test(line)) {
          done({ success: false, error: "Could not append to Drafts: " + line })
        } else if (state === "logout") {
          done({ success: true })
        } else if (/^A\d+ (NO|BAD)/.test(line) && state !== "appending" && state !== "appending2") {
          done({ success: false, error: "IMAP error: " + line })
        }
      }
    })

    socket.on("error", (err: Error) => {
      done({ success: false, error: err.message })
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress
    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { type, action, leadData } = body as {
      type: "title" | "investor" | "attorney"
      action: "preview" | "create_draft"
      leadData: PartnershipLeadData
    }

    if (!type || !action || !leadData) {
      return NextResponse.json({ error: "type, action, and leadData are required" }, { status: 400 })
    }

    let emailContent: { subject: string; html: string }

    switch (type) {
      case "title":
        emailContent = generateTitleCompanyEmail(leadData)
        break
      case "investor":
        emailContent = generateInvestorEmail(leadData)
        break
      case "attorney":
        emailContent = generateAttorneyEmail(leadData)
        break
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    if (action === "preview") {
      return NextResponse.json({
        subject: emailContent.subject,
        html: emailContent.html,
        to: leadData.email,
        from: SENDER_EMAIL,
      })
    }

    if (action === "create_draft") {
      const boundary = "----=_Part_" + Date.now().toString(36)
      const mimeMessage = [
        `From: ${SENDER_NAME} <${SENDER_EMAIL}>`,
        `To: ${leadData.name} <${leadData.email}>`,
        `Subject: ${emailContent.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        `Date: ${new Date().toUTCString()}`,
        `X-Mailer: USFR Partnership Outreach`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        `Partnership opportunity from Foreclosure Recovery Inc. Please view the HTML version for full details.`,
        ``,
        `Contact: (888) 545-8007 | partnerships@usforeclosurerecovery.com`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        emailContent.html,
        ``,
        `--${boundary}--`,
      ].join("\r\n")

      const result = await imapAppendDraft(mimeMessage)

      if (result.success) {
        return NextResponse.json({ success: true, message: "Draft created in mailbox" })
      } else {
        return NextResponse.json({ error: result.error || "Failed to create draft" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
