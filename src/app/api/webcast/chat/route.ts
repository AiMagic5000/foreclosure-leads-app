import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getModeratorResponse } from '@/lib/webcast/chat-moderator'
import { sendAdminNotification } from '@/lib/email'

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

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Rate limit by lead when we have one, otherwise by sender/anon — so chat works on
    // the dashboard route (and for any signed-in viewer) where there is no leadId in the URL.
    if (!checkChatRate(leadId || senderName || 'anon')) {
      return NextResponse.json({ error: 'Slow down! Max 3 messages per minute.' }, { status: 429 })
    }

    // Look up the lead only if we have an id. No leadId (signed-in dashboard viewer) is
    // fine — Allie still answers; we just skip the lead-tied persistence.
    let lead: { first_name: string | null; email: string | null; session_id: string | null } | null = null
    if (leadId) {
      const { data } = await supabaseAdmin
        .from('webcast_leads')
        .select('first_name, email, session_id')
        .eq('id', leadId)
        .single()
      lead = data || null
    }

    const displayName = senderName || lead?.first_name || 'Guest'
    const effectiveSessionId = sessionId || lead?.session_id || ''

    // Save the user message (best-effort; only when tied to a lead + session)
    if (leadId && effectiveSessionId) {
      await supabaseAdmin.from('webcast_chat_messages').insert({
        session_id: effectiveSessionId,
        lead_id: leadId,
        sender_type: 'user',
        sender_name: displayName,
        message: message.trim(),
      }).then(() => {}, () => {})
    }

    // Notify the team of the real question so a human can follow up (xscore10 + claim@)
    sendAdminNotification(
      `Webcast question from ${displayName}`,
      `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
        <p><strong>A live webcast viewer asked a question</strong></p>
        <p>Name: ${displayName}<br/>
        Email: ${lead?.email || '(signed-in viewer)'}<br/>
        Question: "${message.trim().replace(/</g, '&lt;')}"</p>
      </div>`
    ).catch(() => {})

    // Get chat history (only if we have a session to pull it from)
    let history: { sender_type: string; sender_name: string; message: string }[] = []
    if (effectiveSessionId) {
      const { data } = await supabaseAdmin
        .from('webcast_chat_messages')
        .select('sender_type, sender_name, message')
        .eq('session_id', effectiveSessionId)
        .order('created_at', { ascending: true })
        .limit(20)
      history = data || []
    }

    // Small human delay
    const delay = 1500 + Math.random() * 4000
    await new Promise((r) => setTimeout(r, delay))

    // Allie's reply — ALWAYS generated so real questions get answered. Fall back to a
    // helpful canned line if the model errors, so she never goes silent.
    let aiResponse: string
    try {
      aiResponse = await getModeratorResponse(message.trim(), history, displayName)
    } catch {
      aiResponse = `Great question, ${displayName}! Corey covers that in the session, and our team can walk you through it directly — reach us anytime at (888) 545-8007.`
    }

    // Save Allie's reply (best-effort; only when tied to a lead + session)
    if (leadId && effectiveSessionId) {
      await supabaseAdmin.from('webcast_chat_messages').insert({
        session_id: effectiveSessionId,
        lead_id: leadId,
        sender_type: 'moderator_ai',
        sender_name: 'Allie',
        message: aiResponse,
      }).then(() => {}, () => {})
    }

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
