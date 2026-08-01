import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveOperatorConfig, isCommsAuthorized } from "@/lib/operator-config"
import { isRequestAdmin } from "@/lib/admin-guard"
import { getAgentSocialLink } from "@/lib/social-link"
import { leadTypeCopy } from "@/lib/surplus/lead-type-copy"
import { createSigningLink, signUrlFromSlug, type DocusealMergeValues } from "@/lib/docuseal"
import { resolveCallerEmails } from "@/lib/caller-identity"

const TEXTBEE_BASE_URL = "https://api.textbee.dev/api/v1/gateway/devices"
const SMS_GATEWAY_SEND_PATH = "/api/v1/send"

function buildSmsMessage(lead: Record<string, unknown>, config: { displayName: string; companyName: string; phoneDisplay: string; extension: string | null; websiteUrl: string }): string {
  const ownerName = String(lead.owner_name || "")
  const firstName = ownerName.split(" ")[0] || "Homeowner"
  const propertyAddress = String(lead.property_address || lead.mailing_address || "your property")
  const state = String(lead.state || lead.state_abbr || "state")
  // Don't append extension if phoneDisplay already contains it
  const ext = (config.extension && !config.phoneDisplay.includes("ext")) ? ` ext. ${config.extension}` : ""
  const copy = leadTypeCopy(lead.lead_type as string | undefined, lead.foreclosure_type as string | undefined)

  return `${firstName}, this is ${config.displayName} from ${config.companyName}. Our forensic audit has identified funds that are owed to you from ${copy.smsSaleRef} at ${propertyAddress}. Check your email for full details. To claim these funds, please call ${config.displayName} at ${config.phoneDisplay}${ext} or reply to this message. Time is limited under ${state} law. https://${config.websiteUrl}/`
}

// Spanish text for Spanish-speaking claimants. The email path has had an ES option for a
// while; the text step did not, which left agents stuck when a claimant does not read
// English. Same content and the same claims as the English version.
function buildSmsMessageES(lead: Record<string, unknown>, config: { displayName: string; companyName: string; phoneDisplay: string; extension: string | null; websiteUrl: string }): string {
  const ownerName = String(lead.owner_name || "")
  const firstName = ownerName.split(" ")[0] || "Propietario"
  const propertyAddress = String(lead.property_address || lead.mailing_address || "su propiedad")
  const state = String(lead.state || lead.state_abbr || "su estado")
  const ext = (config.extension && !config.phoneDisplay.includes("ext")) ? ` ext. ${config.extension}` : ""
  return `${firstName}, le habla ${config.displayName} de ${config.companyName}. Nuestra auditoria identifico fondos que le corresponden de la venta de ${propertyAddress}. Revise su correo electronico para los detalles. Para reclamar estos fondos, llame a ${config.displayName} al ${config.phoneDisplay}${ext} o responda a este mensaje. El tiempo es limitado segun la ley de ${state}. https://${config.websiteUrl}/`
}

function buildMeetAgentSms(lead: Record<string, unknown>, config: { displayName: string; companyName: string; phoneDisplay: string; meetAgentUrl: string }): string {
  const firstName = String(lead.owner_name || "").split(" ")[0] || "Homeowner"
  return `${firstName}, this is ${config.displayName} from ${config.companyName}. I recorded a short video about the funds owed to you from your foreclosure and how we help you claim them. Watch it here: ${config.meetAgentUrl} -- Questions? Call me at ${config.phoneDisplay}.`
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

    // ALL addresses: Clerk's [0] is not necessarily the one that owns the pin.
    const callerEmails = resolveCallerEmails(user)
    const userEmail = callerEmails[0]
    if (!userEmail || !(await isCommsAuthorized(callerEmails))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { leadId, action, customMessage, operatorPinId, variant, includeSignLink, lang } = body

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
    const requesterIsAdmin = await isRequestAdmin()
    const config = await resolveOperatorConfig({
      requesterIsAdmin,
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

    const baseMessage = customMessage
      || (variant === "meet_agent"
        ? buildMeetAgentSms(lead, config)
        : (String(lang || "").toLowerCase() === "es"
          ? buildSmsMessageES(lead, config)
          : buildSmsMessage(lead, config)))

    // Agreement e-sign link for texting. Reuses the SAME DocuSeal link the email
    // sent (slug stored on the lead); creates one on the fly if the claimant has an
    // none exists yet — including phone-only claimants, who sign from the texted
    // link. Graceful — no link, no problem, the text still goes.
    // Agent can suppress it per-claimant with includeSignLink:false.
    let signLink: string | null = null
    if (includeSignLink !== false) {
      try {
        const existingSlug = String(lead.agreement_docuseal_id || "")
        if (existingSlug) {
          signLink = signUrlFromSlug(existingSlug)
        } else {
          const values = {
            CLAIMANT_NAME: String(lead.owner_name || ""),
            CLAIMANT_ADDRESS: String(lead.mailing_address || lead.property_address || ""),
            CLAIMANT_PHONE: String(lead.primary_phone || ""),
            PROPERTY_ADDRESS: String(lead.property_address || lead.mailing_address || ""),
            PROPERTY_STATE: String(lead.state || lead.state_abbr || ""),
            SALE_DATE: String(lead.sale_date || ""),
            ESTIMATED_SURPLUS: String(lead.overage_amount || ""),
            FEE_PCT: "30",
            VENUE_COUNTY: String(lead.county || ""),
          } as DocusealMergeValues
          const created = await createSigningLink(String(leadId), String(lead.primary_email || ""),
                                                  String(lead.owner_name || ""), values)
          if (created) {
            signLink = created.url
            await supabaseAdmin.from("foreclosure_leads")
              .update({ agreement_docuseal_id: created.slug }).eq("id", leadId)
          }
        }
      } catch { /* never block the text on e-sign */ }
    }

    // Auto-append the agent's consented social link (proof of a real person) when enabled.
    const socialLink = await getAgentSocialLink(userEmail)
    let message = socialLink ? `${baseMessage}\n\nThat's really me — connect with me: ${socialLink}` : baseMessage
    // Only append if the agent hasn't already pasted the link into their custom text.
    if (signLink && !message.includes(signLink)) {
      message = `${message}\n\nReview & sign your agreement here: ${signLink}`
    }

    // Preview mode
    if (action === "preview") {
      return NextResponse.json({
        success: true,
        phone,
        message,
        charCount: message.length,
        segments: Math.ceil(message.length / 160),
        signLink,
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
      // First outreach moves a workable lead to "contacted" (never clobbers dead/converted/etc.)
      await supabaseAdmin.from("foreclosure_leads").update({ status: "contacted" }).eq("id", leadId).in("status", ["new", "skip_traced"])

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
