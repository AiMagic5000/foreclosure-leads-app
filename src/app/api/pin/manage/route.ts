import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

async function verifyAdmin(): Promise<{ authorized: boolean; error?: string }> {
  const { userId } = await auth()

  if (!userId) {
    return { authorized: false, error: "Unauthorized" }
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()

  if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
    return { authorized: false, error: "Admin access required" }
  }

  return { authorized: true }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      )
    }

    const { email, states, packageType, gumroadSaleId } = await request.json()

    if (!email || !states || !Array.isArray(states) || states.length === 0) {
      return NextResponse.json(
        { error: "Email and states array are required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Generate random 8-char alphanumeric PIN
    const plaintextPin = crypto.randomBytes(4).toString("hex").toUpperCase()

    // Hash the PIN for storage
    const hashedPin = await bcrypt.hash(plaintextPin, 10)

    const { data: row, error: insertError } = await supabaseAdmin
      .from("user_pins")
      .insert({
        email: normalizedEmail,
        pin: hashedPin,
        states_access: states,
        package_type: packageType || null,
        gumroad_sale_id: gumroadSaleId || null,
        is_active: true,
      })
      .select("id")
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create PIN" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      pin: plaintextPin,
      id: row.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      )
    }

    const { data: pins, error: queryError } = await supabaseAdmin
      .from("user_pins")
      .select("id, email, states_access, package_type, gumroad_sale_id, is_active, created_at, last_used_at")
      .order("created_at", { ascending: false })

    if (queryError) {
      return NextResponse.json(
        { error: "Failed to fetch PINs" },
        { status: 500 }
      )
    }

    // Never return the hashed pin
    const safePins = (pins || []).map((row) => ({
      ...row,
      pin: "****",
    }))

    return NextResponse.json({
      success: true,
      data: safePins,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      )
    }

    const { id, is_active } = await request.json()

    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "id and is_active (boolean) are required" },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from("user_pins")
      .update({ is_active })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update PIN" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      )
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabaseAdmin
      .from("user_pins")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete PIN" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
