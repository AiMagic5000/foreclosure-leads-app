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
    const { module_id, file_name, display_name, file_url, file_size, file_type, sort_order } = body

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
