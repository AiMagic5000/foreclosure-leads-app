import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { Webhook } from "svix"
import { supabaseAdmin } from "@/lib/supabase"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!

interface ClerkWebhookEvent {
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name: string | null
    last_name: string | null
    primary_email_address_id: string
  }
  type: string
}

export async function POST(request: NextRequest) {
  const headersList = await headers()
  const svixId = headersList.get("svix-id")
  const svixTimestamp = headersList.get("svix-timestamp")
  const svixSignature = headersList.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    )
  }

  const payload = await request.text()

  const wh = new Webhook(webhookSecret)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error("Webhook verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "user.created": {
        await handleUserCreated(event.data)
        break
      }

      case "user.updated": {
        await handleUserUpdated(event.data)
        break
      }

      case "user.deleted": {
        await handleUserDeleted(event.data.id)
        break
      }

      default:
        console.log(`Unhandled Clerk event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Clerk webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleUserCreated(data: ClerkWebhookEvent["data"]) {
  const primaryEmail = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id
  )

  if (!primaryEmail) {
    console.error("No primary email found for user")
    return
  }

  const fullName = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ") || null

  const { error } = await supabaseAdmin.from("users").insert({
    clerk_id: data.id,
    email: primaryEmail.email_address,
    full_name: fullName,
    subscription_tier: "free",
    subscription_status: "active",
  })

  if (error) {
    console.error("Error creating user in database:", error)
    throw error
  }
}

async function handleUserUpdated(data: ClerkWebhookEvent["data"]) {
  const primaryEmail = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id
  )

  if (!primaryEmail) {
    console.error("No primary email found for user")
    return
  }

  const fullName = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ") || null

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      email: primaryEmail.email_address,
      full_name: fullName,
    })
    .eq("clerk_id", data.id)

  if (error) {
    console.error("Error updating user in database:", error)
    throw error
  }
}

async function handleUserDeleted(clerkId: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("clerk_id", clerkId)

  if (error) {
    console.error("Error deleting user from database:", error)
    throw error
  }
}
