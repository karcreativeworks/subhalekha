import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { SangeetPerformance } from "@/app/types/sangeet-performance"
import { SANGEET_PERFORMANCES_COLLECTION } from "@/lib/db/sangeet-performances"
import { getDb } from "@/lib/db/mongodb"
import { toSangeetPerformancePublic } from "@/lib/sangeet/normalize-performance"
import { parseSangeetPerformanceBody } from "@/lib/sangeet/parse-performance-body"
import {
  findPerformanceBySubmissionToken,
  parseSubmissionToken,
} from "@/lib/sangeet/submission-token"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const submissionToken = parseSubmissionToken(body)

    if (!submissionToken) {
      return NextResponse.json(
        { error: "Submission token is required" },
        { status: 400 },
      )
    }

    const existing = await findPerformanceBySubmissionToken(id, submissionToken)
    if (!existing) {
      return NextResponse.json(
        { error: "Performance not found or not authorized" },
        { status: 403 },
      )
    }

    const parsed = parseSangeetPerformanceBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const db = await getDb()
    const result = await db
      .collection<SangeetPerformance>(SANGEET_PERFORMANCES_COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...parsed.data,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      )

    if (!result) {
      return NextResponse.json({ error: "Performance not found" }, { status: 404 })
    }

    return NextResponse.json(toSangeetPerformancePublic(result))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update performance"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    let body: unknown = null
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = await request.json()
    }
    let submissionToken = parseSubmissionToken(body)
    if (!submissionToken) {
      const queryToken = new URL(request.url).searchParams.get("submissionToken")
      submissionToken =
        queryToken && queryToken.trim() ? queryToken.trim() : null
    }

    if (!submissionToken) {
      return NextResponse.json(
        { error: "Submission token is required" },
        { status: 400 },
      )
    }

    const existing = await findPerformanceBySubmissionToken(id, submissionToken)
    if (!existing) {
      return NextResponse.json(
        { error: "Performance not found or not authorized" },
        { status: 403 },
      )
    }

    const db = await getDb()
    const result = await db
      .collection(SANGEET_PERFORMANCES_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Performance not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete performance"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
