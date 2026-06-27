import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com").toLowerCase()
const BUCKET = "pbx-config"
const FILE = "training-resource-access.json"

// Map of resource id -> allowed download tiers, e.g. { "12": ["owner_operator","admin"] }.
// A resource with NO entry falls back to the module-level gate (current behavior).
type AccessMap = Record<string, string[]>

async function verifyAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const u = await currentUser()
  return u?.emailAddresses?.[0]?.emailAddress?.toLowerCase() === ADMIN_EMAIL
}

async function load(): Promise<AccessMap> {
  try {
    const { data } = await supabaseAdmin.storage.from(BUCKET).download(FILE)
    if (!data) return {}
    return JSON.parse(await data.text()) as AccessMap
  } catch {
    return {}
  }
}

async function save(map: AccessMap): Promise<void> {
  await supabaseAdmin.storage.from(BUCKET).upload(
    FILE,
    new Blob([JSON.stringify(map, null, 1)], { type: "application/json" }),
    { upsert: true }
  )
}

const VALID = new Set(["basic", "partnership", "junior_owner_operator", "owner_operator", "admin"])

// GET — the full access map (read by the training page to gate downloads).
export async function GET() {
  return NextResponse.json({ access: await load() })
}

// POST — admin sets the allowed tiers for one resource. Empty array clears the
// override (resource reverts to the module-level gate).
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const id = String(body?.id || "").trim()
  const tiers = Array.isArray(body?.tiers) ? body.tiers.filter((t: unknown) => typeof t === "string" && VALID.has(t)) : []
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const map = await load()
  if (tiers.length) map[id] = tiers
  else delete map[id]
  await save(map)
  return NextResponse.json({ success: true, id, tiers })
}
