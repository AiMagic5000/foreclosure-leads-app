import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveOperatorConfig, isCommsAuthorized } from "@/lib/operator-config"

const TEXTBEE_BASE_URL = "https://api.textbee.dev/api/v1/gateway/devices"
const SMS_GATEWAY_SEND_PATH = "/api/v1/send"

function buildSmsMessage(lead: Record<string, unknown>, config: { displayName: string; companyName: string; phoneDisplay: string; extension: string | null; websiteUrl: string }): string {
  const ownerName = String(lead.owner_name || "")
  const firstName = ownerName.split(" ")[0] || "Homeowner"
  const propertyAddress = String(lead.property_address || lead.mailing_address || "your property")
  const state = String(lead.state || lead.state_abbr || "state")
  // Don't append extension if phoneDisplay already contains it
  const ext = (config.extension && !config.phoneDisplay.includes("ext")) ? ` ext. ${config.extension}` : ""

  return `${firstName}, this is ${config.displayName} from ${config.companyName}. Our forensic audit has identified funds that are owed to you from the foreclosure of your property at ${propertyAddress}. Check your email for full details. To claim these funds, please call ${config.displayName} at ${config.phoneDisplay}${ext} or reply to this message. Time is limited under ${state} law. https://${config.websiteUrl}/`
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return "+1" + digits
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits
  return "+" + digits
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    if (!userEmail || !(await isCommsAuthorized(userEmail))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { leadId, action, customMessage, operatorPinId } = body

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const phone = lead.primary_phone
    if (!phone) {
      return NextResponse.json({ error: "Lead has no phone number" }, { status: 400 })
    }

    // Block all contact if on DNC
    if (lead.on_dnc) {
      return NextResponse.json({ error: "This lead is on the Do Not Call list. SMS blocked." }, { status: 403 })
    }

    // Resolve operator config from DB (handles admin view-as, email lookup, lead assignment fallback)
    const config = await resolveOperatorConfig({
      clerkEmail: userEmail,
      operatorPinId: operatorPinId || null,
      leadId,
    })

    // Guard: never send SMS with admin info for non-admin users
    const ADMIN_EMAIL_LOWER = "coreypearsonemail@gmail.com"
    if (!config.pinId && userEmail?.toLowerCase() !== ADMIN_EMAIL_LOWER) {
      console.error("[send-sms] Blocked: non-admin user resolved to admin defaults", { userEmail, operatorPinId, leadId })
      return NextResponse.json(
        { error: "Could not resolve your agent profile. Please refresh the page and try again." },
        { status: 422 }
      )
    }

    const message = customMessage || buildSmsMessage(lead, config)

    // Preview mode
    if (action === "preview") {
      return NextResponse.json({
        success: true,
        phone,
        message,
        charCount: message.length,
        segments: Math.ceil(message.length / 160),
      })
    }

    // Send mode
    if (action === "send") {
      let result: Record<string, unknown>

      if (config.smsGatewayType === "textbee") {
        // TextBee gateway (per-operator config, e.g. amariyon)
        const textbeeUrl = `${TEXTBEE_BASE_URL}/${config.textbeeDeviceId}/send-sms`
        const res = await fetch(textbeeUrl, {
          method: "POST",
          headers: {
            "x-api-key": config.textbeeApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipients: [formatPhone(phone)],
            message,
          }),
        })

        if (!res.ok) {
          const errText = await res.text()
          return NextResponse.json({ error: `SMS send failed (TextBee): ${errText}` }, { status: 500 })
        }

        result = await res.json()
      } else {
        // Default: self-hosted SMS gateway (sms.alwaysencrypted.com)
        const gatewayUrl = `${config.smsGatewayUrl}${SMS_GATEWAY_SEND_PATH}`
        const res = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "X-API-Key": config.smsApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: formatPhone(phone),
            message,
          }),
        })

        if (!res.ok) {
          const errText = await res.text()
          return NextResponse.json({ error: `SMS send failed: ${errText}` }, { status: 500 })
        }

        result = await res.json()
      }

      await supabaseAdmin
        .from("foreclosure_leads")
        .update({
          sms_sent: true,
          sms_sent_at: new Date().toISOString(),
        })
        .eq("id", leadId)

      return NextResponse.json({
        success: true,
        message: `SMS sent to ${phone}`,
        ...result,
      })
    }

    return NextResponse.json({ error: "Invalid action. Use 'preview' or 'send'" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
