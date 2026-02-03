import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json()

    if (!email || !pin) {
      return NextResponse.json(
        { valid: false, error: "Email and PIN are required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Admin bypass - no PIN check needed
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({
        valid: true,
        states_access: ["ALL"],
        isAdmin: true,
      })
    }

    // Query active PINs for this email
    const { data: pinRows, error: queryError } = await supabaseAdmin
      .from("user_pins")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("is_active", true)

    if (queryError) {
      return NextResponse.json(
        { valid: false, error: "Failed to verify PIN" },
        { status: 500 }
      )
    }

    if (!pinRows || pinRows.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Invalid PIN" },
        { status: 401 }
      )
    }

    // Check each active PIN row for a match
    for (const row of pinRows) {
      const isMatch = await bcrypt.compare(pin, row.pin)

      if (isMatch) {
        // Update last_used_at timestamp
        await supabaseAdmin
          .from("user_pins")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", row.id)

        return NextResponse.json({
          valid: true,
          states_access: row.states_access,
          isAdmin: false,
        })
      }
    }

    return NextResponse.json(
      { valid: false, error: "Invalid PIN" },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
