import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ""
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || ""
const SLYBROADCAST_EMAIL = process.env.SLYBROADCAST_EMAIL || ""
const SLYBROADCAST_PASSWORD = process.env.SLYBROADCAST_PASSWORD || ""
const CALLBACK_NUMBER = process.env.CALLBACK_NUMBER || "8005551234"

const VOICE_SCRIPT_TEMPLATE = `This voice message is specifically for {owner_name}, or any family members, to let {first_name} know:

We are obligated to inform you that the property at {property_address}, APN number {apn_number}, is more than likely going to close out with overages associated with the principal that will be owed to you after the foreclosure sale.

We want to make sure that when the funds are distributed, they are sent to the correct address. We need your current forwarding address in order to send the check.

Please contact us at {callback_number} to update your forwarding address, so the funds that are collected after the bank has been made whole from the foreclosure sale can be distributed to you in a timely manner.

Thank you.`

function generateScript(lead: Record<string, unknown>): string {
  const ownerName = String(lead.owner_name || "Homeowner")
  const firstName = ownerName.split(" ")[0] || "Homeowner"
  const propertyAddress = String(lead.property_address || "your property")
  const apnNumber = String(lead.apn_number || lead.parcel_id || "your property")

  return VOICE_SCRIPT_TEMPLATE
    .replace(/{owner_name}/g, ownerName)
    .replace(/{first_name}/g, firstName)
    .replace(/{property_address}/g, propertyAddress)
    .replace(/{apn_number}/g, apnNumber)
    .replace(/{callback_number}/g, CALLBACK_NUMBER)
}

async function generateAudio(script: string): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        output_format: "mp3_44100_128",
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function sendSlyBroadcast(
  phoneNumber: string,
  audioBase64: string
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const formData = new URLSearchParams()
  formData.append("c_uid", SLYBROADCAST_EMAIL)
  formData.append("c_password", SLYBROADCAST_PASSWORD)
  formData.append("c_option", "text_to_audio")
  formData.append("c_phone", phoneNumber)
  formData.append("c_audio", audioBase64)
  formData.append("c_callerID", CALLBACK_NUMBER)
  formData.append("c_date", "now")
  formData.append("c_audio_type", "mp3")

  const response = await fetch("https://www.mobile-sphere.com/gateway/vmb.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  })

  const text = await response.text()

  if (text.includes("OK") || text.includes("success")) {
    const campaignMatch = text.match(/campaign_id[=:]?\s*(\w+)/i)
    return { success: true, campaignId: campaignMatch?.[1] || "unknown" }
  }

  return { success: false, error: text }
}

function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) return digits
  if (digits.length === 10) return `1${digits}`
  return digits
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
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    // Fetch lead from DB
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (!lead.primary_phone) {
      return NextResponse.json({ error: "Lead has no phone number" }, { status: 400 })
    }

    if (!lead.can_contact || lead.on_dnc) {
      return NextResponse.json({ error: "Lead is on DNC list or not cleared" }, { status: 400 })
    }

    if (lead.voicemail_sent) {
      return NextResponse.json({ error: "Voicemail already sent to this lead" }, { status: 400 })
    }

    // Generate personalized script
    const script = generateScript(lead)

    // Generate audio via ElevenLabs
    const audioBuffer = await generateAudio(script)
    const audioBase64 = audioBuffer.toString("base64")

    // Send via SlyBroadcast
    const cleanPhone = cleanPhoneNumber(lead.primary_phone)
    const result = await sendSlyBroadcast(cleanPhone, audioBase64)

    if (!result.success) {
      // Record the error
      await supabaseAdmin
        .from("foreclosure_leads")
        .update({
          voicemail_script: script,
          voicemail_error: result.error || "SlyBroadcast delivery failed",
        })
        .eq("id", leadId)

      return NextResponse.json({ error: result.error || "Voice drop delivery failed" }, { status: 500 })
    }

    // Update lead record with success
    await supabaseAdmin
      .from("foreclosure_leads")
      .update({
        voicemail_sent: true,
        voicemail_sent_at: new Date().toISOString(),
        voicemail_delivery_id: result.campaignId || null,
        voicemail_script: script,
        voicemail_error: null,
      })
      .eq("id", leadId)

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      phone: cleanPhone,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
