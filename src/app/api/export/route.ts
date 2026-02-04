import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress || ""
    const isAdmin = email === ADMIN_EMAIL

    // Check PIN access
    let allowedStates: string[] = []

    if (isAdmin) {
      allowedStates = [] // empty means all access
    } else {
      // Check database for active PIN
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

      allowedStates = pinData.states_access.includes("ALL") ? [] : pinData.states_access
    }

    const body = await request.json()
    const {
      states,
      dateRange,
      format = "csv",
      includeSkipTrace = true,
    } = body

    // Filter requested states against allowed states
    let queryStates = states
    if (allowedStates.length > 0) {
      queryStates = states.filter((s: string) => allowedStates.includes(s))
      if (queryStates.length === 0) {
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
          : "id, property_address, city, state, state_abbr, zip_code, parcel_id, owner_name, case_number, sale_date, sale_amount, mortgage_amount, lender_name, trustee_name, foreclosure_type, status, created_at, estimated_market_value, property_type, bedrooms, bathrooms, square_footage, year_built, assessed_value, tax_amount, lot_size, enrichment_source, enriched_at"
      )
      .in("state_abbr", queryStates)

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
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from("user_activity").insert({
      user_id: email,
      action: "export",
      details: {
        states: queryStates,
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
          states: queryStates,
        },
      })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: "No leads to export" }, { status: 404 })
    }

    const csvHeaders = Object.keys(leads[0])
    const csvRows = [
      csvHeaders.join(","),
      ...leads.map((lead) =>
        csvHeaders
          .map((header) => {
            const value = lead[header as keyof typeof lead]
            if (value === null || value === undefined) return ""
            const stringValue = String(value)
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
