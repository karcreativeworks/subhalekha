import { ObjectId, type Collection } from "mongodb"

import type { SangeetPerformance } from "@/app/types/sangeet-performance"
import type { SangeetPerformanceListResponse } from "@/app/types/sangeet-performance"
import { getDb } from "@/lib/db/mongodb"
import { SANGEET_PERFORMANCES_PAGE_SIZE } from "@/lib/sangeet/pagination"
import { toSangeetPerformancePublic } from "@/lib/sangeet/normalize-performance"

export const SANGEET_PERFORMANCES_COLLECTION = "sangeetPerformances"

function compareSangeetPerformances(
  a: SangeetPerformance,
  b: SangeetPerformance,
): number {
  const aOrder =
    typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER
  const bOrder =
    typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER
  if (aOrder !== bOrder) {
    return aOrder - bOrder
  }

  const aCreated = new Date(a.createdAt).getTime()
  const bCreated = new Date(b.createdAt).getTime()
  return aCreated - bCreated
}

function sortSangeetPerformances(docs: SangeetPerformance[]) {
  return [...docs].sort(compareSangeetPerformances)
}

async function ensureSangeetPerformanceSortOrders(
  collection: Collection<SangeetPerformance>,
) {
  const docs = await collection.find({}).toArray()
  const withoutOrder = docs.filter((doc) => typeof doc.sortOrder !== "number")
  if (withoutOrder.length === 0) {
    return
  }

  const withOrder = docs
    .filter((doc) => typeof doc.sortOrder === "number")
    .sort((a, b) => (a.sortOrder as number) - (b.sortOrder as number))

  const maxOrder = withOrder.at(-1)?.sortOrder ?? -1
  const unordered = withoutOrder.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  await collection.bulkWrite(
    unordered.map((doc, index) => ({
      updateOne: {
        filter: { _id: doc._id! },
        update: { $set: { sortOrder: maxOrder + 1 + index } },
      },
    })),
  )
}

export async function getNextSangeetPerformanceSortOrder() {
  const db = await getDb()
  const collection = db.collection<SangeetPerformance>(
    SANGEET_PERFORMANCES_COLLECTION,
  )
  await ensureSangeetPerformanceSortOrders(collection)

  const latest = await collection
    .find({})
    .sort({ sortOrder: -1 })
    .limit(1)
    .project({ sortOrder: 1 })
    .next()

  return (latest?.sortOrder ?? -1) + 1
}

export async function listSangeetPerformances() {
  const db = await getDb()
  const collection = db.collection<SangeetPerformance>(
    SANGEET_PERFORMANCES_COLLECTION,
  )
  await ensureSangeetPerformanceSortOrders(collection)
  const docs = await collection.find({}).toArray()

  return sortSangeetPerformances(docs).map(toSangeetPerformancePublic)
}

export async function listSangeetPerformancesPaginated(
  page: number,
  pageSize: number = SANGEET_PERFORMANCES_PAGE_SIZE,
): Promise<SangeetPerformanceListResponse> {
  const db = await getDb()
  const collection = db.collection<SangeetPerformance>(
    SANGEET_PERFORMANCES_COLLECTION,
  )
  await ensureSangeetPerformanceSortOrders(collection)

  const docs = await collection.find({}).toArray()
  const sorted = sortSangeetPerformances(docs)
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const skip = (safePage - 1) * pageSize
  const pageDocs = sorted.slice(skip, skip + pageSize)

  return {
    items: pageDocs.map(toSangeetPerformancePublic),
    page: safePage,
    pageSize,
    total,
    totalPages,
  }
}

export async function reorderSangeetPerformances(orderedIds: string[]) {
  if (!orderedIds.length) {
    throw new Error("orderedIds is required")
  }

  const uniqueIds = new Set(orderedIds)
  if (uniqueIds.size !== orderedIds.length) {
    throw new Error("Duplicate performance ids")
  }

  for (const id of orderedIds) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid performance id")
    }
  }

  const db = await getDb()
  const collection = db.collection<SangeetPerformance>(
    SANGEET_PERFORMANCES_COLLECTION,
  )
  const objectIds = orderedIds.map((id) => new ObjectId(id))
  const existingCount = await collection.countDocuments({
    _id: { $in: objectIds },
  })

  if (existingCount !== orderedIds.length) {
    throw new Error("One or more performances were not found")
  }

  const totalCount = await collection.countDocuments({})
  if (totalCount !== orderedIds.length) {
    throw new Error("orderedIds must include every performance")
  }

  const now = new Date()
  await collection.bulkWrite(
    orderedIds.map((id, sortOrder) => ({
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: { $set: { sortOrder, updatedAt: now } },
      },
    })),
  )
}
