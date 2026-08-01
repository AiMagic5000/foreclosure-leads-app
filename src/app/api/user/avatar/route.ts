import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { canonicalEmail } from "@/lib/email-alias"

export const dynamic = "force-dynamic"

// Custom profile avatar. Stored in the public `avatars` bucket keyed by Clerk id,
// with the URL persisted on users.avatar_url (all dup rows for the email).
// DELETE resets to the default FRI eagle (the default is always an option).
const BUCKET = "avatars"
const MAX = 5 * 1024 * 1024

async function ensureBucket() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.storage as any).getBucket(BUCKET)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!data) await (supabaseAdmin.storage as any).createBucket(BUCKET, { public: true, fileSizeLimit: MAX })
  } catch { /* bucket may already exist */ }
}

async function callerEmail(): Promise<string> {
  const user = await currentUser()
  return canonicalEmail(user?.emailAddresses?.[0]?.emailAddress) || ""
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await callerEmail()
  if (!email) return NextResponse.json({ url: null })
  const { data } = await supabaseAdmin
    .from("users").select("avatar_url").ilike("email", email).not("avatar_url", "is", null).limit(1)
  return NextResponse.json({ url: (data?.[0] as { avatar_url?: string } | undefined)?.avatar_url || null })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await callerEmail()
  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (file.size > MAX) return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 400 })
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Images only" }, { status: 400 })

  await ensureBucket()
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg")
  const path = `${userId}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  // Cache-bust so a replaced photo shows immediately.
  const url = `${pub.publicUrl}?v=${Date.now()}`
  if (email) await supabaseAdmin.from("users").update({ avatar_url: url }).ilike("email", email)
  return NextResponse.json({ url })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await callerEmail()
  if (email) await supabaseAdmin.from("users").update({ avatar_url: null }).ilike("email", email)
  return NextResponse.json({ success: true })
}
