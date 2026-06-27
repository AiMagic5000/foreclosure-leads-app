import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// Record a dashboard page view (or a login event). Fire-and-forget from the client.
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (!email) return NextResponse.json({ ok: false })

    const body = await req.json().catch(() => ({}))
    const path = String(body?.path || "").slice(0, 200)
    // kinds: "login", "view" (page view), "download" (resource/guide download)
    const kind = body?.kind === "login" ? "login" : body?.kind === "download" ? "download" : "view"
    if (!path && kind !== "login") return NextResponse.json({ ok: false })

    await supabaseAdmin.from("page_activity").insert({ email, path: path || "/login", kind })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
