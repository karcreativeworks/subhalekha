import { ObjectId } from "mongodb"

import type { Event, GalleryBlock, VideoBlock } from "@/app/types/gallery"
import { getDb } from "@/lib/db/mongodb"

export async function isEventSlugTaken(
  eventSlug: string,
  excludeId?: string,
): Promise<boolean> {
  const db = await getDb()
  const existing = await db.collection<Event>("events").findOne({ eventSlug })
  if (!existing) {
    return false
  }
  if (excludeId && ObjectId.isValid(excludeId)) {
    return existing._id!.toString() !== excludeId
  }
  return true
}

export async function isGalleryBlockSlugTaken(
  galleryBlockSlug: string,
  excludeId?: string,
): Promise<boolean> {
  const db = await getDb()
  const existing = await db
    .collection<GalleryBlock>("galleryBlocks")
    .findOne({ galleryBlockSlug })
  if (!existing) {
    return false
  }
  if (excludeId && ObjectId.isValid(excludeId)) {
    return existing._id!.toString() !== excludeId
  }
  return true
}

export async function isVideoBlockSlugTaken(
  videoBlockSlug: string,
  excludeId?: string,
): Promise<boolean> {
  const db = await getDb()
  const existing = await db
    .collection<VideoBlock>("videoBlocks")
    .findOne({ videoBlockSlug })
  if (!existing) {
    return false
  }
  if (excludeId && ObjectId.isValid(excludeId)) {
    return existing._id!.toString() !== excludeId
  }
  return true
}
