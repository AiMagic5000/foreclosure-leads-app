import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// mytrustsoftware.com is one of our own properties but blocks cross-site framing
// (X-Frame-Options). We proxy it through our own origin so the Contingent
// Attorneys Network tab can embed it. A <base> tag is injected so the site's
// relative URLs resolve back to the real domain.
const TARGET = "https://www.mytrustsoftware.com/"

export async function GET() {
  try {
    const res = await fetch(TARGET, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    })

    let html = await res.text()
    if (!/<base\s/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${TARGET}">`)
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Allow our own dashboard to frame this proxied content.
        "Content-Security-Policy": "frame-ancestors 'self' https://usforeclosureleads.com",
        "Cache-Control": "public, max-age=300",
      },
    })
  } catch {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:40px;text-align:center;color:#334155">
        <p>Couldn't load the Trust Software portal here.</p>
        <p><a href="${TARGET}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600">Open it in a new tab &rarr;</a></p>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  }
}
