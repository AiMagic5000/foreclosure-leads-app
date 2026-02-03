import { NextRequest, NextResponse } from "next/server"

// Stub for future Gumroad webhook integration
// Gumroad sends POST webhooks on sale events
// https://gumroad.com/ping
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()

    const saleId = body.get("sale_id") as string
    const email = body.get("email") as string
    const productId = body.get("product_id") as string

    // TODO: When Gumroad products are created, implement:
    // 1. Verify the sale via Gumroad API
    // 2. Auto-create a PIN for the buyer
    // 3. Email the PIN to the buyer

    console.log("Gumroad webhook received:", { saleId, email, productId })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
