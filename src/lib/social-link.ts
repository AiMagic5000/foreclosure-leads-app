import { supabaseAdmin } from "@/lib/supabase"

// The agent's social-media setting, stored in user_activity (action
// "social_link_setting") keyed by email. Shared by the API route and the
// SMS/email send paths so a consented link auto-appends to outgoing messages.

export interface SocialLinkSetting {
  enabled: boolean
  link: string
  consent: boolean
  og_image?: string
}

export async function getSocialSetting(email?: string | null): Promise<SocialLinkSetting> {
  if (!email) return { enabled: false, link: "", consent: false }
  const { data } = await supabaseAdmin
    .from("user_activity")
    .select("details")
    .eq("user_id", email)
    .eq("action", "social_link_setting")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  const d = (data?.details || {}) as Partial<SocialLinkSetting>
  return { enabled: !!d.enabled, link: d.link || "", consent: !!d.consent, og_image: (d as Record<string, string>).og_image || "" }
}

// Returns the consented, enabled link or null. Used by the send routes.
export async function getAgentSocialLink(email?: string | null): Promise<string | null> {
  const s = await getSocialSetting(email)
  return s.enabled && s.consent && s.link ? s.link : null
}
