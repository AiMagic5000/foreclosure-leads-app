import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { sendAdminNotification } from "@/lib/email"

const DEBOUNCE_MS = 30 * 60 * 1000 // 30 minutes
const lastNotified = new Map<string, number>()

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const now = Date.now()
  const last = lastNotified.get(userId) || 0
  if (now - last < DEBOUNCE_MS) {
    return NextResponse.json({ ok: true, skipped: true })
  }
  lastNotified.set(userId, now)

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress || "unknown"
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown"
  const loginTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1E3A5F, #2563eb); padding: 18px 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Dashboard Login</h2>
        <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">usforeclosureleads.com</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 20px 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 100px;">User</td><td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${name}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Email</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${email}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Time</td><td style="padding: 6px 0; color: #111827; font-size: 14px;">${loginTime}</td></tr>
        </table>
      </div>
    </div>
  `

  await sendAdminNotification(`Dashboard Login: ${name} (${email})`, html)

  return NextResponse.json({ ok: true })
}
