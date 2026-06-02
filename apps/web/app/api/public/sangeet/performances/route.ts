import { NextRequest, NextResponse } from "next/server"

import type { SangeetPerformance } from "@/app/types/sangeet-performance"
import {
  listSangeetPerformancesPaginated,
  SANGEET_PERFORMANCES_COLLECTION,
} from "@/lib/db/sangeet-performances"
import { getDb } from "@/lib/db/mongodb"
import { SANGEET_PERFORMANCES_PAGE_SIZE } from "@/lib/sangeet/pagination"
import { toSangeetPerformancePublic } from "@/lib/sangeet/normalize-performance"
import { parseSangeetPerformanceBody } from "@/lib/sangeet/parse-performance-body"
import { createSubmissionToken } from "@/lib/sangeet/submission-token"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    )
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(
          searchParams.get("limit") || String(SANGEET_PERFORMANCES_PAGE_SIZE),
          10,
        ) || SANGEET_PERFORMANCES_PAGE_SIZE,
      ),
    )

    const result = await listSangeetPerformancesPaginated(page, limit)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch performances"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = parseSangeetPerformanceBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const now = new Date()
    const submissionToken = createSubmissionToken()
    const record: SangeetPerformance = {
      ...parsed.data,
      submissionToken,
      createdAt: now,
      updatedAt: now,
    }

    const db = await getDb()
    const result = await db
      .collection<SangeetPerformance>(SANGEET_PERFORMANCES_COLLECTION)
      .insertOne(record)

    return NextResponse.json(
      {
        ...toSangeetPerformancePublic({ ...record, _id: result.insertedId }),
        submissionToken,
      },
      { status: 201 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create performance"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
