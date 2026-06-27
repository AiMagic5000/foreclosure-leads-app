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

export async function GET(request: NextRequest) {
  try {
    const moduleId = request.nextUrl.searchParams.get("module_id")

    if (!moduleId) {
      return NextResponse.json({ error: "module_id query param is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("training_resources")
      .select("*")
      .eq("module_id", parseInt(moduleId, 10))
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
    }

    return NextResponse.json({ data })
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
    const { module_id, file_name, display_name, file_url, file_size, file_type, sort_order, cover_url } = body

    if (!module_id || !file_name || !display_name || !file_url) {
      return NextResponse.json(
        { error: "module_id, file_name, display_name, and file_url are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("training_resources")
      .insert({
        module_id,
        file_name,
        display_name,
        file_url,
        file_size: file_size || 0,
        file_type: file_type || "application/pdf",
        sort_order: sort_order || 0,
        ...(cover_url ? { cover_url } : {}),
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Edit an existing resource in place: rename, swap the download file/link, or
// change the cover image — no need to delete and recreate the listing.
export async function PATCH(request: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    const body = await request.json()
    const { id, display_name, file_url, file_name, file_size, file_type, cover_url, sort_order } = body
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const update: Record<string, unknown> = {}
    if (typeof display_name === "string" && display_name.trim()) update.display_name = display_name.trim()
    if (typeof file_url === "string" && file_url.trim()) update.file_url = file_url.trim()
    if (typeof file_name === "string" && file_name.trim()) update.file_name = file_name.trim()
    if (typeof file_size === "number") update.file_size = file_size
    if (typeof file_type === "string" && file_type.trim()) update.file_type = file_type.trim()
    if (typeof cover_url === "string") update.cover_url = cover_url.trim() || null
    if (typeof sort_order === "number") update.sort_order = sort_order
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("training_resources").update(update).eq("id", id)
    if (error) return NextResponse.json({ error: "Failed to update resource" }, { status: 500 })
    return NextResponse.json({ success: true })
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

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("training_resources")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
