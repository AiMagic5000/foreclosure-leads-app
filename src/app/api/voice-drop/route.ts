import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveOperatorConfig, isCommsAuthorized } from "@/lib/operator-config";
import type { OperatorConfig } from "@/lib/operator-config";

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

function generateScript(lead: Record<string, unknown>, config: OperatorConfig): string {
  const ownerName = String(lead.owner_name || "Homeowner");
  const propertyAddress = String(lead.property_address || "your property");
  const city = String(lead.city || "");
  const stateRaw = String(lead.state || lead.state_abbr || "");
  const stateFull = stateToFullName(stateRaw);
  const fullAddress =
    city && stateFull ? `${propertyAddress}, ${city}, ${stateFull}` : propertyAddress;

  const overage = Number(lead.overage_amount) || 0;
  const statedAmount = overage > 10000 ? overage - 10000 : overage;
  const surplusLine =
    statedAmount > 0
      ? `A forensic audit has identified surplus funds in excess of ${formatDollarForSpeech(statedAmount)} -- also known as overages -- from the equity in your property that exceed the lender's claim from the foreclosure sale.`
      : `A forensic audit has identified surplus funds -- also known as overages -- from the equity in your property that exceed the lender's claim from the foreclosure sale.`;

  const agentName = config.displayName;
  const companySpoken = config.companyName;
  const phoneSpoken = phoneToSpoken(config.phoneDisplay);
  const websiteSpoken = domainToSpoken(config.websiteUrl);

  return `Hi, this message is for ${ownerName}.

My name is ${agentName}, calling on behalf of ${companySpoken}. We are legally required to inform you that a forensic audit has been completed on the property located at ${fullAddress}.

This is NOT a sales call, and there is no cost or money required from you in connection with this communication.

If the person receiving this message is not the primary deed holder but is an heir, successor, or party associated with this property in any way, it is equally important that you respond as soon as possible.

${surplusLine} These funds have not yet been distributed and legally belong to you or your heirs.

If there were any liens or encumbrances on the property at the time of foreclosure, please know that those obligations are accounted for within the surplus -- and there are still remaining funds that require distribution to the primary deed holder or their heirs.

Call as soon as possible so we can begin processing your claim and get those funds distributed as quickly as possible.

Please return this call at your earliest convenience.

To learn more about our process, feel free to visit us at: ${websiteSpoken}.

Again this is ${agentName} -- ${phoneSpoken}.

We look forward to hearing from you.`;
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

async function generateAudioElevenLabs(script: string): Promise<Buffer> {
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
        model_id: "eleven_v3",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
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

async function generateAudio(script: string, voiceId: string): Promise<Buffer> {
  // Primary: MiniMax 2.5
  if (MINIMAX_API_KEY) {
    try {
      return await generateAudioMiniMax(script, voiceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`MiniMax TTS failed, falling back to ElevenLabs: ${msg}`);
    }
  }

  // Fallback: ElevenLabs (only when MiniMax unavailable)
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
  const formData = new URLSearchParams();
  formData.append("c_uid", config.slybroadcastEmail);
  formData.append("c_password", config.slybroadcastPassword);
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

    const config = await resolveOperatorConfig({
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

      const audioBuffer = await generateAudio(script, config.voiceId);
      const audioFilename = `vd-test-${Date.now()}.mp3`;
      const audioUrl = await uploadAudioToStorage(audioBuffer, audioFilename);

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

    // Generate personalized script
    const script = generateScript(lead, config);

    // Generate audio via MiniMax 2.5 (primary) or ElevenLabs (fallback)
    const audioBuffer = await generateAudio(script, config.voiceId);
    const audioFilename = `vd-${leadId}-${Date.now()}.mp3`;
    const audioUrl = await uploadAudioToStorage(audioBuffer, audioFilename);

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
