import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// One-tap "AI covers me" switch for the owners' extensions. Bookmark two links on your
// phone and tap when you step away / come back — no login needed (token-guarded), so it
// works instantly from a locked-down phone browser at lunch.
//
//   AI ON  (going to lunch):  /api/sw/lunch?t=TOKEN&on=1
//   AI OFF (back at desk):    /api/sw/lunch?t=TOKEN&on=0
//   just one ext:             ...&ext=1   (defaults to both owner exts 1 and 2)
//
// Both 888 numbers share this one extensions.json, so flipping here covers every number.
const WEBHOOK_TOKEN = process.env.SW_WEBHOOK_TOKEN || "usfr-sw-9f3a2c7b"
const BUCKET = "pbx-config"
const FILE = "extensions.json"
const OWNER_EXTS = ["1", "2"] // Allie = 1, Corey = 2

type ExtMap = Record<string, Record<string, unknown>>

async function handle(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  if (url.searchParams.get("t") !== WEBHOOK_TOKEN) {
    return new NextResponse("Not authorized.", { status: 403 })
  }
  const onParam = (url.searchParams.get("on") || "1").toLowerCase()
  const on = onParam === "1" || onParam === "true" || onParam === "yes"
  const oneExt = (url.searchParams.get("ext") || "").replace(/\D/g, "")
  const targets = oneExt ? [oneExt] : OWNER_EXTS

  let map: ExtMap = {}
  try {
    const { data } = await supabaseAdmin.storage.from(BUCKET).download(FILE)
    if (data) map = JSON.parse(await data.text()) as ExtMap
  } catch {
    return new NextResponse("Could not read extensions.", { status: 500 })
  }

  const changed: string[] = []
  for (const ext of targets) {
    if (map[ext]) {
      map[ext] = { ...map[ext], ai_cover: on }
      changed.push(ext)
    }
  }
  if (!changed.length) return new NextResponse("No matching extensions found.", { status: 404 })

  await supabaseAdmin.storage.from(BUCKET).upload(
    FILE,
    new Blob([JSON.stringify(map, null, 1)], { type: "application/json" }),
    { upsert: true },
  )

  const state = on ? "ON — the AI assistant is now answering" : "OFF — your calls ring your phone again"
  const body = `AI coverage ${state}.
Extensions updated: ${changed.join(", ")}.
Toggle the other way any time with on=${on ? 0 : 1}.`
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } })
}

export function GET(req: NextRequest) { return handle(req) }
export function POST(req: NextRequest) { return handle(req) }
