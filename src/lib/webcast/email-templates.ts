interface LeadData {
  first_name: string
  email: string
  session_time?: string
  countdown_minutes?: number
}

function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
body{margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif}
.container{max-width:600px;margin:0 auto;background:#fff;padding:32px 24px}
.header{background:#09274c;padding:24px;text-align:center;color:#fff}
.header h1{margin:0;font-size:22px;color:#d4a84b}
.cta-btn{display:inline-block;background:#d4a84b;color:#09274c;padding:14px 32px;text-decoration:none;font-weight:700;border-radius:6px;margin:16px 0}
.footer{text-align:center;font-size:12px;color:#999;padding:20px 24px}
.footer a{color:#999}
h2{color:#09274c;margin-top:0}
</style></head><body>
<div class="header"><h1>Foreclosure Recovery Inc.</h1></div>
<div class="container">${content}</div>
<div class="footer">
<p>Foreclosure Recovery Inc. | (888) 545-8007</p>
<p><a href="https://usforeclosureleads.com/unsubscribe?email={{EMAIL}}">Unsubscribe</a></p>
</div></body></html>`
}

export function getEmailTemplate(step: number, lead: LeadData): { subject: string; html: string } {
  const templates: Record<number, { subject: string; body: string }> = {
    0: {
      subject: 'Your seat is confirmed -- webcast starting soon',
      body: `<h2>${lead.first_name}, you're in.</h2>
<p>You're confirmed for the <strong>${lead.session_time || 'next available'}</strong> session.</p>
<p>In this webcast, you will see exactly how surplus fund recovery works -- real deals, real numbers, and the fastest path from zero to your first check.</p>
<p>A preview account on usforeclosureleads.com was created so you can explore the dashboard after the session. Full leads access unlocks when you enroll in the Asset Recovery Agent Partnership.</p>
<p>Pay attention to the partnership offer at the end -- it is the shortcut most people are looking for.</p>
<p>See you in ${lead.countdown_minutes || 30} minutes.</p>
<p>-- Corey<br>Foreclosure Recovery Inc.<br>(888) 545-8007</p>`,
    },
    1: {
      subject: `${lead.first_name}, did you see the $47K deal example?`,
      body: `<h2>Quick check-in after the webcast...</h2>
<p>The deal walked through -- $47,400 surplus fund, one property, one claimant, one week of follow-up work.</p>
<p>That is what is sitting in state records right now in your area.</p>
<p>Your preview account is active so you can explore the dashboard and see how the system works. When you are ready to access live leads and outreach automations, the Asset Recovery Agent Partnership is the path.</p>
<a href="https://usforeclosureleads.com/webcast" class="cta-btn">ENROLL IN THE PARTNERSHIP</a>
<p>Partnership agents get 50 exclusive leads per week assigned directly to their account, certified letters mailed on their behalf, and full outreach automation.</p>`,
    },
    2: {
      subject: 'The #1 mistake new surplus fund agents make (avoid this)',
      body: `<h2>${lead.first_name},</h2>
<p>The most common mistake: waiting until you feel "ready."</p>
<p>Surplus fund leads expire. Property owners get found by someone else. State records are public -- your competition is real.</p>
<p>Here is the fastest path from where you are now to your first deal:</p>
<ol>
<li>Enroll in the Asset Recovery Agent Partnership ($995 total -- pay in full, three monthly payments, or in-house financing)</li>
<li>Get 50 exclusive leads per week assigned directly to your account</li>
<li>Use the built-in outreach automation to contact homeowners (certified letters go out on your behalf too)</li>
</ol>
<p>The system handles the follow-up. You just approve and send. That is the job.</p>
<a href="https://usforeclosureleads.com/webcast" class="cta-btn">ENROLL NOW</a>`,
    },
    3: {
      subject: 'REAL numbers from real people doing this',
      body: `<h2>${lead.first_name},</h2>
<p>Marcus came to us unemployed. First deal: $14,200. Took 11 days from first contact to check.</p>
<p>Sandra was working two jobs, could not make rent. First quarter: 3 deals, $61K gross, $30K her share.</p>
<p>Derek lost his job in the automotive layoffs. He closed his first deal from his phone in the parking lot of his old employer. $22K.</p>
<p>These are not exceptions. These are the people who did not wait.</p>
<p>Every one of them enrolled in the partnership. We provided the leads, the system, and the training. They brought the drive.</p>
<p>We only accept a limited number of new agents per week.</p>
<a href="https://usforeclosureleads.com/webcast" class="cta-btn">ENROLL IN THE PARTNERSHIP</a>`,
    },
    4: {
      subject: 'What happens to the leads nobody claims?',
      body: `<h2>${lead.first_name},</h2>
<p>When a surplus fund lead expires unclaimed -- that money goes back to the government.</p>
<p><strong>Forever.</strong></p>
<p>The homeowner loses it. You lose the commission. The government keeps it.</p>
<p>It happens thousands of times a month across every state.</p>
<p>Our partnership agents do not let that happen. They get 50 exclusive leads per week assigned to their account, the outreach system runs automatically, and they work the files that respond.</p>
<p>One enrollment. One conversation with Corey. That is the starting line.</p>
<a href="https://usforeclosureleads.com/webcast" class="cta-btn">ENROLL IN THE PARTNERSHIP</a>
<p>P.S. -- We still have partnership spots available this week. If you want Corey in your corner personally, this is the moment.</p>`,
    },
    5: {
      subject: 'Last email (and an honest message from Corey)',
      body: `<h2>${lead.first_name},</h2>
<p>This is the last email in this sequence.</p>
<p>Not because we are giving up on you -- because we respect your inbox and your time.</p>
<p>If you have not moved yet, we get it. New things take trust. Trust takes time.</p>
<p>Here is what we know:</p>
<p>The leads are real. The process is legal. The money exists. It is sitting in state records right now.</p>
<p>Your preview account does not expire. We will be here when you are ready.</p>
<p>And if you want to move fast -- the Asset Recovery Agent Partnership is the path. $995 total. Three ways to pay. Money Back Guarantee.</p>
<p>Text "READY" to (888) 545-8007 and Corey will respond personally.</p>
<p>-- Corey<br>Founder, Foreclosure Recovery Inc.</p>`,
    },
  }

  const template = templates[step] || templates[0]
  return {
    subject: template.subject,
    html: wrapEmail(template.body.replace('{{EMAIL}}', lead.email)),
  }
}

export const SMS_TEMPLATES: Record<number, string> = {
  0: `{first_name}, your webcast starts at {session_time}! A preview account is being set up for you now. Check your email for details. - Corey @ Foreclosure Recovery Inc. Reply STOP to opt out`,
  1: `5 MINUTES! Your webcast starts soon. Pay attention to the partnership offer at the end -- it is the fastest way to get started with live leads. Reply STOP to opt out`,
  2: `{first_name} - hope the webcast opened your eyes! Ready to access live leads? Apply for the partnership program: https://usforeclosureleads.com/webcast Questions? Reply to this text. Reply STOP to opt out`,
  3: `Quick Q {first_name} - Have you enrolled in the Asset Recovery Agent Partnership yet? 50 exclusive leads/week + full outreach automation + certified letters mailed for you. $995 total, 3 ways to pay. Enroll: https://usforeclosureleads.com/webcast Reply STOP to opt out`,
  4: `{first_name}, the partnership offer - we still have 1-2 spots this week. We provide the leads, certified mail, automation, and training. You work the files, keep 50/50 of the recovery fee. Interested? Reply YES. Reply STOP to opt out`,
  5: `Last SMS from us {first_name}. Your preview account is still active. Text READY anytime you want to discuss the partnership. This opportunity does not go away -- only leads do. - Foreclosure Recovery Inc. Reply STOP to opt out`,
}
