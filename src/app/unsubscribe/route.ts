import { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function page(title: string, body: string): Response {
  const doc = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f4f5f7;font-family:'Inter Tight','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#2c3e50}.wrap{max-width:520px;margin:48px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 14px rgba(9,39,76,.08)}.bar{height:4px;background:#09274c}.in{padding:36px 40px}h1{font-size:20px;color:#09274c;margin:0 0 14px}p{font-size:15px;line-height:23px;margin:0 0 18px}input{width:100%;box-sizing:border-box;padding:12px 14px;font-size:15px;border:1px solid #cfd8e3;border-radius:6px;margin:0 0 16px}button{background:#09274c;color:#fff;border:0;padding:12px 26px;font-size:15px;font-weight:600;border-radius:6px;cursor:pointer}a{color:#09274c}.f{font-size:11px;color:#8a96a5;padding:18px 40px;border-top:1px solid #eef1f5;line-height:17px}</style></head><body><div class="wrap"><div class="bar"></div><div class="in">${body}</div><div class="f">Foreclosure Recovery Inc. &mdash; 30 N Gould St, Ste R, Sheridan, WY 82801</div></div></body></html>`
  return new Response(doc, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } })
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function formPage(prefill = "", note = ""): Response {
  return page("Unsubscribe", `
    <h1>Unsubscribe</h1>
    <p>Enter your email address below to stop receiving messages from us.</p>
    ${note ? `<p style="color:#b91c1c">${esc(note)}</p>` : ""}
    <form method="POST" action="/unsubscribe">
      <input type="email" name="email" placeholder="you@example.com" value="${esc(prefill)}" required>
      <button type="submit">Unsubscribe me</button>
    </form>`)
}

function donePage(email: string): Response {
  return page("Unsubscribed", `
    <h1>You're unsubscribed</h1>
    <p><strong>${esc(email)}</strong> has been removed and will no longer receive messages from us.</p>
    <p>If this was a mistake, email <a href="mailto:support@usforeclosureleads.com">support@usforeclosureleads.com</a>.</p>`)
}

async function doUnsubscribe(raw: string): Promise<{ ok: boolean; value: string }> {
  const email = (raw || "").trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { ok: false, value: "Please enter a valid email address." }
  }
  try {
    const { error } = await supabaseAdmin
      .from("email_blacklist")
      .upsert(
        { email, reason: "Unsubscribed via email link", source: "agent_email_template", added_at: new Date().toISOString() },
        { onConflict: "email" }
      )
    if (error) {
      console.error("[unsubscribe] upsert failed:", error.message)
      return { ok: false, value: "Something went wrong. Email support@usforeclosureleads.com to be removed." }
    }
    return { ok: true, value: email }
  } catch (e) {
    console.error("[unsubscribe] error:", e instanceof Error ? e.message : e)
    return { ok: false, value: "Something went wrong. Email support@usforeclosureleads.com to be removed." }
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (email) {
    const r = await doUnsubscribe(email)
    return r.ok ? donePage(r.value) : formPage(email, r.value)
  }
  return formPage()
}

export async function POST(req: NextRequest) {
  let email = ""
  const ct = req.headers.get("content-type") || ""
  try {
    if (ct.includes("form")) {
      const fd = await req.formData()
      email = String(fd.get("email") || "")
    } else {
      const j = await req.json()
      email = String(j.email || "")
    }
  } catch {
    /* ignore parse errors -> validation catches empty */
  }
  const r = await doUnsubscribe(email)
  return r.ok ? donePage(r.value) : formPage(email, r.value)
}
