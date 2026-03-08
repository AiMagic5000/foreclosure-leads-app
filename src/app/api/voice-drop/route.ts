import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = "coreypearsonemail@gmail.com";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const MINIMAX_BASE_URL = "https://api.minimax.io/v1";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "";
const SLYBROADCAST_EMAIL = process.env.SLYBROADCAST_EMAIL || "";
const SLYBROADCAST_PASSWORD = process.env.SLYBROADCAST_PASSWORD || "";
const CALLBACK_NUMBER = process.env.CALLBACK_NUMBER || "8885458007";

// Agent voice drop profiles
interface VoiceAgent {
  name: string;
  extensionSpoken: string | null;
  extensionDigit: string | null;
  callbackLine: string;
  emailAddress: string;
}

const DEFAULT_VOICE_AGENT: VoiceAgent = {
  name: "Corey Pearson",
  extensionSpoken: null,
  extensionDigit: null,
  callbackLine:
    "call back and talk to Allie your recovery agent at eight, eight, eight, five, four, five, eight, zero, zero, seven",
  emailAddress: "claim at U.S. foreclosure recovery dot com",
};

const VOICE_AGENT_PROFILES: Record<string, VoiceAgent> = {
  "rebecca@usforeclosurerecovery.com": {
    name: "Rebecca Maguire",
    extensionSpoken: "extension six",
    extensionDigit: "6",
    callbackLine:
      "call back and ask for Rebecca at eight, eight, eight, five, four, five, eight, zero, zero, seven, extension six",
    emailAddress: "rebecca at U.S. foreclosure recovery dot com",
  },
  "joshua@usforeclosurerecovery.com": {
    name: "Joshua Goc-ong",
    extensionSpoken: "extension seven",
    extensionDigit: "7",
    callbackLine:
      "call back and ask for Joshua at eight, eight, eight, five, four, five, eight, zero, zero, seven, extension seven",
    emailAddress: "joshua at U.S. foreclosure recovery dot com",
  },
};

function getVoiceAgent(agentEmail: string | null): VoiceAgent {
  if (!agentEmail) return DEFAULT_VOICE_AGENT;
  return VOICE_AGENT_PROFILES[agentEmail.toLowerCase()] || DEFAULT_VOICE_AGENT;
}

function generateScript(lead: Record<string, unknown>): string {
  const ownerName = String(lead.owner_name || "Homeowner");
  const firstName = ownerName.split(" ")[0] || "Homeowner";
  const propertyAddress = String(lead.property_address || "your property");
  const city = String(lead.city || "");
  const state = String(lead.state || "");
  const fullAddress =
    city && state ? `${propertyAddress}, ${city} ${state}` : propertyAddress;
  const apnNumber = String(
    lead.apn_number || lead.parcel_id || "your property"
  );
  const agent = getVoiceAgent(
    lead.agent_email ? String(lead.agent_email) : null
  );

  const extPart = agent.extensionSpoken ? `, ${agent.extensionSpoken}` : "";

  return `This is ${agent.name} from Foreclosure Recovery Inc. This message is specifically for ${ownerName}, or to any family members, to let ${firstName} know:

We are obligated to inform you that the property at ${fullAddress}, APN number ${apnNumber}, is going to close out with excess funds associated with the homes equity after the bank has been paid from the foreclosure sale.

We want to make sure that when the funds are distributed, they are sent to the correct address. We need your current forwarding address in order to send the check.

Please contact us at eight, eight, eight, five, four, five, eight, zero, zero, seven${extPart} or email us at ${agent.emailAddress} to update your forwarding address, so the funds that are collected after the bank has been made whole from the foreclosure sale can be distributed to you in a timely manner.

Please get a pen and replay this message to take down our phone number so you can ${agent.callbackLine}.

Thank you.`;
}

async function generateAudioMiniMax(script: string): Promise<Buffer> {
  const response = await fetch(`${MINIMAX_BASE_URL}/t2a_v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "speech-02-hd",
      text: script,
      voice_setting: { voice_id: "Narrator" },
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

async function generateAudio(script: string): Promise<Buffer> {
  // Primary: MiniMax 2.5
  if (MINIMAX_API_KEY) {
    try {
      return await generateAudioMiniMax(script);
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

async function sendSlyBroadcast(
  phoneNumber: string,
  audioUrl: string
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const formData = new URLSearchParams();
  formData.append("c_uid", SLYBROADCAST_EMAIL);
  formData.append("c_password", SLYBROADCAST_PASSWORD);
  formData.append("c_method", "new_campaign");
  formData.append("c_phone", phoneNumber);
  formData.append("c_url", audioUrl);
  formData.append("c_audio", "mp3");
  formData.append("c_callerID", CALLBACK_NUMBER);
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

    // Allow admin and any user with an active partnership+ account
    let isAuthorized = userEmail === ADMIN_EMAIL.toLowerCase();
    if (!isAuthorized && userEmail) {
      const { data: userPin } = await supabaseAdmin
        .from("user_pins")
        .select("package_type, is_active")
        .eq("email", userEmail)
        .single();
      if (
        userPin?.is_active &&
        ["partnership", "owner_operator", "admin"].includes(
          userPin.package_type
        )
      ) {
        isAuthorized = true;
      }
    }
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access required - Partnership plan or higher" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { leadId, testPhone, testName } = body;

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
      const script = generateScript(testLead);

      const audioBuffer = await generateAudio(script);
      const audioBase64 = audioBuffer.toString("base64");

      const result = await sendSlyBroadcast(cleanPhone, audioBase64);

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
    const script = generateScript(lead);

    // Generate audio via MiniMax 2.5 (primary) or ElevenLabs (fallback)
    const audioBuffer = await generateAudio(script);
    const audioBase64 = audioBuffer.toString("base64");

    // Send via SlyBroadcast
    const cleanPhone = cleanPhoneNumber(lead.primary_phone);
    const result = await sendSlyBroadcast(cleanPhone, audioBase64);

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
