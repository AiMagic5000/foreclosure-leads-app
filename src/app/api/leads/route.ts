import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user email from Clerk
    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress || ""
    const isAdmin = email === ADMIN_EMAIL

    // Check PIN-based access from headers (set by client after PIN verification)
    const pinStates = request.headers.get("x-pin-states")
    const parsedStates: string[] = pinStates ? JSON.parse(pinStates) : []
    const hasAllAccess = isAdmin || parsedStates.includes("ALL")

    // If not admin and no PIN states, check if they have a PIN in the database
    if (!isAdmin && parsedStates.length === 0) {
      const { data: pinData } = await supabaseAdmin
        .from("user_pins")
        .select("states_access")
        .eq("email", email)
        .eq("is_active", true)
        .limit(1)
        .single()

      if (!pinData) {
        return NextResponse.json(
          { error: "Access required. Please enter your PIN or purchase access." },
          { status: 403 }
        )
      }
      parsedStates.push(...pinData.states_access)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const state = searchParams.get("state")
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search")

    // Build query
    let query = supabaseAdmin
      .from("foreclosure_leads")
      .select("*", { count: "exact" })

    // Filter by states based on PIN access (unless admin/ALL)
    if (!hasAllAccess && parsedStates.length > 0) {
      query = query.in("state_abbr", parsedStates)
    }

    // Apply filters
    if (state) {
      query = query.eq("state_abbr", state)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(
        `property_address.ilike.%${search}%,owner_name.ilike.%${search}%,city.ilike.%${search}%`
      )
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

    const { data: leads, error: leadsError, count } = await query

    if (leadsError) {
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: leads,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Leads API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
