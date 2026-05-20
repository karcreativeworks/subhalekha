import { ObjectId } from "mongodb"

import type { Event, EventBlockRef, GalleryBlock } from "@/app/types/gallery"
import { normalizeEventBlockRefs } from "@/lib/gallery/event-block-order"
import { getDb } from "@/lib/db/mongodb"

export async function appendBlockToEvent(
  eventId: string,
  clientId: string,
  blockId: string,
): Promise<void> {
  if (!ObjectId.isValid(eventId)) return

  const db = await getDb()
  const event = await db.collection<Event>("events").findOne({
    _id: new ObjectId(eventId),
    clientId,
  })
  if (!event) return

  const blocks = event.blocks ?? []
  if (blocks.some((entry) => entry.blockId === blockId)) return

  const maxOrder = blocks.reduce(
    (max, entry) => Math.max(max, entry.blockOrder),
    -1,
  )
  const next = normalizeEventBlockRefs([
    ...blocks,
    { blockId, blockOrder: maxOrder + 1 },
  ])

  await db.collection<Event>("events").updateOne(
    { _id: new ObjectId(eventId), clientId },
    { $set: { blocks: next, updatedAt: new Date() } },
  )
}

export async function removeBlockFromEvent(
  eventId: string,
  clientId: string,
  blockId: string,
): Promise<void> {
  if (!ObjectId.isValid(eventId)) return

  const db = await getDb()
  const event = await db.collection<Event>("events").findOne({
    _id: new ObjectId(eventId),
    clientId,
  })
  if (!event) return

  const next = normalizeEventBlockRefs(
    (event.blocks ?? []).filter((entry) => entry.blockId !== blockId),
  )

  await db.collection<Event>("events").updateOne(
    { _id: new ObjectId(eventId), clientId },
    { $set: { blocks: next, updatedAt: new Date() } },
  )
}

export async function moveBlockBetweenEvents(
  fromEventId: string,
  toEventId: string,
  clientId: string,
  blockId: string,
): Promise<void> {
  if (fromEventId === toEventId) return
  await removeBlockFromEvent(fromEventId, clientId, blockId)
  await appendBlockToEvent(toEventId, clientId, blockId)
}

export async function validateEventBlockRefs(
  eventId: string,
  clientId: string,
  blocks: EventBlockRef[],
): Promise<{ ok: true; normalized: EventBlockRef[] } | { ok: false; error: string }> {
  if (!ObjectId.isValid(eventId)) {
    return { ok: false, error: "Invalid event id" }
  }

  const normalized = normalizeEventBlockRefs(blocks)
  const db = await getDb()

  const childBlocks = await db
    .collection<GalleryBlock>("galleryBlocks")
    .find({ parentEventId: eventId, clientId })
    .project({ _id: 1 })
    .toArray()

  const childIds = new Set(childBlocks.map((block) => block._id!.toString()))

  if (normalized.length !== childIds.size) {
    return {
      ok: false,
      error: "blocks must include every gallery block for this event exactly once",
    }
  }

  for (const entry of normalized) {
    if (!ObjectId.isValid(entry.blockId)) {
      return { ok: false, error: "Invalid block id in blocks" }
    }
    if (!childIds.has(entry.blockId)) {
      return {
        ok: false,
        error: "blocks contains an id that does not belong to this event",
      }
    }
  }

  return { ok: true, normalized }
}
