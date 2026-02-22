import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const VOICE_AGENT_URL = process.env.VOICE_AGENT_URL || "http://10.28.28.95:8090"

function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
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

    if (lead.on_dnc) {
      return NextResponse.json({ error: "Lead is on DNC list" }, { status: 400 })
    }

    const phone = cleanPhoneNumber(lead.primary_phone)

    const response = await fetch(`${VOICE_AGENT_URL}/api/call/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        phone: phone,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Voice agent unreachable" }))
      return NextResponse.json(
        { error: errorData.detail || "Failed to initiate call" },
        { status: response.status }
      )
    }

    const result = await response.json()

    await supabaseAdmin
      .from("foreclosure_leads")
      .update({
        last_ai_call_at: new Date().toISOString(),
        ai_call_count: (lead.ai_call_count || 0) + 1,
        ai_disposition: "in_progress",
      })
      .eq("id", leadId)

    return NextResponse.json({
      success: true,
      sessionId: result.session_id,
      channelId: result.channel_id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress
    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (sessionId) {
      const response = await fetch(`${VOICE_AGENT_URL}/api/call/status/${sessionId}`)
      if (!response.ok) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }
      const data = await response.json()
      return NextResponse.json(data)
    }

    const response = await fetch(`${VOICE_AGENT_URL}/api/calls/active`)
    if (!response.ok) {
      return NextResponse.json({ error: "Voice agent unreachable" }, { status: 502 })
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
