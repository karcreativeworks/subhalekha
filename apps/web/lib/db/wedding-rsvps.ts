import type { WeddingRsvp, WeddingRsvpListResponse } from "@/app/types/wedding-rsvp"
import type { WeddingRsvpGang } from "@/app/types/wedding-rsvp"
import { getDb } from "@/lib/db/mongodb"
import { toWeddingRsvpPublic } from "@/lib/rsvp/normalize-rsvp"
import { WEDDING_RSVPS_PAGE_SIZE } from "@/lib/rsvp/pagination"

export const WEDDING_RSVPS_COLLECTION = "weddingRsvps"

const newestFirst = { createdAt: -1 as const }

export async function listWeddingRsvpsPaginated(
  page: number,
  pageSize: number = WEDDING_RSVPS_PAGE_SIZE,
  gang?: WeddingRsvpGang | "all",
): Promise<WeddingRsvpListResponse> {
  const db = await getDb()
  const collection = db.collection<WeddingRsvp>(WEDDING_RSVPS_COLLECTION)

  const filter = gang && gang !== "all" ? { gang } : {}

  const total = await collection.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const skip = (safePage - 1) * pageSize

  const docs = await collection
    .find(filter)
    .sort(newestFirst)
    .skip(skip)
    .limit(pageSize)
    .toArray()

  return {
    items: docs.map(toWeddingRsvpPublic),
    page: safePage,
    pageSize,
    total,
    totalPages,
  }
}
