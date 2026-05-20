import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { Event, UpdateEventRequest } from "@/app/types/gallery"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { parseDateField } from "@/lib/gallery/parse-date"
import { toEventPublic } from "@/lib/gallery/normalize"
import { parseSlugInput } from "@/lib/gallery/slug"
import { isValidTeam } from "@/lib/gallery/team"
import { isEventSlugTaken } from "@/lib/gallery/unique-slug"
import { getDb } from "@/lib/db/mongodb"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.EVENTS_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 })
    }

    const db = await getDb()
    const event = await db.collection<Event>("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(toEventPublic(event))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireAdminAccess(ADMIN_ACCESS.EVENTS_MANAGER)
    const { id } = await params
    const body = (await request.json()) as UpdateEventRequest

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 })
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
      }
      update.title = body.title.trim()
    }
    if (body.eventSlug !== undefined) {
      const slugResult = parseSlugInput(body.eventSlug, "eventSlug")
      if ("error" in slugResult) {
        return NextResponse.json({ error: slugResult.error }, { status: 400 })
      }
      if (await isEventSlugTaken(clientId, slugResult.slug, id)) {
        return NextResponse.json(
          { error: "An event with this slug already exists" },
          { status: 409 },
        )
      }
      update.eventSlug = slugResult.slug
    }
    if (body.subtitle !== undefined) {
      update.subtitle = body.subtitle.trim() || undefined
    }
    if (body.description !== undefined) {
      update.description = body.description.trim() || undefined
    }
    if (body.tags !== undefined) update.tags = body.tags
    if (body.team !== undefined) {
      if (!isValidTeam(body.team)) {
        return NextResponse.json(
          { error: "team must be bride, groom, or both" },
          { status: 400 },
        )
      }
      update.team = body.team
    }
    if (body.eventDate !== undefined) {
      const eventDate = parseDateField(body.eventDate, "eventDate")
      if (!eventDate) {
        return NextResponse.json(
          { error: "Valid eventDate is required" },
          { status: 400 },
        )
      }
      update.eventDate = eventDate
    }
    if (body.eventTime !== undefined) {
      if (!body.eventTime.trim()) {
        return NextResponse.json(
          { error: "eventTime cannot be empty" },
          { status: 400 },
        )
      }
      update.eventTime = body.eventTime.trim()
    }
    if (body.coverPicHorizontal !== undefined) {
      update.coverPicHorizontal = body.coverPicHorizontal.trim()
    }
    if (body.coverPicVertical !== undefined) {
      update.coverPicVertical = body.coverPicVertical.trim()
    }

    const db = await getDb()
    const result = await db.collection<Event>("events").findOneAndUpdate(
      { _id: new ObjectId(id), clientId },
      { $set: update },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(toEventPublic(result))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireAdminAccess(ADMIN_ACCESS.EVENTS_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection("events").deleteOne({
      _id: new ObjectId(id),
      clientId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await db.collection("galleryBlocks").deleteMany({
      parentEventId: id,
      clientId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
