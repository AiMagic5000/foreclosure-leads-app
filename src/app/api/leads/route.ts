import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscription info
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("subscription_tier, selected_states")
      .eq("clerk_id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check subscription access
    if (user.subscription_tier === "free") {
      return NextResponse.json(
        { error: "Subscription required to access leads" },
        { status: 403 }
      )
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

    // Filter by state based on subscription
    if (user.subscription_tier === "single_state") {
      if (user.selected_states && user.selected_states.length > 0) {
        query = query.in("state_abbr", user.selected_states)
      } else {
        return NextResponse.json(
          { error: "No state selected. Please select a state in settings." },
          { status: 400 }
        )
      }
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
      console.error("Error fetching leads:", leadsError)
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
