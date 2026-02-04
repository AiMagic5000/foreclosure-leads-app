import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "coreypearsonemail@gmail.com"

async function verifyAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  return email === ADMIN_EMAIL.toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fileType = formData.get("type") as string | null

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!fileType || !["poster", "video", "resource"].includes(fileType)) {
      return NextResponse.json({ error: "type must be poster, video, or resource" }, { status: 400 })
    }

    const maxSize = fileType === "video" ? 500 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMb = maxSize / (1024 * 1024)
      return NextResponse.json({ error: `File too large. Max ${maxMb}MB for ${fileType}` }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "bin"
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase()
    const storagePath = `training/${fileType}s/${Date.now()}-${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from("training-files")
      .upload(storagePath, buffer, {
        contentType: file.type || `application/${ext}`,
        upsert: false,
      })

    if (uploadError) {
      // If bucket doesn't exist, try to create it
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
        await supabaseAdmin.storage.createBucket("training-files", {
          public: true,
          fileSizeLimit: 500 * 1024 * 1024,
        })

        const { error: retryError } = await supabaseAdmin.storage
          .from("training-files")
          .upload(storagePath, buffer, {
            contentType: file.type || `application/${ext}`,
            upsert: false,
          })

        if (retryError) {
          return NextResponse.json({ error: "Upload failed after bucket creation" }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("training-files")
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
