import { ObjectId } from "mongodb"

import type {
  Event,
  EventBlockRef,
  EventBlockType,
  GalleryBlock,
  VideoBlock,
} from "@/app/types/gallery"
import {
  normalizeEventBlockRefs,
  resolveEventBlockType,
} from "@/lib/gallery/event-block-order"
import { getDb } from "@/lib/db/mongodb"

function blockRefKey(blockId: string, blockType: EventBlockType): string {
  return `${blockType}:${blockId}`
}

export async function appendBlockToEvent(
  eventId: string,
  blockId: string,
  blockType: EventBlockType = "gallery",
): Promise<void> {
  if (!ObjectId.isValid(eventId)) return

  const db = await getDb()
  const event = await db.collection<Event>("events").findOne({
    _id: new ObjectId(eventId),
  })
  if (!event) return

  const blocks = event.blocks ?? []
  if (
    blocks.some(
      (entry) =>
        entry.blockId === blockId &&
        resolveEventBlockType(entry) === blockType,
    )
  ) {
    return
  }

  const maxOrder = blocks.reduce(
    (max, entry) => Math.max(max, entry.blockOrder),
    -1,
  )
  const next = normalizeEventBlockRefs([
    ...blocks,
    {
      blockId,
      blockOrder: maxOrder + 1,
      ...(blockType === "video" ? { blockType: "video" as const } : {}),
    },
  ])

  await db.collection<Event>("events").updateOne(
    { _id: new ObjectId(eventId) },
    { $set: { blocks: next, updatedAt: new Date() } },
  )
}

export async function removeBlockFromEvent(
  eventId: string,
  blockId: string,
  blockType?: EventBlockType,
): Promise<void> {
  if (!ObjectId.isValid(eventId)) return

  const db = await getDb()
  const event = await db.collection<Event>("events").findOne({
    _id: new ObjectId(eventId),
  })
  if (!event) return

  const next = normalizeEventBlockRefs(
    (event.blocks ?? []).filter((entry) => {
      if (entry.blockId !== blockId) return true
      if (!blockType) return false
      return resolveEventBlockType(entry) !== blockType
    }),
  )

  await db.collection<Event>("events").updateOne(
    { _id: new ObjectId(eventId) },
    { $set: { blocks: next, updatedAt: new Date() } },
  )
}

export async function moveBlockBetweenEvents(
  fromEventId: string,
  toEventId: string,
  blockId: string,
  blockType: EventBlockType = "gallery",
): Promise<void> {
  if (fromEventId === toEventId) return
  await removeBlockFromEvent(fromEventId, blockId, blockType)
  await appendBlockToEvent(toEventId, blockId, blockType)
}

async function getEventBlockIdentities(
  eventId: string,
): Promise<{ blockId: string; blockType: EventBlockType }[]> {
  const db = await getDb()
  const [galleryBlocks, videoBlocks] = await Promise.all([
    db
      .collection<GalleryBlock>("galleryBlocks")
      .find({ parentEventId: eventId })
      .toArray(),
    db
      .collection<VideoBlock>("videoBlocks")
      .find({ parentEventId: eventId })
      .toArray(),
  ])

  return [
    ...galleryBlocks.map((block) => ({
      blockId: block._id!.toString(),
      blockType: "gallery" as const,
    })),
    ...videoBlocks.map((block) => ({
      blockId: block._id!.toString(),
      blockType: "video" as const,
    })),
  ]
}

export async function validateEventBlockRefs(
  eventId: string,
  blocks: EventBlockRef[],
): Promise<{ ok: true; normalized: EventBlockRef[] } | { ok: false; error: string }> {
  if (!ObjectId.isValid(eventId)) {
    return { ok: false, error: "Invalid event id" }
  }

  const normalized = normalizeEventBlockRefs(blocks)
  const identities = await getEventBlockIdentities(eventId)
  const expectedKeys = new Set(
    identities.map((b) => blockRefKey(b.blockId, b.blockType)),
  )

  if (normalized.length !== expectedKeys.size) {
    return {
      ok: false,
      error:
        "blocks must include every gallery and video block for this event exactly once",
    }
  }

  for (const entry of normalized) {
    if (!ObjectId.isValid(entry.blockId)) {
      return { ok: false, error: "Invalid block id in blocks" }
    }
    const type = resolveEventBlockType(entry)
    const key = blockRefKey(entry.blockId, type)
    if (!expectedKeys.has(key)) {
      return {
        ok: false,
        error: "blocks contains an id that does not belong to this event",
      }
    }
  }

  return { ok: true, normalized }
}
