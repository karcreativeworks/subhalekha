import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { Event, UpdateEventBlocksRequest } from "@/app/types/gallery"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { validateEventBlockRefs } from "@/lib/gallery/event-blocks-db"
import { toEventPublic } from "@/lib/gallery/normalize"
import { getDb } from "@/lib/db/mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.EVENTS_MANAGER)
    const { id } = await params
    const body = (await request.json()) as UpdateEventBlocksRequest

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 })
    }

    if (!Array.isArray(body.blocks)) {
      return NextResponse.json(
        { error: "blocks array is required" },
        { status: 400 },
      )
    }

    const db = await getDb()
    const existing = await db.collection<Event>("events").findOne({
      _id: new ObjectId(id),
    })
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const validation = await validateEventBlockRefs(id, body.blocks)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const result = await db.collection("events").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          blocks: validation.normalized,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(toEventPublic(result as Event))
  } catch (error) {
    return apiErrorResponse(error)
  }
}
