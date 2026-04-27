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

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, duration, video_url, poster_url, access_level } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    // Get the next module number and sort order
    const { data: existing } = await supabaseAdmin
      .from("training_modules")
      .select("module_number, sort_order")
      .order("module_number", { ascending: false })
      .limit(1)

    const nextModuleNumber = existing && existing.length > 0 ? existing[0].module_number + 1 : 1
    const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data, error } = await supabaseAdmin
      .from("training_modules")
      .insert({
        module_number: nextModuleNumber,
        title,
        description: description || "",
        duration: duration || "0:00",
        video_url: video_url || "",
        poster_url: poster_url || "",
        access_level: access_level || ["basic", "partnership", "owner_operator", "admin"],
        status: "current",
        sort_order: nextSortOrder,
        updated_at: new Date().toISOString(),
        updated_by: ADMIN_EMAIL,
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create module" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { module_id } = await request.json()

    if (!module_id) {
      return NextResponse.json({ error: "module_id is required" }, { status: 400 })
    }

    // Delete associated resources first
    await supabaseAdmin
      .from("training_resources")
      .delete()
      .eq("module_id", module_id)

    // Delete the module
    const { error } = await supabaseAdmin
      .from("training_modules")
      .delete()
      .eq("id", module_id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete module" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
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

    const allowedFields = ["title", "description", "duration", "poster_url", "video_url", "status", "access_level"]
    const cleanUpdates: Record<string, unknown> = {}
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
