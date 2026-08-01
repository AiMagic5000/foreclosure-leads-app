import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"

export const maxDuration = 10

// Logged-in time tracker. The dashboard pings this once a minute while the tab
// is visible; we credit the elapsed time since the previous beat (capped at
// 2 minutes so a laptop waking from sleep can't inflate the counter). One tiny
// upsert per active user per minute — negligible load.
const BEAT_CAP_SECONDS = 120

export async function POST() {
  const user = await currentUser()
  const email = canonicalEmail(user?.emailAddresses?.[0]?.emailAddress)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const day = now.toISOString().slice(0, 10)

  const { data: row } = await supabaseAdmin
    .from("user_time_daily")
    .select("seconds, last_beat")
    .eq("email", email)
    .eq("day", day)
    .maybeSingle()

  let add = 60 // first beat of the day gets one interval's credit
  if (row?.last_beat) {
    const elapsed = Math.round((now.getTime() - new Date(row.last_beat).getTime()) / 1000)
    add = Math.max(0, Math.min(elapsed, BEAT_CAP_SECONDS))
  }

  const { error } = await supabaseAdmin.from("user_time_daily").upsert(
    {
      email,
      day,
      seconds: (row?.seconds || 0) + add,
      last_beat: now.toISOString(),
    },
    { onConflict: "email,day" }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
