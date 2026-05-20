import { ObjectId } from "mongodb"

import type { Event, GalleryBlock } from "@/app/types/gallery"
import { getDb } from "@/lib/db/mongodb"

export async function isEventSlugTaken(
  clientId: string,
  eventSlug: string,
  excludeId?: string,
): Promise<boolean> {
  const db = await getDb()
  const query: Record<string, unknown> = { clientId, eventSlug }
  if (excludeId && ObjectId.isValid(excludeId)) {
    query._id = { $ne: new ObjectId(excludeId) }
  }
  const existing = await db.collection<Event>("events").findOne(query)
  return Boolean(existing)
}

export async function isGalleryBlockSlugTaken(
  clientId: string,
  galleryBlockSlug: string,
  excludeId?: string,
): Promise<boolean> {
  const db = await getDb()
  const query: Record<string, unknown> = { clientId, galleryBlockSlug }
  if (excludeId && ObjectId.isValid(excludeId)) {
    query._id = { $ne: new ObjectId(excludeId) }
  }
  const existing = await db.collection<GalleryBlock>("galleryBlocks").findOne(query)
  return Boolean(existing)
}
