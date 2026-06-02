import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { SangeetPerformance } from "@/app/types/sangeet-performance"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { SANGEET_PERFORMANCES_COLLECTION } from "@/lib/db/sangeet-performances"
import { getDb } from "@/lib/db/mongodb"
import { toSangeetPerformancePublic } from "@/lib/sangeet/normalize-performance"
import { parseSangeetPerformanceBody } from "@/lib/sangeet/parse-performance-body"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.SANGEET_PLAN_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid performance id" }, { status: 400 })
    }

    const body = await request.json()
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
    return apiErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.SANGEET_PLAN_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid performance id" }, { status: 400 })
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
    return apiErrorResponse(error)
  }
}
