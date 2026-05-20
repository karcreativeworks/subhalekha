import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextRequest, NextResponse } from "next/server"

import { requireAdminAccess } from "@/lib/auth/require-access"

const s3Client = new S3Client({
  region: "ap-south-1",
  endpoint: process.env.SPACES_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: false,
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess("mediaUploader")
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get("filename")
    const contentType = searchParams.get("contentType")

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and contentType are required" },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
    const key = `subhalekha/${timestamp}-${sanitizedFilename}`

    const command = new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const cdnHost =
      process.env.SPACES_NORMAL_ENDPOINT?.replace(/^https?:\/\//, "").replace(
        /\/$/,
        ""
      ) ??
      process.env.CLOUDFLARE_IMAGE_ZONE?.replace(/^https?:\/\//, "").replace(
        /\/$/,
        ""
      )
    const baseUrl =
      cdnHost != null
        ? `https://${cdnHost}`
        : process.env.SPACES_ENDPOINT?.replace(
            "https://",
            `https://${process.env.SPACES_BUCKET}.`
          )
    const publicUrl = `${baseUrl}/${key}`

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
      filename: sanitizedFilename,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload URL failed"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
