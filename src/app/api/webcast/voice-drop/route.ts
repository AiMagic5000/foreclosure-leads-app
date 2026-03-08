import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const MINIMAX_BASE_URL = "https://api.minimax.io/v1";
const SLYBROADCAST_EMAIL = process.env.SLYBROADCAST_EMAIL || "";
const SLYBROADCAST_PASSWORD = process.env.SLYBROADCAST_PASSWORD || "";
const CALLBACK_NUMBER = process.env.CALLBACK_NUMBER || "8885458007";

function generateWebcastScript(firstName: string): string {
  return `Hi ${firstName}, this is Corey Pearson from Foreclosure Recovery Incorporated.

I just wanted to personally welcome you and make sure you caught the webcast. We set up a preview account for you on U.S. Foreclosure Leads dot com so you can see the dashboard and how the whole system works.

If you watched the presentation, you already know how surplus fund recovery works. If you missed it, no worries, sessions run every 30 minutes so you can jump in anytime.

I also wanted to mention the partnership program. We provide the leads, the system, and the training. You work the files and keep your share. That is the fastest way to get started. Give us a call at eight, eight, eight, five, four, five, eight, zero, zero, seven and we will walk you through everything.

Talk soon.`;
}

async function generateAudio(script: string): Promise<Buffer> {
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

async function sendSlyBroadcast(phone: string, audioBase64: string) {
  const formData = new URLSearchParams();
  formData.append("c_uid", SLYBROADCAST_EMAIL);
  formData.append("c_password", SLYBROADCAST_PASSWORD);
  formData.append("c_method", "new_campaign");
  formData.append("c_phone", phone);
  formData.append("c_url", audioBase64);
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

function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json();
    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    const { data: lead } = await supabaseAdmin
      .from("webcast_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.phone) {
      return NextResponse.json({ error: "No phone number" }, { status: 400 });
    }

    if (lead.voice_drop_sent) {
      return NextResponse.json(
        { error: "Voice drop already sent" },
        { status: 400 }
      );
    }

    if (!MINIMAX_API_KEY || !SLYBROADCAST_EMAIL) {
      return NextResponse.json(
        { error: "Voice drop not configured" },
        { status: 500 }
      );
    }

    const script = generateWebcastScript(lead.first_name || "there");
    const audioBuffer = await generateAudio(script);
    const audioBase64 = audioBuffer.toString("base64");

    const phone = cleanPhone(lead.phone);
    const result = await sendSlyBroadcast(phone, audioBase64);

    await supabaseAdmin
      .from("webcast_leads")
      .update({
        voice_drop_sent: true,
        voice_drop_sent_at: new Date().toISOString(),
        voice_drop_error: result.success ? null : result.error,
      })
      .eq("id", leadId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaignId: result.campaignId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
