export function getNextSessionTime(): Date {
  const now = new Date()
  const minutes = now.getMinutes()
  const next = new Date(now)
  if (minutes < 30) {
    next.setMinutes(30, 0, 0)
  } else {
    next.setMinutes(0, 0, 0)
    next.setHours(next.getHours() + 1)
  }
  return next
}

export function getCurrentSessionStart(): Date {
  const now = new Date()
  const minutes = now.getMinutes()
  const current = new Date(now)
  if (minutes >= 30) {
    current.setMinutes(30, 0, 0)
  } else {
    current.setMinutes(0, 0, 0)
  }
  return current
}

export function getVideoOffsetSeconds(sessionStartTime: Date): number {
  const elapsed = (Date.now() - sessionStartTime.getTime()) / 1000
  return Math.max(0, Math.floor(elapsed))
}

export function getSessionLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  })
}

export function getSecondsUntilSession(sessionTime: Date): number {
  return Math.max(0, Math.floor((sessionTime.getTime() - Date.now()) / 1000))
}

export function getLiveAttendeeCount(baseCount: number, sessionAgeMinutes: number): number {
  const growth = Math.min(sessionAgeMinutes * 3, 40)
  const noise = Math.floor(Math.random() * 7) - 3
  return Math.max(12, baseCount + growth + noise)
}
