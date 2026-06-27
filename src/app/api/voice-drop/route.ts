import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveOperatorConfig, isCommsAuthorized } from "@/lib/operator-config";
import type { OperatorConfig } from "@/lib/operator-config";
import { isRequestAdmin } from "@/lib/admin-guard";
import { leadTypeCopy } from "@/lib/surplus/lead-type-copy";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const MINIMAX_BASE_URL = "https://api.minimax.io/v1";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

function stateToFullName(state: string): string {
  const upper = state.trim().toUpperCase();
  return STATE_NAMES[upper] || state;
}

function formatDollarForSpeech(amount: number): string {
  const rounded = Math.round(amount / 1000) * 1000;
  return `$${rounded.toLocaleString("en-US")}`;
}

function phoneToSpoken(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.split("").join(", ");
}

function domainToSpoken(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/\./g, " dot ")
    .replace(/^usforeclosure/, "U. S. foreclosure");
}

function emailToSpoken(email: string): string {
  const [local, domain] = String(email || "").split("@");
  if (!domain) return local || "";
  return `${local} at ${domainToSpoken(domain)}`;
}

// Make a raw property_address read clearly: drop the trailing ZIP (mashes into the
// street number and is unintelligible spoken), drop a duplicated trailing city, and
// expand common street-type abbreviations so TTS pronounces them in full.
function spokenStreet(propertyAddress: string, city: string): string {
  let a = String(propertyAddress || "").trim();
  a = a.replace(/\s*\b\d{5}(-\d{4})?\b\s*$/, "").trim();
  if (city) {
    const c = city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    a = a.replace(new RegExp("\\s*,?\\s*" + c + "\\s*$", "i"), "").trim();
  }
  const ab: Record<string, string> = {
    Ave: "Avenue", Rd: "Road", Dr: "Drive", Blvd: "Boulevard", Ln: "Lane",
    Ct: "Court", Hwy: "Highway", Pkwy: "Parkway", Cir: "Circle",
    Ter: "Terrace", Pl: "Place", Trl: "Trail",
  };
  a = a.replace(/\b(Ave|Rd|Dr|Blvd|Ln|Ct|Hwy|Pkwy|Cir|Ter|Pl|Trl)\b\.?/gi,
    (m) => ab[m.charAt(0).toUpperCase() + m.slice(1).toLowerCase().replace(/\.$/, "")] || m);
  // Spell digit groups (street/unit numbers) one digit at a time so TTS reads them
  // clearly: "202" -> "two zero two" instead of mumbling "two hundred two".
  const DIG = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  a = a.replace(/\d+/g, (m) => m.split("").map((d) => DIG[Number(d)]).join(" "));
  return a.replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").trim();
}

function generateScript(lead: Record<string, unknown>, config: OperatorConfig): string {
  const ownerName = String(lead.owner_name || "Homeowner");
  const firstName = ownerName.split(/\s+/)[0] || ownerName;
  const propertyAddress = String(lead.property_address || "your property");
  const city = String(lead.city || "");
  const stateRaw = String(lead.state || lead.state_abbr || "");
  const stateFull = stateToFullName(stateRaw);
  const streetClean = spokenStreet(propertyAddress, city);
  const fullAddress =
    city && stateFull ? `${streetClean}, ${city}, ${stateFull}` : streetClean;

  const overage = Number(lead.overage_amount) || 0;
  const statedAmount = overage > 10000 ? overage - 10000 : overage;
  // Per-lead-type wording (tax-deed overage / pre-foreclosure / completed foreclosure).
  const copy = leadTypeCopy(lead.lead_type as string | undefined, lead.foreclosure_type as string | undefined);
  const surplusLine =
    statedAmount > 0
      ? `A forensic audit has identified surplus funds in excess of ${formatDollarForSpeech(statedAmount)} -- also known as overages -- from ${copy.vmSurplusSource}.`
      : `A forensic audit has identified surplus funds -- also known as overages -- from ${copy.vmSurplusSource}.`;

  const agentName = config.displayName;
  const companySpoken = config.companyName;
  const phoneSpoken = phoneToSpoken(config.phoneDisplay);
  const websiteSpoken = domainToSpoken(config.websiteUrl);
  const extSpoken = config.extension ? `, extension ${config.extension}` : "";
  const emailSpoken = emailToSpoken(config.senderEmail);

  return `Hi ${firstName}, this message is for ${ownerName}.

My name is ${agentName}, calling on behalf of ${companySpoken}. We are legally required to inform you that ${copy.vmAudit.replace("{ADDR}", fullAddress)}.

This is NOT a sales call, and there is no cost or money required from you in connection with this communication.

If the person receiving this message is not the primary deed holder but is an heir, successor, or party associated with this property in any way, it is equally important that you respond as soon as possible.

${surplusLine} These funds have not yet been distributed and legally belong to you or your heirs.

${copy.vmLien}

Call as soon as possible so we can begin processing your claim and get those funds distributed as quickly as possible.

Please return this call at your earliest convenience. You can reach me directly at ${phoneSpoken}${extSpoken}, or by email at ${emailSpoken}.

To learn more about our process, feel free to visit us at: ${websiteSpoken}.

Again, this is ${agentName} with ${companySpoken}. We look forward to hearing from you.`;
}

async function generateAudioMiniMax(script: string, voiceId: string): Promise<Buffer> {
  const response = await fetch(`${MINIMAX_BASE_URL}/t2a_v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "speech-02-hd",
      text: script,
      voice_setting: { voice_id: voiceId },
      audio_setting: { format: "mp3", sample_rate: 44100 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (data?.base_resp?.status_code !== 0) {
    throw new Error(
      `MiniMax TTS error: ${data?.base_resp?.status_msg || "Unknown error"}`
    );
  }

  return Buffer.from(data.data.audio as string, "hex");
}

async function generateAudioElevenLabs(script: string, voiceId: string = ELEVENLABS_VOICE_ID): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        // More expressive, less monotone: lower stability widens emotional range,
        // style adds delivery variation, speaker boost keeps the cloned voice present.
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
        },
        output_format: "mp3_44100_128",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Generic MiniMax fallback voice (Wise Woman) — used ONLY when an ElevenLabs
// cloned voice was requested but ElevenLabs is unavailable (e.g. out of credits).
const MINIMAX_FALLBACK_VOICE = "moss_audio_c0bbc114-1f24-11f1-83c7-3e0d56c699a9";

async function generateAudio(script: string, voiceId: string): Promise<Buffer> {
  // Voice id taxonomy (user_pins.voice_id):
  //   - 20-char alphanumeric (e.g. "ioRCUMBLQYICIH6h2vLV") => ElevenLabs cloned voice.
  //   - "moss_audio_..."                                   => MiniMax SYSTEM voice.
  //   - anything else (e.g. "marieusfr0612")               => MiniMax CUSTOM clone.
  // MiniMax handles both system + custom-clone ids on the same t2a endpoint, so a
  // custom clone keeps THE AGENT'S voice even when ElevenLabs is down. ElevenLabs is
  // only attempted for a true ElevenLabs id, and falls back to the generic MiniMax
  // voice (never to a different agent's voice).
  const isElevenLabsVoice = /^[A-Za-z0-9]{20}$/.test(voiceId);
  if (isElevenLabsVoice && ELEVENLABS_API_KEY) {
    try {
      return await generateAudioElevenLabs(script, voiceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`ElevenLabs cloned-voice TTS failed, falling back: ${msg}`);
    }
  }

  // MiniMax 2.5 — system voice, custom clone, or generic fallback for a failed EL id.
  if (MINIMAX_API_KEY) {
    const mmVoice = isElevenLabsVoice
      ? MINIMAX_FALLBACK_VOICE
      : (voiceId || MINIMAX_FALLBACK_VOICE);
    try {
      return await generateAudioMiniMax(script, mmVoice);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`MiniMax TTS failed, falling back to ElevenLabs: ${msg}`);
    }
  }

  // Last resort: ElevenLabs default voice
  if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
    return await generateAudioElevenLabs(script);
  }

  throw new Error(
    "No TTS provider configured. Set MINIMAX_API_KEY or ELEVENLABS_API_KEY."
  );
}

async function uploadAudioToStorage(audioBuffer: Buffer, filename: string): Promise<string> {
  const bucket = "voicedrops";
  // Ensure bucket exists (idempotent -- ignores if already created)
  await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => {});

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, audioBuffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

async function sendSlyBroadcast(
  phoneNumber: string,
  audioUrl: string,
  config: OperatorConfig
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  // An agent who connected their OWN SlyBroadcast account sends through THEIR
  // account — that's the entire point of connecting it (their drops bill to their
  // own SlyBroadcast credits, not the company's). Everyone who has NOT connected
  // their own account falls back to the company account. The agent's caller ID is
  // kept either way. NOTE: an agent's personal account must have SlyBroadcast API
  // access enabled, or the send returns "API access not allowed" (surfaced to them).
  const companyUid = process.env.SLYBROADCAST_EMAIL || "coreypearsonemail@gmail.com";
  const companyPass = process.env.SLYBROADCAST_PASSWORD || "Slypassword#1";
  const uid = config.slybroadcastEmail || companyUid;
  const pass = config.slybroadcastPassword || companyPass;
  const formData = new URLSearchParams();
  formData.append("c_uid", uid);
  formData.append("c_password", pass);
  formData.append("c_method", "new_campaign");
  formData.append("c_phone", phoneNumber);
  formData.append("c_url", audioUrl);
  formData.append("c_audio", "mp3");
  formData.append("c_callerID", config.slyCallbackNumber);
  formData.append("c_date", "now");

  const response = await fetch(
    "https://www.mobile-sphere.com/gateway/vmb.php",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    }
  );

  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.session_id || data.campaign_id) {
      return {
        success: true,
        campaignId: String(data.session_id || data.campaign_id),
      };
    }
    return { success: false, error: JSON.stringify(data) };
  } catch {
    if (text.includes("OK") || text.includes("session_id")) {
      return { success: true, campaignId: text.trim() };
    }
    return { success: false, error: text };
  }
}

function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    if (!userEmail || !(await isCommsAuthorized(userEmail))) {
      return NextResponse.json(
        { error: "Access required - Partnership plan or higher" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { leadId, testPhone, testName, operatorPinId } = body;

    const requesterIsAdmin = await isRequestAdmin()
    const config = await resolveOperatorConfig({
      requesterIsAdmin,
      clerkEmail: userEmail,
      operatorPinId: operatorPinId || null,
      leadId,
    });

    // Guard: never send voice drops with admin info for non-admin users
    const ADMIN_EMAIL_LOWER = "coreypearsonemail@gmail.com";
    if (!config.pinId && userEmail?.toLowerCase() !== ADMIN_EMAIL_LOWER) {
      console.error("[voice-drop] Blocked: non-admin user resolved to admin defaults", { userEmail, operatorPinId, leadId });
      return NextResponse.json(
        { error: "Could not resolve your agent profile. Please refresh the page and try again." },
        { status: 422 }
      );
    }

    // TEST MODE: send to any phone number with sample data
    if (testPhone) {
      const cleanPhone = cleanPhoneNumber(testPhone);
      if (cleanPhone.length < 10) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 }
        );
      }

      const testLead = {
        owner_name: testName || "John Smith",
        property_address: "123 Main Street",
        parcel_id: "TEST-0001",
      };
      const script = generateScript(testLead, config);

      let audioUrl: string;
      if (config.voicedropAudioUrl) {
        audioUrl = config.voicedropAudioUrl;
      } else {
        const audioBuffer = await generateAudio(script, config.voiceId);
        const audioFilename = `vd-test-${Date.now()}.mp3`;
        audioUrl = await uploadAudioToStorage(audioBuffer, audioFilename);
      }

      const result = await sendSlyBroadcast(cleanPhone, audioUrl, config);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Test voice drop delivery failed", script },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        test: true,
        campaignId: result.campaignId,
        phone: cleanPhone,
        script,
      });
    }

    // PRODUCTION MODE: send to a specific lead
    if (!leadId) {
      return NextResponse.json(
        { error: "leadId or testPhone is required" },
        { status: 400 }
      );
    }

    // Fetch lead from DB
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("foreclosure_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.primary_phone) {
      return NextResponse.json(
        { error: "Lead has no phone number" },
        { status: 400 }
      );
    }

    if (!lead.can_contact || lead.on_dnc) {
      return NextResponse.json(
        { error: "Lead is on DNC list or not cleared" },
        { status: 400 }
      );
    }

    if (lead.voicemail_sent) {
      return NextResponse.json(
        { error: "Voicemail already sent to this lead" },
        { status: 400 }
      );
    }

    // Generate personalized script (still recorded even if static audio is used)
    const script = generateScript(lead, config);

    // Per-operator static audio override -- skip TTS + upload
    let audioUrl: string;
    if (config.voicedropAudioUrl) {
      audioUrl = config.voicedropAudioUrl;
    } else {
      const audioBuffer = await generateAudio(script, config.voiceId);
      const audioFilename = `vd-${leadId}-${Date.now()}.mp3`;
      audioUrl = await uploadAudioToStorage(audioBuffer, audioFilename);
    }

    // Send via SlyBroadcast
    const cleanPhone = cleanPhoneNumber(lead.primary_phone);
    const result = await sendSlyBroadcast(cleanPhone, audioUrl, config);

    if (!result.success) {
      await supabaseAdmin
        .from("foreclosure_leads")
        .update({
          voicemail_script: script,
          voicemail_error: result.error || "SlyBroadcast delivery failed",
        })
        .eq("id", leadId);

      return NextResponse.json(
        { error: result.error || "Voice drop delivery failed" },
        { status: 500 }
      );
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
      .eq("id", leadId);

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      phone: cleanPhone,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
