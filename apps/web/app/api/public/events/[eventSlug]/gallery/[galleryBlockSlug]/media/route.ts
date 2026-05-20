import { NextRequest, NextResponse } from "next/server"

import {
  getPublicEventBySlug,
  getPublicGalleryBlock,
  getPublicMediaForGalleryBlock,
} from "@/lib/gallery/public-event"
import {
  PUBLIC_GALLERY_MEDIA_MAX_PAGE_SIZE,
  PUBLIC_GALLERY_MEDIA_PAGE_SIZE,
} from "@/lib/gallery/public-media-constants"

interface RouteParams {
  params: Promise<{ eventSlug: string; galleryBlockSlug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { eventSlug, galleryBlockSlug } = await params
  const { searchParams } = new URL(request.url)

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1,
  )
  const limit = Math.min(
    PUBLIC_GALLERY_MEDIA_MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(
        searchParams.get("limit") || String(PUBLIC_GALLERY_MEDIA_PAGE_SIZE),
        10,
      ) || PUBLIC_GALLERY_MEDIA_PAGE_SIZE,
    ),
  )

  const event = await getPublicEventBySlug(eventSlug)
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const block = await getPublicGalleryBlock(event, galleryBlockSlug)
  if (!block) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
  }

  const result = await getPublicMediaForGalleryBlock(block, { page, limit })

  return NextResponse.json(result)
}
