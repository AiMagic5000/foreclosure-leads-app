import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"

const ADMIN_DEFAULTS = {
  display_name: "Corey Pearson",
  title: "Director",
  extension: null as string | null,
  phone_display: "(888) 545-8007",
  phone_href: "tel:+18885458007",
  company_name: "Foreclosure Recovery Inc.",
  company_address: "Foreclosure Recovery Inc. - 30 N Gould St, Ste R - Sheridan, WY 82801",
  sender_email: "claim@usforeclosurerecovery.com",
  imap_password: process.env.IMAP_CLAIM_PASSWORD || "Thepassword#1234",
  sms_gateway_type: "alwaysencrypted" as const,
  sms_gateway_url: process.env.SMS_GATEWAY_URL || "https://sms.alwaysencrypted.com",
  sms_api_key: process.env.SMS_GATEWAY_API_KEY || "sms_gw_ak_7f3a9c2e1b4d8f6a0c5e3b7d9f2a4c6e8b0d3f5a7c9e1b4d",
  slybroadcast_email: process.env.SLYBROADCAST_EMAIL || "coreypearsonemail@gmail.com",
  slybroadcast_password: process.env.SLYBROADCAST_PASSWORD || "Slypassword#1",
  sly_callback_number: "8885458007",
  voice_id: "moss_audio_c0bbc114-1f24-11f1-83c7-3e0d56c699a9",
  website_url: "usforeclosurerecovery.com",
  logo_url: "https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png",
  privacy_policy_url: "https://usforeclosurerecovery.com/privacy-policy",
}

export interface OperatorConfig {
  pinId: string
  email: string
  displayName: string
  title: string
  extension: string | null
  phoneDisplay: string
  phoneHref: string
  companyName: string
  companyAddress: string
  senderEmail: string
  imapPassword: string
  smsGatewayType: "alwaysencrypted" | "textbee"
  smsGatewayUrl: string
  smsApiKey: string
  textbeeApiKey: string
  textbeeDeviceId: string
  slybroadcastEmail: string
  slybroadcastPassword: string
  slyCallbackNumber: string
  voiceId: string
  websiteUrl: string
  logoUrl: string
  privacyPolicyUrl: string
  packageType: string
  role: string
}

export interface AgentProfile {
  name: string
  title: string
  extension: string | null
  phoneDisplay: string
  phoneHref: string
  companyName: string
  logoUrl: string
  logoAlt: string
  websiteUrl: string
  websiteDisplay: string
  claimPageUrl: string
  companyAddress: string
  privacyPolicyUrl: string
  introEN: string
  introES: string
  signatureTitleEN: string
  signatureTitleES: string
  onBehalfEN: string
  onBehalfES: string
  byPhoneEN: string
  byPhoneES: string
}

/**
 * Resolves operator config from DB. Single source of truth for all comms.
 *
 * Resolution order:
 * 1. operatorPinId (admin view-as-user or explicit)
 * 2. Clerk email lookup in user_pins
 * 3. Lead assignment lookup (who owns this lead?)
 * 4. Admin defaults
 *
 * NULL DB fields inherit from admin defaults.
 */
export async function resolveOperatorConfig(opts: {
  clerkEmail: string | null
  operatorPinId?: string | null
  leadId?: string | null
}): Promise<OperatorConfig> {
  const { clerkEmail, operatorPinId, leadId } = opts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pinRow: Record<string, any> | null = null
  let resolvedVia = "admin_defaults"

  // Step 1: Direct pin ID lookup (most reliable -- sent from frontend)
  if (operatorPinId) {
    const { data, error } = await supabaseAdmin
      .from("user_pins")
      .select("*")
      .eq("id", operatorPinId)
      .eq("is_active", true)
      .single()
    if (error) {
      console.error("[resolveOperatorConfig] Step 1 failed (pinId lookup):", { operatorPinId, error: error.message })
    }
    if (data) {
      pinRow = data
      resolvedVia = `pin_id:${operatorPinId}`
    }
  }

  // Step 2: Clerk email lookup in user_pins
  if (!pinRow && clerkEmail) {
    const { data, error } = await supabaseAdmin
      .from("user_pins")
      .select("*")
      .ilike("email", clerkEmail)
      .eq("is_active", true)
      .single()
    if (error) {
      console.error("[resolveOperatorConfig] Step 2 failed (email lookup):", { clerkEmail, error: error.message })
    }
    if (data) {
      pinRow = data
      resolvedVia = `clerk_email:${clerkEmail}`
    }
  }

  // Step 3: Lead assignment lookup (who owns this lead?)
  if (!pinRow && leadId) {
    const { data: assignment, error: assignErr } = await supabaseAdmin
      .from("operator_lead_assignments")
      .select("operator_pin_id")
      .eq("lead_id", leadId)
      .single()
    if (assignErr) {
      console.error("[resolveOperatorConfig] Step 3a failed (assignment lookup):", { leadId, error: assignErr.message })
    }
    if (assignment?.operator_pin_id) {
      const { data, error } = await supabaseAdmin
        .from("user_pins")
        .select("*")
        .eq("id", assignment.operator_pin_id)
        .eq("is_active", true)
        .single()
      if (error) {
        console.error("[resolveOperatorConfig] Step 3b failed (pin from assignment):", { pinId: assignment.operator_pin_id, error: error.message })
      }
      if (data) {
        pinRow = data
        resolvedVia = `lead_assignment:${leadId}`
      }
    }
  }

  // Guard: if non-admin user resolved to admin defaults, that's a bug -- log it loudly
  const isAdminUser = clerkEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  if (!pinRow && !isAdminUser) {
    console.error("[resolveOperatorConfig] CRITICAL: Non-admin user fell through to admin defaults!", {
      clerkEmail,
      operatorPinId,
      leadId,
      resolvedVia,
    })
  } else {
    console.log("[resolveOperatorConfig] Resolved:", {
      resolvedVia,
      displayName: pinRow?.display_name || "ADMIN_DEFAULT",
      senderEmail: pinRow?.sender_email || "ADMIN_DEFAULT",
      pinId: pinRow?.id || "none",
    })
  }

  const r = pinRow || {}
  return {
    pinId: String(r.id || ""),
    email: String(r.email || clerkEmail || ""),
    displayName: String(r.display_name || ADMIN_DEFAULTS.display_name),
    title: String(r.title || ADMIN_DEFAULTS.title),
    extension: r.extension ? String(r.extension) : ADMIN_DEFAULTS.extension,
    phoneDisplay: String(r.phone_display || ADMIN_DEFAULTS.phone_display),
    phoneHref: String(r.phone_href || ADMIN_DEFAULTS.phone_href),
    companyName: String(r.company_name || ADMIN_DEFAULTS.company_name),
    companyAddress: String(r.company_address || ADMIN_DEFAULTS.company_address),
    senderEmail: String(r.sender_email || ADMIN_DEFAULTS.sender_email),
    imapPassword: String(r.imap_password || ADMIN_DEFAULTS.imap_password),
    smsGatewayType: (r.textbee_api_key && r.textbee_device_id) ? "textbee" : ADMIN_DEFAULTS.sms_gateway_type,
    smsGatewayUrl: ADMIN_DEFAULTS.sms_gateway_url,
    smsApiKey: ADMIN_DEFAULTS.sms_api_key,
    textbeeApiKey: String(r.textbee_api_key || ""),
    textbeeDeviceId: String(r.textbee_device_id || ""),
    slybroadcastEmail: String(r.slybroadcast_email || ADMIN_DEFAULTS.slybroadcast_email),
    slybroadcastPassword: String(r.slybroadcast_password || ADMIN_DEFAULTS.slybroadcast_password),
    slyCallbackNumber: String(r.sly_callback_number || ADMIN_DEFAULTS.sly_callback_number),
    voiceId: String(r.voice_id || ADMIN_DEFAULTS.voice_id),
    websiteUrl: String(r.website_url || ADMIN_DEFAULTS.website_url),
    logoUrl: String(r.logo_url || ADMIN_DEFAULTS.logo_url),
    privacyPolicyUrl: `https://${String(r.website_url || ADMIN_DEFAULTS.website_url)}/privacy-policy`,
    packageType: String(r.package_type || "basic"),
    role: String(r.role || "standard"),
  }
}

export async function isCommsAuthorized(clerkEmail: string): Promise<boolean> {
  if (clerkEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true
  const { data } = await supabaseAdmin
    .from("user_pins")
    .select("package_type, is_active")
    .ilike("email", clerkEmail)
    .eq("is_active", true)
    .single()
  if (!data) return false
  return ["partnership", "owner_operator", "admin"].includes(data.package_type)
}

export function configToAgentProfile(config: OperatorConfig): AgentProfile {
  const ext = config.extension ? ` ext. ${config.extension}` : ""
  const websiteBase = `https://${config.websiteUrl}`
  return {
    name: config.displayName,
    title: config.title,
    extension: config.extension,
    phoneDisplay: config.phoneDisplay,
    phoneHref: config.phoneHref,
    companyName: config.companyName,
    logoUrl: config.logoUrl,
    logoAlt: config.companyName,
    websiteUrl: websiteBase,
    websiteDisplay: config.websiteUrl,
    claimPageUrl: `${websiteBase}/claim-foreclosure-surplus-funds`,
    companyAddress: config.companyAddress,
    privacyPolicyUrl: config.privacyPolicyUrl,
    introEN: `My name is <strong style="color: #09274c;">${config.displayName}</strong>, and I am your ${config.title} at <strong style="color: #09274c;">${config.companyName}</strong>`,
    introES: `Mi nombre es <strong style="color: #09274c;">${config.displayName}</strong>, y soy su ${config.title} en <strong style="color: #09274c;">${config.companyName}</strong>`,
    signatureTitleEN: `${config.title}, ${config.companyName}`,
    signatureTitleES: `${config.title}, ${config.companyName}`,
    onBehalfEN: "",
    onBehalfES: "",
    byPhoneEN: `Call <strong>${config.displayName}</strong> directly at <a style="color: #09274c; font-weight: 600; text-decoration: none;" href="${config.phoneHref}">${config.phoneDisplay}</a>${ext ? ` ${ext}` : ""}`,
    byPhoneES: `Llame a <strong>${config.displayName}</strong> directamente al <a style="color: #09274c; font-weight: 600; text-decoration: none;" href="${config.phoneHref}">${config.phoneDisplay}</a>${ext ? ` ${ext}` : ""}`,
  }
}
