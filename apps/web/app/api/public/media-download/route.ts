import { NextRequest, NextResponse } from "next/server"

import {
  isAllowedMediaDownloadUrl,
} from "@/lib/media/download-image"

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim() || "photo.jpg"
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")
    const filename = sanitizeFilename(searchParams.get("filename") ?? "photo.jpg")

    if (!url || !isAllowedMediaDownloadUrl(url)) {
      return NextResponse.json({ error: "Invalid download URL" }, { status: 400 })
    }

    const upstream = await fetch(url)
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 502 },
      )
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream"
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Download failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
