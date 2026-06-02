import type { SangeetPerformance } from "@/app/types/sangeet-performance"
import type { SangeetPerformanceListResponse } from "@/app/types/sangeet-performance"
import { getDb } from "@/lib/db/mongodb"
import { SANGEET_PERFORMANCES_PAGE_SIZE } from "@/lib/sangeet/pagination"
import { toSangeetPerformancePublic } from "@/lib/sangeet/normalize-performance"

export const SANGEET_PERFORMANCES_COLLECTION = "sangeetPerformances"

const newestFirst = { createdAt: -1 as const }

export async function listSangeetPerformances() {
  const db = await getDb()
  const docs = await db
    .collection<SangeetPerformance>(SANGEET_PERFORMANCES_COLLECTION)
    .find({})
    .sort(newestFirst)
    .toArray()

  return docs.map(toSangeetPerformancePublic)
}

export async function listSangeetPerformancesPaginated(
  page: number,
  pageSize: number = SANGEET_PERFORMANCES_PAGE_SIZE,
): Promise<SangeetPerformanceListResponse> {
  const db = await getDb()
  const collection = db.collection<SangeetPerformance>(
    SANGEET_PERFORMANCES_COLLECTION,
  )

  const total = await collection.countDocuments({})
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const skip = (safePage - 1) * pageSize

  const docs = await collection
    .find({})
    .sort(newestFirst)
    .skip(skip)
    .limit(pageSize)
    .toArray()

  return {
    items: docs.map(toSangeetPerformancePublic),
    page: safePage,
    pageSize,
    total,
    totalPages,
  }
}
