import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const NOTIFY_EMAIL = "claim@usforeclosurerecovery.com"
const SMTP_HOST = "smtp.hostinger.com"
const SMTP_PORT = 465
const SMTP_USER = NOTIFY_EMAIL
const SMTP_PASS = process.env.IMAP_CLAIM_PASSWORD || "Thepassword#1234"

async function sendSmtpEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const tls = await import("tls")
    return new Promise((resolve) => {
      const socket = tls.connect(SMTP_PORT, SMTP_HOST, { rejectUnauthorized: false }, () => {
        let step = 0
        const commands = [
          `EHLO usforeclosureleads.com\r\n`,
          `AUTH LOGIN\r\n`,
          `${Buffer.from(SMTP_USER).toString("base64")}\r\n`,
          `${Buffer.from(SMTP_PASS).toString("base64")}\r\n`,
          `MAIL FROM:<${SMTP_USER}>\r\n`,
          `RCPT TO:<${to}>\r\n`,
          `DATA\r\n`,
          `From: "Foreclosure Recovery Inc." <${SMTP_USER}>\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.\r\n`,
          `QUIT\r\n`,
        ]

        socket.on("data", () => {
          if (step < commands.length) {
            socket.write(commands[step])
            step++
          }
        })
        socket.on("end", () => resolve(true))
        socket.on("error", () => resolve(false))
        setTimeout(() => { socket.destroy(); resolve(false) }, 15000)
      })
    })
  } catch {
    return false
  }
}

// GET: Fetch user's completed modules
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("user_training_progress")
      .select("module_id, completed_at")
      .eq("clerk_user_id", userId)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Mark a module as complete
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress || ""
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email

    const body = await request.json()
    const { module_id } = body

    if (!module_id) {
      return NextResponse.json({ error: "module_id is required" }, { status: 400 })
    }

    // Upsert progress record
    const { error: insertError } = await supabaseAdmin
      .from("user_training_progress")
      .upsert(
        {
          clerk_user_id: userId,
          user_email: email,
          user_name: name,
          module_id,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "clerk_user_id,module_id" }
      )

    if (insertError) {
      return NextResponse.json({ error: "Failed to save progress" }, { status: 500 })
    }

    // Check if ALL modules are now complete
    const { data: allModules } = await supabaseAdmin
      .from("training_modules")
      .select("id")

    const { data: userProgress } = await supabaseAdmin
      .from("user_training_progress")
      .select("module_id")
      .eq("clerk_user_id", userId)

    const totalModules = allModules?.length || 0
    const completedModules = userProgress?.length || 0
    const allComplete = totalModules > 0 && completedModules >= totalModules

    if (allComplete) {
      // Get full user info for notification
      const phone = user?.phoneNumbers?.[0]?.phoneNumber || "Not provided"
      const createdAt = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })
        : "Unknown"

      const completionDate = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Training Complete</h1>
            <p style="color: #d1fae5; margin: 8px 0 0; font-size: 14px;">A user has completed all training modules</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <h2 style="color: #111827; font-size: 18px; margin: 0 0 16px;">User Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Name</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${email}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${phone}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Account Created</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">${createdAt}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Completed At</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${completionDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Modules Done</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">${completedModules} of ${totalModules}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Clerk User ID</td><td style="padding: 8px 0; color: #6b7280; font-size: 12px; font-family: monospace;">${userId}</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
              <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">Action Required: Schedule one-on-one call training with this user.</p>
            </div>
          </div>
        </div>
      `

      await sendSmtpEmail(
        NOTIFY_EMAIL,
        `Training Complete: ${name} (${email}) -- Schedule 1-on-1 Call`,
        html
      )
    }

    return NextResponse.json({
      success: true,
      allComplete,
      completedModules,
      totalModules,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
