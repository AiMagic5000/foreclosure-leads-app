import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

async function verifyAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  return email === ADMIN_EMAIL.toLowerCase()
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("training_modules")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 })
    }

    const isAdmin = await verifyAdmin().catch(() => false)

    return NextResponse.json({ data, isAdmin })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { module_id, ...updates } = body

    if (!module_id) {
      return NextResponse.json({ error: "module_id is required" }, { status: 400 })
    }

    const allowedFields = ["title", "description", "duration", "poster_url", "video_url", "status"]
    const cleanUpdates: Record<string, string> = {}
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key]
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    cleanUpdates.updated_at = new Date().toISOString()
    cleanUpdates.updated_by = ADMIN_EMAIL

    const { error } = await supabaseAdmin
      .from("training_modules")
      .update(cleanUpdates)
      .eq("id", module_id)

    if (error) {
      return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
