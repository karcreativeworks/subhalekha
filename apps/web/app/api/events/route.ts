import { NextRequest, NextResponse } from "next/server"

import type { CreateEventRequest, Event } from "@/app/types/gallery"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import {
  requireAdminAccess,
  requireAdminAnyAccess,
} from "@/lib/auth/require-access"
import { parseDateField } from "@/lib/gallery/parse-date"
import { toEventPublic } from "@/lib/gallery/normalize"
import { parseSlugInput } from "@/lib/gallery/slug"
import { isValidTeam } from "@/lib/gallery/team"
import { isEventSlugTaken } from "@/lib/gallery/unique-slug"
import { getDb } from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAnyAccess([
      ADMIN_ACCESS.EVENTS_MANAGER,
      ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER,
    ])
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get("sort") || "eventDate"
    const order = searchParams.get("order") || "desc"

    const db = await getDb()
    const events = await db
      .collection<Event>("events")
      .find({})
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .toArray()

    return NextResponse.json(events.map(toEventPublic))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await requireAdminAccess(ADMIN_ACCESS.EVENTS_MANAGER)
    const body = (await request.json()) as CreateEventRequest

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!isValidTeam(body.team)) {
      return NextResponse.json(
        { error: "team must be bride, groom, or both" },
        { status: 400 },
      )
    }

    const eventDate = parseDateField(body.eventDate, "eventDate")
    if (!eventDate) {
      return NextResponse.json(
        { error: "Valid eventDate is required" },
        { status: 400 },
      )
    }

    if (!body.eventTime?.trim()) {
      return NextResponse.json(
        { error: "eventTime is required" },
        { status: 400 },
      )
    }

    const slugResult = parseSlugInput(body.eventSlug, "eventSlug")
    if ("error" in slugResult) {
      return NextResponse.json({ error: slugResult.error }, { status: 400 })
    }

    if (await isEventSlugTaken(slugResult.slug)) {
      return NextResponse.json(
        { error: "An event with this slug already exists" },
        { status: 409 },
      )
    }

    const now = new Date()
    const record: Event = {
      clientId,
      title: body.title.trim(),
      eventSlug: slugResult.slug,
      coverPicHorizontal: body.coverPicHorizontal?.trim() ?? "",
      coverPicVertical: body.coverPicVertical?.trim() ?? "",
      subtitle: body.subtitle?.trim() || undefined,
      description: body.description?.trim() || undefined,
      tags: body.tags ?? [],
      team: body.team,
      eventDate,
      eventTime: body.eventTime.trim(),
      blocks: [],
      isVisible: body.isVisible ?? false,
      createdAt: now,
      updatedAt: now,
    }

    const db = await getDb()
    const result = await db.collection<Event>("events").insertOne(record)

    return NextResponse.json(
      toEventPublic({ ...record, _id: result.insertedId }),
      { status: 201 },
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}
