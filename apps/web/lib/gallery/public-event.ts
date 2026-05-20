import { unstable_noStore as noStore } from "next/cache"
import { cache } from "react"

import type {
  Event,
  EventPublic,
  GalleryBlock,
  GalleryBlockPublic,
  GalleryBlockPublicWithPicCount,
} from "@/app/types/gallery"
import type { MediaFile } from "@/app/types/media"
import { getDb } from "@/lib/db/mongodb"
import {
  reconcileEventBlockRefs,
  sortByEventBlockOrder,
} from "@/lib/gallery/event-block-order"
import { toEventPublic, toGalleryBlockPublic } from "@/lib/gallery/normalize"
import { PUBLIC_GALLERY_MEDIA_PAGE_SIZE } from "@/lib/gallery/public-media-constants"
import { isPublicDbConfigured } from "@/lib/site/public-client"
import { normalizeMediaFile } from "@/lib/media/normalize-media"

export { PUBLIC_GALLERY_MEDIA_PAGE_SIZE } from "@/lib/gallery/public-media-constants"

export async function getPublicEventBySlug(
  eventSlug: string
): Promise<EventPublic | null> {
  if (!isPublicDbConfigured()) {
    return null
  }

  const db = await getDb()
  const doc = await db.collection<Event>("events").findOne({
    eventSlug,
  })

  if (!doc) return null
  return toEventPublic(doc)
}

async function countPublicImagesForGalleryBlock(
  block: GalleryBlockPublic
): Promise<number> {
  if (!isPublicDbConfigured() || !block.tags.length) {
    return 0
  }

  const db = await getDb()
  const query = {
    tags: { $in: block.tags },
    contentType: "image" as const,
  }

  return db.collection<MediaFile>("mediaFiles").countDocuments(query)
}

export async function getPublicGalleryBlocksForEvent(
  event: EventPublic
): Promise<GalleryBlockPublicWithPicCount[]> {
  if (!isPublicDbConfigured()) {
    return []
  }

  const db = await getDb()

  const blocks = await db
    .collection<GalleryBlock>("galleryBlocks")
    .find({
      parentEventId: event.id,
    })
    .toArray()

  if (!blocks.length) return []

  const publicBlocks = blocks.map(toGalleryBlockPublic)
  const blockIds = publicBlocks.map((b) => b.id)
  const orderedRefs = reconcileEventBlockRefs(event.blocks, blockIds)

  const ordered = sortByEventBlockOrder(publicBlocks, orderedRefs)

  return Promise.all(
    ordered.map(async (block) => ({
      ...block,
      picCount: await countPublicImagesForGalleryBlock(block),
    }))
  )
}

export async function getPublicGalleryBlock(
  event: EventPublic,
  galleryBlockSlug: string
): Promise<GalleryBlockPublic | null> {
  if (!isPublicDbConfigured()) {
    return null
  }

  const db = await getDb()
  const doc = await db.collection<GalleryBlock>("galleryBlocks").findOne({
    parentEventId: event.id,
    galleryBlockSlug,
  })

  if (!doc) return null
  return toGalleryBlockPublic(doc)
}

export interface PublicGalleryMediaPage {
  files: MediaFile[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

export async function getPublicMediaForGalleryBlock(
  block: GalleryBlockPublic,
  options?: { page?: number; limit?: number }
): Promise<PublicGalleryMediaPage> {
  const limit = options?.limit ?? PUBLIC_GALLERY_MEDIA_PAGE_SIZE
  const page = Math.max(1, options?.page ?? 1)
  const offset = (page - 1) * limit

  if (!isPublicDbConfigured() || !block.tags.length) {
    return { files: [], total: 0, hasMore: false, page, limit }
  }

  const db = await getDb()
  const query = {
    tags: { $in: block.tags },
    contentType: "image" as const,
  }

  const collection = db.collection<MediaFile>("mediaFiles")

  const [files, total] = await Promise.all([
    collection
      .find(query)
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    collection.countDocuments(query),
  ])

  const normalized = files.map(normalizeMediaFile)

  return {
    files: normalized,
    total,
    hasMore: offset + normalized.length < total,
    page,
    limit,
  }
}

/** All public events for site navigation (newest event date first). */
export const getPublicEventsList = cache(async (): Promise<EventPublic[]> => {
  noStore()
  if (!isPublicDbConfigured()) return []

  const db = await getDb()
  const docs = await db
    .collection<Event>("events")
    .find({})
    .sort({ eventDate: -1 })
    .toArray()

  return docs.map(toEventPublic)
})

/** First event slug for the homepage link helper. */
export async function getFirstPublicEventSlug(): Promise<string | null> {
  const events = await getPublicEventsList()
  return events[0]?.eventSlug ?? null
}
