import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveImpersonationTarget } from "@/lib/admin-guard"
import { notifyAccountActivity } from "@/lib/email"
import { canonicalEmail } from "@/lib/email-alias"
import { resolveCallerEmails, resolvePinForEmails } from "@/lib/caller-identity"

export const dynamic = "force-dynamic"
const BUCKET = "agent-docs"
const MAX = 50 * 1024 * 1024 // 50MB

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
  const callerEmails = resolveCallerEmails(user)
  const email = callerEmails[0]
  if (!email) return { pinId: null, error: "Unauthorized" }
  const asPinId = asPinIdFromBody ?? req.nextUrl.searchParams.get("asPinId")
  if (asPinId) {
    const target = await resolveImpersonationTarget(asPinId)
    if (!target) return { pinId: null, error: "Not authorized" }
    return { pinId: target.pinId }
  }
  // all addresses + limit-then-pick (see caller-identity.ts)
  const data = await resolvePinForEmails(callerEmails, "id, email, package_type, is_active, slybroadcast_email, textbee_api_key")
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
  if (file.size > MAX) return NextResponse.json({ error: "File too large (50MB max)" }, { status: 400 })

  const folder = folderOf(req, (form.get("folder") as string) || null)
  // Supabase storage keys reject many characters ("string did not match the recognized pattern").
  // Keep only safe chars; collapse the rest to hyphens; always keep a sane extension.
  const rawName = file.name || "document"
  const dot = rawName.lastIndexOf(".")
  const base = (dot > 0 ? rawName.slice(0, dot) : rawName).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file"
  const ext = (dot > 0 ? rawName.slice(dot + 1) : "").replace(/[^A-Za-z0-9]+/g, "").slice(0, 8).toLowerCase()
  const safeName = ext ? `${base}.${ext}` : base
  const ts = (req.nextUrl.searchParams.get("ts") || `${Date.now()}`).replace(/[^A-Za-z0-9]+/g, "")
  const path = `${pinId}/${folder}/${ts}-${safeName}`

  await ensureBucket()
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  // Guard against silent storage-write failures: the client can return success without the
  // object actually persisting. Confirm it's really there before reporting success / notifying,
  // so a dropped upload becomes a visible retry instead of a lost file. (John Bailey, 2026-07-13.)
  const fileKey = `${ts}-${safeName}`
  const { data: check } = await supabaseAdmin.storage.from(BUCKET).list(`${pinId}/${folder}`, { search: fileKey })
  if (!check?.some((f) => f.name === fileKey)) {
    return NextResponse.json({ error: "Upload did not save. Please try again." }, { status: 502 })
  }
  const actor = (await currentUser())?.emailAddresses?.[0]?.emailAddress || "unknown"
  // Resolve whose account this doc belongs to (the pin owner) so the notification shows both
  // the account AND who actually uploaded (agent themselves, or a team member via view-as).
  const { data: ownerPin } = await supabaseAdmin.from("user_pins").select("email").eq("id", pinId).maybeSingle()
  const ownerEmail = (ownerPin as { email?: string } | null)?.email || actor
  // Attach the uploaded file to the admin notification so we can see it without going into the account.
  await notifyAccountActivity(ownerEmail, "Uploaded a document", `${folder}: ${safeName}`, { filename: safeName, content: buf }, actor)

  // Payment / tax documents (W-9, direct deposit, LLC): confirm to BOTH the agent AND the
  // business inbox via Resend (reliable from Vercel; the SMTP admin notice above is the archive copy).
  if (folder.startsWith("payment")) {
    try {
      const { data: pinRow } = await supabaseAdmin.from("user_pins").select("email").eq("id", pinId).maybeSingle()
      const recipients = Array.from(
        new Set([pinRow?.email, "support@usforeclosureleads.com"].filter(Boolean) as string[])
      )
      if (recipients.length) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY || "re_T54sWRAZ_PPYJ3yXJHuJBpiA2uikL6nCn"}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Foreclosure Recovery Inc. <support@usforeclosureleads.com>",
            to: recipients,
            subject: `Payment document received — ${safeName}`,
            html:
              `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px">` +
              `<h2 style="color:#1E3A5F;margin:0 0 6px">Payment document received</h2>` +
              `<p style="color:#334155;margin:0 0 4px">We&rsquo;ve received <strong>${safeName}</strong> for the agent payment file.</p>` +
              `<p style="color:#64748b;font-size:14px;margin:0">The agent attested the information is true and accurate. ` +
              `Our team will review it and set up payment. No further action is needed right now.</p>` +
              `<p style="color:#94a3b8;font-size:12px;margin-top:14px">Foreclosure Recovery Inc. &middot; agent payment setup</p></div>`,
          }),
        })
      }
    } catch {
      // non-fatal — the upload already succeeded and the admin archive notice was sent.
    }
  }

  return NextResponse.json({ success: true, path })
}

// PATCH — rename a document's label (storage move; keeps the file extension)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { pinId, error } = await ownerPinId(req, body?.asPinId || null)
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  if (!pinId) return NextResponse.json({ error: "No profile" }, { status: 404 })

  const name = String(body?.name || "")
  const newLabel = String(body?.label || "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
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
