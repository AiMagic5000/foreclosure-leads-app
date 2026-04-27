import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getModeratorResponse } from '@/lib/webcast/chat-moderator'

const chatRateLimits = new Map<string, { count: number; resetAt: number }>()

function checkChatRate(leadId: string): boolean {
  const now = Date.now()
  const entry = chatRateLimits.get(leadId)
  if (!entry || now > entry.resetAt) {
    chatRateLimits.set(leadId, { count: 1, resetAt: now + 60000 })
    return true
  }
  if (entry.count >= 3) return false
  chatRateLimits.set(leadId, { count: entry.count + 1, resetAt: entry.resetAt })
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, sessionId, message, senderName } = body

    if (!leadId || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'leadId and message required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    if (!checkChatRate(leadId)) {
      return NextResponse.json({ error: 'Slow down! Max 3 messages per minute.' }, { status: 429 })
    }

    const { data: lead } = await supabaseAdmin
      .from('webcast_leads')
      .select('first_name, session_id')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const effectiveSessionId = sessionId || lead.session_id

    // Save user message
    await supabaseAdmin.from('webcast_chat_messages').insert({
      session_id: effectiveSessionId,
      lead_id: leadId,
      sender_type: 'user',
      sender_name: senderName || lead.first_name || 'Guest',
      message: message.trim(),
    })

    // Get chat history
    const { data: history } = await supabaseAdmin
      .from('webcast_chat_messages')
      .select('sender_type, sender_name, message')
      .eq('session_id', effectiveSessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Random delay 2-8 seconds for human feel
    const delay = 2000 + Math.random() * 6000
    await new Promise((r) => setTimeout(r, delay))

    // Get AI response
    const aiResponse = await getModeratorResponse(
      message.trim(),
      history || [],
      lead.first_name || 'Guest'
    )

    // Save moderator response
    await supabaseAdmin.from('webcast_chat_messages').insert({
      session_id: effectiveSessionId,
      lead_id: leadId,
      sender_type: 'moderator_ai',
      sender_name: 'Allie',
      message: aiResponse,
    })

    return NextResponse.json({
      success: true,
      response: {
        sender_name: 'Allie',
        sender_type: 'moderator_ai',
        message: aiResponse,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const { data: messages } = await supabaseAdmin
      .from('webcast_chat_messages')
      .select('id, sender_type, sender_name, message, video_timestamp_seconds, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100)

    return NextResponse.json({ messages: messages || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
