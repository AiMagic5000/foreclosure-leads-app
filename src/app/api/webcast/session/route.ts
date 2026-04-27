import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  getNextSessionTime,
  getCurrentSessionStart,
  getSessionLabel,
  getSecondsUntilSession,
  getVideoOffsetSeconds,
  getLiveAttendeeCount,
} from '@/lib/webcast/session-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')

    const currentSession = getCurrentSessionStart()
    const nextSession = getNextSessionTime()
    const videoOffset = getVideoOffsetSeconds(currentSession)
    const isLive = videoOffset > 0 && videoOffset < 1800

    let assignedSession: Date | null = null

    if (leadId) {
      const { data: lead } = await supabaseAdmin
        .from('webcast_leads')
        .select('assigned_session_time')
        .eq('id', leadId)
        .single()

      if (lead?.assigned_session_time) {
        assignedSession = new Date(lead.assigned_session_time)
      }
    }

    const sessionAgeMinutes = isLive ? videoOffset / 60 : 0
    const baseCount = 20 + Math.floor(Math.random() * 20)

    return NextResponse.json({
      currentSession: {
        start: currentSession.toISOString(),
        label: getSessionLabel(currentSession),
        isLive,
        videoOffsetSeconds: isLive ? videoOffset : 0,
        attendeeCount: isLive ? getLiveAttendeeCount(baseCount, sessionAgeMinutes) : 0,
      },
      nextSession: {
        start: nextSession.toISOString(),
        label: getSessionLabel(nextSession),
        secondsUntil: getSecondsUntilSession(nextSession),
      },
      assignedSession: assignedSession
        ? {
            start: assignedSession.toISOString(),
            label: getSessionLabel(assignedSession),
            secondsUntil: getSecondsUntilSession(assignedSession),
            isLive: getVideoOffsetSeconds(assignedSession) > 0 && getVideoOffsetSeconds(assignedSession) < 1800,
            videoOffsetSeconds: Math.max(0, getVideoOffsetSeconds(assignedSession)),
          }
        : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
