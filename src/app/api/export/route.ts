import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
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

    if (user.subscription_tier === "free") {
      return NextResponse.json(
        { error: "Subscription required to export leads" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      states,
      dateRange,
      format = "csv",
      includeSkipTrace = true,
    } = body

    // Validate states based on subscription
    let allowedStates = states
    if (user.subscription_tier === "single_state") {
      allowedStates = states.filter((s: string) =>
        user.selected_states?.includes(s)
      )
      if (allowedStates.length === 0) {
        return NextResponse.json(
          { error: "No access to selected states" },
          { status: 403 }
        )
      }
    }

    // Build query
    let query = supabaseAdmin
      .from("foreclosure_leads")
      .select(
        includeSkipTrace
          ? "*"
          : "id, property_address, city, state, state_abbr, zip_code, parcel_id, owner_name, case_number, sale_date, sale_amount, mortgage_amount, lender_name, trustee_name, foreclosure_type, status, created_at"
      )
      .in("state_abbr", allowedStates)

    // Apply date filter
    if (dateRange && dateRange !== "all") {
      const days = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      query = query.gte("created_at", startDate.toISOString())
    }

    const { data: leads, error: leadsError } = await query.order("created_at", {
      ascending: false,
    })

    if (leadsError) {
      console.error("Error fetching leads for export:", leadsError)
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      )
    }

    // Log the export activity
    await supabaseAdmin.from("user_activity").insert({
      user_id: user.subscription_tier, // Would need to get actual user ID
      action: "export",
      details: {
        states: allowedStates,
        dateRange,
        format,
        leadCount: leads?.length || 0,
      },
    })

    if (format === "json") {
      return NextResponse.json({
        success: true,
        data: leads,
        meta: {
          totalRecords: leads?.length || 0,
          exportedAt: new Date().toISOString(),
          states: allowedStates,
        },
      })
    }

    // Generate CSV
    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: "No leads to export" }, { status: 404 })
    }

    const headers = Object.keys(leads[0])
    const csvRows = [
      headers.join(","),
      ...leads.map((lead) =>
        headers
          .map((header) => {
            const value = lead[header as keyof typeof lead]
            if (value === null || value === undefined) return ""
            const stringValue = String(value)
            // Escape quotes and wrap in quotes if contains comma or quote
            if (stringValue.includes(",") || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(",")
      ),
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="foreclosure-leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
