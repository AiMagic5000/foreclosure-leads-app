import { supabaseAdmin } from "@/lib/supabase"
import { sendEmail } from "@/lib/email"

// Official USFL branded email shell. Body paragraphs should be styled inline.
export function renderUsflEmail(greeting: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body>
<div style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"><center style="width:100%;background-color:#f4f5f7;">
<div style="max-width:600px;margin:0 auto;">
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#ffffff;padding:28px 40px 20px;">
<table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
<td align="left" valign="middle"><img style="display:block;max-width:200px;height:auto;border:0;" src="https://usforeclosureleads.com/us-foreclosure-leads-logo.png" alt="US Foreclosure Leads" /></td>
<td align="right" valign="middle"><p style="margin:0;font-size:12px;color:#7a8a9e;line-height:18px;">Foreclosure Recovery Inc.<br /><span style="color:#09274c;font-weight:600;">Asset Recovery Specialists</span></p></td>
</tr></tbody></table>
</td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#ffffff;padding:0 40px;"><div style="border-top:1px solid #e2e6eb;font-size:0;line-height:0;">&nbsp;</div></td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#ffffff;padding:24px 40px 8px;">
<p style="margin:0 0 18px;font-size:16px;color:#09274c;font-weight:bold;line-height:24px;font-family:arial,helvetica,sans-serif;">${greeting}</p>
${bodyHtml}
</td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#ffffff;padding:8px 40px 0;">
<table style="background-color:#f0f7ff;border-radius:6px;border-left:4px solid #09274c;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding:20px 24px;text-align:center;">
<p style="margin:0 0 10px;font-size:15px;color:#09274c;font-weight:600;">Need Help? We Are Here For You</p>
<p style="margin:0 0 14px;font-size:14px;color:#2c3e50;line-height:22px;">Our team is available to answer any questions. Reach out anytime.</p>
<p style="margin:0 0 6px;font-size:14px;"><a style="color:#09274c;font-weight:600;text-decoration:none;" href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a></p>
<a style="display:inline-block;padding:12px 28px;background-color:#09274c;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;text-align:center;" href="tel:+18885458007">(888) 545-8007</a>
</td></tr></tbody></table>
</td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#ffffff;padding:28px 40px 12px;">
<table style="border-top:1px solid #e2e6eb;width:100%;" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding-top:20px;">
<p style="margin:0 0 2px;font-size:15px;color:#09274c;font-weight:bold;">The US Foreclosure Leads Team</p>
<p style="margin:0 0 2px;font-size:13px;color:#5a6d82;">Foreclosure Recovery Inc.</p>
<p style="margin:8px 0 0;font-size:13px;"><a style="color:#09274c;text-decoration:none;" href="tel:+18885458007">(888) 545-8007</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color:#09274c;text-decoration:none;" href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a></p>
</td></tr></tbody></table>
</td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#ffffff;padding:0 40px;"><div style="border-top:2px solid #1a7a3a;width:60px;font-size:0;line-height:0;">&nbsp;</div></td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#ffffff;padding:20px 40px 30px;">
<p style="margin:0 0 10px;font-size:11px;color:#8a96a5;line-height:17px;">Foreclosure Recovery Inc. -- 30 N Gould St, Ste R -- Sheridan, WY 82801</p>
<p style="margin:0;font-size:11px;color:#8a96a5;line-height:17px;">&copy; 2026 Foreclosure Recovery Inc. All rights reserved.&nbsp;&nbsp;<a style="color:#7a8a9e;text-decoration:underline;" href="https://usforeclosureleads.com/privacy">Privacy Policy</a>&nbsp;&nbsp;<a style="color:#7a8a9e;text-decoration:underline;" href="https://usforeclosureleads.com/terms">Terms</a></p>
</td></tr></tbody></table>
<table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td style="background-color:#09274c;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>
</div></center></div></body></html>`
}

const BODY_P = "margin:0 0 16px;font-size:10pt;font-family:arial,helvetica,sans-serif;color:#2c3e50;line-height:22px;"
const p = (t: string) => `<p style="${BODY_P}">${t}</p>`

async function firstNameFor(email: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin.from("user_pins").select("display_name").ilike("email", email).eq("is_active", true)
    const name = (data || []).map((r) => r.display_name).find(Boolean) as string | undefined
    if (name) return name.trim().split(/\s+/)[0]
  } catch { /* ignore */ }
  return "there"
}

// Sent when an agent connects their SlyBroadcast account.
export async function sendVoiceUploadRequestEmail(toEmail: string): Promise<void> {
  try {
    const greeting = `Hi ${await firstNameFor(toEmail)},`
    const body =
      p(`Good news &mdash; your <strong style="color:#09274c;">SlyBroadcast account is connected</strong> and your phone number is verified, so your voice drops are ready to run on your own SlyBroadcast account.`) +
      p(`One step left to make them fully personalized: please upload a <strong style="color:#09274c;">short voice recording of yourself</strong> (30&ndash;60 seconds, just speak naturally). As soon as you do, we automatically clone your voice so every voice drop sent to a claimant goes out in <strong style="color:#09274c;">your own voice</strong> &mdash; customized with their name, property, and details.`) +
      p(`To send it: log in to your dashboard and use the voice-recording upload (the same place you connected SlyBroadcast), or simply reply to this email with a voice memo.`)
    await sendEmail(toEmail, "Your SlyBroadcast is connected - one step left to personalize your voice drops", renderUsflEmail(greeting, body))
  } catch { /* never throw from automation */ }
}

// Sent after we successfully clone an agent's uploaded voice.
export async function sendVoiceClonedEmail(toEmail: string): Promise<void> {
  try {
    const greeting = `Hi ${await firstNameFor(toEmail)},`
    const body =
      p(`Great news &mdash; we received your voice recording and <strong style="color:#09274c;">your voice has been cloned successfully</strong>.`) +
      p(`Your voice drops are now <strong style="color:#09274c;">fully personalized</strong>: every drop sent to a claimant will go out in your own voice, customized with their name and property details.`) +
      p(`Nothing else to do &mdash; you're all set. Just send your voice drops as usual from your dashboard.`)
    await sendEmail(toEmail, "Your voice is cloned - your voice drops are now personalized", renderUsflEmail(greeting, body))
  } catch { /* never throw from automation */ }
}

// Auto-clone an uploaded sample into ElevenLabs and store the voice id on the pin.
// Returns the new voice id, or null on failure (caller should not fail the upload).
export async function autoCloneAgentVoice(
  pinId: string,
  sample: Buffer,
  filename: string,
  displayName?: string
): Promise<string | null> {
  const KEY = process.env.ELEVENLABS_API_KEY
  if (!KEY) return null
  try {
    const fd = new FormData()
    fd.append("name", (displayName || `Agent ${pinId.slice(0, 8)}`).slice(0, 100))
    fd.append("description", "USFR agent voice - auto-cloned from dashboard upload")
    fd.append("remove_background_noise", "true")
    fd.append("files", new Blob([new Uint8Array(sample)], { type: "audio/mpeg" }), filename || "sample.mp3")
    const r = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": KEY },
      body: fd,
    })
    if (!r.ok) {
      console.error("[voice-clone] ElevenLabs add failed:", r.status, (await r.text()).slice(0, 200))
      return null
    }
    const data = (await r.json()) as { voice_id?: string }
    const voiceId = data?.voice_id
    if (!voiceId) return null
    // Set the clone on ALL active pins for this agent's email so whichever resolves uses it.
    const { data: pin } = await supabaseAdmin.from("user_pins").select("email").eq("id", pinId).single()
    if (pin?.email) {
      await supabaseAdmin.from("user_pins").update({ voice_id: voiceId }).ilike("email", pin.email).eq("is_active", true)
    } else {
      await supabaseAdmin.from("user_pins").update({ voice_id: voiceId }).eq("id", pinId)
    }
    return voiceId
  } catch (err) {
    console.error("[voice-clone] error:", err instanceof Error ? err.message : String(err))
    return null
  }
}
