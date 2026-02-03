import { NextRequest, NextResponse } from "next/server"

const GUMROAD_URLS: Record<string, string> = {
  five_state: process.env.GUMROAD_LEAD_ACCESS_URL || "https://startmybusinessinc.gumroad.com/l/vzqbhs",
  additional_state: process.env.GUMROAD_ADDITIONAL_STATE_URL || "https://startmybusinessinc.gumroad.com/l/blwra",
  business_buildout: process.env.GUMROAD_BUSINESS_BUILDOUT_URL || "https://gumroad.com/l/placeholder-business-buildout",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product } = body

    const url = GUMROAD_URLS[product]
    if (!url) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 })
    }

    return NextResponse.json({ url })
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
