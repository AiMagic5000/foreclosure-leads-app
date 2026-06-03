import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"
const BUCKET = "agent-docs"
const MAX = 25 * 1024 * 1024 // 25MB

async function ensureBucket() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.storage as any).getBucket(BUCKET)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!data) await (supabaseAdmin.storage as any).createBucket(BUCKET, { public: false, fileSizeLimit: MAX })
  } catch {
    // already exists
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

// Documents are namespaced per pin and per "folder" (a label sub-path): {pinId}/{folder}/{ts}-{name}
function folderOf(req: NextRequest, fromBody?: string | null) {
  const raw = (fromBody ?? req.nextUrl.searchParams.get("folder") ?? "general").toString()
  return raw.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "general"
}

// GET — list the owner's documents (optionally within a folder)
export async function GET(req: NextRequest) {
  const { pinId, error } = await ownerPinId(req)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ documents: [] })

  await ensureBucket()
  const folder = folderOf(req)
  const prefix = `${pinId}/${folder}`
  const { data: files } = await supabaseAdmin.storage.from(BUCKET).list(prefix, { sortBy: { column: "created_at", order: "desc" } })
  const documents = []
  for (const f of files || []) {
    if (f.name === ".emptyFolderPlaceholder") continue
    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(`${prefix}/${f.name}`, 3600)
    documents.push({
      name: f.name,
      label: f.name.replace(/^\d+-/, ""),
      url: signed?.signedUrl || "",
      created: f.created_at || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      size: (f.metadata as any)?.size || 0,
    })
  }
  return NextResponse.json({ documents })
}

// POST — upload one document (multipart: file, optional folder, optional asPinId)
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const asPinId = (form.get("asPinId") as string) || null
  const { pinId, error } = await ownerPinId(req, asPinId)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ error: "No active operator profile found." }, { status: 404 })

  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size > MAX) return NextResponse.json({ error: "File too large (25MB max)" }, { status: 400 })

  const folder = folderOf(req, (form.get("folder") as string) || null)
  const safeName = (file.name || "document").replace(/[^a-zA-Z0-9.\- _]/g, "_").slice(0, 80)
  const ts = req.nextUrl.searchParams.get("ts") || `${Date.now()}`
  const path = `${pinId}/${folder}/${ts}-${safeName}`

  await ensureBucket()
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ success: true, path })
}

// PATCH — rename a document's label (storage move; keeps the file extension)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { pinId, error } = await ownerPinId(req, body?.asPinId || null)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ error: "No profile" }, { status: 404 })

  const name = String(body?.name || "")
  const newLabel = String(body?.label || "").replace(/[^a-zA-Z0-9.\- _]/g, "_").trim().slice(0, 80)
  if (!name || !newLabel) return NextResponse.json({ error: "name and label required" }, { status: 400 })
  const folder = folderOf(req, (body?.folder as string) || null)
  const ext = name.includes(".") ? "." + name.split(".").pop() : ""
  const base = newLabel.endsWith(ext) ? newLabel : newLabel + ext
  const ts = name.split("-")[0] || `${Date.now()}`
  const from = `${pinId}/${folder}/${name.replace(/\.\./g, "")}`
  const to = `${pinId}/${folder}/${ts}-${base}`
  if (from === to) return NextResponse.json({ success: true })
  const { error: mvErr } = await supabaseAdmin.storage.from(BUCKET).move(from, to)
  if (mvErr) return NextResponse.json({ error: mvErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — remove a document (?name=, ?folder=, ?asPinId=)
export async function DELETE(req: NextRequest) {
  const { pinId, error } = await ownerPinId(req)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ error: "No profile" }, { status: 404 })
  const name = req.nextUrl.searchParams.get("name")
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const folder = folderOf(req)
  const { error: delErr } = await supabaseAdmin.storage.from(BUCKET).remove([`${pinId}/${folder}/${name.replace(/\.\./g, "")}`])
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
