import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const maxDuration = 30

const WEBHOOK_SECRET = process.env.DOCUSEAL_WEBHOOK_SECRET || "usfr-ds-9f3a2c7b551e"
const DOCUSEAL_URL = process.env.DOCUSEAL_URL || "https://sign.usforeclosurerecovery.com"
const SIGNED_BUCKET = "signed-agreements"

// DocuSeal fires this on form.completed. Payload shape:
// { event_type: "form.completed", data: { id, slug, external_id, email, name,
//   completed_at, documents: [{ name, url }], ... } }
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    if (url.searchParams.get("t") !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const payload = await req.json().catch(() => null)
    const event = payload?.event_type || payload?.event
    const d = payload?.data || payload
    if (event !== "form.completed") {
      // acknowledge other events without acting
      return NextResponse.json({ ok: true, ignored: event })
    }

    // external_id is the leadId we set on the submitter; slug is the signer slug.
    const leadId: string | undefined = d?.external_id || d?.submission?.external_id
    const slug: string | undefined = d?.slug
    const signedAt = d?.completed_at || new Date().toISOString()
    const claimantEmail: string = d?.email || ""
    const claimantName: string = d?.name || ""

    if (!leadId && !slug) {
      return NextResponse.json({ error: "no lead reference" }, { status: 400 })
    }

    // Download the completed PDF and store it (best-effort).
    let signedPdfUrl: string | null = null
    try {
      const docs = d?.documents || d?.submission?.documents || []
      const pdfDoc = docs.find((x: { name?: string; url?: string }) => (x.url || "").toLowerCase().includes(".pdf")) || docs[0]
      if (pdfDoc?.url) {
        const pdfRes = await fetch(pdfDoc.url, { signal: AbortSignal.timeout(20000) })
        if (pdfRes.ok) {
          const buf = Buffer.from(await pdfRes.arrayBuffer())
          const path = `${leadId || slug}/${slug || Date.now()}.pdf`
          const { error: upErr } = await supabaseAdmin.storage
            .from(SIGNED_BUCKET)
            .upload(path, buf, { contentType: "application/pdf", upsert: true })
          if (!upErr) {
            signedPdfUrl = `${supabaseUrl()}/storage/v1/object/${SIGNED_BUCKET}/${path}`
          }
        }
      }
    } catch (e) {
      console.error("[docuseal-webhook] pdf store failed:", e instanceof Error ? e.message : e)
    }

    // Mark the lead signed.
    const update: Record<string, unknown> = {
      agreement_signed: true,
      agreement_signed_at: signedAt,
    }
    if (signedPdfUrl) update.agreement_signed_pdf_url = signedPdfUrl
    if (slug) update.agreement_docuseal_id = slug

    if (leadId) {
      const { data: upd } = await supabaseAdmin.from("foreclosure_leads").update(update).eq("id", leadId).select("id")
      if ((!upd || upd.length === 0) && slug) {
        await supabaseAdmin.from("foreclosure_leads").update(update).eq("agreement_docuseal_id", slug)
      }
    } else if (slug) {
      await supabaseAdmin.from("foreclosure_leads").update(update).eq("agreement_docuseal_id", slug)
    }

    // Money moment -> queue an xscore10 SMTP alert (R740xd notifier picks it up).
    try {
      await supabaseAdmin.from("signed_agreement_alerts").insert({
        lead_id: leadId || null,
        claimant_name: claimantName || null,
        claimant_email: claimantEmail || null,
        signed_pdf_url: signedPdfUrl,
      })
    } catch (e) {
      console.error("[docuseal-webhook] alert insert failed:", e instanceof Error ? e.message : e)
    }

    return NextResponse.json({ ok: true, leadId: leadId || null, stored: !!signedPdfUrl })
  } catch (err) {
    console.error("[docuseal-webhook] error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}

function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "")
}
