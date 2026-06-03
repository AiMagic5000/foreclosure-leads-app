import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"

export const dynamic = "force-dynamic"
const BUCKET = "agent-voice"

async function ensureBucket() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.storage as any).getBucket(BUCKET)
    if (!data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.storage as any).createBucket(BUCKET, { public: false, fileSizeLimit: 15728640 })
    }
  } catch {
    // createBucket throws if it already exists — fine
  }
}

async function ownerPinId(req: NextRequest, asPinIdFromBody?: string | null): Promise<{ pinId: string | null; error?: string }> {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return { pinId: null, error: "Unauthorized" }
  const asPinId = asPinIdFromBody ?? req.nextUrl.searchParams.get("asPinId")
  if (asPinId) {
    const target = await resolveImpersonationTarget(asPinId)
    if (!target) return { pinId: null, error: "Not authorized" }
    return { pinId: target.pinId }
  }
  const { data } = await supabaseAdmin.from("user_pins").select("id").ilike("email", email).eq("is_active", true).single()
  return { pinId: data?.id || null }
}

// GET — list the owner's voice recordings (signed playback URLs)
export async function GET(req: NextRequest) {
  const { pinId, error } = await ownerPinId(req)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ recordings: [] })

  await ensureBucket()
  const { data: files } = await supabaseAdmin.storage.from(BUCKET).list(pinId, { sortBy: { column: "created_at", order: "desc" } })
  const recordings = []
  for (const f of files || []) {
    if (f.name === ".emptyFolderPlaceholder") continue
    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(`${pinId}/${f.name}`, 3600)
    recordings.push({
      name: f.name,
      label: f.name.replace(/^\d+-/, "").replace(/\.(webm|mp3|m4a|wav)$/i, ""),
      url: signed?.signedUrl || "",
      created: f.created_at || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      size: (f.metadata as any)?.size || 0,
    })
  }
  return NextResponse.json({ recordings })
}

// POST — upload a voice recording (multipart: file, optional label, optional asPinId)
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const asPinId = (form.get("asPinId") as string) || null
  const { pinId, error } = await ownerPinId(req, asPinId)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ error: "No active operator profile found." }, { status: 404 })

  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Recording too large (15MB max)" }, { status: 400 })

  const label = String(form.get("label") || "recording").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "recording"
  const ext = (file.name.split(".").pop() || "webm").toLowerCase().replace(/[^a-z0-9]/g, "")
  const ts = req.nextUrl.searchParams.get("ts") || `${file.size}`
  const path = `${pinId}/${ts}-${label}.${ext}`

  await ensureBucket()
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || "audio/webm",
    upsert: false,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  const actor = (await currentUser())?.emailAddresses?.[0]?.emailAddress || "unknown"
  await notifyAccountActivity(actor, "Uploaded a voice sample", label)
  return NextResponse.json({ success: true, path })
}

// DELETE — remove a recording (?name=, ?asPinId=)
export async function DELETE(req: NextRequest) {
  const { pinId, error } = await ownerPinId(req)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ error: "No profile" }, { status: 404 })
  const name = req.nextUrl.searchParams.get("name")
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const { error: delErr } = await supabaseAdmin.storage.from(BUCKET).remove([`${pinId}/${name.replace(/\.\./g, "")}`])
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
