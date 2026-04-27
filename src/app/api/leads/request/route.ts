import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendAdminNotification } from "@/lib/email"

const LEAD_LIMITS: Record<string, number> = {
  basic: 10,
  partnership: 25,
  owner_operator: 50,
  admin: 9999,
}

function buildLeadRequestHtml(
  userEmail: string,
  userName: string,
  accountType: string,
  leadCount: number,
  statePreference: string,
  notes: string
): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
<div style="background:#1E3A5F;padding:20px 24px;color:#fff">
<h2 style="margin:0;font-size:18px">New Lead Request Submitted</h2>
</div>
<div style="padding:24px">
<p style="margin:0 0 16px;color:#475569">A user has submitted a lead request from the dashboard.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;width:180px">User Email</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${userEmail}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">User Name</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${userName || "N/A"}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">Account Type</td><td style="padding:8px 12px;border:1px solid #e2e8f0"><strong style="color:#059669">${accountType.replace("_", " ").toUpperCase()}</strong></td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">Leads Requested</td><td style="padding:8px 12px;border:1px solid #e2e8f0"><strong style="color:#2563eb;font-size:18px">${leadCount}</strong></td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">State Preference</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${statePreference || "No preference"}</td></tr>
${notes ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc">Notes</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${notes}</td></tr>` : ""}
</table>
<div style="margin-top:20px;padding:16px;background:#fef9f0;border:1px solid #f59e0b;border-radius:8px">
<p style="margin:0;color:#92400e;font-size:14px"><strong>Action Required:</strong> Assign ${leadCount} leads to this user via the Admin panel > Lead Assignment.</p>
</div>
</div></div></body></html>`
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "unknown"
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || ""

  const body = await request.json()
  const { leadCount, statePreference, notes } = body

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("account_type")
    .eq("clerk_id", userId)
    .single()

  const accountType = dbUser?.account_type || "basic"
  const maxLeads = LEAD_LIMITS[accountType] || 10

  const requestedCount = Math.min(Math.max(1, Number(leadCount) || 1), maxLeads)

  const result = await sendAdminNotification(
    `Lead Request: ${requestedCount} leads - ${userEmail} (${accountType})`,
    buildLeadRequestHtml(userEmail, userName, accountType, requestedCount, statePreference || "", notes || "")
  )

  if (!result.success) {
    console.error("Lead request email failed:", result.error)
    return NextResponse.json({ error: "Failed to send request. Please try again." }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `Lead request for ${requestedCount} leads has been submitted. Our team will assign them within 1-2 business days.`,
    requested: requestedCount,
  })
}
