import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { isRequestAdmin } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

const BUCKET = "pbx-config"
const FILE = "extensions.json"

type ExtRec = { forwarding_phone: string; agent_name?: string; agent_email?: string; active?: boolean }
type ExtMap = Record<string, ExtRec>

async function load(): Promise<ExtMap> {
  try {
    const { data } = await supabaseAdmin.storage.from(BUCKET).download(FILE)
    if (!data) return {}
    return JSON.parse(await data.text()) as ExtMap
  } catch {
    return {}
  }
}

async function save(map: ExtMap): Promise<void> {
  await supabaseAdmin.storage.from(BUCKET).upload(
    FILE,
    new Blob([JSON.stringify(map, null, 1)], { type: "application/json" }),
    { upsert: true }
  )
}

function normPhone(p: string): string {
  const d = (p || "").replace(/\D/g, "")
  if (d.length === 11 && d.startsWith("1")) return `+${d}`
  if (d.length === 10) return `+1${d}`
  return p.trim()
}

export async function GET() {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const map = await load()
  const list = Object.entries(map)
    .map(([extension, r]) => ({ extension, ...r }))
    .sort((a, b) => a.extension.localeCompare(b.extension, undefined, { numeric: true }))
  return NextResponse.json({ extensions: list })
}

export async function POST(req: NextRequest) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const extension = String(body?.extension || "").replace(/\D/g, "").trim()
  const forwarding_phone = normPhone(String(body?.forwarding_phone || ""))
  if (!extension || !forwarding_phone) {
    return NextResponse.json({ error: "Extension and forwarding phone are required" }, { status: 400 })
  }
  if (forwarding_phone.replace(/\D/g, "").length < 11) {
    return NextResponse.json({ error: "Forwarding phone must be a valid US number" }, { status: 400 })
  }
  const map = await load()
  map[extension] = {
    forwarding_phone,
    agent_name: String(body?.agent_name || "").trim() || undefined,
    agent_email: String(body?.agent_email || "").trim() || undefined,
    active: body?.active === false ? false : true,
  }
  await save(map)
  return NextResponse.json({ success: true, extension, forwarding_phone })
}

export async function DELETE(req: NextRequest) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const extension = new URL(req.url).searchParams.get("extension")?.replace(/\D/g, "") || ""
  if (!extension) return NextResponse.json({ error: "extension required" }, { status: 400 })
  const map = await load()
  delete map[extension]
  await save(map)
  return NextResponse.json({ success: true })
}
