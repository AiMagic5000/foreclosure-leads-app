interface LeadData {
  first_name: string
  email: string
  session_time?: string
  countdown_minutes?: number
}

const FONT = "'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif"
const LOGO = 'https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png'
const APP = 'https://usforeclosureleads.com'

/* ---- content helpers (inline-styled, email-safe) ---- */
const P = (t: string) =>
  `<p style="margin:0 0 18px;font-size:15px;color:#2c3e50;line-height:26px;font-family:${FONT};">${t}</p>`

const H2 = (t: string) =>
  `<h2 style="margin:0 0 8px;font-size:17px;color:#09274c;font-weight:bold;font-family:${FONT};">${t}</h2>`

const BTN = (text: string, href: string, color = '#1a7a3a') =>
  `<table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td align="center" style="padding:8px 0 22px;"><a class="cta-btn mobile-full-btn" href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;background-color:${color};color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;font-family:${FONT};text-align:center;">${text}</a></td></tr></tbody></table>`

const NOTE = (html: string, bg = '#f0fff4') =>
  `<table style="background-color:${bg};border-radius:6px;width:100%;margin:0 0 6px;" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding:14px 18px;"><p style="margin:0;font-size:13px;color:#09274c;line-height:20px;font-family:${FONT};">${html}</p></td></tr></tbody></table>`

const CHECKLIST = (items: string[]) =>
  `<table style="border:1px solid #dce1e8;border-radius:6px;border-left:4px solid #1a7a3a;width:100%;margin:22px 0 4px;" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td class="property-box" style="padding:22px 24px;">
<p style="margin:0 0 14px;font-size:11px;color:#1a7a3a;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;font-family:${FONT};">Your Quick-Start Checklist</p>
<table style="width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody>
${items
    .map(
      (it, i) =>
        `<tr><td style="padding:6px 0;width:30px;" valign="top"><div style="width:22px;height:22px;border-radius:50%;background-color:#09274c;color:#ffffff;text-align:center;line-height:22px;font-size:12px;font-weight:bold;">${i + 1}</div></td><td style="padding:6px 0 6px 10px;font-size:14px;color:#2c3e50;line-height:21px;font-family:${FONT};">${it}</td></tr>`
    )
    .join('')}
</tbody></table></td></tr></tbody></table>`

/* ---- shell: header + hero + content + signature + footer ---- */
function wrapEmail(o: {
  preheader: string
  headerLabel: string
  eyebrow: string
  heading: string
  content: string
  email: string
}): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<style>
  html,body{margin:0!important;padding:0!important;height:100%!important;width:100%!important}
  *{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  table{border-spacing:0!important;border-collapse:collapse!important;table-layout:fixed!important;margin:0 auto!important}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
  a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
  @media only screen and (max-width:620px){
    .email-container{width:100%!important;max-width:100%!important}
    .padding-mobile{padding-left:20px!important;padding-right:20px!important}
    .property-box{padding:18px 16px!important}
    .mobile-full-btn{display:block!important;width:100%!important;text-align:center!important;box-sizing:border-box!important}
    .hero-heading{font-size:19px!important;line-height:26px!important}
    .logo-img{max-width:160px!important;height:auto!important}
    .cta-btn{padding:14px 20px!important;font-size:14px!important}
  }
</style></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:${FONT};">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${o.preheader}</div>
<center style="width:100%;background-color:#f4f5f7;">
<div class="email-container" style="max-width:600px;margin:0 auto;">

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color:#ffffff;padding:28px 40px 18px;">
    <table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
      <td style="width:55%;" align="left" valign="middle"><a href="https://usforeclosurerecovery.com" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img class="logo-img" src="${LOGO}" alt="Foreclosure Recovery Inc." width="185" height="67" style="display:block;max-width:185px;height:auto;border:0;" /></a></td>
      <td style="width:45%;" align="right" valign="middle"><p class="header-date" style="margin:0;font-size:12px;color:#7a8a9e;font-family:${FONT};line-height:18px;"><span style="color:#09274c;font-weight:600;">${o.headerLabel}</span></p></td>
    </tr></tbody></table>
  </td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color:#ffffff;padding:0 40px;"><div style="border-top:1px solid #e2e6eb;font-size:0;line-height:0;">&nbsp;</div></td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color:#ffffff;padding:18px 40px 0;">
    <p style="margin:0 0 6px;font-size:11px;color:#1a7a3a;text-transform:uppercase;letter-spacing:1.2px;font-family:${FONT};font-weight:600;">${o.eyebrow}</p>
    <h1 class="hero-heading" style="margin:0 0 22px;font-size:21px;color:#09274c;font-weight:bold;font-family:${FONT};line-height:28px;">${o.heading}</h1>
  </td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color:#ffffff;padding:0 40px;">
    ${o.content}
  </td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color:#ffffff;padding:26px 40px 12px;">
    <table style="border-top:1px solid #e2e6eb;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding-top:20px;">
      <img src="${APP}/images/corey-allie-pearson.jpg" alt="Corey and Allie, Foreclosure Recovery Inc." width="220" style="display:block;width:220px;max-width:60%;height:auto;border-radius:8px;margin:0 0 10px;" />
      <p style="margin:0 0 12px;font-size:13px;color:#5a6d82;font-style:italic;font-family:${FONT};">&ldquo;Helping agents close deals since 1999&rdquo;</p>
      <p style="margin:0 0 2px;font-size:15px;color:#09274c;font-weight:bold;font-family:${FONT};">Corey Pearson</p>
      <p style="margin:0 0 2px;font-size:15px;color:#09274c;font-weight:bold;font-family:${FONT};">Allie Pearson</p>
      <p style="margin:0 0 2px;font-size:13px;color:#5a6d82;font-family:${FONT};">Recovery Agent Partnerships</p>
      <p style="margin:0 0 2px;font-size:13px;color:#5a6d82;font-family:${FONT};">Foreclosure Recovery Inc.</p>
      <p style="margin:8px 0 0;font-size:13px;font-family:${FONT};"><a href="tel:+18885458007" style="color:#09274c;text-decoration:none;">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="mailto:support@usforeclosureleads.com" style="color:#09274c;text-decoration:none;">support@usforeclosureleads.com</a></p>
    </td></tr></tbody></table>
  </td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color:#ffffff;padding:0 40px;"><div style="border-top:2px solid #1a7a3a;width:60px;font-size:0;line-height:0;">&nbsp;</div></td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td class="padding-mobile" style="background-color:#ffffff;padding:20px 40px 28px;">
    <p style="margin:0 0 10px;font-size:11px;color:#8a96a5;line-height:17px;font-family:${FONT};">Foreclosure Recovery Inc. &middot; 30 N Gould St, Ste R &middot; Sheridan, WY 82801 &middot; (888) 545-8007</p>
    <p style="margin:0;font-size:11px;color:#8a96a5;line-height:17px;font-family:${FONT};">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a href="https://usforeclosurerecovery.com/privacy-policy" target="_blank" rel="noopener noreferrer" style="color:#7a8a9e;text-decoration:underline;">Privacy Policy</a>&nbsp;&nbsp;<a href="${APP}/unsubscribe?email=${encodeURIComponent(o.email)}" style="color:#7a8a9e;text-decoration:underline;">Unsubscribe</a></p>
  </td></tr></tbody></table>

  <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>

</div></center></body></html>`
}

export function getEmailTemplate(step: number, lead: LeadData): { subject: string; html: string } {
  const fn = lead.first_name
  const SIGNIN = `${APP}/sign-in`
  const SIGNUP = `${APP}/sign-up`
  const ACCOUNT = `${APP}/dashboard/settings`
  const TRAINING = `${APP}/dashboard/closing-training`
  const STAN = 'https://stan.store/alliepearson/p/asset-recovery-agent-partnership'
  const PRICING = STAN

  const steps: Record<number, { subject: string; preheader: string; label: string; eyebrow: string; heading: string; content: string }> = {
    0: {
      subject: `${fn}, your account is ready`,
      preheader: 'Log in and start your training videos and guides — nothing to set up.',
      label: 'Welcome: Getting Started',
      eyebrow: 'Getting Started',
      heading: 'Your Account Is Ready &mdash; Log In<br />and Start Your Training',
      content: `
${P(`Hi ${fn},`)}
${P(`Good news &mdash; your account on <strong style="color:#09274c;">usforeclosureleads.com</strong> is created and ready. There is nothing to set up. Just log in and start learning.`)}
${BTN('Log Into My Account', SIGNIN, '#1a7a3a')}
${H2('Start Your Training')}
${P(`Log in and open <strong style="color:#1a7a3a;">Free Training</strong> in the left-side menu. Watch the videos and download the guides under each one &mdash; you will learn how surplus recovery works and how to confirm you have the proper standing to make a claim.`)}
${CHECKLIST([
  `<strong style="color:#09274c;">Account created</strong> &mdash; done`,
  `<strong style="color:#09274c;">Log in</strong> at usforeclosureleads.com`,
  `<strong style="color:#09274c;">Open Free Training</strong>, watch the videos, and download the guides under each`,
  `<strong style="color:#09274c;">When you are ready for live leads</strong> &mdash; your own 800 number and business email &mdash; choose a package (below)`,
])}
${P(`<strong style="color:#09274c;">Start with these two guides.</strong> Please read both &mdash; they answer most of the questions people have when getting started. You will find them under the first Free Training module&rsquo;s Resources section, in the <strong style="color:#1a7a3a;">Free Training</strong> tab on your dashboard.`)}
<table border="0" width="100%" cellspacing="0" cellpadding="0" style="margin:6px 0 18px;"><tbody><tr>
<td width="50%" align="center" valign="top" style="padding:0 6px;"><a href="${TRAINING}" target="_blank" rel="noopener noreferrer"><img src="${APP}/guides/doc-a.jpg" alt="Agent Overview" width="250" style="display:block;width:100%;max-width:250px;height:auto;border:1px solid #dce1e8;border-radius:6px;" /></a></td>
<td width="50%" align="center" valign="top" style="padding:0 6px;"><a href="${TRAINING}" target="_blank" rel="noopener noreferrer"><img src="${APP}/guides/doc-b.jpg" alt="Quick Start" width="250" style="display:block;width:100%;max-width:250px;height:auto;border:1px solid #dce1e8;border-radius:6px;" /></a></td>
</tr></tbody></table>
<table style="border:1px solid #dce1e8;border-radius:6px;border-left:4px solid #09274c;width:100%;margin:22px 0 0;" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td class="property-box" style="padding:22px 24px;">
<p style="margin:0 0 12px;font-size:11px;color:#09274c;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;font-family:${FONT};">Ready for Live Leads?</p>
<p style="margin:0 0 14px;font-size:14px;color:#2c3e50;line-height:22px;font-family:${FONT};">Your account and training are at no cost. When you want exclusive leads sent only to you, your own 800 number, and a business email with done-for-you outreach templates, choose a package below.</p>
${BTN('View Partnership Packages', STAN, '#09274c')}
</td></tr></tbody></table>
${P(`<strong style="color:#09274c;">Missed part of the webcast?</strong> Here is the quick recap &mdash; and you can watch the full session anytime from your dashboard.`)}
<img src="${APP}/images/foreclosure-surplus-math.jpg" alt="Foreclosure surplus example: a 120,000 dollar average surplus at a 30 percent recovery fee is about 36,000 dollars per claim" width="520" style="display:block;width:520px;max-width:100%;height:auto;border-radius:8px;margin:8px 0;border:1px solid #dce1e8;" />
${BTN('Log In to Watch the Webcast', SIGNUP, '#09274c')}
${P(`Once you are logged in, click <strong style="color:#1a7a3a;">Live Webcast</strong> in your dashboard menu to watch the full session.`)}
<table style="background-color:#f0f7ff;border-radius:6px;border-left:4px solid #09274c;width:100%;margin:18px 0 0;" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding:20px 24px;text-align:center;">
<p style="margin:0 0 12px;font-size:15px;color:#09274c;font-weight:600;font-family:${FONT};">Questions? We are here to help.</p>
<p style="margin:0 0 16px;font-size:14px;color:#2c3e50;line-height:22px;font-family:${FONT};">Reply to this email or give us a call and we will walk you through everything.</p>
<a class="cta-btn" href="tel:+18885458007" style="display:inline-block;padding:14px 32px;background-color:#09274c;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;font-family:${FONT};">Call (888) 545-8007</a>
</td></tr></tbody></table>`,
    },
    1: {
      subject: `${fn}, have you added your phone yet?`,
      preheader: 'One quick step unlocks all your free training videos and the resources under each.',
      label: 'Follow-Up: Unlock Training',
      eyebrow: 'Quick Reminder',
      heading: 'One Step Away From Your Free<br />Training Videos',
      content: `
${P(`Hi ${fn},`)}
${P(`Your free account is ready, but your training is still locked behind one quick step: <strong style="color:#1a7a3a;">add your phone number in the My Account tab</strong>.`)}
${P(`The moment you do, every free training video opens up &mdash; along with the downloadable guides under each one so you can research the process and confirm you qualify to make claims.`)}
${BTN('▶&nbsp; Add Your Phone &amp; Unlock Training', `${APP}/dashboard/settings`, '#1a7a3a')}
${NOTE(`Add it once. No spam, no commitment &mdash; just full access to your free training.`)}
${P(`<strong style="color:#09274c;">Got interrupted or distracted during the webcast?</strong> No problem &mdash; here is the quick recap, and you can watch the full session anytime you have a few minutes.`)}
<img src="${APP}/images/foreclosure-surplus-math.jpg" alt="The foreclosure surplus math: $120,000 average surplus times a 30% recovery fee equals $36,000 per claim" width="520" style="display:block;width:520px;max-width:100%;height:auto;border-radius:8px;margin:0 0 8px;border:1px solid #dce1e8;" />
${BTN('▶&nbsp; Watch the Full Webcast', `${APP}/dashboard/live-webcast`, '#09274c')}`,
    },
    2: {
      subject: 'Inside the dashboard: where your training lives',
      preheader: 'After you add your phone, open Closing Training in the left menu.',
      label: 'Follow-Up: Your Training',
      eyebrow: 'Getting Started',
      heading: 'Where to Find Your Training<br />Once You Are In',
      content: `
${P(`${fn},`)}
${P(`Once your phone is on file, head to your dashboard and look at the <strong style="color:#09274c;">left-side menu</strong>. Click <strong style="color:#1a7a3a;">&ldquo;Closing Training&rdquo;</strong> &mdash; that is where every module lives.`)}
${P(`Watch the videos in order, and download the resource under each one. These guides walk you through how surplus recovery works, the paperwork, and how to confirm a claimant has proper standing.`)}
${BTN('▶&nbsp; Open My Dashboard', `${APP}/dashboard`, '#1a7a3a')}
${P(`Work through it at your own pace. It is built so you can decide if this is for you before you ever spend a dollar.`)}`,
    },
    3: {
      subject: `${fn}, this is what the work actually looks like`,
      preheader: 'Real recovered amounts from people who did the training and took action.',
      label: 'Follow-Up: Real Results',
      eyebrow: 'Real Numbers',
      heading: 'What This Looks Like for People<br />Who Took the First Step',
      content: `
${P(`${fn},`)}
${P(`A quick picture of what is possible once the training clicks:`)}
${P(`<strong style="color:#09274c;">Marcus</strong> &mdash; first deal, $14,200, eleven days from first contact to check. <br><strong style="color:#09274c;">Sandra</strong> &mdash; first quarter, three deals, $30K her share. <br><strong style="color:#09274c;">Derek</strong> &mdash; closed his first deal from his phone, $22K.`)}
${P(`Every one of them started exactly where you are: a free account and the training. If you have not added your phone yet to open your videos, now is the time.`)}
${BTN('▶&nbsp; Unlock My Free Training', `${APP}/dashboard/settings`, '#1a7a3a')}`,
    },
    4: {
      subject: 'Ready for leads that go to you only?',
      preheader: 'When you are ready: exclusive leads, your own 800 number, and business email.',
      label: 'Follow-Up: Go Live',
      eyebrow: 'When You Are Ready',
      heading: 'When You Are Ready, Here Is How<br />You Go Live',
      content: `
${P(`${fn},`)}
${P(`Your account and training are free for as long as you like. When you decide to start working real cases, here is what activating gets you:`)}
${P(`&bull; Exclusive surplus leads assigned <strong style="color:#1a7a3a;">only to you</strong> &mdash; never shared. <br>&bull; Your own business 800 number. <br>&bull; A business email with done-for-you outreach templates. <br>&bull; Certified letters mailed on your behalf.`)}
${BTN('💳&nbsp; View Packages &amp; Get Started', `${APP}/#pricing`, '#09274c')}
${NOTE(`Not ready yet? No problem &mdash; keep going through the free training. Your account does not expire.`, '#f0f7ff')}`,
    },
    5: {
      subject: 'An honest note from Corey',
      preheader: 'Your free account does not expire. We are here when you are ready.',
      label: 'Follow-Up: From Corey',
      eyebrow: 'A Personal Note',
      heading: 'Whenever You Are Ready,<br />We Are Here',
      content: `
${P(`${fn},`)}
${P(`This is the last note in this sequence &mdash; not because we are giving up on you, but because we respect your time and your inbox.`)}
${P(`Here is what we know: the leads are real, the process is legal, and the money is sitting in state records right now. Your free account does not expire, and your training is always there.`)}
${P(`If you have not opened your free training yet, add your phone in My Account and dive in. And when you want to talk through going live, just reach out.`)}
${BTN('▶&nbsp; Go to My Account', `${APP}/dashboard/settings`, '#1a7a3a')}
${P(`Text <strong>&ldquo;READY&rdquo;</strong> to (888) 545-8007 anytime and I will respond personally.`)}`,
    },
  }

  const s = steps[step] || steps[0]
  return {
    subject: s.subject,
    html: wrapEmail({ preheader: s.preheader, headerLabel: s.label, eyebrow: s.eyebrow, heading: s.heading, content: s.content, email: lead.email }),
  }
}

export const SMS_TEMPLATES: Record<number, string> = {
  0: `{first_name}, your free account on usforeclosureleads.com is ready! Watch the live webcast now, no login needed: https://usforeclosureleads.com/webcast/livefb - Foreclosure Recovery Inc. Reply STOP to opt out`,
  1: `{first_name}, log in anytime: your email + your phone number is the password. Your free training videos and guides are waiting. https://usforeclosureleads.com/sign-in?direct=1 Reply STOP to opt out`,
  2: `{first_name}, once you're in, click "Closing Training" in the left menu for all your free modules and downloadable resources. Login = your email + your phone number. https://usforeclosureleads.com/sign-in?direct=1 Reply STOP to opt out`,
  3: `{first_name}, real results from agents who did the training: $14K, $22K, $30K first deals. Log in with your email + your phone number: https://usforeclosureleads.com/sign-in?direct=1 Reply STOP to opt out`,
  4: `{first_name}, ready for leads that go to you only + your own 800# and business email? See packages: https://usforeclosureleads.com/#pricing Reply STOP to opt out`,
  5: `Last text {first_name}. Your free account + training don't expire. Text READY anytime to talk about going live. - Foreclosure Recovery Inc. Reply STOP to opt out`,
}
