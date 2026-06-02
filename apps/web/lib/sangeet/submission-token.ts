import { ObjectId } from "mongodb"

import type { SangeetPerformance } from "@/app/types/sangeet-performance"
import { SANGEET_PERFORMANCES_COLLECTION } from "@/lib/db/sangeet-performances"
import { getDb } from "@/lib/db/mongodb"

export function parseSubmissionToken(body: unknown): string | null {
  if (!body || typeof body !== "object") return null
  const token = (body as Record<string, unknown>).submissionToken
  return typeof token === "string" && token.trim() ? token.trim() : null
}

export async function findPerformanceBySubmissionToken(
  id: string,
  submissionToken: string,
): Promise<SangeetPerformance | null> {
  if (!ObjectId.isValid(id)) return null

  const db = await getDb()
  const doc = await db
    .collection<SangeetPerformance>(SANGEET_PERFORMANCES_COLLECTION)
    .findOne({ _id: new ObjectId(id) })

  if (!doc?.submissionToken || doc.submissionToken !== submissionToken) {
    return null
  }

  return doc
}

export function createSubmissionToken(): string {
  return crypto.randomUUID()
}
