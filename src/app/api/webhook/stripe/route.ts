import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkId = session.metadata?.clerk_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!clerkId) {
    console.error("No clerk_id in session metadata")
    return
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id

  // Determine subscription tier based on price
  let subscriptionTier = "free"
  if (priceId === process.env.STRIPE_SINGLE_STATE_PRICE_ID) {
    subscriptionTier = "single_state"
  } else if (priceId === process.env.STRIPE_MULTI_STATE_PRICE_ID) {
    subscriptionTier = "multi_state"
  }

  // Update user in database
  await supabaseAdmin
    .from("users")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_tier: subscriptionTier,
      subscription_status: "active",
    })
    .eq("clerk_id", clerkId)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id

  let subscriptionTier = "free"
  if (priceId === process.env.STRIPE_SINGLE_STATE_PRICE_ID) {
    subscriptionTier = "single_state"
  } else if (priceId === process.env.STRIPE_MULTI_STATE_PRICE_ID) {
    subscriptionTier = "multi_state"
  }

  const status = subscription.status === "active" ? "active" :
                 subscription.status === "past_due" ? "past_due" :
                 subscription.status === "trialing" ? "trialing" : "canceled"

  await supabaseAdmin
    .from("users")
    .update({
      subscription_tier: subscriptionTier,
      subscription_status: status,
      stripe_subscription_id: subscription.id,
    })
    .eq("stripe_customer_id", customerId)
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await supabaseAdmin
    .from("users")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
    })
    .eq("stripe_customer_id", customerId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  await supabaseAdmin
    .from("users")
    .update({
      subscription_status: "active",
    })
    .eq("stripe_customer_id", customerId)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  await supabaseAdmin
    .from("users")
    .update({
      subscription_status: "past_due",
    })
    .eq("stripe_customer_id", customerId)
}
