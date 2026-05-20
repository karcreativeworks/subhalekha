import { ObjectId } from "mongodb"

import type { Event } from "@/app/types/gallery"
import { getDb } from "@/lib/db/mongodb"

export async function verifyParentEvent(
  parentEventId: string,
  clientId: string,
): Promise<boolean> {
  if (!ObjectId.isValid(parentEventId)) {
    return false
  }

  const db = await getDb()
  const event = await db.collection<Event>("events").findOne({
    _id: new ObjectId(parentEventId),
    clientId,
  })

  return Boolean(event)
}
